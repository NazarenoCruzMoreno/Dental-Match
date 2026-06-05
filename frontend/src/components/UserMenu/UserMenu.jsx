import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUser, clearAuth, isSessionValid, profileService } from "../../services/api";

// Rutas públicas donde NO se muestra el menú
const PUBLIC_PATHS = ["/", "/login", "/register"];

// ── Iconos ────────────────────────────────────────────────────────────────────
const IconUser    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconCalendar= () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IconHome    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const IconSwitch  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>);
const IconLogout  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);

export default function UserMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const ref      = useRef(null);
  const [open,    setOpen]    = useState(false);
  const [perfil,  setPerfil]  = useState(null);

  const user = getUser();

  // Cargar perfil para mostrar nombre y foto
  useEffect(() => {
    if (!isSessionValid()) return;
    profileService.get().then(({ perfil }) => setPerfil(perfil)).catch(() => {});
  }, [location.pathname]);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // No mostrar en rutas públicas ni sin sesión
  if (PUBLIC_PATHS.includes(location.pathname) || !isSessionValid() || !user) return null;

  const nombre  = perfil?.nombre ?? user.email?.split("@")[0] ?? "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();
  const roleLabel = user.role === "estudiante" ? "🎓 Estudiante" : "👤 Paciente";

  const go = (path) => { setOpen(false); navigate(path); };

  const cerrarSesion = () => {
    clearAuth();
    navigate("/login");
  };

  const cambiarCuenta = () => {
    clearAuth();
    navigate("/"); // vuelve a la selección para entrar con otra cuenta
  };

  return (
    <div ref={ref} style={s.wrapper}>
      {/* Avatar flotante */}
      <button style={s.avatarBtn} onClick={() => setOpen(o => !o)} aria-label="Menú de cuenta">
        {perfil?.imagen_url
          ? <img src={perfil.imagen_url} alt="avatar" style={s.avatarImg} />
          : <span style={s.avatarInitial}>{inicial}</span>}
        <span style={s.onlineDot} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={s.dropdown}>
          {/* Cabecera con info del usuario */}
          <div style={s.header}>
            <div style={s.headerAvatar}>
              {perfil?.imagen_url
                ? <img src={perfil.imagen_url} alt="" style={s.avatarImg} />
                : <span style={s.headerInitial}>{inicial}</span>}
            </div>
            <div style={s.headerInfo}>
              <div style={s.headerName}>{nombre}</div>
              <div style={s.headerEmail}>{user.email}</div>
              <div style={s.roleBadge}>{roleLabel}</div>
            </div>
          </div>

          <div style={s.divider} />

          {/* Navegación */}
          <button style={s.item} onClick={() => go("/home")}>
            <span style={s.itemIcon}><IconHome /></span> Inicio
          </button>
          <button style={s.item} onClick={() => go("/profile")}>
            <span style={s.itemIcon}><IconUser /></span> Mi perfil
          </button>
          <button style={s.item} onClick={() => go("/turnos")}>
            <span style={s.itemIcon}><IconCalendar /></span> Mis turnos
          </button>

          <div style={s.divider} />

          {/* Sesión */}
          <button style={s.item} onClick={cambiarCuenta}>
            <span style={s.itemIcon}><IconSwitch /></span> Cambiar de cuenta
          </button>
          <button style={{ ...s.item, ...s.itemDanger }} onClick={cerrarSesion}>
            <span style={{ ...s.itemIcon, color: "#ef4444" }}><IconLogout /></span> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper:      { position: "fixed", top: "16px", right: "16px", zIndex: 8000, fontFamily: "'Inter',sans-serif" },
  avatarBtn:    { position: "relative", width: "44px", height: "44px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.9)", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, overflow: "hidden", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" },
  avatarImg:    { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitial:{ fontSize: "18px", fontWeight: 800 },
  onlineDot:    { position: "absolute", bottom: "1px", right: "1px", width: "11px", height: "11px", borderRadius: "50%", background: "#10b981", border: "2px solid #fff" },

  dropdown:     { position: "absolute", top: "54px", right: 0, width: "260px", background: "#fff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1px solid #f1f5f9", overflow: "hidden", animation: "fadeIn .15s ease" },
  header:       { display: "flex", gap: "12px", padding: "18px 18px 14px", alignItems: "center" },
  headerAvatar: { width: "48px", height: "48px", minWidth: "48px", borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  headerInitial:{ fontSize: "20px", fontWeight: 800 },
  headerInfo:   { flex: 1, overflow: "hidden" },
  headerName:   { fontSize: "15px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  headerEmail:  { fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "1px" },
  roleBadge:    { display: "inline-block", marginTop: "6px", fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "999px" },
  divider:      { height: "1px", background: "#f1f5f9", margin: "2px 0" },
  item:         { display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "11px 18px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "#334155", fontFamily: "'Inter',sans-serif", textAlign: "left", transition: "background .12s" },
  itemIcon:     { color: "#64748b", display: "flex", alignItems: "center" },
  itemDanger:   { color: "#ef4444" },
};
