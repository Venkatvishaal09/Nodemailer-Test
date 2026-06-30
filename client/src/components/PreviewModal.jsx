export default function PreviewModal({
  isOpen,
  onClose,
  onSend,
  to,
  subject,
  from,
  body,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      id="modal-preview"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>Email Preview</h3>
          <button className="btn-icon" id="btn-close-preview" onClick={onClose}>
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="modal-body">
          <div className="preview-meta">
            <div>
              <strong>To:</strong> <span id="preview-to">{to}</span>
            </div>
            <div>
              <strong>Subject:</strong>{" "}
              <span id="preview-subject">{subject}</span>
            </div>
            <div>
              <strong>From:</strong> <span id="preview-from">{from}</span>
            </div>
          </div>
          <hr />
          <div
            className="preview-body"
            id="preview-body"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            id="btn-close-preview-2"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="btn btn-primary"
            id="btn-send-from-preview"
            onClick={onSend}
          >
            <span className="material-icons-outlined">send</span>
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
}
