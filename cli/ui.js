// cli/ui.js — Shared terminal rendering helpers

import chalk from 'chalk';
import Table from 'cli-table3';

// ─── Color theme ──────────────────────────────────────────────────────────────
export const c = {
  brand:    chalk.hex('#7C3AED'),        // purple
  brandBg:  chalk.bgHex('#7C3AED').white,
  manager:  chalk.hex('#1E1B4B'),        // deep indigo
  success:  chalk.hex('#059669'),        // green
  warning:  chalk.hex('#D97706'),        // amber
  danger:   chalk.hex('#EF4444'),        // red
  info:     chalk.hex('#3B82F6'),        // blue
  muted:    chalk.hex('#6B7280'),        // gray
  bold:     chalk.bold,
  dim:      chalk.dim,
};

// ─── Status badge ─────────────────────────────────────────────────────────────
export function statusBadge(status) {
  switch (status) {
    case 'Pending':    return chalk.bgHex('#FEF3C7').hex('#92400E')(` ${status} `);
    case 'Picked Up':  return chalk.bgHex('#EDE9FE').hex('#5B21B6')(` ${status} `);
    case 'In Transit': return chalk.bgHex('#DBEAFE').hex('#1D4ED8')(` ${status} `);
    case 'Delivered':  return chalk.bgHex('#D1FAE5').hex('#065F46')(` ${status} `);
    default:           return chalk.bgGray.white(` ${status} `);
  }
}

// ─── App banner ───────────────────────────────────────────────────────────────
export function printBanner() {
  console.log('');
  console.log(c.brand('╔══════════════════════════════════════════════╗'));
  console.log(c.brand('║') + c.brandBg('  🚚  DELIVERY TRACKING SYSTEM  v2.0 CLI  ') + c.brand('║'));
  console.log(c.brand('╚══════════════════════════════════════════════╝'));
  console.log('');
}

// ─── Section header ───────────────────────────────────────────────────────────
export function sectionHeader(title) {
  console.log('');
  console.log(c.muted('  ─────────────────────────────────────'));
  console.log('  ' + c.brand.bold(`▸ ${title}`));
  console.log(c.muted('  ─────────────────────────────────────'));
}

// ─── Driver stats row ─────────────────────────────────────────────────────────
export function printDriverStats(activeCount, completedCount) {
  const activeBox = chalk.bgHex('#F5F3FF').hex('#5B21B6')(
    `  📦 Active Jobs: ${chalk.bold(activeCount)}  `
  );
  const doneBox = chalk.bgHex('#ECFDF5').hex('#065F46')(
    `  ✅ Completed: ${chalk.bold(completedCount)}  `
  );
  console.log('');
  console.log(`  ${activeBox}   ${doneBox}`);
  console.log('');
}

// ─── Manager stats table ──────────────────────────────────────────────────────
export function printManagerStats({ total, pending, inTransit, delivered }) {
  console.log('');
  const table = new Table({
    head: [
      c.info.bold('Total Orders'),
      c.warning.bold('Pending'),
      c.brand.bold('In Transit'),
      c.success.bold('Delivered'),
    ],
    colAligns: ['center', 'center', 'center', 'center'],
    style: { head: [], border: ['gray'] },
  });
  table.push([
    c.info.bold(String(total)),
    c.warning.bold(String(pending)),
    c.brand.bold(String(inTransit)),
    c.success.bold(String(delivered)),
  ]);
  console.log(table.toString());
  console.log('');
}

// ─── Orders table ─────────────────────────────────────────────────────────────
export function printOrdersTable(orders, showCoords = false) {
  const head = ['#', 'Order ID', 'Customer', 'Address', 'Status'];
  if (showCoords) head.push('Live Coordinates');

  const table = new Table({
    head: head.map(h => c.muted.bold(h)),
    colWidths: showCoords
      ? [4, 12, 18, 30, 14, 26]
      : [4, 12, 18, 35, 14],
    wordWrap: true,
    style: { head: [], border: ['gray'] },
  });

  orders.forEach((order, i) => {
    const row = [
      c.muted(String(i + 1)),
      c.bold(order.id),
      order.customerName,
      c.dim(order.address),
      statusBadge(order.status),
    ];
    if (showCoords) {
      if (order.status !== 'Pending') {
        const lat = order.currentCoordinates.latitude.toFixed(5);
        const lng = order.currentCoordinates.longitude.toFixed(5);
        row.push(c.brand(`${lat}\n${lng}`));
      } else {
        row.push(c.muted('—'));
      }
    }
    table.push(row);
  });

  console.log(table.toString());
}

// ─── Single order detail card ─────────────────────────────────────────────────
export function printOrderCard(order) {
  console.log('');
  console.log(`  ${c.bold.white('Order:')}  ${c.brand.bold(order.id)}`);
  console.log(`  ${c.bold.white('Customer:')} ${order.customerName}`);
  console.log(`  ${c.bold.white('Address:')} ${c.dim(order.address)}`);
  console.log(`  ${c.bold.white('Status:')}  ${statusBadge(order.status)}`);
  if (order.status !== 'Pending') {
    const lat = order.currentCoordinates.latitude.toFixed(6);
    const lng = order.currentCoordinates.longitude.toFixed(6);
    console.log(`  ${c.bold.white('Location:')} ${c.brand(`Lat ${lat}  Lng ${lng}`)}`);
  }
  console.log('');
}

// ─── Separator ────────────────────────────────────────────────────────────────
export function hr() {
  console.log(c.muted('  ' + '─'.repeat(50)));
}
