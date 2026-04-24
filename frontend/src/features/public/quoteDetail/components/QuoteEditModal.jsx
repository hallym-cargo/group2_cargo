export default function QuoteEditModal({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="quote-edit-modal-overlay" onClick={onClose}>
      <div
        className="quote-edit-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="quote-edit-modal__header">
          <button
            type="button"
            className="quote-edit-modal__close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="quote-edit-modal__body">{children}</div>
      </div>
    </div>
  );
}
