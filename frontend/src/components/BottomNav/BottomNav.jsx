import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUser, isSessionValid } from "../../services/api";

// ── Iconos ──────────────────────────────────────────────────────────────────
const IconHome     = (active) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22" stroke={active ? "#fff" : "currentColor"} fill="none"/></svg>);
const IconUsers    = (active) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const IconHeart    = (active) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IconCalendar = (active) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6" stroke={active ? "#fff" : "currentColor"}/><line x1="8"  y1="2" x2="8"  y2="6" stroke={active ? "#fff" : "currentColor"}/><line x1="3"  y1="10" x2="21" y2="10" stroke={active ? "#fff" : "currentColor"}/></svg>);
const IconFolder   = (active) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>);

// Rutas donde NO mostrar el bottom nav
const HIDDEN_PATHS = ["/", "/login", "/register"];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getUser());

  // Actualizar user en cambios de ruta (post-login)
  useEffect(() => { setUser(getUser()); }, [location.pathname]);

  if (HIDDEN_PATHS.includes(location.pathname) || !isSessionValid() || !user) return null;

  // Tabs según rol
  const tabsEstudiante = [
    { path: "/home",          label: "Inicio",    icon: IconHome     },
    { path: "/marketplace",   label: "Pacientes", icon: IconUsers    },
    { path: "/asignaciones",  label: "Mis casos", icon: IconFolder   },
    { path: "/turnos",        label: "Turnos",    icon: IconCalendar },
  ];
  const tabsPaciente = [
    { path: "/home",   label: "Inicio",  icon: IconHome     },
    { path: "/casos",  label: "Mis casos", icon: IconFolder },
    { path: "/match",  label: "Match",   icon: IconHeart    },
    { path: "/turnos", label: "Turnos",  icon: IconCalendar },
  ];
  const tabs = user.role === "estudiante" ? tabsEstudiante : tabsPaciente;

  const isActive = (path) => {
    if (path === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Spacer para que el contenido no quede tapado en mobile */}
      <div data-bottom-nav-spacer style={styles.spacer} />

      <nav data-bottom-nav style={styles.nav}>
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              style={styles.tab}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
            >
              <div style={{ ...styles.iconWrap, ...(active ? styles.iconActive : {}) }}>
                {tab.icon(active)}
              </div>
              <span style={{ ...styles.label, ...(active ? styles.labelActive : {}) }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

const styles = {
  // Spacer solo en mobile — desktop no tiene bottom nav
  spacer: { height: "0", display: "none" },
  nav:    {
    display: "none", // Se activa por media query inline abajo
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "rgba(255,255,255,0.98)",
    borderTop: "1px solid #e2e8f0",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    padding: "8px 8px calc(8px + env(safe-area-inset-bottom)) 8px",
    zIndex: 7000,
    fontFamily: "'Inter',sans-serif",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
  },
  tab: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
    background: "none", border: "none", padding: "8px 4px", cursor: "pointer", color: "#94a3b8",
    transition: "color .2s",
  },
  iconWrap: {
    width: "40px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "14px", transition: "all .25s cubic-bezier(0.4,0,0.2,1)",
  },
  iconActive: {
    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
  },
  label:       { fontSize: "10px", fontWeight: 600, letterSpacing: "0.2px" },
  labelActive: { color: "#2563eb", fontWeight: 700 },
};

// ── Media query inline (estilo CSS-in-JS) ─────────────────────────────────
// Se inyecta una sola vez al cargar el módulo.
if (typeof document !== "undefined" && !document.getElementById("bottom-nav-styles")) {
  const style = document.createElement("style");
  style.id = "bottom-nav-styles";
  style.textContent = `
    @media (max-width: 768px) {
      nav[data-bottom-nav] { display: flex !important; }
      div[data-bottom-nav-spacer] { display: block !important; height: 76px !important; }
    }
  `;
  document.head.appendChild(style);
}
