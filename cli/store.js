// cli/store.js — In-memory state + JSON session persistence (replaces Zustand + AsyncStorage)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = path.join(__dirname, '..', 'session.json');

// ─── Initial seed data ────────────────────────────────────────────────────────
const INITIAL_ORDERS = [
  {
    id: 'ORD-9821',
    customerName: 'Eleanor Vance',
    address: '5th Ave & E 82nd St, Metropolitan Museum, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.782900, longitude: -73.965400 },
    endCoordinates:   { latitude: 40.771100, longitude: -73.974100 },
    currentCoordinates: { latitude: 40.782900, longitude: -73.965400 },
  },
  {
    id: 'ORD-4029',
    customerName: 'Julian Caster',
    address: '75 9th Ave, Chelsea Market, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.742000, longitude: -74.006000 },
    endCoordinates:   { latitude: 40.758000, longitude: -73.985500 },
    currentCoordinates: { latitude: 40.742000, longitude: -74.006000 },
  },
  {
    id: 'ORD-5192',
    customerName: 'Marcus Aurelius',
    address: '350 5th Ave, Empire State Building, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.748400, longitude: -73.985700 },
    endCoordinates:   { latitude: 40.706100, longitude: -73.996900 },
    currentCoordinates: { latitude: 40.748400, longitude: -73.985700 },
  },
  {
    id: 'ORD-8831',
    customerName: 'Sophia Loren',
    address: 'Dumbo Park, Brooklyn, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.703300, longitude: -73.988000 },
    endCoordinates:   { latitude: 40.718000, longitude: -73.989000 },
    currentCoordinates: { latitude: 40.703300, longitude: -73.988000 },
  },
  {
    id: 'ORD-2740',
    customerName: 'David Beckham',
    address: '1260 Ave of the Americas, Radio City, NY',
    status: 'Pending',
    startCoordinates: { latitude: 40.759900, longitude: -73.979900 },
    endCoordinates:   { latitude: 40.764400, longitude: -73.973000 },
    currentCoordinates: { latitude: 40.759900, longitude: -73.979900 },
  },
];

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
  user:         null,
  orders:       JSON.parse(JSON.stringify(INITIAL_ORDERS)), // deep clone
  activeOrderId: null,
  isTracking:   false,
};

// ─── State accessors ──────────────────────────────────────────────────────────
export function getState() {
  return state;
}

export function setState(partial) {
  state = { ...state, ...partial };
}

// ─── Session persistence ──────────────────────────────────────────────────────
export function saveSession(user) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(user, null, 2), 'utf-8');
}

export function clearSession() {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
}

export function restoreSession() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;
    const raw = fs.readFileSync(SESSION_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Auth actions ─────────────────────────────────────────────────────────────
export function login(email, password) {
  const normEmail = email.trim().toLowerCase();
  let role = null;

  if (normEmail === 'driver@test.com' && password === '123456') role = 'driver';
  else if (normEmail === 'ops@test.com' && password === '123456')  role = 'manager';

  if (role) {
    const user = { email: normEmail, role };
    setState({ user });
    saveSession(user);
    return { success: true, role };
  }
  return { success: false, error: 'Invalid email or password.' };
}

export function logout() {
  clearSession();
  setState({ user: null, activeOrderId: null, isTracking: false });
}

// ─── Order actions ────────────────────────────────────────────────────────────
export function acceptOrder(orderId) {
  const orders = state.orders.map(o =>
    o.id === orderId
      ? { ...o, status: 'Picked Up', currentCoordinates: { ...o.startCoordinates } }
      : o
  );
  const accepted = orders.find(o => o.id === orderId);
  setState({ orders, activeOrderId: orderId, driverLocation: accepted?.startCoordinates ?? null });
}

export function updateOrderStatus(orderId, status) {
  const orders = state.orders.map(o =>
    o.id === orderId ? { ...o, status } : o
  );
  const patch = { orders };
  if (status === 'In Transit') patch.isTracking = true;
  if (status === 'Delivered')  { patch.isTracking = false; patch.activeOrderId = null; }
  setState(patch);
}

export function updateDriverLocation(orderId, coordinates) {
  const orders = state.orders.map(o =>
    o.id === orderId ? { ...o, currentCoordinates: coordinates } : o
  );
  setState({ orders, driverLocation: coordinates });
}

export function resetDemoData() {
  setState({
    orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
    activeOrderId: null,
    isTracking: false,
    driverLocation: null,
  });
}
