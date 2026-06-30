import { useState } from "react";

export default function AddContactModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(name.trim(), email.trim());
    setName("");
    setEmail("");
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      id="modal-add-contact"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3>Add Contact</h3>
          <button
            className="btn-icon"
            id="btn-close-add-contact"
            onClick={handleClose}
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="contact-name">Name</label>
            <input
              type="text"
              id="contact-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact-email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="contact-email"
              placeholder="john@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            id="btn-cancel-add-contact"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            id="btn-save-contact"
            onClick={handleSave}
          >
            Save Contact
          </button>
        </div>
      </div>
    </div>
  );
}
