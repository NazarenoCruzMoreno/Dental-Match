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

// ── 🪥 Cepillo de dientes — diseño reconocible con contexto ──────────────────
const ToothbrushDecoration = ({ isDark }) => (
  <div style={{ position: "fixed", right: "30px", top: "50%", transform: "translateY(-50%) rotate(-15deg)", width: "90px", pointerEvents: "none", zIndex: 0, animation: "toothFloat 6s ease-in-out infinite" }} aria-hidden="true">

    {/* Burbujas de pasta decorativas */}
    {[
      { cx: 75, cy: 20, r: 8,  op: 0.25 },
      { cx: 20, cy: 40, r: 5,  op: 0.18 },
      { cx: 85, cy: 60, r: 6,  op: 0.2  },
      { cx: 10, cy: 90, r: 4,  op: 0.15 },
      { cx: 80, cy: 110,r: 7,  op: 0.2  },
    ].map((b, i) => (
      <div key={i} style={{
        position: "absolute", borderRadius: "50%",
        width: b.r * 2, height: b.r * 2,
        left: b.cx - b.r, top: b.cy - b.r,
        background: isDark ? `rgba(147,197,253,${b.op})` : `rgba(59,130,246,${b.op})`,
        border: `1px solid rgba(147,197,253,${b.op * 1.5})`,
      }} />
    ))}

    <svg viewBox="0 0 80 320" style={{ width: "100%", opacity: isDark ? 0.7 : 0.85 }}>
      <defs>
        <linearGradient id="bHandle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={isDark ? "#1e3a5f" : "#bfdbfe"}/>
          <stop offset="45%"  stopColor={isDark ? "#2563eb" : "#93c5fd"}/>
          <stop offset="100%" stopColor={isDark ? "#1d4ed8" : "#60a5fa"}/>
        </linearGradient>
        <linearGradient id="bSide" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1d4ed8" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0.3"/>
        </linearGradient>
        <linearGradient id="bRubber" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#fb923c"/>
          <stop offset="50%"  stopColor="#fed7aa"/>
          <stop offset="100%" stopColor="#f97316"/>
        </linearGradient>
        <linearGradient id="bHead" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={isDark ? "#1e3a5f" : "#dbeafe"}/>
          <stop offset="50%"  stopColor={isDark ? "#2563eb" : "#eff6ff"}/>
          <stop offset="100%" stopColor={isDark ? "#1d4ed8" : "#bfdbfe"}/>
        </linearGradient>
        <filter id="bShadow">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.25"/>
        </filter>
      </defs>

      {/* Sombra suave debajo */}
      <ellipse cx="43" cy="314" rx="20" ry="5" fill="#3b82f6" opacity="0.1"/>

      {/* ── MANGO — cuerpo principal ── */}
      {/* Cara lateral derecha (oscura, 3D) */}
      <path d="M52 305 Q56 290 56 160 L60 150 L60 145 L56 140 L56 95 L52 88 L52 85 L60 85 L65 90 L65 145 L68 150 L68 160 Q68 290 64 305 Z"
        fill="url(#bSide)"/>
      {/* Cara frontal del mango */}
      <path d="M28 305 Q24 290 24 160 L28 150 L28 145 L24 140 L24 95 L28 88 L28 85 L52 85 L52 88 L56 95 L56 140 L52 145 L52 150 L56 160 Q56 290 52 305 Z"
        fill="url(#bHandle)" filter="url(#bShadow)"/>
      {/* Brillo lateral izquierdo */}
      <path d="M30 100 Q28 180 28 280" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      {/* Borde redondeado inferior */}
      <path d="M28 305 Q40 315 52 305" fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.4"/>

      {/* ── GRIP DE GOMA (banda naranja) ── */}
      <path d="M24 195 L56 195 L56 235 L24 235 Z" fill="url(#bRubber)" opacity="0.9" rx="3"/>
      <path d="M56 195 L64 200 L64 240 L56 235 Z" fill="#ea580c" opacity="0.35"/>
      {[202, 210, 218, 226].map((y, i) => (
        <line key={i} x1="26" y1={y} x2="54" y2={y} stroke="white" strokeWidth="1.5" opacity="0.35"/>
      ))}

      {/* ── CUELLO (transición mango → cabeza) ── */}
      <path d="M24 88 L28 50 L52 50 L56 88 Z" fill="url(#bHandle)"/>
      <path d="M56 88 L60 90 L64 52 L60 50 L56 50 Z" fill="url(#bSide)"/>

      {/* ── CABEZA del cepillo ── */}
      {/* Cara lateral derecha */}
      <path d="M52 52 L60 50 L64 8 L56 6 Z" fill="url(#bSide)"/>
      {/* Cara frontal */}
      <path d="M12 52 Q10 50 12 8 L56 6 Q58 8 56 52 Z" fill="url(#bHead)" filter="url(#bShadow)"/>
      {/* Borde superior redondeado */}
      <path d="M12 8 Q34 2 56 6" fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity="0.6"/>

      {/* ── BASE de cerdas (plataforma blanca) ── */}
      <rect x="14" y="10" width="40" height="36" rx="4" fill="white" opacity="0.65"/>
      <rect x="56" y="10" width="6" height="36" rx="1" fill="#bfdbfe" opacity="0.4"/>

      {/* ── CERDAS en 4 columnas × 3 filas ── */}
      {/* Columnas: x = 20, 27, 34, 41, 48 */}
      {/* Filas: base y = 46 (crecen hacia arriba) */}
      {[20, 27, 34, 41, 48].map((x, ci) =>
        [0, 1, 2].map((ri) => {
          const colors = ["#2563eb", "#60a5fa", "#ffffff"];
          const h = 14 - ri * 1;
          const y = 45 - h;
          return (
            <g key={`${ci}-${ri}`}>
              <rect x={x-2} y={y} width="4" height={h} rx="2"
                fill={colors[ri]} opacity={ri === 2 ? 0.9 : 0.85}/>
              <circle cx={x} cy={y} r="2.2"
                fill={ri === 0 ? "#1d4ed8" : ri === 1 ? "#3b82f6" : "#dbeafe"}
                opacity="0.95"/>
            </g>
          );
        })
      )}

      {/* ── Detalle de marca en el mango ── */}
      <rect x="30" y="130" width="20" height="4" rx="2" fill="white" opacity="0.2"/>
      <rect x="30" y="140" width="14" height="3" rx="1.5" fill="white" opacity="0.15"/>

      {/* ── Reflejo superior en la cabeza ── */}
      <path d="M15 12 Q34 8 54 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  </div>
);

