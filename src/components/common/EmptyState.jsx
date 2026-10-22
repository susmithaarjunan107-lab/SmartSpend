export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon ? (
        <span className="empty-icon" aria-hidden="true">
          <Icon size={28} />
        </span>
      ) : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
