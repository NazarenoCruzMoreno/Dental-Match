import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SESSION_EXPIRED_MSG_KEY } from "../services/api";

const ToastContext = createContext(null);

const TYPES = {
  success: { bg: "linear-gradient(135deg,#10b981,#059669)", icon: "✓" },
  error:   { bg: "linear-gradient(135deg,#ef4444,#dc2626)", icon: "✕" },
  info:    { bg: "linear-gradient(135deg,#3b82f6,#2563eb)", icon: "ℹ" },
  warning: { bg: "linear-gradient(135deg,#f59e0b,#d97706)", icon: "⚠" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((curr) => [...curr, { id, message, type }]);
    setTimeout(() => setToasts((curr) => curr.filter((t) => t.id !== id)), duration);
  }, []);

  const api = {
    show,
    success: (msg, d) => show(msg, "success", d),
    error:   (msg, d) => show(msg, "error",   d),
    info:    (msg, d) => show(msg, "info",    d),
    warning: (msg, d) => show(msg, "warning", d),
  };

  // Mensaje "flash": lo dejó guardado api.js antes de un window.location.href
  // por sesión expirada (un Toast disparado justo antes del reload no llega a verse).
  useEffect(() => {
    const msg = sessionStorage.getItem(SESSION_EXPIRED_MSG_KEY);
    if (msg) {
      sessionStorage.removeItem(SESSION_EXPIRED_MSG_KEY);
      show(msg, "error", 5000);
    }
  }, [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={styles.container}>
        {toasts.map((t) => {
          const cfg = TYPES[t.type] ?? TYPES.info;
          return (
            <div key={t.id} style={{ ...styles.toast, background: cfg.bg }}>
              <span style={styles.icon}>{cfg.icon}</span>
              <span style={styles.message}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
};

const styles = {
  container: { position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 10000, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "90vw", pointerEvents: "none" },
  toast:     { display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", color: "#fff", borderRadius: "14px", fontFamily: "'Inter',sans-serif", fontSize: "14px", fontWeight: 600, boxShadow: "0 12px 32px rgba(0,0,0,0.18)", animation: "toastSlideIn .3s cubic-bezier(0.21,1.02,0.73,1)", pointerEvents: "auto", minWidth: "240px" },
  icon:      { fontSize: "18px", fontWeight: 800, lineHeight: 1 },
  message:   { lineHeight: 1.4, flex: 1 },
};
