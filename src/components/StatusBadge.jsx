// src/components/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const config = {
    'Pending':    { cls: 'badge-pending',   icon: '⏳', label: 'Pending'    },
    'Picked Up':  { cls: 'badge-picked',    icon: '📦', label: 'Picked Up'  },
    'In Transit': { cls: 'badge-transit',   icon: '🚚', label: 'In Transit' },
    'Delivered':  { cls: 'badge-delivered', icon: '✅', label: 'Delivered'  },
  };

  const { cls, icon, label } = config[status] ?? { cls: 'badge-pending', icon: '❓', label: status };

  return (
    <span className={`status-badge ${cls}`}>
      {icon} {label}
    </span>
  );
}
