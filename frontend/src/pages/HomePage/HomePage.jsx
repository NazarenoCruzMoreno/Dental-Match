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

// ── 🪥 Cepillo flat cartoon — inspirado en la referencia ─────────────────────
const ToothbrushDecoration = ({ isDark }) => {
  const body  = isDark ? "#3b82f6" : "#60a5fa";
  const light = isDark ? "#60a5fa" : "#93c5fd";
  const dark2 = isDark ? "#1d4ed8" : "#3b82f6";
  const shine = "rgba(255,255,255,0.55)";
  return (
    <div style={{ position: "fixed", right: "10px", top: "50%", transform: "translateY(-52%) rotate(18deg)", width: "95px", height: "320px", pointerEvents: "none", zIndex: 0, animation: "toothFloat 6s ease-in-out infinite" }} aria-hidden="true">
      <svg viewBox="0 0 60 300" style={{ width: "100%", height: "100%", opacity: isDark ? 0.65 : 0.82 }}>
        <defs>
          <linearGradient id="tb_body" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={light}/>
            <stop offset="40%"  stopColor={body}/>
            <stop offset="100%" stopColor={dark2}/>
          </linearGradient>
          <linearGradient id="tb_head" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={light}/>
            <stop offset="50%"  stopColor={body}/>
            <stop offset="100%" stopColor={dark2}/>
          </linearGradient>
        </defs>

        {/* ── MANGO: forma ergonómica con curva suave ── */}
        {/* Más ancho abajo, se estrecha en el cuello */}
        <path d="
          M18 295 Q10 292 10 280 L10 190
          Q8  175 10 160 L11 140
          Q12 128 16 122
          L16 90 Q16 82 20 78
          L20 68
          Q20 60 24 58
          L36 58
          Q40 60 40 68
          L40 78 Q44 82 44 90
          L44 122 Q48 128 49 140
          L50 160 Q52 175 50 190
          L50 280 Q50 292 42 295 Z"
          fill="url(#tb_body)" rx="8"/>

        {/* Brillo izquierdo del mango */}
        <path d="M14 100 Q13 180 13 265" stroke={shine} strokeWidth="2.5" strokeLinecap="round"/>

        {/* Pequeña zona diferenciada en la parte baja del mango */}
        <rect x="14" y="230" width="32" height="38" rx="8" fill={dark2} opacity="0.25"/>
        <path d="M16 238 Q30 235 44 238" stroke={shine} strokeWidth="1" opacity="0.4"/>

        {/* ── CUELLO: se estrecha suavemente ── */}
        {/* Ya incluido en el path del mango — transición natural */}

        {/* ── CABEZA: rectángulo redondeado más ancho ── */}
        <rect x="8" y="8" width="44" height="54" rx="10" fill="url(#tb_head)"/>
        {/* Brillo cabeza */}
        <path d="M12 13 Q30 9 48 13" stroke={shine} strokeWidth="2" strokeLinecap="round"/>
        {/* Borde inferior de la cabeza (sombra) */}
        <rect x="8" y="50" width="44" height="12" rx="0" fill={dark2} opacity="0.2"
          style={{ borderBottomLeftRadius: "0", borderBottomRightRadius: "0" }}/>

        {/* ── CERDAS: 7 grupos de líneas verticales azul oscuro ── */}
        {[13, 18, 23, 28, 33, 38, 43].map((x, i) => (
          <g key={i}>
            {/* cerda larga */}
            <rect x={x-1.5} y={2} width="3" height="22" rx="1.5" fill={dark2} opacity="0.9"/>
            {/* cerda corta (alternada) */}
            <rect x={x-1.5} y={i%2===0 ? 4 : 6} width="3" height={i%2===0 ? 18 : 16} rx="1.5" fill={dark2} opacity="0.5"/>
          </g>
        ))}

        {/* Base de las cerdas (plataforma) */}
        <rect x="9" y="22" width="42" height="8" rx="2" fill={dark2} opacity="0.3"/>

        {/* Pequeño reflejo en la punta de las cerdas */}
        {[13, 23, 33, 43].map((x, i) => (
          <circle key={i} cx={x} cy="3" r="1.5" fill="white" opacity="0.6"/>
        ))}
      </svg>
    </div>
  );
};

// ── 🌊 Olas fijas — más altas y prominentes, cambian con dark mode ────────────
const WaveBackground = ({ isDark }) => {
  const c = isDark
    ? { w1: "#1e3a5f", w2: "#1d4ed8", w3: "#1e40af", o1: 0.6, o2: 0.5, o3: 0.4 }
    : { w1: "#93c5fd", w2: "#60a5fa", w3: "#3b82f6", o1: 0.55, o2: 0.45, o3: 0.38 };
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, pointerEvents: "none", zIndex: 0, lineHeight: 0 }} aria-hidden="true">
      <svg viewBox="0 0 1440 180" preserveAspectRatio="none" style={{ width: "100%", height: "180px", display: "block" }}>
        {/* Ola trasera — más clara y alta */}
        <path d="M0,90 C180,45 360,130 540,85 C720,40 900,120 1080,78 C1260,36 1380,100 1440,72 L1440,180 L0,180 Z"
          fill={c.w1} fillOpacity={c.o1}/>
        {/* Ola media */}
        <path d="M0,115 C200,75 400,145 600,108 C800,71 1000,138 1200,100 C1320,80 1390,112 1440,98 L1440,180 L0,180 Z"
          fill={c.w2} fillOpacity={c.o2}/>
        {/* Ola delantera — más oscura y cercana */}
        <path d="M0,138 C240,105 480,160 720,132 C960,104 1200,155 1440,138 L1440,180 L0,180 Z"
          fill={c.w3} fillOpacity={c.o3}/>
      </svg>
    </div>
  );
};

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

