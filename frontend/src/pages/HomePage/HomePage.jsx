import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getUser, profileService, statsService } from "../../services/api";
import { logout } from "../../utils/logout";
import { useTheme } from "../../context/ThemeContext";
import NotificationsBell from "../../components/Notifications/NotificationsBell";
import OnboardingTour from "../../components/OnboardingTour/OnboardingTour";
import ActivityGraph from "../../components/ActivityGraph/ActivityGraph";
import { Skeleton, GridSkeleton } from "../../components/Skeleton/Skeleton";

// ── Iconos ─────────────────────────────────────────────────────────────────────
const IconProfile = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconLogout  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconEdit    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);

// ── A: Contador animado ────────────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 1800 }) {
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
  }, [target]);
  return <span>{count}</span>;
}

function StatsBar({ stats }) {
  const items = [
    { value: stats.estudiantes, label: "Estudiantes", color: "var(--color-info)",    bg: "var(--color-info-bg)" },
    { value: stats.pacientes,   label: "Pacientes",   color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
    { value: stats.matches,     label: "Matches",     color: "var(--color-success)", bg: "var(--color-success-bg)" },
  ];
  return (
    <div style={s.statsBar} data-grid="stats">
      {items.map((item, i) => (
        <div key={i} style={{ ...s.statItem, background: item.bg }}>
          <div style={{ ...s.statNum, color: item.color }}><AnimatedCounter target={item.value} duration={1500 + i * 200}/></div>
          <div style={{ ...s.statLabel, color: "var(--text-secondary)" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── D: Progreso del perfil ─────────────────────────────────────────────────────
function ProfileProgress({ perfil, role, onEdit }) {
  const fields = role === "estudiante"
    ? ["nombre","universidad","descripcion","materias","disponibilidad","anio_carrera"]
    : ["nombre","edad","problema_dental","telefono","imagen_url"];
  const filled = perfil
    ? fields.filter(f => { const v = perfil[f]; return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0); }).length
    : 0;
  const pct     = Math.round((filled / fields.length) * 100);
  const tone    = pct < 50 ? "warning" : pct < 100 ? "info" : "success";
  const color   = `var(--color-${tone})`;
  const colorBg = `var(--color-${tone}-bg)`;
  const msg     = pct < 50  ? "Completá tu perfil para aparecer en búsquedas"
                : pct < 100 ? "¡Casi listo! Agregá los datos que faltan"
                : "Tu perfil está completo 🎉";
  return (
    <div style={s.progressCard}>
      <div style={s.progressHeader}>
        <div>
          <div style={s.progressTitle}>Completitud del perfil</div>
          <div style={s.progressMsg}>{msg}</div>
        </div>
        <button style={{ ...s.progressEditBtn, color, borderColor: color, background: colorBg }} onClick={onEdit}>
          <IconEdit /> Editar
        </button>
      </div>
      <div style={s.progressBarBg}>
        <div style={{ ...s.progressBarFill, width: `${pct}%`, background: color }}/>
      </div>
      <div style={{ ...s.progressPct, color }}>{pct}%</div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate       = useNavigate();
  const { isDark }     = useTheme();
  const user            = getUser();
  const role            = user?.role;
  const [perfil,  setPerfil]  = useState(null);
  const [stats,   setStats]   = useState({ estudiantes: 0, pacientes: 0, matches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      profileService.get().then(({ perfil }) => setPerfil(perfil)),
      statsService.publicas().then(setStats),
    ]).finally(() => setLoading(false));
  }, []);

  const nombre    = perfil?.nombre ?? user?.email?.split("@")[0] ?? "usuario";
  const fraseRol  = role === "estudiante"
    ? "Conectá con pacientes reales y sumá experiencia clínica."
    : "El estudiante ideal para tu tratamiento está a un click.";
  const cards = role === "estudiante"
    ? [
        { icon: "👤", title: "Mi perfil",    desc: "Tu universidad, materias y disponibilidad.",   action: () => navigate("/profile"),      label: "Ver perfil",    primary: true },
        { icon: "🦷", title: "Pacientes",   desc: "Explorá los casos disponibles para atender.",  action: () => navigate("/marketplace"),  label: "Ver pacientes", primary: true },
        { icon: "📋", title: "Mis casos",   desc: "Casos clínicos que estás atendiendo.",          action: () => navigate("/asignaciones"), label: "Ver mis casos", primary: false },
        { icon: "📅", title: "Mis turnos",  desc: "Confirmá y gestioná tus citas con pacientes.",  action: () => navigate("/turnos"),       label: "Ver turnos",    primary: false },
      ]
    : [
        { icon: "👤", title: "Mi perfil",      desc: "Tus datos personales y problema dental.",       action: () => navigate("/profile"),     label: "Ver perfil",    primary: true },
        { icon: "💚", title: "Dental Match",   desc: "Swipeá estudiantes que quieren atenderte.",     action: () => navigate("/match"),       label: "¡Buscar match!",primary: true },
        { icon: "🦷", title: "Mis casos",      desc: "Publicá un caso para encontrar un estudiante.", action: () => navigate("/casos"),       label: "Ver mis casos", primary: false },
        { icon: "📅", title: "Mis turnos",     desc: "Reservá y seguí tus citas con estudiantes.",    action: () => navigate("/turnos"),      label: "Ver turnos",    primary: false },
      ];

  if (loading) {
    return (
      <div style={s.pageWrapper}>
        <div style={s.page}>
          <div style={s.container}>
            <Skeleton height="160px" borderRadius="24px" />
            <div style={s.statsBar} data-grid="stats">
              {[0, 1, 2].map((i) => <Skeleton key={i} height="86px" borderRadius="16px" />)}
            </div>
            <Skeleton height="94px" borderRadius="20px" />
            <GridSkeleton count={4} type="card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    /* pageWrapper: scroll vertical habilitado, no corta nada */
    <div style={s.pageWrapper}>

      {/* 🌍 Onboarding — primera vez */}
      <OnboardingTour />

      {/* Contenido scrollable */}
      <div style={s.page}>
        <div style={s.container}>

          {/* C: Card bienvenida — sin overflow:hidden para que notifs no se corten */}
          <div style={s.welcomeCard}>
            <div style={s.welcomeLeft}>
              <div style={s.badge}>DENTAL MATCH</div>
              <h1 style={s.title}>Hola, <span style={s.highlight}>{nombre}</span> 👋</h1>
              <p style={s.sub}>{fraseRol}</p>
              <div style={s.rolePill}>{role === "estudiante" ? "🎓 Estudiante" : "👤 Paciente"}</div>
            </div>
            {/* Controles — FUERA del clip, con position relative y zIndex alto */}
            <div style={s.headerControls}>
              <NotificationsBell />
              <button style={s.logoutBtn} onClick={async () => { await logout(); navigate("/login"); }}>
                <IconLogout /> Salir
              </button>
            </div>
          </div>

          {/* A: Stats reales */}
          <StatsBar stats={stats} />

          {/* D: Progreso */}
          {perfil !== null && <ProfileProgress perfil={perfil} role={role} onEdit={() => navigate("/profile/edit")} />}

          {/* 📊 Actividad */}
          <ActivityGraph role={role} isDark={isDark} />

          {/* Cards */}
          <div style={s.sectionLabel}>¿Qué querés hacer hoy?</div>
          <div style={s.grid} data-grid="cards">
            {cards.map((card, i) => (
              <div key={i} style={{ ...s.card, ...(card.primary ? s.cardPrimary : {}) }}>
                <div style={{ fontSize: "28px" }}>{card.icon}</div>
                <h3 style={s.cardTitle}>{card.title}</h3>
                <p style={s.cardDesc}>{card.desc}</p>
                <button
                  style={{ ...s.cardBtn, ...(card.action ? s.cardBtnPrimary : s.cardBtnDisabled) }}
                  onClick={card.action ?? undefined} disabled={!card.action}>
                  {card.action && <IconProfile />}{card.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  /* Wrapper: sin overflow — el scroll lo maneja html/body via index.css */
  pageWrapper:    { minHeight: "100vh", position: "relative", background: "var(--bg-page)" },
  page:           { position: "relative", zIndex: 1, padding: "36px 20px 20px" },
  container:      { maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },

  /* Welcome card: SIN overflow:hidden para que el dropdown de notifs salga */
  welcomeCard:    { background: "var(--color-primary)", borderRadius: "24px", padding: "32px 36px", color: "var(--color-primary-text)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", boxShadow: "var(--shadow-md)", flexWrap: "wrap", gap: "16px" },
  welcomeLeft:    { display: "flex", flexDirection: "column", gap: "10px", zIndex: 1, flex: 1 },
  badge:          { display: "inline-block", background: "rgba(255,255,255,0.2)", color: "var(--color-primary-text)", padding: "5px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: 900, letterSpacing: "1.5px", width: "fit-content" },
  title:          { fontSize: "30px", fontWeight: 900, margin: 0, letterSpacing: "-1px", lineHeight: 1.2 },
  highlight:      { opacity: 0.85 },
  sub:            { fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: "1.6", maxWidth: "360px" },
  rolePill:       { display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", fontSize: "13px", fontWeight: 700, width: "fit-content" },
  headerControls: { display: "flex", alignItems: "center", gap: "8px", zIndex: 2, flexShrink: 0, position: "relative" },
  iconBtn:        { display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "10px", cursor: "pointer", color: "var(--color-primary-text)" },
  logoutBtn:      { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(255,255,255,0.15)", color: "var(--color-primary-text)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },

  statsBar:       { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" },
  statItem:       { borderRadius: "16px", padding: "18px 16px", textAlign: "center" },
  statNum:        { fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1 },
  statLabel:      { fontSize: "11px", fontWeight: 600, marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },

  progressCard:   { background: "var(--bg-card)", borderRadius: "20px", padding: "20px 24px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "10px" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" },
  progressTitle:  { fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" },
  progressMsg:    { fontSize: "12px", marginTop: "2px", color: "var(--text-secondary)" },
  progressEditBtn:{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  progressBarBg:  { height: "8px", borderRadius: "999px", overflow: "hidden", background: "var(--bg-subtle)" },
  progressBarFill:{ height: "100%", borderRadius: "999px", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" },
  progressPct:    { fontSize: "12px", fontWeight: 800, textAlign: "right" },

  sectionLabel:   { fontSize: "17px", fontWeight: 800, color: "var(--text-primary)" },

  grid:           { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: "16px" },
  card:           { background: "var(--bg-card)", borderRadius: "20px", padding: "22px 18px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "10px" },
  cardPrimary:    { border: "1px solid var(--color-primary)" },
  cardTitle:      { fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--text-primary)" },
  cardDesc:       { fontSize: "13px", lineHeight: "1.6", margin: 0, flex: 1, color: "var(--text-secondary)" },
  cardBtn:        { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "4px" },
  cardBtnPrimary: { background: "var(--color-primary)", color: "var(--color-primary-text)" },
  cardBtnDisabled:{ background: "var(--bg-subtle)", color: "var(--text-tertiary)", cursor: "not-allowed" },
};
