// src/services/trackingService.js — GPS simulation (ported from cli/trackingService.js)
import { useStore } from '../store/useStore.js';

const TOTAL_STEPS = 20;
let simulationInterval = null;
let currentStep = 0;

/**
 * Starts simulated GPS interpolation from start → end coordinates.
 * Updates Zustand store every 3 seconds.
 * @param {string} orderId
 * @param {Function} [onDone] optional callback when delivery completes
 */
export function startGPSSimulation(orderId, onDone) {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }

  const state = useStore.getState();
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  const start = order.startCoordinates;
  const end   = order.endCoordinates;
  const current = order.currentCoordinates || start;

  const latDiffTotal = end.latitude  - start.latitude;
  const lngDiffTotal = end.longitude - start.longitude;

  // Auto-deliver if already at destination
  if (Math.abs(latDiffTotal) < 0.0001 && Math.abs(lngDiffTotal) < 0.0001) {
    useStore.getState().updateOrderStatus(orderId, 'Delivered');
    onDone?.();
    return;
  }

  // Resume from current progress if mid-route
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
      useStore.getState().updateOrderStatus(orderId, 'Delivered');
      useStore.getState().updateDriverLocation(orderId, end);
      onDone?.();
      return;
    }

    const t   = currentStep / TOTAL_STEPS;
    const lat = Number((start.latitude  + latDiffTotal * t).toFixed(6));
    const lng = Number((start.longitude + lngDiffTotal * t).toFixed(6));

    useStore.getState().updateDriverLocation(orderId, { latitude: lat, longitude: lng });
  }, 3000);
}

/** Stops any running GPS simulation. */
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

/** Returns current step (0–20). */
export function getCurrentStep() {
  return currentStep;
}

export const TOTAL_STEPS_COUNT = TOTAL_STEPS;