function StatsBar({ stats, isDark }) {
  const items = [
    { value: stats.estudiantes, label: "Estudiantes", color: "#3b82f6", bg: isDark ? "rgba(30,58,95,0.8)" : "#eff6ff", border: isDark ? "#1e3a5f" : "#bfdbfe" },
    { value: stats.pacientes,   label: "Pacientes",   color: "#f59e0b", bg: isDark ? "rgba(45,31,14,0.8)" : "#fff7ed", border: isDark ? "#451a03" : "#fed7aa" },
    { value: stats.matches,     label: "Matches",     color: "#10b981", bg: isDark ? "rgba(15,45,31,0.8)" : "#f0fdf4", border: isDark ? "#052e16" : "#bbf7d0" },
  ];
  return (
    <div style={s.statsBar}>
      {items.map((item, i) => (
        <div key={i} style={{ ...s.statItem, background: item.bg, border: `1px solid ${item.border}` }}>
          <div style={{ ...s.statNum, color: item.color }}><AnimatedCounter target={item.value} duration={1500 + i * 200}/></div>
          <div style={{ ...s.statLabel, color: isDark ? "#94a3b8" : "#64748b" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── D: Progreso del perfil ─────────────────────────────────────────────────────
function ProfileProgress({ perfil, role, onEdit, isDark }) {
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
    <div style={{ ...s.progressCard, background: isDark ? "#1e293b" : "#fff", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : s.progressCard.boxShadow }}>
      <div style={s.progressHeader}>
        <div>
          <div style={{ ...s.progressTitle, color: isDark ? "#f1f5f9" : "#0f172a" }}>Completitud del perfil</div>
          <div style={{ ...s.progressMsg, color: isDark ? "#94a3b8" : "#64748b" }}>{msg}</div>
        </div>
        <button style={{ ...s.progressEditBtn, color, borderColor: `${color}50`, background: `${color}15` }} onClick={onEdit}>
          <IconEdit /> Editar
        </button>
      </div>
      <div style={{ ...s.progressBarBg, background: isDark ? "#334155" : "#f1f5f9" }}>
        <div style={{ ...s.progressBarFill, width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}cc)` }}/>
      </div>
      <div style={{ ...s.progressPct, color }}>{pct}%</div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate             = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const user                 = getUser();
  const role                 = user?.role;
  const [perfil,  setPerfil]  = useState(null);
  const [stats,   setStats]   = useState({ estudiantes: 0, pacientes: 0, matches: 0 });

  useEffect(() => {
    profileService.get().then(({ perfil }) => setPerfil(perfil)).catch(() => {});
    fetch("/api/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const nombre    = perfil?.nombre ?? user?.email?.split("@")[0] ?? "usuario";
  const fraseRol  = role === "estudiante"
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

  const pageBg = isDark
    ? "linear-gradient(160deg,#0f172a 0%,#1e1b4b 55%,#1c1917 100%)"
    : "linear-gradient(160deg,#f8fafc 0%,#eff6ff 55%,#fff7ed 100%)";

  return (
    /* pageWrapper: scroll vertical habilitado, no corta nada */
    <div style={{ ...s.pageWrapper, background: pageBg }}>

      {/* 🌍 Onboarding — primera vez */}
      <OnboardingTour />

      {/* 🪥 Cepillo flotante — fixed, siempre visible */}
      <ToothbrushDecoration isDark={isDark} />

      {/* 🌊 Olas — fixed al fondo, siempre visibles */}
      <WaveBackground isDark={isDark} />

      {/* Contenido scrollable */}
      <div style={s.page}>
        <div style={s.container}>

          {/* C: Card bienvenida — sin overflow:hidden para que notifs no se corten */}
          <div style={s.welcomeCard}>
            {/* Círculos decorativos — clips propios */}
            <div style={s.deco1}/><div style={s.deco2}/>
            <div style={s.welcomeLeft}>
              <div style={s.badge}>DENTAL MATCH</div>
              <h1 style={s.title}>Hola, <span style={s.highlight}>{nombre}</span> 👋</h1>
              <p style={s.sub}>{fraseRol}</p>
              <div style={s.rolePill}>{role === "estudiante" ? "🎓 Estudiante" : "👤 Paciente"}</div>
            </div>
            {/* Controles — FUERA del clip, con position relative y zIndex alto */}
            <div style={s.headerControls}>
              <button style={s.iconBtn} onClick={toggleTheme} title={isDark ? "Modo claro" : "Modo oscuro"}>
                {isDark ? <IconSun /> : <IconMoon />}
              </button>
              <NotificationsBell />
              <button style={s.logoutBtn} onClick={() => { clearAuth(); navigate("/login"); }}>
                <IconLogout /> Salir
              </button>
            </div>
          </div>

          {/* A: Stats reales */}
          <StatsBar stats={stats} isDark={isDark} />

          {/* D: Progreso */}
          {perfil !== null && <ProfileProgress perfil={perfil} role={role} onEdit={() => navigate("/profile/edit")} isDark={isDark} />}

          {/* 📊 Actividad */}
          <ActivityGraph role={role} />

          {/* Cards */}
          <div style={{ fontSize: "17px", fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a" }}>¿Qué querés hacer hoy?</div>
          <div style={s.grid}>
            {cards.map((card, i) => (
              <div key={i} style={{
                ...s.card,
                ...(card.primary ? s.cardPrimary : {}),
                background: card.primary
                  ? (isDark ? "linear-gradient(135deg,#1e3a5f,#1e293b)" : "linear-gradient(135deg,#fff,#eff6ff)")
                  : (isDark ? "#1e293b" : "#fff"),
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : s.card.boxShadow,
              }}>
                <div style={{ fontSize: "28px" }}>{card.icon}</div>
                <h3 style={{ ...s.cardTitle, color: isDark ? "#f1f5f9" : "#0f172a" }}>{card.title}</h3>
                <p style={{ ...s.cardDesc, color: isDark ? "#94a3b8" : "#64748b" }}>{card.desc}</p>
                <button
                  style={{ ...s.cardBtn, ...(card.primary ? s.cardBtnPrimary : { ...s.cardBtnDisabled, background: isDark ? "#334155" : "#f1f5f9", color: isDark ? "#64748b" : "#94a3b8" }) }}
                  onClick={card.action ?? undefined} disabled={!card.action}>
                  {card.primary && <IconProfile />}{card.label}
                </button>
              </div>
            ))}
          </div>

          {/* Espaciado para que las olas no tapen el contenido */}
          <div style={{ height: "100px" }} />
        </div>
      </div>
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  /* Wrapper: sin overflow — el scroll lo maneja html/body via index.css */
  pageWrapper:    { minHeight: "100vh", position: "relative", fontFamily: "'Inter',sans-serif" },
  page:           { position: "relative", zIndex: 1, padding: "36px 20px 20px" },
  container:      { maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },

  /* Welcome card: SIN overflow:hidden para que el dropdown de notifs salga */
  welcomeCard:    { background: "linear-gradient(135deg,#1e40af 0%,#2563eb 50%,#3b82f6 100%)", borderRadius: "24px", padding: "32px 36px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", boxShadow: "0 20px 60px rgba(37,99,235,0.35)", flexWrap: "wrap", gap: "16px" },
  welcomeLeft:    { display: "flex", flexDirection: "column", gap: "10px", zIndex: 1, flex: 1 },
  badge:          { display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "5px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: 900, letterSpacing: "1.5px", width: "fit-content" },
  title:          { fontSize: "30px", fontWeight: 900, margin: 0, letterSpacing: "-1px", lineHeight: 1.2 },
  highlight:      { color: "#93c5fd" },
  sub:            { fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: "1.6", maxWidth: "360px" },
  rolePill:       { display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", fontSize: "13px", fontWeight: 700, width: "fit-content" },
  headerControls: { display: "flex", alignItems: "center", gap: "8px", zIndex: 2, flexShrink: 0, position: "relative" },
  iconBtn:        { display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "10px", cursor: "pointer", color: "#fff" },
  logoutBtn:      { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  /* Decorativos del card — posicionados pero sin clip externo */
  deco1:          { position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", top: "-60px", right: "80px", pointerEvents: "none", zIndex: 0 },
  deco2:          { position: "absolute", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: "-40px", right: "20px", pointerEvents: "none", zIndex: 0 },

  statsBar:       { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" },
  statItem:       { borderRadius: "16px", padding: "18px 16px", textAlign: "center" },
  statNum:        { fontSize: "30px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1 },
  statLabel:      { fontSize: "11px", fontWeight: 600, marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },

  progressCard:   { background: "#fff", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "10px" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" },
  progressTitle:  { fontSize: "14px", fontWeight: 800 },
  progressMsg:    { fontSize: "12px", marginTop: "2px" },
  progressEditBtn:{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  progressBarBg:  { height: "8px", borderRadius: "999px", overflow: "hidden" },
  progressBarFill:{ height: "100%", borderRadius: "999px", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" },
  progressPct:    { fontSize: "12px", fontWeight: 800, textAlign: "right" },

  grid:           { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: "16px" },
  card:           { borderRadius: "20px", padding: "22px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "10px" },
  cardPrimary:    { border: "2px solid #bfdbfe" },
  cardTitle:      { fontSize: "15px", fontWeight: 800, margin: 0 },
  cardDesc:       { fontSize: "13px", lineHeight: "1.6", margin: 0, flex: 1 },
  cardBtn:        { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "4px" },
  cardBtnPrimary: { background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff" },
  cardBtnDisabled:{ background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" },
};
