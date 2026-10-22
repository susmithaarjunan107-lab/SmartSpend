import { useEffect } from 'react';
import MonthSelector from '../common/MonthSelector.jsx';

export default function Header({ title, subtitle, actions, showMonth = false }) {
  useEffect(() => {
    document.title = `${title} · SmartSpend`;
  }, [title]);

  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="page-header-actions">
        {showMonth ? <MonthSelector /> : null}
        {actions}
      </div>
    </header>
  );
}
