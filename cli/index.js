#!/usr/bin/env node
// cli/index.js — Entry point: session restore → route to driver or manager dashboard

import { restoreSession, setState, getState } from './store.js';
import { promptLogin } from './auth.js';
import { driverDashboard } from './driver.js';
import { managerDashboard } from './manager.js';
import { printBanner, c } from './ui.js';
import ora from 'ora';

async function main() {
  // ── Restore session ──────────────────────────────────────────────────────
  const spinner = ora({ text: c.muted('  Restoring session…'), color: 'magenta' }).start();
  await new Promise(r => setTimeout(r, 400)); // brief pause for UX

  const savedUser = restoreSession();
  spinner.stop();

  let role;

  if (savedUser) {
    setState({ user: savedUser });
    console.clear();
    printBanner();
    console.log(c.success.bold(`  ✔  Session restored — welcome back, ${savedUser.email}`));
    console.log(c.muted(`     Role: ${savedUser.role.toUpperCase()}`));
    console.log('');
    await new Promise(r => setTimeout(r, 800));
    role = savedUser.role;
  } else {
    // ── Fresh login ────────────────────────────────────────────────────────
    const result = await promptLogin();
    role = result.role;
  }

  // ── Route to dashboard ────────────────────────────────────────────────────
  if (role === 'driver') {
    await driverDashboard();
  } else if (role === 'manager') {
    await managerDashboard();
  } else {
    console.log(c.danger('  Unknown role. Exiting.'));
    process.exit(1);
  }

  // After logout — re-launch login prompt
  await main();
}

// ── Global error handling ─────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  if (err.code === 'ERR_USE_AFTER_CLOSE') return; // inquirer cleanup noise
  console.error(c.danger(`\n  Error: ${err.message}`));
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n');
  console.log(c.muted('  Interrupted. Goodbye! 👋'));
  process.exit(0);
});

main();
