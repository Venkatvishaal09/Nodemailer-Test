export default function Sidebar({
  activeView,
  onNavigate,
  isOpen,
  sentCount,
  maxQuota,
  onLogout,
}) {
  const navItems = [
    { key: "compose", icon: "edit", label: "Compose" },
    { key: "history", icon: "history", label: "Sent History" },
    { key: "contacts", icon: "contacts", label: "Contacts" },
  ];

  const quotaPct = Math.min((sentCount / maxQuota) * 100, 100);

  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`} id="sidebar">
      <div className="sidebar-brand">
        <span className="material-icons-outlined brand-icon">mail</span>
        <span className="brand-name">Nodemailer Test</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <a
            href="#"
            key={item.key}
            className={`nav-item${activeView === item.key ? " active" : ""}`}
            data-view={item.key}
            id={`nav-${item.key}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(item.key);
            }}
          >
            <span className="material-icons-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
        <div style={{ flex: 1 }} />
        <a
          href="#"
          className="nav-item"
          onClick={(e) => {
            e.preventDefault();
            onLogout();
          }}
          style={{ marginTop: "auto" }}
        >
          <span className="material-icons-outlined">logout</span>
          <span>Logout</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="quota-info">
          <div className="quota-label">
            <span>Daily quota</span>
            <span id="quota-count">
              {sentCount} / {maxQuota}
            </span>
          </div>
          <div className="quota-bar">
            <div
              className="quota-fill"
              id="quota-fill"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
