// cli/trackingService.js — GPS simulation (direct port from src/services/trackingService.js)

import { getState, updateOrderStatus, updateDriverLocation } from './store.js';
import { c } from './ui.js';

const TOTAL_STEPS = 20;
let simulationInterval = null;
let currentStep = 0;

/**
 * Starts simulated GPS interpolation from start → end coordinates.
 * Prints live telemetry to the terminal every 3 seconds.
 * @param {string} orderId
 * @param {Function} [onUpdate]  optional callback called with new coordinates each step
 * @param {Function} [onDone]    optional callback called when delivery is complete
 */
export function startGPSSimulation(orderId, onUpdate, onDone) {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  const state = getState();
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  const start   = order.startCoordinates;
  const end     = order.endCoordinates;
  const current = order.currentCoordinates || start;

  const latDiffTotal = end.latitude  - start.latitude;
  const lngDiffTotal = end.longitude - start.longitude;

  // Auto-deliver if start === end
  if (latDiffTotal === 0 && lngDiffTotal === 0) {
    updateOrderStatus(orderId, 'Delivered');
    onDone?.();
    return;
  }

  // Resume from current progress if session was restored mid-route
  let progressRatio = 0;
  if (Math.abs(latDiffTotal) > 0.0001) {
    progressRatio = (current.latitude - start.latitude) / latDiffTotal;
  } else if (Math.abs(lngDiffTotal) > 0.0001) {
    progressRatio = (current.longitude - start.longitude) / lngDiffTotal;
  }
  currentStep = Math.min(Math.max(Math.round(progressRatio * TOTAL_STEPS), 0), TOTAL_STEPS);

  simulationInterval = setInterval(() => {
    currentStep += 1;

    if (currentStep > TOTAL_STEPS) {
      clearInterval(simulationInterval);
      simulationInterval = null;
      updateOrderStatus(orderId, 'Delivered');
      updateDriverLocation(orderId, end);

      console.log('');
      console.log(c.success.bold('  ✅  Delivery complete! Order marked as Delivered.'));
      console.log('');
      onDone?.();
      return;
    }

    const t   = currentStep / TOTAL_STEPS;
    const lat = Number((start.latitude  + latDiffTotal * t).toFixed(6));
    const lng = Number((start.longitude + lngDiffTotal * t).toFixed(6));

    updateDriverLocation(orderId, { latitude: lat, longitude: lng });

    const pct = Math.round(t * 100);
    const bar = progressBar(pct);

    // Clear previous line and reprint
    process.stdout.write(`\r  ${c.brand('📍')}  ${bar}  ${c.brand.bold(`Lat ${lat}  Lng ${lng}`)}  ${c.muted(`(${pct}%)`)}   `);

    onUpdate?.({ latitude: lat, longitude: lng, step: currentStep, pct });
  }, 3000);
}

/** Stops any running simulation. */
export function stopGPSSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    currentStep = 0;
  }
}

/** Returns true if a simulation is currently running. */
export function isSimulationRunning() {
  return simulationInterval !== null;
}

// ─── Internal: ASCII progress bar ────────────────────────────────────────────
function progressBar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  const empty  = width - filled;
  return c.brand('█'.repeat(filled)) + c.muted('░'.repeat(empty));
}
