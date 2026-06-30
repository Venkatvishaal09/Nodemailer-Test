import { useState } from "react";
import AddContactModal from "./AddContactModal";

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getInitials(str) {
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return str.substring(0, 2).toUpperCase();
}

export default function ContactsView({
  contacts,
  onSetContacts,
  showToast,
  onAddToRecipients,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = searchQuery
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contacts;

  const handleDelete = (idx) => {
    const updated = [...contacts];
    updated.splice(idx, 1);
    onSetContacts(updated);
  };

  const handleSaveContact = (name, email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("error", "Please enter a valid email");
      return;
    }
    if (
      contacts.some((c) => c.email.toLowerCase() === email.toLowerCase())
    ) {
      showToast("error", "This contact already exists");
      return;
    }
    onSetContacts([...contacts, { name, email }]);
    setShowAddModal(false);
    showToast("success", "Contact saved");
  };

  const handleExport = () => {
    if (!contacts.length) {
      showToast("error", "No contacts to export");
      return;
    }
    const csv =
      "Name,Email\n" +
      contacts.map((c) => `"${c.name}","${c.email}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="view active" id="view-contacts">
      <div className="contacts-wrapper">
        <div className="contacts-header">
          <h2>Saved Contacts</h2>
          <div className="contacts-actions-top">
            <button
              className="btn btn-secondary btn-sm"
              id="btn-add-contact"
              onClick={() => setShowAddModal(true)}
            >
              <span className="material-icons-outlined">person_add</span>
              Add Contact
            </button>
            <button
              className="btn btn-secondary btn-sm"
              id="btn-export-contacts"
              onClick={handleExport}
            >
              <span className="material-icons-outlined">download</span>
              Export
            </button>
          </div>
        </div>

        <div className="contacts-search">
          <span className="material-icons-outlined search-icon">search</span>
          <input
            type="text"
            id="contacts-search-input"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="contacts-list" id="contacts-list">
          {!filtered.length ? (
            <div className="empty-state">
              <span className="material-icons-outlined empty-icon">
                people_outline
              </span>
              <p>
                {searchQuery
                  ? "No contacts match your search."
                  : "No contacts saved.\nAdd contacts manually or import from CSV."}
              </p>
            </div>
          ) : (
            filtered.map((c, i) => (
              <div className="contact-row" key={`${c.email}-${i}`}>
                <div className="contact-avatar">
                  {getInitials(c.name || c.email)}
                </div>
                <div className="contact-info">
                  <div className="contact-name">
                    {escapeHtml(c.name || "—")}
                  </div>
                  <div className="contact-email">{escapeHtml(c.email)}</div>
                </div>
                <div className="contact-actions">
                  <button
                    className="btn-icon btn-use-contact"
                    title="Add to recipients"
                    onClick={() => onAddToRecipients(c.email)}
                  >
                    <span className="material-icons-outlined">
                      add_circle_outline
                    </span>
                  </button>
                  <button
                    className="btn-icon btn-delete-contact"
                    title="Delete"
                    onClick={() => handleDelete(i)}
                  >
                    <span className="material-icons-outlined">
                      delete_outline
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveContact}
      />
    </section>
  );
}
