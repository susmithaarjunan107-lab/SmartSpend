import Button from './Button.jsx';
import Modal from './Modal.jsx';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p className="dialog-copy">{message}</p>
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
