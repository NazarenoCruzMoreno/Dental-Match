import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getUser, clearAuth, profileService } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import NotificationsBell from "../../components/Notifications/NotificationsBell";
import OnboardingTour from "../../components/OnboardingTour/OnboardingTour";
import ActivityGraph from "../../components/ActivityGraph/ActivityGraph";

// ── Iconos ─────────────────────────────────────────────────────────────────────
const IconProfile = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconLogout  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconEdit    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IconMoon    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);
const IconSun     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);

// ── 🪥 Cepillo de dientes 3D en perspectiva ───────────────────────────────────
const ToothbrushDecoration = () => (
  <div style={deco.wrapper} aria-hidden="true">
    <svg viewBox="0 0 160 380" style={deco.svg}>
      <defs>
        <linearGradient id="handleTop" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#93c5fd"/>
          <stop offset="40%" stopColor="#dbeafe"/>
          <stop offset="100%" stopColor="#60a5fa"/>
        </linearGradient>
        <linearGradient id="handleSide" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4"/>
        </linearGradient>
        <linearGradient id="headTop" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#bfdbfe"/>
          <stop offset="50%" stopColor="#eff6ff"/>
          <stop offset="100%" stopColor="#93c5fd"/>
        </linearGradient>
        <linearGradient id="bristleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#bfdbfe"/>
        </linearGradient>
        <linearGradient id="rubberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fdba74"/>
          <stop offset="60%" stopColor="#fef3c7"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* ── Sombra proyectada ── */}
      <ellipse cx="90" cy="368" rx="28" ry="7" fill="#3b82f6" opacity="0.12"/>

      {/* ── Mango (handle) — cara frontal ── */}
      <path d="M52 355 Q48 340 48 180 L56 170 L84 170 L92 180 Q92 340 88 355 Z"
        fill="url(#handleTop)" filter="url(#softShadow)"/>
      {/* Cara lateral derecha — efecto 3D */}
      <path d="M84 170 L92 180 Q92 340 88 355 L96 348 Q100 333 100 180 L92 170 Z"
        fill="url(#handleSide)"/>
      {/* Brillo superior del mango */}
      <path d="M56 175 Q54 260 54 330" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>

      {/* ── Grip de goma (banda naranja) ── */}
      <path d="M48 270 Q48 255 56 250 L84 250 Q92 255 92 270 L92 295 Q92 310 84 315 L56 315 Q48 310 48 295 Z"
        fill="url(#rubberGrad)" opacity="0.85"/>
      <path d="M84 250 L92 260 L92 305 L84 315 L92 310 Q100 305 100 290 L100 265 Q100 255 92 250 Z"
        fill="#d97706" opacity="0.4"/>
      {/* Líneas del grip */}
      {[260,272,284,296].map((y, i) => (
        <line key={i} x1="52" y1={y} x2="88" y2={y} stroke="white" strokeWidth="1.5" opacity="0.4"/>
      ))}

      {/* ── Cuello (neck) — transición a la cabeza ── */}
      <path d="M56 170 L48 130 L58 125 L84 125 L94 130 L84 170 Z"
        fill="url(#handleTop)"/>
      <path d="M84 170 L92 180 L94 130 L84 125 Z"
        fill="url(#handleSide)"/>

      {/* ── Cabeza (head) — más ancha ── */}
      <path d="M30 125 Q28 110 30 40 L40 32 L110 32 L120 40 Q122 110 120 125 Z"
        fill="url(#headTop)" filter="url(#softShadow)"/>
      {/* Cara lateral de la cabeza */}
      <path d="M110 32 L120 40 Q122 110 120 125 L128 118 Q130 108 130 40 L120 30 Z"
        fill="url(#handleSide)"/>
      {/* Borde inferior de la cabeza */}
      <path d="M30 125 Q79 132 120 125 L128 118 Q79 125 28 118 Z"
        fill="#2563eb" opacity="0.2"/>

      {/* ── Porta-cerdas (bristle base) ── */}
      <rect x="35" y="35" width="80" height="75" rx="8" fill="white" opacity="0.6"/>
      <rect x="120" y="35" width="8" height="75" rx="2" fill="#93c5fd" opacity="0.4"/>

      {/* ── Cerdas (bristles) en grilla 5×4 ── */}
      {[45, 57, 69, 81, 93].map((x, ci) =>
        [38, 52, 66, 80].map((y, ri) => (
          <g key={`${ci}-${ri}`}>
            <rect x={x} y={y} width="6" height="20" rx="3"
              fill={ri === 0 ? "#3b82f6" : ri === 1 ? "#60a5fa" : "white"}
              opacity={ri === 0 ? 0.9 : 0.8}/>
            {/* Puntita redondeada de la cerda */}
            <circle cx={x+3} cy={y} r="3"
              fill={ri === 0 ? "#2563eb" : ri === 1 ? "#3b82f6" : "#bfdbfe"}
              opacity="0.9"/>
          </g>
        ))
      )}

      {/* ── Logo / detalle decorativo ── */}
      <rect x="50" y="195" width="50" height="8" rx="4" fill="white" opacity="0.25"/>
      <rect x="50" y="210" width="35" height="6" rx="3" fill="white" opacity="0.18"/>
    </svg>
  </div>
);

