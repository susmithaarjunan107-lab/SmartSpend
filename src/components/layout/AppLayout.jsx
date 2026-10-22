import { useState } from 'react';
import { Menu, Wallet } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext.jsx';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import MobileNavigation from './MobileNavigation.jsx';
import Sidebar from './Sidebar.jsx';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const data = useAppData();

  if (!data.ready) {
    return (
      <div className="loading-screen" role="status">
        <span className="brand-mark" aria-hidden="true">
          <Wallet size={18} />
        </span>
        <p>Loading your finances…</p>
      </div>
    );
  }

  const isEmpty =
    data.transactions.length === 0 &&
    data.budgets.length === 0 &&
    data.recurringExpenses.length === 0 &&
    data.customCategories.length === 0;
  const showPrompt = isEmpty && !data.meta.demoPromptSeen;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="sidebar-slot">
        <Sidebar />
      </div>
      <MobileNavigation open={open} onClose={() => setOpen(false)} />
      <div className="app-content">
        <div className="mobile-topbar">
          <button type="button" className="icon-btn" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <strong>SmartSpend</strong>
        </div>
        {data.storageError ? (
          <div className="banner banner--danger" role="alert">
            {data.storageError}
          </div>
        ) : null}
        {data.storageWarning && !data.storageError ? (
          <div className="banner" role="status">
            {data.storageWarning}
          </div>
        ) : null}
        {data.hasDemoData ? (
          <div className="banner" role="status">
            Sample data is loaded and labeled. Clear it from Settings without removing entries you added yourself.
          </div>
        ) : null}
        <main id="main" className="page">
          <Outlet />
        </main>
      </div>
      <div className="toast-region" aria-live="polite">
        {data.toasts.map((toast) => (
          <button key={toast.id} type="button" className={`toast toast--${toast.type === 'error' ? 'error' : 'info'}`} onClick={() => data.dismissToast(toast.id)}>
            {toast.message}
          </button>
        ))}
      </div>
      {showPrompt ? (
        <Modal title="Welcome to SmartSpend" onClose={data.dismissDemoPrompt}>
          <div className="stack-form">
            <p>
              SmartSpend keeps your budget on this device. Nothing is sent to a server, and it does not sync between browsers on its own.
            </p>
            <p>You can explore with labeled sample data, or start from an empty ledger. Sample records can be removed later.</p>
            <div className="form-actions">
              <Button variant="secondary" onClick={data.dismissDemoPrompt}>
                Start fresh
              </Button>
              <Button
                onClick={() => {
                  const result = data.loadDemoData();
                  if (!result.ok) data.notify(result.error || 'Sample data could not be loaded.', 'error');
                }}
              >
                Load sample data
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
