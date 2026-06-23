// src/pages/DriverDashboard.jsx
import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import {
  startGPSSimulation,
  stopGPSSimulation,
  isSimulationRunning,
} from '../services/trackingService.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

function calcProgress(order) {
  const latTotal = order.endCoordinates.latitude  - order.startCoordinates.latitude;
  const latDone  = order.currentCoordinates.latitude - order.startCoordinates.latitude;
  if (Math.abs(latTotal) < 0.0001) return order.status === 'Delivered' ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((latDone / latTotal) * 100)));
}

export default function DriverDashboard() {
  const { user, orders, activeOrderId, logout, acceptOrder, updateOrderStatus } = useStore();

  const [showLiveTrack, setShowLiveTrack] = useState(false);
  const [showAcceptMenu, setShowAcceptMenu] = useState(false);
  const [deliveredToast, setDeliveredToast] = useState(false);

  const activeOrder   = orders.find(o => o.id === activeOrderId) ?? null;
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const pastOrders    = orders.filter(o => o.status === 'Delivered');

  // Re-read active order reactively (Zustand auto-updates component)
  const liveOrder = activeOrder
    ? orders.find(o => o.id === activeOrder.id)
    : null;

  const handleStartTransit = () => {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, 'In Transit');
    startGPSSimulation(activeOrder.id, () => {
      setShowLiveTrack(false);
      setDeliveredToast(true);
      setTimeout(() => setDeliveredToast(false), 4000);
    });
  };

  const handleDeliver = () => {
    if (!activeOrder) return;
    stopGPSSimulation();
    updateOrderStatus(activeOrder.id, 'Delivered');
    setShowLiveTrack(false);
    setDeliveredToast(true);
    setTimeout(() => setDeliveredToast(false), 4000);
  };

  const handleLogout = () => {
    stopGPSSimulation();
    logout();
  };

  // Close live track if order gets delivered automatically
  useEffect(() => {
    if (showLiveTrack && (!activeOrderId || liveOrder?.status === 'Delivered')) {
      setShowLiveTrack(false);
    }
  }, [activeOrderId, liveOrder?.status, showLiveTrack]);

  return (
    <div className="dashboard">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar__brand">
          <span className="navbar__icon">🚗</span>
          <div>
            <span className="navbar__title">Delivery Partner</span>
            <span className="navbar__sub">Driver Dashboard</span>
          </div>
        </div>
        <div className="navbar__actions">
          {isSimulationRunning() && (
            <span className="auto-refresh-badge pulse">● GPS Active</span>
          )}
          <span className="navbar__email">{user.email}</span>
          <button id="driver-logout" className="btn btn--ghost btn--sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard__main">

        {/* ── Active Assignment ── */}
        {liveOrder ? (
          <section className="active-order">
            <div className="active-order__header">
              <h2 className="section-title">🎯 Active Assignment</h2>
              <StatusBadge status={liveOrder.status} />
            </div>

            <div className="active-order__card">
              <div className="active-order__info">
                <div>
                  <code className="order-id order-id--lg">{liveOrder.id}</code>
                  <p className="active-order__customer">{liveOrder.customerName}</p>
                  <p className="active-order__address">📍 {liveOrder.address}</p>
                </div>
                <div className="active-order__coords">
                  <div className="coord-tag">
                    <span className="coord-tag__label">Current Lat</span>
                    <span className="coord-tag__val">{liveOrder.currentCoordinates.latitude.toFixed(6)}</span>
                  </div>
                  <div className="coord-tag">
                    <span className="coord-tag__label">Current Lng</span>
                    <span className="coord-tag__val">{liveOrder.currentCoordinates.longitude.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {liveOrder.status !== 'Pending' && (
                <div style={{ marginTop: 16 }}>
                  <ProgressBar pct={calcProgress(liveOrder)} size="lg" />
                </div>
              )}

              <div className="active-order__actions">
                {liveOrder.status === 'Picked Up' && (
                  <button
                    id="start-transit"
                    className="btn btn--info"
                    onClick={handleStartTransit}
                  >
                    ▶ Start Transit
                  </button>
                )}
                {liveOrder.status === 'In Transit' && (
                  <>
                    <button
                      id="live-track"
                      className="btn btn--primary"
                      onClick={() => setShowLiveTrack(true)}
                    >
                      📍 Live Track
                    </button>
                    <button
                      id="mark-delivered"
                      className="btn btn--success"
                      onClick={handleDeliver}
                    >
                      ✅ Mark as Delivered
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* ── No active order ── */
          <section className="no-active">
            <div className="no-active__inner">
              <span className="no-active__icon">📭</span>
              <p>No active assignment. Pick a job below!</p>
            </div>
          </section>
        )}

        {/* ── Available Jobs ── */}
        {pendingOrders.length > 0 && (
          <section>
            <div className="toolbar">
              <h2 className="section-title">📦 Available Jobs ({pendingOrders.length})</h2>
              {!liveOrder && (
                <button
                  id="accept-job"
                  className="btn btn--primary btn--sm"
                  onClick={() => setShowAcceptMenu(true)}
                  disabled={!!liveOrder}
                >
                  + Accept a Job
                </button>
              )}
            </div>
            <div className="jobs-grid">
              {pendingOrders.map(order => (
                <div key={order.id} className="job-card">
                  <div className="job-card__top">
                    <code className="order-id">{order.id}</code>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="job-card__customer">{order.customerName}</p>
                  <p className="job-card__address text-muted text-sm">📍 {order.address}</p>
                  {!liveOrder && (
                    <button
                      className="btn btn--primary btn--sm btn--full"
                      style={{ marginTop: 12 }}
                      onClick={() => {
                        acceptOrder(order.id);
                      }}
                    >
                      Accept Job
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Completed History ── */}
        {pastOrders.length > 0 && (
          <section>
            <h2 className="section-title" style={{ marginBottom: 16 }}>
              ✅ Completed History ({pastOrders.length})
            </h2>
            <div className="table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastOrders.map(order => (
                    <tr key={order.id}>
                      <td><code className="order-id">{order.id}</code></td>
                      <td className="fw-medium">{order.customerName}</td>
                      <td className="text-muted text-sm">{order.address}</td>
                      <td><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {pendingOrders.length === 0 && !liveOrder && pastOrders.length === 0 && (
          <div className="empty-state">
            <span>🎉</span>
            <p>All orders delivered! Reset demo data from the manager account to try again.</p>
          </div>
        )}
      </main>

      {/* ── Live Tracking Modal ── */}
      {showLiveTrack && liveOrder && (
        <LiveTrackModal
          order={orders.find(o => o.id === liveOrder.id) ?? liveOrder}
          onClose={() => setShowLiveTrack(false)}
          onDeliver={handleDeliver}
        />
      )}

      {/* ── Accept Job Modal ── */}
      {showAcceptMenu && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowAcceptMenu(false)}
        >
          <div className="modal modal--sm">
            <div className="modal__header">
              <h2 className="modal__title">📦 Select a Job</h2>
              <button className="modal__close" onClick={() => setShowAcceptMenu(false)}>✕</button>
            </div>
            <div className="modal__body">
              {pendingOrders.map(order => (
                <button
                  key={order.id}
                  className="job-select-btn"
                  onClick={() => {
                    acceptOrder(order.id);
                    setShowAcceptMenu(false);
                  }}
                >
                  <code className="order-id">{order.id}</code>
                  <span className="fw-medium">{order.customerName}</span>
                  <span className="text-muted text-sm">{order.address.slice(0, 40)}…</span>
                </button>
              ))}
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setShowAcceptMenu(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delivered Toast ── */}
      {deliveredToast && (
        <div className="toast toast--success" role="alert">
          ✅ Order marked as Delivered!
        </div>
      )}
    </div>
  );
}

// ── Live Tracking Panel ────────────────────────────────────────────────────────
function LiveTrackModal({ order, onClose, onDeliver }) {
  const pct = (() => {
    const latTotal = order.endCoordinates.latitude  - order.startCoordinates.latitude;
    const latDone  = order.currentCoordinates.latitude - order.startCoordinates.latitude;
    if (Math.abs(latTotal) < 0.0001) return order.status === 'Delivered' ? 100 : 0;
    return Math.min(100, Math.max(0, Math.round((latDone / latTotal) * 100)));
  })();

  // Animate GPS pulse indicator
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Live GPS Tracking">
      <div className="modal modal--live">
        <div className="modal__header">
          <div>
            <h2 className="modal__title">📍 Live Tracking</h2>
            <p className="text-muted">{order.id} — {order.customerName}</p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__body">
          {/* Route visualizer */}
          <div className="route-viz">
            <div className="route-viz__point route-viz__point--start">
              <span>🏁</span>
              <span className="text-sm text-muted">Start</span>
            </div>
            <div className="route-viz__line">
              <div className="route-viz__fill" style={{ width: `${pct}%` }} />
              <div
                className={`route-viz__truck ${pulse ? 'pulse' : ''}`}
                style={{ left: `calc(${pct}% - 16px)` }}
              >
                🚚
              </div>
            </div>
            <div className="route-viz__point route-viz__point--end">
              <span>📦</span>
              <span className="text-sm text-muted">Delivery</span>
            </div>
          </div>

          {/* Live coordinates */}
          <div className="live-coords-grid">
            <div className="live-coord-card">
              <span className="live-coord-card__label">📍 Latitude</span>
              <span className="live-coord-card__val">
                {order.currentCoordinates.latitude.toFixed(6)}
              </span>
            </div>
            <div className="live-coord-card">
              <span className="live-coord-card__label">📍 Longitude</span>
              <span className="live-coord-card__val">
                {order.currentCoordinates.longitude.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Big progress bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="text-muted text-sm">Route Progress</span>
              <span className="text-sm fw-medium">{pct}% complete</span>
            </div>
            <ProgressBar pct={pct} size="lg" showLabel={false} />
          </div>

          <p className="text-muted text-sm" style={{ marginTop: 12, textAlign: 'center' }}>
            GPS updates automatically every 3 seconds
          </p>
        </div>

        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            ← Back to Dashboard
          </button>
          {order.status === 'In Transit' && (
            <button id="deliver-from-track" className="btn btn--success" onClick={onDeliver}>
              ✅ Mark as Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
