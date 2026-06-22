// cli/auth.js — Login / logout via inquirer prompts

import inquirer from 'inquirer';
import { login } from './store.js';
import { printBanner, c } from './ui.js';

/**
 * Prompts for credentials and attempts login.
 * Returns the logged-in user object on success, or null on cancel.
 */
export async function promptLogin() {
  printBanner();

  console.log(c.muted('  Test credentials:'));
  console.log(c.muted('    Driver  → driver@test.com  /  123456'));
  console.log(c.muted('    Manager → ops@test.com     /  123456'));
  console.log('');

  let attempts = 0;
  while (attempts < 3) {
    const { email, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: c.brand('  Email:'),
        validate: (v) => v.trim().length > 0 || 'Email cannot be empty.',
      },
      {
        type: 'password',
        name: 'password',
        message: c.brand('  Password:'),
        mask: '●',
        validate: (v) => v.length > 0 || 'Password cannot be empty.',
      },
    ]);

    const result = login(email, password);
    if (result.success) {
      console.log('');
      console.log(c.success.bold(`  ✔  Logged in as ${result.role.toUpperCase()}`));
      console.log('');
      return result;
    }

    attempts++;
    const remaining = 3 - attempts;
    console.log('');
    console.log(c.danger.bold(`  ✖  ${result.error}`) + (remaining > 0 ? c.muted(` (${remaining} attempt${remaining > 1 ? 's' : ''} left)`) : ''));
    console.log('');
  }

  console.log(c.danger.bold('  Too many failed attempts. Exiting.'));
  process.exit(1);
}
