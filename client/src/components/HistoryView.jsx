function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryView({ history, onClearHistory, showToast }) {
  const handleClear = () => {
    if (confirm("Clear all sent history?")) {
      onClearHistory();
      showToast("info", "History cleared");
    }
  };

  return (
    <section className="view active" id="view-history">
      <div className="history-wrapper">
        <div className="history-header">
          <h2>Sent History</h2>
          <button
            className="btn btn-secondary btn-sm"
            id="btn-clear-history"
            onClick={handleClear}
          >
            <span className="material-icons-outlined">delete_sweep</span>
            Clear All
          </button>
        </div>
        <div className="history-list" id="history-list">
          {!history.length ? (
            <div className="empty-state">
              <span className="material-icons-outlined empty-icon">inbox</span>
              <p>No campaigns sent yet.</p>
            </div>
          ) : (
            history.map((h) => (
              <div className="history-card" key={h.id}>
                <div className="history-card-header">
                  <div className="history-card-title">
                    {escapeHtml(h.subject)}
                  </div>
                  <div className="history-card-date">
                    {formatDate(h.date)}
                  </div>
                </div>
                <div className="history-card-stats">
                  <span>
                    <span className="material-icons-outlined">group</span>
                    {h.total} recipients
                  </span>
                  <span style={{ color: "var(--green-500)" }}>
                    <span className="material-icons-outlined">
                      check_circle
                    </span>
                    {h.success} sent
                  </span>
                  {h.failed > 0 && (
                    <span style={{ color: "var(--red-500)" }}>
                      <span className="material-icons-outlined">error</span>
                      {h.failed} failed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
