import { useEffect, useRef } from "react";

export default function Modal({ open, onClose, title, children, maxWidth = "520px" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ ...styles.panel, maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div style={styles.header}>
            {title && <h3 style={styles.title}>{title}</h3>}
            {onClose && (
              <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Cerrar">✕</button>
            )}
          </div>
        )}
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "20px", zIndex: 9000,
  },
  panel: {
    width: "100%", maxHeight: "88vh", overflowY: "auto",
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)",
    outline: "none",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 24px", borderBottom: "1px solid var(--border)",
    position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1,
  },
  title: { margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" },
  closeBtn: {
    width: "32px", height: "32px", borderRadius: "var(--radius-sm)", border: "none",
    background: "var(--bg-subtle)", color: "var(--text-secondary)", cursor: "pointer",
    fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center",
  },
  body: { padding: "24px" },
};
