import { useEffect, useRef, useState } from "react";
import { notificationService } from "../../services/api";
import PushToggle from "../PushToggle/PushToggle";

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export default function NotificationsBell() {
  const [notifs,  setNotifs]  = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const unread = notifs.filter(n => !n.read).length;

  const load = () => {
    setLoading(true);
    notificationService.getAll()
      .then(setNotifs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unread > 0) {
      notificationService.markRead().then(() => {
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      }).catch(() => {});
    }
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60)   return "hace un momento";
    if (diff < 3600) return `hace ${Math.floor(diff/60)}m`;
    if (diff < 86400)return `hace ${Math.floor(diff/3600)}h`;
    return `hace ${Math.floor(diff/86400)}d`;
  };

  return (
    <div ref={ref} style={styles.wrapper}>
      <button style={styles.bell} onClick={handleOpen} aria-label="Notificaciones">
        <IconBell />
        {unread > 0 && <span style={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <span style={styles.dropTitle}>Notificaciones</span>
            {unread > 0 && <span style={styles.unreadLabel}>{unread} nuevas</span>}
          </div>

          {loading ? (
            <div style={styles.empty}>Cargando...</div>
          ) : notifs.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
              <div>No tenés notificaciones</div>
            </div>
          ) : (
            <div style={styles.list}>
              {notifs.map(n => (
                <div key={n.id} style={{ ...styles.item, ...(n.read ? {} : styles.itemUnread) }}>
                  <div style={styles.itemDot(n.read)} />
                  <div style={{ flex: 1 }}>
                    <div style={styles.itemTitle}>{n.title}</div>
                    <div style={styles.itemMsg}>{n.message}</div>
                    <div style={styles.itemTime}>{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <PushToggle />
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper:     { position: "relative" },
  bell:        { position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "#fff" },
  badge:       { position: "absolute", top: "-6px", right: "-6px", background: "var(--color-danger)", color: "#fff", borderRadius: "var(--radius-full)", fontSize: "10px", fontWeight: 900, minWidth: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid white" },
  dropdown:    { position: "absolute", top: "calc(100% + 12px)", right: 0, width: "320px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)", zIndex: 9000, overflow: "hidden" },
  dropHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" },
  dropTitle:   { fontSize: "15px", fontWeight: 800, color: "var(--text-primary)" },
  unreadLabel: { fontSize: "12px", fontWeight: 700, color: "var(--color-info)", background: "var(--color-info-bg)", padding: "2px 8px", borderRadius: "var(--radius-full)" },
  empty:       { padding: "32px 20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" },
  list:        { maxHeight: "320px", overflowY: "auto" },
  item:        { display: "flex", gap: "12px", padding: "14px 20px", borderBottom: "1px solid var(--border)", alignItems: "flex-start" },
  itemUnread:  { background: "var(--bg-subtle)" },
  itemDot:     (read) => ({ width: "8px", height: "8px", minWidth: "8px", borderRadius: "var(--radius-full)", background: read ? "var(--border-strong)" : "var(--color-primary)", marginTop: "5px" }),
  itemTitle:   { fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" },
  itemMsg:     { fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px", lineHeight: "1.4" },
  itemTime:    { fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" },
};
