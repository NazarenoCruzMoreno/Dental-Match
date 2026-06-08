import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isSessionValid } from "../../services/api";

// Rutas donde NO mostrar el botón (públicas + el propio home)
const HIDDEN_PATHS = ["/", "/login", "/register", "/home"];

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export default function HomeButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hover,   setHover]   = useState(false);
  const [pressed, setPressed] = useState(false);

  if (HIDDEN_PATHS.includes(location.pathname) || !isSessionValid()) return null;

  return (
    <button
      onClick={() => navigate("/home")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        ...s.btn,
        transform: pressed ? "scale(0.92)" : hover ? "scale(1.06)" : "scale(1)",
        boxShadow: hover
          ? "0 8px 24px rgba(37,99,235,0.45)"
          : "0 4px 16px rgba(37,99,235,0.35)",
      }}
      aria-label="Volver al inicio"
      title="Volver al inicio"
    >
      {/* Glow animado */}
      <span style={s.glow} />
      <span style={s.icon}><IconHome /></span>
      {/* Tooltip que aparece al hacer hover */}
      {hover && <span style={s.tooltip}>Inicio</span>}
    </button>
  );
}

const s = {
  btn: {
    position: "fixed", top: "16px", left: "16px", zIndex: 8000,
    width: "44px", height: "44px", borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.9)",
    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 0, overflow: "visible",
    fontFamily: "'Inter',sans-serif",
    transition: "transform .2s cubic-bezier(0.34,1.56,0.64,1), box-shadow .2s ease",
  },
  glow: {
    position: "absolute", inset: "-4px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)",
    pointerEvents: "none",
    animation: "homePulse 2.4s ease-in-out infinite",
  },
  icon: {
    position: "relative", zIndex: 1,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  tooltip: {
    position: "absolute", top: "54px", left: "50%",
    transform: "translateX(-50%)",
    background: "#0f172a", color: "#fff",
    fontSize: "12px", fontWeight: 600,
    padding: "5px 10px", borderRadius: "8px",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    pointerEvents: "none",
    animation: "fadeIn .15s ease",
  },
};
