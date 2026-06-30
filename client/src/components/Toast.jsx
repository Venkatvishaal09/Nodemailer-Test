import { useState, useCallback } from "react";

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, message) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return { toasts, showToast };
}

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((t) => {
        const icons = { success: "check_circle", error: "error", info: "info" };
        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="material-icons-outlined">
              {icons[t.type] || "info"}
            </span>
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
