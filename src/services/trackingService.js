import { useStore } from '../store/useStore';

let simulationInterval = null;
let currentStep = 0;
const TOTAL_STEPS = 20;

/**
 * Starts a simulated GPS coordinate update loop, interpolating
 * coordinates from the order's start point to its end point.
 * @param {string} orderId 
 */
export const startGPSSimulation = (orderId) => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  const store = useStore.getState();
  const order = store.orders.find(o => o.id === orderId);
  if (!order) return;

  const start = order.startCoordinates;
  const end = order.endCoordinates;
  const current = order.currentCoordinates || start;
  
  // Calculate total differences
  const latDiffTotal = end.latitude - start.latitude;
  const lngDiffTotal = end.longitude - start.longitude;
  
  if (latDiffTotal === 0 && lngDiffTotal === 0) {
    store.updateOrderStatus(orderId, 'Delivered');
    return;
  }
  
  // Check if we are already partially along the path (e.g. from restored session)
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
      
      // Auto transition to Delivered on final step completion
      useStore.getState().updateOrderStatus(orderId, 'Delivered');
      useStore.getState().updateDriverLocation(orderId, end);
      return;
    }

    const t = currentStep / TOTAL_STEPS;
    const lat = start.latitude + (latDiffTotal) * t;
    const lng = start.longitude + (lngDiffTotal) * t;

    // Apply the update to the store
    useStore.getState().updateDriverLocation(orderId, { 
      latitude: Number(lat.toFixed(6)), 
      longitude: Number(lng.toFixed(6)) 
    });
  }, 3000); // 3-second simulation step
};

/**
 * Stops the active simulation.
 */
export const stopGPSSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
};