const deco = {
  wrapper: { position: "absolute", right: "-18px", top: "8%", width: "220px", height: "380px", pointerEvents: "none", zIndex: 0, animation: "toothFloat 7s ease-in-out infinite" },
  svg:     { width: "100%", height: "100%", opacity: 0.82 },
};

// ── E: Olas en tonos azules ───────────────────────────────────────────────────
const WaveDecoration = () => (
  <div style={{ position: "relative", width: "100%", lineHeight: 0, marginTop: "8px" }} aria-hidden="true">
    <svg viewBox="0 0 1440 160" style={{ width: "100%", height: "160px", display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="w1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#dbeafe" stopOpacity="0.9"/>
          <stop offset="50%"  stopColor="#bfdbfe" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.7"/>
        </linearGradient>
        <linearGradient id="w2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#bfdbfe" stopOpacity="0.7"/>
          <stop offset="50%"  stopColor="#93c5fd" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.5"/>
        </linearGradient>
        <linearGradient id="w3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#93c5fd" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4"/>
        </linearGradient>
      </defs>
      {/* Ola 1 — más clara, atrás */}
      <path d="M0,80 C180,40 360,120 540,80 C720,40 900,110 1080,75 C1260,40 1380,90 1440,70 L1440,160 L0,160 Z" fill="url(#w1)"/>
      {/* Ola 2 — media */}
      <path d="M0,100 C200,65 400,130 600,95 C800,60 1000,120 1200,88 C1320,72 1390,100 1440,90 L1440,160 L0,160 Z" fill="url(#w2)"/>
      {/* Ola 3 — más oscura, adelante */}
      <path d="M0,120 C240,90 480,145 720,115 C960,85 1200,140 1440,115 L1440,160 L0,160 Z" fill="url(#w3)"/>
    </svg>
  </div>
);

// ── A: Contador animado ────────────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 1800, suffix = "" }) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    const tick  = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return <span>{count}{suffix}</span>;
}

function StatsBar({ stats, isDark }) {
  const items = [
    { value: stats.estudiantes, label: "Estudiantes", color: "#3b82f6", bg: isDark ? "#1e3a5f" : "#eff6ff", border: "#bfdbfe" },
    { value: stats.pacientes,   label: "Pacientes",   color: "#f59e0b", bg: isDark ? "#2d1f0e" : "#fff7ed", border: "#fed7aa" },
    { value: stats.matches,     label: "Matches",     color: "#10b981", bg: isDark ? "#0f2d1f" : "#f0fdf4", border: "#bbf7d0" },
  ];
  return (
    <div style={s.statsBar}>
      {items.map((item, i) => (
        <div key={i} style={{ ...s.statItem, background: item.bg, border: `1px solid ${item.border}` }}>
          <div style={{ ...s.statNum, color: item.color }}>
            <AnimatedCounter target={item.value} duration={1500 + i * 200} />
          </div>
          <div style={s.statLabel}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── D: Progreso del perfil ────────────────────────────────────────────────────
function ProfileProgress({ perfil, role, onEdit }) {
  const fields = role === "estudiante"
    ? ["nombre","universidad","descripcion","materias","disponibilidad","anio_carrera"]
    : ["nombre","edad","problema_dental","telefono","imagen_url"];
  const filled = perfil
    ? fields.filter(f => { const v = perfil[f]; return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0); }).length
    : 0;
  const pct   = Math.round((filled / fields.length) * 100);
  const color = pct < 50 ? "#f59e0b" : pct < 100 ? "#3b82f6" : "#10b981";
  const msg   = pct < 50  ? "Completá tu perfil para aparecer en búsquedas"
              : pct < 100 ? "¡Casi listo! Agregá los datos que faltan"
              : "Tu perfil está completo 🎉";
  return (
    <div style={s.progressCard}>
      <div style={s.progressHeader}>
        <div>
          <div style={s.progressTitle}>Completitud del perfil</div>
          <div style={s.progressMsg}>{msg}</div>
        </div>
        <button style={{ ...s.progressEditBtn, color, borderColor: `${color}50`, background: `${color}10` }} onClick={onEdit}>
          <IconEdit /> Editar
        </button>
      </div>
      <div style={s.progressBarBg}>
        <div style={{ ...s.progressBarFill, width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}cc)` }}/>
      </div>
      <div style={{ ...s.progressPct, color }}>{pct}%</div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate        = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const user            = getUser();
  const role            = user?.role;
  const [perfil, setPerfil]  = useState(null);
  const [stats,  setStats]   = useState({ estudiantes: 0, pacientes: 0, matches: 0 });

  useEffect(() => {
    profileService.get().then(({ perfil }) => setPerfil(perfil)).catch(() => {});
    fetch("/api/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const handleLogout = () => { clearAuth(); navigate("/login"); };
  const nombre = perfil?.nombre ?? user?.email?.split("@")[0] ?? "usuario";
  const fraseRol = role === "estudiante"
    ? "Conectá con pacientes reales y sumá experiencia clínica."
    : "El estudiante ideal para tu tratamiento está a un click.";

  const cards = role === "estudiante"
    ? [
        { icon: "👤", title: "Mi perfil",      desc: "Tu universidad, materias y disponibilidad.",   action: () => navigate("/profile"), label: "Ver perfil",   primary: true },
        { icon: "🦷", title: "Casos clínicos",  desc: "Próximamente: explorá pacientes disponibles.", action: null, label: "Próximamente", primary: false },
        { icon: "📅", title: "Mis turnos",      desc: "Próximamente: gestioná tus turnos.",           action: null, label: "Próximamente", primary: false },
      ]
    : [
        { icon: "👤", title: "Mi perfil",        desc: "Tus datos personales y problema dental.",     action: () => navigate("/profile"), label: "Ver perfil",   primary: true },
        { icon: "🔍", title: "Buscar estudiante", desc: "Próximamente: encontrá tu match ideal.",      action: null, label: "Próximamente", primary: false },
        { icon: "📅", title: "Mis turnos",        desc: "Próximamente: seguí el estado de tus turnos.",action: null, label: "Próximamente", primary: false },
      ];

  return (
    <div style={{ ...s.pageWrapper, background: isDark ? "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#1c1917 100%)" : "linear-gradient(135deg,#f8fafc 0%,#eff6ff 60%,#fff7ed 100%)" }}>

      {/* 🌍 Onboarding tour — primera vez */}
      <OnboardingTour />

      {/* 🪥 Cepillo flotante */}
      <ToothbrushDecoration />

      <div style={s.page}>
        <div style={s.container}>

          {/* C: Card bienvenida */}
          <div style={s.welcomeCard}>
            <div style={s.welcomeLeft}>
              <div style={s.badge}>DENTAL MATCH</div>
              <h1 style={s.title}>Hola, <span style={s.highlight}>{nombre}</span> 👋</h1>
              <p style={s.sub}>{fraseRol}</p>
              <div style={s.rolePill}>{role === "estudiante" ? "🎓 Estudiante" : "👤 Paciente"}</div>
            </div>
            {/* Controles: dark mode + notificaciones + salir */}
            <div style={s.headerControls}>
              <button style={s.iconBtn} onClick={toggleTheme} title={isDark ? "Modo claro" : "Modo oscuro"}>
                {isDark ? <IconSun /> : <IconMoon />}
              </button>
              <NotificationsBell />
              <button style={s.logoutBtn} onClick={handleLogout}><IconLogout /> Salir</button>
            </div>
            <div style={s.deco1}/><div style={s.deco2}/>
          </div>

          {/* A: Stats reales */}
          <StatsBar stats={stats} isDark={isDark} />

          {/* D: Progreso del perfil */}
          {perfil !== null && <ProfileProgress perfil={perfil} role={role} onEdit={() => navigate("/profile/edit")} />}

          {/* 📊 Gráfico de actividad */}
          <ActivityGraph role={role} />

          {/* Cards de navegación */}
          <div style={{ fontSize: "18px", fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a" }}>¿Qué querés hacer hoy?</div>
          <div style={s.grid}>
            {cards.map((card, i) => (
              <div key={i} style={{ ...s.card, ...(card.primary ? s.cardPrimary : {}), background: card.primary ? (isDark ? "linear-gradient(135deg,#1e3a5f,#1e293b)" : "linear-gradient(135deg,#fff,#eff6ff)") : (isDark ? "#1e293b" : "#fff") }}>
                <div style={{ fontSize: "30px" }}>{card.icon}</div>
                <h3 style={{ ...s.cardTitle, color: isDark ? "#f1f5f9" : "#0f172a" }}>{card.title}</h3>
                <p style={{ ...s.cardDesc, color: isDark ? "#94a3b8" : "#64748b" }}>{card.desc}</p>
                <button
                  style={{ ...s.cardBtn, ...(card.primary ? s.cardBtnPrimary : s.cardBtnDisabled) }}
                  onClick={card.action ?? undefined} disabled={!card.action}>
                  {card.primary && <IconProfile />}{card.label}
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* E: Olas en tonos azules */}
      <WaveDecoration />
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  pageWrapper:     { minHeight: "100vh", position: "relative", fontFamily: "'Inter', sans-serif", overflowX: "hidden" },
  page:            { padding: "36px 20px 10px", position: "relative", zIndex: 1 },
  container:       { maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "22px", paddingBottom: "30px" },

  welcomeCard:     { background: "linear-gradient(135deg,#1e40af 0%,#2563eb 50%,#3b82f6 100%)", borderRadius: "24px", padding: "32px 36px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", overflow: "hidden", boxShadow: "0 20px 60px rgba(37,99,235,0.35)", flexWrap: "wrap", gap: "16px" },
  welcomeLeft:     { display: "flex", flexDirection: "column", gap: "10px", zIndex: 1 },
  badge:           { display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "5px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: 900, letterSpacing: "1.5px", width: "fit-content" },
  title:           { fontSize: "32px", fontWeight: 900, margin: 0, letterSpacing: "-1px", lineHeight: 1.2 },
  highlight:       { color: "#93c5fd" },
  sub:             { fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: "1.6", maxWidth: "380px" },
  rolePill:        { display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", fontSize: "13px", fontWeight: 700, width: "fit-content" },
  headerControls:  { display: "flex", alignItems: "center", gap: "8px", zIndex: 1, flexShrink: 0 },
  iconBtn:         { display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "10px", cursor: "pointer", color: "#fff" },
  logoutBtn:       { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  deco1:           { position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", top: "-60px", right: "80px", pointerEvents: "none" },
  deco2:           { position: "absolute", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: "-40px", right: "20px", pointerEvents: "none" },

  statsBar:        { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" },
  statItem:        { borderRadius: "16px", padding: "18px 20px", textAlign: "center" },
  statNum:         { fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1 },
  statLabel:       { fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },

  progressCard:    { background: "var(--bg-card,#fff)", borderRadius: "20px", padding: "22px 26px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "10px" },
  progressHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" },
  progressTitle:   { fontSize: "14px", fontWeight: 800, color: "var(--text-primary,#0f172a)" },
  progressMsg:     { fontSize: "12px", color: "var(--text-secondary,#64748b)", marginTop: "2px" },
  progressEditBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  progressBarBg:   { height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: "999px", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" },
  progressPct:     { fontSize: "12px", fontWeight: 800, textAlign: "right" },

  grid:            { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "16px" },
  card:            { borderRadius: "20px", padding: "24px 20px", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", gap: "10px" },
  cardPrimary:     { border: "2px solid #bfdbfe" },
  cardTitle:       { fontSize: "16px", fontWeight: 800, margin: 0 },
  cardDesc:        { fontSize: "13px", lineHeight: "1.6", margin: 0, flex: 1 },
  cardBtn:         { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "4px" },
  cardBtnPrimary:  { background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff" },
  cardBtnDisabled: { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" },
};
