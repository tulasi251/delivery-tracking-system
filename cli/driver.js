// cli/driver.js — Driver interactive dashboard loop

import inquirer from 'inquirer';
import ora from 'ora';
import {
  getState,
  logout,
  acceptOrder,
  updateOrderStatus,
} from './store.js';
import { startGPSSimulation, stopGPSSimulation, isSimulationRunning } from './trackingService.js';
import {
  printBanner,
  sectionHeader,
  printDriverStats,
  printOrdersTable,
  printOrderCard,
  c,
  hr,
} from './ui.js';

/**
 * Main driver dashboard loop.
 * Returns when the driver logs out.
 */
export async function driverDashboard() {
  while (true) {
    const state = getState();
    const { user, orders, activeOrderId } = state;

    const activeOrder   = orders.find(o => o.id === activeOrderId);
    const pendingOrders = orders.filter(o => o.status === 'Pending');
    const pastOrders    = orders.filter(o => o.status === 'Delivered');

    // ── Header ────────────────────────────────────────────────────────────────
    console.clear();
    printBanner();
    console.log(
      `  ${c.brand('🚗  Delivery Partner')}   ${c.muted(user.email)}`
    );
    printDriverStats(activeOrder ? 1 : 0, pastOrders.length);

    // ── Active assignment ─────────────────────────────────────────────────────
    if (activeOrder) {
      sectionHeader('ACTIVE ASSIGNMENT');
      printOrderCard(activeOrder);

      const activeChoices = [];

      if (activeOrder.status === 'Picked Up') {
        activeChoices.push({ name: `${c.info('▶')}  Start Transit  (begin GPS tracking)`, value: 'start_transit' });
      }
      if (activeOrder.status === 'In Transit') {
        activeChoices.push({ name: `${c.brand('📍')}  Live Track  (watch GPS updates)`, value: 'live_track' });
        activeChoices.push({ name: `${c.success('✔')}  Mark as Delivered`, value: 'deliver' });
      }
      activeChoices.push({ name: c.muted('↩  Back to main menu'), value: 'back' });

      const { activeAction } = await inquirer.prompt([{
        type: 'list',
        name: 'activeAction',
        message: c.brand('  Active order action:'),
        choices: activeChoices,
      }]);

      if (activeAction === 'start_transit') {
        updateOrderStatus(activeOrder.id, 'In Transit');
        startGPSSimulation(activeOrder.id);
        const spinner = ora({
          text: c.brand('  GPS simulation started — updating every 3 seconds…'),
          color: 'magenta',
        }).start();
        await pause(1500);
        spinner.stop();
        continue;
      }

      if (activeAction === 'live_track') {
        await showLiveTracking(activeOrder.id);
        continue;
      }

      if (activeAction === 'deliver') {
        stopGPSSimulation();
        updateOrderStatus(activeOrder.id, 'Delivered');
        console.log('');
        console.log(c.success.bold('  ✅  Order marked as Delivered!'));
        await pause(1500);
        continue;
      }

      // 'back' — just re-render the dashboard
      continue;
    }

    // ── Available jobs ────────────────────────────────────────────────────────
    sectionHeader(`AVAILABLE JOBS  (${pendingOrders.length})`);

    if (pendingOrders.length === 0) {
      console.log(c.muted('  No pending delivery jobs available.\n'));
    } else {
      printOrdersTable(pendingOrders);
    }

    // ── Past deliveries ───────────────────────────────────────────────────────
    if (pastOrders.length > 0) {
      sectionHeader(`COMPLETED HISTORY  (${pastOrders.length})`);
      printOrdersTable(pastOrders);
    }

    // ── Main menu ─────────────────────────────────────────────────────────────
    hr();
    const menuChoices = [];

    if (pendingOrders.length > 0) {
      menuChoices.push({ name: `${c.brand('📦')}  Accept a job`, value: 'accept' });
    }
    menuChoices.push({ name: `${c.info('🔄')}  Refresh dashboard`, value: 'refresh' });
    menuChoices.push({ name: `${c.danger('⏻')}  Logout`, value: 'logout' });

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: c.brand('  What would you like to do?'),
      choices: menuChoices,
    }]);

    if (action === 'logout') {
      stopGPSSimulation();
      logout();
      console.log('');
      console.log(c.muted('  Logged out. Goodbye!'));
      console.log('');
      return;
    }

    if (action === 'accept') {
      await acceptJobMenu(pendingOrders);
    }

    // 'refresh' — loop continues and re-renders
  }
}

// ─── Sub-menu: pick a job to accept ──────────────────────────────────────────
async function acceptJobMenu(pendingOrders) {
  const choices = pendingOrders.map(o => ({
    name: `${c.bold(o.id)}  —  ${o.customerName}  ${c.dim('(' + o.address.slice(0, 35) + '…)')}`,
    value: o.id,
  }));
  choices.push({ name: c.muted('↩  Cancel'), value: '__cancel__' });

  const { orderId } = await inquirer.prompt([{
    type: 'list',
    name: 'orderId',
    message: c.brand('  Select a job to accept:'),
    choices,
  }]);

  if (orderId === '__cancel__') return;

  acceptOrder(orderId);
  console.log('');
  console.log(c.success.bold(`  ✔  Job ${orderId} accepted! Status → Picked Up`));
  await pause(1200);
}

// ─── Live tracking view ───────────────────────────────────────────────────────
async function showLiveTracking(orderId) {
  const state = getState();
  const order = state.orders.find(o => o.id === orderId);

  console.clear();
  printBanner();
  console.log(c.brand.bold(`  📍  LIVE TRACKING  —  ${orderId}`));
  console.log(c.muted(`  Customer: ${order?.customerName}   |   ${order?.address}`));
  console.log('');
  console.log(c.muted('  Press ') + c.bold('ENTER') + c.muted(' at any time to return to dashboard…'));
  console.log('');

  // Ensure simulation is running
  if (!isSimulationRunning()) {
    startGPSSimulation(orderId);
  }

  // Wait for ENTER keypress to exit live view
  await inquirer.prompt([{
    type: 'input',
    name: '_',
    message: '',
    prefix: '',
  }]);

  console.log('');
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
