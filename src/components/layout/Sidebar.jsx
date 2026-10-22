import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PieChart, Repeat, LineChart, Settings, Wallet, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext.jsx';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PieChart },
  { to: '/recurring', label: 'Recurring Expenses', icon: Repeat },
  { to: '/reports', label: 'Reports & Analytics', icon: LineChart },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function initials(name) {
  const parts = String(name || 'M').trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'M';
}

export default function Sidebar({ onNavigate, showClose = false, onClose }) {
  const { preferences } = useAppData();
  const name = preferences?.displayName || 'My finances';

  return (
    <aside className="sidebar">
      <div className="spread">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Wallet size={18} />
          </span>
          <span>
            <strong>SmartSpend</strong>
            <small>Expense & Budget</small>
          </span>
        </div>
        {showClose ? (
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        ) : null}
      </div>
      <nav className="nav-list" aria-label="Primary">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <NavLink to="/settings" className="profile" onClick={onNavigate}>
          <span className="avatar" aria-hidden="true">
            {initials(name)}
          </span>
          <span>
            <strong>{name}</strong>
            <small>On this device</small>
          </span>
        </NavLink>
        <p className="sidebar-note">Data stays in this browser.</p>
      </div>
    </aside>
  );
}
