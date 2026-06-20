import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@delivery_tracker_session';

const INITIAL_ORDERS = [
  {
    id: 'ORD-9821',
    customerName: 'Eleanor Vance',
    address: '5th Ave & E 82nd St, Metropolitan Museum, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.7829, longitude: -73.9654 },
    endCoordinates: { latitude: 40.7711, longitude: -73.9741 },
    currentCoordinates: { latitude: 40.7829, longitude: -73.9654 },
  },
  {
    id: 'ORD-4029',
    customerName: 'Julian Caster',
    address: '75 9th Ave, Chelsea Market, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.7420, longitude: -74.0060 },
    endCoordinates: { latitude: 40.7580, longitude: -73.9855 },
    currentCoordinates: { latitude: 40.7420, longitude: -74.0060 },
  },
  {
    id: 'ORD-5192',
    customerName: 'Marcus Aurelius',
    address: '350 5th Ave, Empire State Building, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.7484, longitude: -73.9857 },
    endCoordinates: { latitude: 40.7061, longitude: -73.9969 },
    currentCoordinates: { latitude: 40.7484, longitude: -73.9857 },
  },
  {
    id: 'ORD-8831',
    customerName: 'Sophia Loren',
    address: 'Dumbo Park, Brooklyn, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.7033, longitude: -73.9880 },
    endCoordinates: { latitude: 40.7180, longitude: -73.9890 },
    currentCoordinates: { latitude: 40.7033, longitude: -73.9880 },
  },
  {
    id: 'ORD-2740',
    customerName: 'David Beckham',
    address: '1260 Ave of the Americas, Radio City, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.7599, longitude: -73.9799 },
    endCoordinates: { latitude: 40.7644, longitude: -73.9730 },
    currentCoordinates: { latitude: 40.7599, longitude: -73.9799 },
  },
];

export const useStore = create((set, get) => ({
  user: null,
  orders: INITIAL_ORDERS,
  driverLocation: null,
  activeOrderId: null,
  isTracking: false,
  isLoading: true,

  // Auth actions
  login: async (email, password) => {
    set({ isLoading: true });
    
    // Normalize and validate credentials locally
    const normEmail = email.trim().toLowerCase();
    let role = null;
    
    if (normEmail === 'driver@test.com' && password === '123456') {
      role = 'driver';
    } else if (normEmail === 'ops@test.com' && password === '123456') {
      role = 'manager';
    }
    
    if (role) {
      const sessionUser = { email: normEmail, role };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      set({ user: sessionUser, isLoading: false });
      return { success: true, role };
    } else {
      set({ isLoading: false });
      return { success: false, error: 'Invalid email or password' };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ user: null, activeOrderId: null, isTracking: false, driverLocation: null });
  },

  restoreSession: async () => {
    try {
      const stored = await AsyncStorage.getItem(SESSION_KEY);
      if (stored) {
        const sessionUser = JSON.parse(stored);
        set({ user: sessionUser });
        
        // Find if there is an active order in progress for driver
        if (sessionUser.role === 'driver') {
          const activeOrder = get().orders.find(o => o.status === 'Picked Up' || o.status === 'In Transit');
          if (activeOrder) {
            set({ 
              activeOrderId: activeOrder.id, 
              driverLocation: activeOrder.currentCoordinates,
              isTracking: activeOrder.status === 'In Transit'
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Order actions
  acceptOrder: (orderId) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: 'Picked Up', currentCoordinates: order.startCoordinates };
        }
        return order;
      });
      
      const acceptedOrder = updatedOrders.find(o => o.id === orderId);
      
      return {
        orders: updatedOrders,
        activeOrderId: orderId,
        driverLocation: acceptedOrder ? acceptedOrder.startCoordinates : null,
      };
    });
  },

  updateOrderStatus: (orderId, status) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.id === orderId) {
          return { ...order, status };
        }
        return order;
      });
      
      let nextState = { orders: updatedOrders };
      
      if (status === 'In Transit') {
        nextState.isTracking = true;
      } else if (status === 'Delivered') {
        nextState.isTracking = false;
        nextState.activeOrderId = null;
      }
      
      return nextState;
    });
  },

  updateDriverLocation: (orderId, coordinates) => {
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.id === orderId) {
          return { ...order, currentCoordinates: coordinates };
        }
        return order;
      });
      
      return {
        orders: updatedOrders,
        driverLocation: coordinates,
      };
    });
  },

  setTrackingState: (trackingState) => {
    set({ isTracking: trackingState });
  },

  resetDemoData: () => {
    set({
      orders: INITIAL_ORDERS,
      driverLocation: null,
      activeOrderId: null,
      isTracking: false,
    });
  }
}));