// ── E: Olas fijas en fondo — 3 tonos de azul, cambian con dark mode ──────────
const WaveBackground = ({ isDark }) => {
  const c = isDark
    ? { w1: "#1e3a5f", w2: "#1d4ed8", w3: "#1e40af", o1: 0.5, o2: 0.4, o3: 0.35 }
    : { w1: "#bfdbfe", w2: "#93c5fd", w3: "#60a5fa", o1: 0.7, o2: 0.55, o3: 0.45 };
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, pointerEvents: "none", zIndex: 0, lineHeight: 0 }} aria-hidden="true">
      <svg viewBox="0 0 1440 130" preserveAspectRatio="none" style={{ width: "100%", height: "130px", display: "block" }}>
        {/* Ola 1 — más suave, atrás */}
        <path d="M0,70 C180,30 360,100 540,65 C720,30 900,95 1080,60 C1260,25 1380,75 1440,55 L1440,130 L0,130 Z"
          fill={c.w1} fillOpacity={c.o1}/>
        {/* Ola 2 — media */}
        <path d="M0,90 C200,55 400,110 600,80 C800,50 1000,105 1200,75 C1320,58 1390,82 1440,72 L1440,130 L0,130 Z"
          fill={c.w2} fillOpacity={c.o2}/>
        {/* Ola 3 — más oscura, adelante */}
        <path d="M0,108 C240,78 480,125 720,100 C960,75 1200,120 1440,105 L1440,130 L0,130 Z"
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
  /* Wrapper: scroll vertical libre, sin overflow que corte */
  pageWrapper:    { minHeight: "100vh", position: "relative", fontFamily: "'Inter',sans-serif", overflowX: "clip" },
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
