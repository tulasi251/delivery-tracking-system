// src/components/OrderCard.jsx
import StatusBadge from './StatusBadge.jsx';
import ProgressBar from './ProgressBar.jsx';

function calcProgress(order) {
  const latTotal = order.endCoordinates.latitude  - order.startCoordinates.latitude;
  const latDone  = order.currentCoordinates.latitude - order.startCoordinates.latitude;
  if (Math.abs(latTotal) < 0.0001) return order.status === 'Delivered' ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((latDone / latTotal) * 100)));
}

export default function OrderCard({ order, onClick, compact = false }) {
  const progress = calcProgress(order);
  const isActive = order.status === 'In Transit' || order.status === 'Picked Up';

  return (
    <div
      className={`order-card ${isActive ? 'order-card--active' : ''} ${compact ? 'order-card--compact' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="order-card__header">
        <div>
          <span className="order-card__id">{order.id}</span>
          <span className="order-card__customer">{order.customerName}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {!compact && (
        <p className="order-card__address">📍 {order.address}</p>
      )}

      {order.status !== 'Pending' && (
        <div className="order-card__progress">
          <div className="order-card__coords">
            <span>Lat {order.currentCoordinates.latitude.toFixed(6)}</span>
            <span>Lng {order.currentCoordinates.longitude.toFixed(6)}</span>
          </div>
          <ProgressBar pct={progress} size="sm" />
        </div>
      )}
    </div>
  );
}
