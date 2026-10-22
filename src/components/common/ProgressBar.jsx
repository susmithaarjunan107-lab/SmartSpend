export default function ProgressBar({ percent, status = 'normal', label = 'Budget used' }) {
  const width = percent == null ? 0 : Math.max(0, Math.min(percent, 100));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent == null ? undefined : Math.round(percent)}
    >
      <span className={`progress-fill progress-fill--${status}`} style={{ width: `${width}%` }} />
    </div>
  );
}
