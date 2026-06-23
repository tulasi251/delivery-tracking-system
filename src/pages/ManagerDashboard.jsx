// src/pages/ManagerDashboard.jsx
import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

function calcProgress(order) {
  const latTotal = order.endCoordinates.latitude  - order.startCoordinates.latitude;
  const latDone  = order.currentCoordinates.latitude - order.startCoordinates.latitude;
  if (Math.abs(latTotal) < 0.0001) return order.status === 'Delivered' ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((latDone / latTotal) * 100)));
}

export default function ManagerDashboard() {
  const { user, orders, logout, resetDemoData } = useStore();
  const [selectedOrder, setSelectedOrder]   = useState(null);
  const [autoRefresh, setAutoRefresh]       = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [_tick, setTick] = useState(0); // force re-render for auto-refresh

  // Stats
  const total     = orders.length;
  const pending   = orders.filter(o => o.status === 'Pending').length;
  const inTransit = orders.filter(o => o.status === 'In Transit' || o.status === 'Picked Up').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;

  // Auto-refresh (re-reads Zustand state every 5s)
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // Update modal with latest order data
  const modalOrder = selectedOrder
    ? orders.find(o => o.id === selectedOrder.id) ?? null
    : null;

  const handleReset = () => {
    resetDemoData();
    setShowResetConfirm(false);
    setSelectedOrder(null);
  };

  return (
    <div className="dashboard">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar__brand">
          <span className="navbar__icon">🚚</span>
          <div>
            <span className="navbar__title">Operations Hub</span>
            <span className="navbar__sub">Manager Dashboard</span>
          </div>
        </div>
        <div className="navbar__actions">
          {autoRefresh && (
            <span className="auto-refresh-badge">● Live</span>
          )}
          <span className="navbar__email">{user.email}</span>
          <button
            id="manager-logout"
            className="btn btn--ghost btn--sm"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard__main">
        {/* ── Stats ── */}
        <section className="stats-grid">
          <StatCard icon="📦" label="Total Orders"  value={total}     cls="stat--neutral" />
          <StatCard icon="⏳" label="Pending"        value={pending}   cls="stat--warning" />
          <StatCard icon="🚚" label="In Transit"     value={inTransit} cls="stat--info"    />
          <StatCard icon="✅" label="Delivered"      value={delivered} cls="stat--success" />
        </section>

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <h2 className="section-title">All Delivery Consignments</h2>
          <div className="toolbar__right">
            <button
              id="toggle-autorefresh"
              className={`btn btn--sm ${autoRefresh ? 'btn--success' : 'btn--ghost'}`}
              onClick={() => setAutoRefresh(r => !r)}
            >
              {autoRefresh ? '⏸ Stop Auto-refresh' : '▶ Auto-refresh (5s)'}
            </button>
            <button
              id="reset-demo"
              className="btn btn--danger btn--sm"
              onClick={() => setShowResetConfirm(true)}
            >
              ↺ Reset Demo
            </button>
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Live Coords</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const pct = calcProgress(order);
                return (
                  <tr
                    key={order.id}
                    className="orders-table__row"
                    onClick={() => setSelectedOrder(order)}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedOrder(order)}
                    aria-label={`View details for order ${order.id}`}
                  >
                    <td><code className="order-id">{order.id}</code></td>
                    <td className="fw-medium">{order.customerName}</td>
                    <td className="text-muted text-sm">{order.address}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ minWidth: 120 }}>
                      <ProgressBar pct={pct} size="sm" />
                    </td>
                    <td className="coords-cell">
                      <span>{order.currentCoordinates.latitude.toFixed(5)}</span>
                      <span>{order.currentCoordinates.longitude.toFixed(5)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Order Detail Modal ── */}
      {modalOrder && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Order detail for ${modalOrder.id}`}
        >
          <div className="modal">
            <div className="modal__header">
              <div>
                <h2 className="modal__title">🔍 {modalOrder.id}</h2>
                <p className="text-muted">{modalOrder.customerName}</p>
              </div>
              <button
                className="modal__close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal__body">
              <DetailRow label="Address"  value={modalOrder.address} />
              <DetailRow label="Status">
                <StatusBadge status={modalOrder.status} />
              </DetailRow>

              <div className="modal-divider" />

              <DetailRow
                label="Start"
                value={`Lat ${modalOrder.startCoordinates.latitude}  Lng ${modalOrder.startCoordinates.longitude}`}
              />
              <DetailRow
                label="Destination"
                value={`Lat ${modalOrder.endCoordinates.latitude}  Lng ${modalOrder.endCoordinates.longitude}`}
              />

              {modalOrder.status !== 'Pending' && (
                <>
                  <div className="modal-divider" />
                  <div className="modal-live">
                    <span className="modal-live__label">📍 Live Position</span>
                    <span className="modal-live__coords">
                      Lat {modalOrder.currentCoordinates.latitude.toFixed(6)}
                      &nbsp;&nbsp;Lng {modalOrder.currentCoordinates.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <p className="text-muted text-sm" style={{ marginBottom: 6 }}>
                      Route Progress
                    </p>
                    <ProgressBar pct={calcProgress(modalOrder)} size="lg" />
                  </div>
                </>
              )}
            </div>

            <div className="modal__footer">
              <button
                className="btn btn--ghost"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Confirm Modal ── */}
      {showResetConfirm && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowResetConfirm(false)}
        >
          <div className="modal modal--sm">
            <div className="modal__header">
              <h2 className="modal__title">⚠️ Reset Demo Data?</h2>
            </div>
            <div className="modal__body">
              <p className="text-muted">
                This will reset all 5 orders back to <strong>Pending</strong> and
                clear any active GPS tracking. This cannot be undone.
              </p>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--ghost"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                id="confirm-reset"
                className="btn btn--danger"
                onClick={handleReset}
              >
                Reset All Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, cls }) {
  return (
    <div className={`stat-card ${cls}`}>
      <span className="stat-card__icon">{icon}</span>
      <div>
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, children }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__value">{children ?? value}</span>
    </div>
  );
}
