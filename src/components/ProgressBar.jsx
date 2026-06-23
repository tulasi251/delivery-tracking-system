// src/components/ProgressBar.jsx
export default function ProgressBar({ pct = 0, showLabel = true, size = 'md' }) {
  const clamped = Math.min(100, Math.max(0, Math.round(pct)));

  return (
    <div className={`progress-wrap progress-${size}`}>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label">{clamped}%</span>
      )}
    </div>
  );
}
