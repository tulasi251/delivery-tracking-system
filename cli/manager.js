// cli/manager.js — Manager (Ops) interactive dashboard loop

import inquirer from 'inquirer';
import {
  getState,
  logout,
  resetDemoData,
} from './store.js';
import {
  printBanner,
  sectionHeader,
  printManagerStats,
  printOrdersTable,
  c,
  hr,
} from './ui.js';

/**
 * Main manager dashboard loop.
 * Returns when the manager logs out.
 */
export async function managerDashboard() {
  let autoRefresh = false;
  let refreshTimer = null;

  while (true) {
    const state = getState();
    const { user, orders } = state;

    const pendingCount   = orders.filter(o => o.status === 'Pending').length;
    const pickedUpCount  = orders.filter(o => o.status === 'Picked Up').length;
    const transitCount   = orders.filter(o => o.status === 'In Transit').length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;

    // ── Header ────────────────────────────────────────────────────────────────
    console.clear();
    printBanner();
    console.log(
      `  ${c.manager.bold('🛡  Operations Hub')}   ${c.muted(user.email)}`
    );
    if (autoRefresh) {
      console.log(c.success.dim('  ● Auto-refresh ON — dashboard updates every 5s'));
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    sectionHeader('FLEET OVERVIEW');
    printManagerStats({
      total:     orders.length,
      pending:   pendingCount,
      inTransit: pickedUpCount + transitCount,
      delivered: deliveredCount,
    });

    // ── All orders ────────────────────────────────────────────────────────────
    sectionHeader('ALL DELIVERY CONSIGNMENTS');
    printOrdersTable(orders, true /* showCoords */);

    // ── Menu ──────────────────────────────────────────────────────────────────
    hr();
    const choices = [
      { name: `${c.info('🔄')}  Refresh now`, value: 'refresh' },
      {
        name: autoRefresh
          ? `${c.warning('⏸')}  Disable auto-refresh`
          : `${c.success('▶')}  Enable auto-refresh (5s)`,
        value: 'toggle_auto',
      },
      { name: `${c.brand('🔍')}  View order detail`, value: 'detail' },
      { name: `${c.warning('↺')}  Reset demo data`, value: 'reset' },
      { name: `${c.danger('⏻')}  Logout`, value: 'logout' },
    ];

    // Use a short timeout so auto-refresh can interrupt the prompt
    const action = await promptWithTimeout(choices, autoRefresh ? 5000 : 0);

    // ── Handle timeout (auto-refresh) ─────────────────────────────────────────
    if (action === '__timeout__') {
      continue; // just re-render
    }

    if (action === 'logout') {
      logout();
      console.log('');
      console.log(c.muted('  Logged out. Goodbye!'));
      console.log('');
      return;
    }

    if (action === 'reset') {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: c.warning('  Reset ALL orders to Pending? (cannot be undone)'),
        default: false,
      }]);
      if (confirm) {
        resetDemoData();
        console.log('');
        console.log(c.success.bold('  ✔  Demo data reset. All 5 orders are Pending again.'));
        await pause(1200);
      }
      continue;
    }

    if (action === 'toggle_auto') {
      autoRefresh = !autoRefresh;
      continue;
    }

    if (action === 'detail') {
      await viewOrderDetail(orders);
      continue;
    }

    // 'refresh' — loop re-renders naturally
  }
}

// ─── Sub-menu: pick an order for full detail ──────────────────────────────────
async function viewOrderDetail(orders) {
  const choices = orders.map(o => ({
    name: `${c.bold(o.id)}  ${statusIcon(o.status)}  ${o.customerName}`,
    value: o.id,
  }));
  choices.push({ name: c.muted('↩  Back'), value: '__back__' });

  const { orderId } = await inquirer.prompt([{
    type: 'list',
    name: 'orderId',
    message: c.brand('  Select an order to inspect:'),
    choices,
  }]);

  if (orderId === '__back__') return;

  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  console.clear();
  printBanner();
  console.log(c.brand.bold(`  🔍  ORDER DETAIL — ${order.id}`));
  console.log('');
  console.log(`  ${c.bold('Customer:')}   ${order.customerName}`);
  console.log(`  ${c.bold('Address:')}    ${c.dim(order.address)}`);
  console.log(`  ${c.bold('Status:')}     ${statusIcon(order.status)} ${order.status}`);
  console.log('');
  console.log(`  ${c.bold('Start Coords:')}   Lat ${order.startCoordinates.latitude}  Lng ${order.startCoordinates.longitude}`);
  console.log(`  ${c.bold('End Coords:')}     Lat ${order.endCoordinates.latitude}  Lng ${order.endCoordinates.longitude}`);

  if (order.status !== 'Pending') {
    const lat = order.currentCoordinates.latitude.toFixed(6);
    const lng = order.currentCoordinates.longitude.toFixed(6);
    console.log('');
    console.log(`  ${c.brand.bold('Live Position:')}  ${c.brand(`Lat ${lat}  Lng ${lng}`)}`);

    // Show a simple ASCII route indicator
    const progress = calcProgress(order);
    const bar = progressBar(progress);
    console.log('');
    console.log(`  ${c.muted('Route:')}  🏁 ${bar} 📦  ${c.muted(progress + '%')}`);
  }

  console.log('');
  await inquirer.prompt([{
    type: 'input',
    name: '_',
    message: c.muted('  Press ENTER to go back…'),
    prefix: '',
  }]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusIcon(status) {
  const icons = {
    'Pending':    c.warning('⏳'),
    'Picked Up':  c.brand('📦'),
    'In Transit': c.info('🚚'),
    'Delivered':  c.success('✅'),
  };
  return icons[status] ?? '❓';
}

function calcProgress(order) {
  const latTotal = order.endCoordinates.latitude - order.startCoordinates.latitude;
  const latDone  = order.currentCoordinates.latitude - order.startCoordinates.latitude;
  if (Math.abs(latTotal) < 0.0001) return 100;
  return Math.min(100, Math.max(0, Math.round((latDone / latTotal) * 100)));
}

function progressBar(pct, width = 24) {
  const filled = Math.round((pct / 100) * width);
  const empty  = width - filled;
  return c.success('█'.repeat(filled)) + c.muted('░'.repeat(empty));
}

function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps inquirer list prompt with an optional timeout.
 * Resolves with '__timeout__' when timeout fires before user picks.
 */
function promptWithTimeout(choices, timeoutMs) {
  return new Promise((resolve) => {
    let resolved = false;

    const timer = timeoutMs > 0
      ? setTimeout(() => {
          if (!resolved) {
            resolved = true;
            // Close stdin briefly to unblock inquirer
            process.stdin.emit('keypress', '\r', { name: 'return' });
            resolve('__timeout__');
          }
        }, timeoutMs)
      : null;

    inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: c.brand('  Operations:'),
      choices,
    }]).then(({ action }) => {
      if (!resolved) {
        resolved = true;
        if (timer) clearTimeout(timer);
        resolve(action);
      }
    });
  });
}
