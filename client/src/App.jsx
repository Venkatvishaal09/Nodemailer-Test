import { useState, useCallback } from "react";
import useLocalStorage from "./hooks/useLocalStorage";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ComposeView from "./components/ComposeView";
import HistoryView from "./components/HistoryView";
import ContactsView from "./components/ContactsView";
import ToastContainer, { useToast } from "./components/Toast";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";

const titles = {
  compose: "Compose Campaign",
  history: "Sent History",
  contacts: "Contacts",
};

const MAX_QUOTA = 500;

export default function App() {
  const [activeView, setActiveView] = useState("compose");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [contacts, setContacts] = useLocalStorage("mp_contacts", []);
  const [history, setHistory] = useLocalStorage("mp_history", []);
  const [token, setToken] = useLocalStorage("mp_token", null);
  const [authView, setAuthView] = useState("login");
  const { toasts, showToast } = useToast();

  const handleNavigate = useCallback((view) => {
    setActiveView(view);
    setSidebarOpen(false);
  }, []);

  const handleEmailsSent = useCallback(
    (successCount, subject, totalEmails, failCount) => {
      setSentCount((prev) => prev + successCount);
      const entry = {
        id: Date.now(),
        subject,
        date: new Date().toISOString(),
        total: totalEmails,
        success: successCount,
        failed: failCount,
      };
      setHistory((prev) => [entry, ...prev]);
    },
    [setHistory]
  );

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const handleAddToRecipients = useCallback(
    (email) => {
      showToast("info", `Added ${email} to recipients`);
      handleNavigate("compose");
    },
    [showToast, handleNavigate]
  );

  const handleAuthSuccess = useCallback((newToken) => {
    setToken(newToken);
    showToast("success", "Successfully signed in");
  }, [setToken, showToast]);

  const handleLogout = useCallback(() => {
    setToken(null);
    showToast("info", "Signed out successfully");
  }, [setToken, showToast]);

  if (!token) {
    return (
      <>
        {authView === "login" ? (
          <LoginView 
            onLogin={handleAuthSuccess} 
            onToggleView={() => setAuthView("register")}
            showToast={showToast} 
          />
        ) : (
          <RegisterView 
            onRegister={handleAuthSuccess} 
            onToggleView={() => setAuthView("login")}
            showToast={showToast} 
          />
        )}
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <>
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        sentCount={sentCount}
        maxQuota={MAX_QUOTA}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <Topbar
          title={titles[activeView] || "Nodemailer Test"}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />

        {activeView === "compose" && (
          <ComposeView
            showToast={showToast}
            onEmailsSent={handleEmailsSent}
            token={token}
          />
        )}

        {activeView === "history" && (
          <HistoryView
            history={history}
            onClearHistory={handleClearHistory}
            showToast={showToast}
          />
        )}

        {activeView === "contacts" && (
          <ContactsView
            contacts={contacts}
            onSetContacts={setContacts}
            showToast={showToast}
            onAddToRecipients={handleAddToRecipients}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </>
  );
}
