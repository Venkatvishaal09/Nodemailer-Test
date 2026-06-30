import { useState, useEffect } from "react";

export default function Topbar({ title, onMenuToggle }) {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    fetch("/send", { method: "OPTIONS" })
      .then(() => setConnected(true))
      .catch(() => setConnected(false));
  }, []);

  return (
    <header className="topbar">
      <button
        className="menu-toggle"
        id="menu-toggle"
        aria-label="Toggle menu"
        onClick={onMenuToggle}
      >
        <span className="material-icons-outlined">menu</span>
      </button>
      <h1 className="page-title" id="page-title">
        {title}
      </h1>
      <div className="topbar-right">
        <div
          className={`connection-badge${!connected ? " error" : ""}`}
          id="connection-badge"
        >
          <span className="status-dot" />
          <span>{connected ? "Connected" : "Offline"}</span>
        </div>
      </div>
    </header>
  );
}
