import Sidebar from './Sidebar.jsx';

export default function MobileNavigation({ open, onClose }) {
  return (
    <>
      <button
        type="button"
        className={`nav-backdrop${open ? ' is-open' : ''}`}
        aria-label="Close navigation"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <div className={`mobile-drawer${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <Sidebar onNavigate={onClose} showClose onClose={onClose} />
      </div>
    </>
  );
}
