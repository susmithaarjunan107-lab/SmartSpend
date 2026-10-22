export default function SummaryCard({ label, value, hint, icon: Icon, tone = 'positive', extra }) {
  return (
    <article className="card summary-card">
      <div className="summary-top">
        <span className="summary-label">{label}</span>
        {Icon ? (
          <span className={`icon-bubble tone-${tone}`} aria-hidden="true">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <div className={`summary-value money money--${tone === 'expense' ? 'negative' : tone === 'positive' ? 'positive' : 'neutral'}`}>{value}</div>
      {hint ? <p className="summary-hint">{hint}</p> : null}
      {extra}
    </article>
  );
}
