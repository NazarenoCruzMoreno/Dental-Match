import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getUser, clearAuth, profileService } from "../../services/api";

// ── Iconos ────────────────────────────────────────────────────────────────────
const IconProfile = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconLogout  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconEdit    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);

// ── B: Tooth SVG flotante ─────────────────────────────────────────────────────
const FloatingTooth = () => (
  <svg viewBox="0 0 120 140" style={styles.toothSvg} aria-hidden="true">
    <defs>
      <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.4"/>
      </linearGradient>
    </defs>
    {/* Corona del diente */}
    <path d="M20 10 C10 10 5 25 8 45 C10 55 12 65 15 75 C18 85 22 90 30 88 C35 87 38 82 40 75 C42 68 44 60 50 58 C56 60 58 68 60 75 C62 82 65 87 70 88 C78 90 82 85 85 75 C88 65 90 55 92 45 C95 25 90 10 80 10 C72 10 68 18 60 18 C52 18 48 10 40 10 Z" fill="url(#toothGrad)" stroke="#bfdbfe" strokeWidth="1.5"/>
    {/* Raíces */}
    <path d="M35 88 C33 100 31 115 33 128 C34 133 37 136 40 135 C43 134 44 130 44 125 C44 118 43 108 44 100" fill="url(#toothGrad)" stroke="#bfdbfe" strokeWidth="1.5"/>
    <path d="M65 88 C67 100 69 115 67 128 C66 133 63 136 60 135 C57 134 56 130 56 125 C56 118 57 108 56 100" fill="url(#toothGrad)" stroke="#bfdbfe" strokeWidth="1.5"/>
    {/* Brillo */}
    <path d="M28 20 C24 28 22 38 24 45" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

// ── E: Olas decorativas ───────────────────────────────────────────────────────
const WaveDecoration = () => (
  <svg viewBox="0 0 1440 120" style={styles.waveSvg} preserveAspectRatio="none" aria-hidden="true">
    <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
      fill="url(#waveGrad1)" opacity="0.5"/>
    <path d="M0,80 C200,40 400,100 600,70 C800,40 1000,90 1200,60 C1320,45 1380,55 1440,50 L1440,120 L0,120 Z"
      fill="url(#waveGrad2)" opacity="0.4"/>
    <defs>
      <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.2"/>
      </linearGradient>
      <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdba74" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#fb923c" stopOpacity="0.2"/>
      </linearGradient>
    </defs>
  </svg>
);

// ── A: Contador animado ───────────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 1800, suffix = "" }) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return <span>{count}{suffix}</span>;
}

function StatsBar() {
  const stats = [
    { value: 142, suffix: "+", label: "Estudiantes", color: "#3b82f6", bg: "#eff6ff" },
    { value: 89,  suffix: "+", label: "Pacientes",   color: "#f59e0b", bg: "#fff7ed" },
    { value: 67,  suffix: "",  label: "Matches",      color: "#10b981", bg: "#f0fdf4" },
  ];
  return (
    <div style={styles.statsBar}>
      {stats.map((s, i) => (
        <div key={i} style={{ ...styles.statItem, background: s.bg, border: `1px solid ${s.color}30` }}>
          <div style={{ ...styles.statNum, color: s.color }}>
            <AnimatedCounter target={s.value} suffix={s.suffix} duration={1600 + i * 200} />
          </div>
          <div style={styles.statLabel}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── D: Barra de progreso de perfil ────────────────────────────────────────────
function ProfileProgress({ perfil, role, onEdit }) {
  const fields = role === "estudiante"
    ? ["nombre", "universidad", "descripcion", "materias", "disponibilidad", "anio_carrera"]
    : ["nombre", "edad", "problema_dental", "telefono", "imagen_url"];

  const filled = perfil
    ? fields.filter(f => {
        const v = perfil[f];
        return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
      }).length
    : 0;

  const pct = Math.round((filled / fields.length) * 100);
  const color = pct < 50 ? "#f59e0b" : pct < 100 ? "#3b82f6" : "#10b981";
  const msg   = pct < 50 ? "Completá tu perfil para aparecer en búsquedas"
              : pct < 100 ? "¡Casi listo! Agregá los datos que faltan"
              : "Tu perfil está completo 🎉";

  return (
    <div style={styles.progressCard}>
      <div style={styles.progressHeader}>
        <div>
          <div style={styles.progressTitle}>Completitud del perfil</div>
          <div style={styles.progressMsg}>{msg}</div>
        </div>
        <button style={{ ...styles.progressEditBtn, color, borderColor: `${color}50`, background: `${color}10` }} onClick={onEdit}>
          <IconEdit /> Editar
        </button>
      </div>
      <div style={styles.progressBarBg}>
        <div style={{ ...styles.progressBarFill, width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
      </div>
      <div style={{ ...styles.progressPct, color }}>{pct}%</div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const user = getUser();
  const role = user?.role;
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    profileService.get()
      .then(({ perfil }) => setPerfil(perfil))
      .catch(() => {});
  }, []);

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  const nombre = perfil?.nombre ?? user?.email?.split("@")[0] ?? "usuario";

  const fraseRol = role === "estudiante"
    ? "Conectá con pacientes reales y sumá experiencia clínica que marque la diferencia."
    : "El estudiante ideal para tu tratamiento está a un click de distancia.";

  const cards = role === "estudiante"
    ? [
        { icon: "👤", title: "Mi perfil",     desc: "Tu universidad, materias y disponibilidad.", action: () => navigate("/profile"),  label: "Ver perfil",   primary: true },
        { icon: "🦷", title: "Casos clínicos", desc: "Próximamente: explorá pacientes disponibles.", action: null, label: "Próximamente", primary: false },
        { icon: "📅", title: "Mis turnos",    desc: "Próximamente: gestioná tus turnos asignados.",  action: null, label: "Próximamente", primary: false },
      ]
    : [
        { icon: "👤", title: "Mi perfil",       desc: "Tus datos personales y problema dental.", action: () => navigate("/profile"), label: "Ver perfil",   primary: true },
        { icon: "🔍", title: "Buscar estudiante", desc: "Próximamente: encontrá tu match ideal.", action: null, label: "Próximamente", primary: false },
        { icon: "📅", title: "Mis turnos",      desc: "Próximamente: seguí el estado de tus turnos.", action: null, label: "Próximamente", primary: false },
      ];

  return (
    <div style={styles.page}>

      {/* B: Tooth flotante */}
      <FloatingTooth />

      <div style={styles.container}>

        {/* C: Card de bienvenida con gradiente */}
        <div style={styles.welcomeCard}>
          <div style={styles.welcomeLeft}>
            <div style={styles.badge}>DENTAL MATCH</div>
            <h1 style={styles.title}>
              Hola, <span style={styles.highlight}>{nombre}</span> 👋
            </h1>
            <p style={styles.sub}>{fraseRol}</p>
            <div style={styles.rolePill}>
              {role === "estudiante" ? "🎓 Estudiante de Odontología" : "👤 Paciente"}
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <IconLogout /> Salir
          </button>
          {/* Círculos decorativos dentro de la card */}
          <div style={styles.deco1} />
          <div style={styles.deco2} />
        </div>

        {/* A: Stats animadas */}
        <StatsBar />

        {/* D: Progreso del perfil */}
        {perfil !== null && (
          <ProfileProgress perfil={perfil} role={role} onEdit={() => navigate("/profile/edit")} />
        )}

        {/* Cards de navegación */}
        <div style={styles.sectionTitle}>¿Qué querés hacer hoy?</div>
        <div style={styles.grid}>
          {cards.map((card, i) => (
            <div key={i} style={{ ...styles.card, ...(card.primary ? styles.cardPrimary : {}) }}>
              <div style={styles.cardIcon}>{card.icon}</div>
              <h3 style={styles.cardTitle}>{card.title}</h3>
              <p style={styles.cardDesc}>{card.desc}</p>
              <button
                style={{ ...styles.cardBtn, ...(card.primary ? styles.cardBtnPrimary : styles.cardBtnDisabled) }}
                onClick={card.action ?? undefined}
                disabled={!card.action}
              >
                {card.primary && <IconProfile />}
                {card.label}
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* E: Olas decorativas */}
      <WaveDecoration />

    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = {
  page:            { minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 60%, #fff7ed 100%)", padding: "40px 20px 0", fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden" },
  container:       { maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "100px", position: "relative", zIndex: 1 },

  // B: Tooth
  toothSvg:        { position: "fixed", right: "-30px", top: "50%", transform: "translateY(-50%)", width: "260px", height: "300px", opacity: 0.35, pointerEvents: "none", zIndex: 0, animation: "toothFloat 6s ease-in-out infinite" },

  // E: Waves
  waveSvg:         { position: "fixed", bottom: 0, left: 0, width: "100%", height: "120px", pointerEvents: "none", zIndex: 0 },

  // C: Welcome card
  welcomeCard:     { background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)", borderRadius: "24px", padding: "36px 40px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", overflow: "hidden", boxShadow: "0 20px 60px rgba(37,99,235,0.35)" },
  welcomeLeft:     { display: "flex", flexDirection: "column", gap: "10px", zIndex: 1 },
  badge:           { display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "5px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: 900, letterSpacing: "1.5px", width: "fit-content", backdropFilter: "blur(4px)" },
  title:           { fontSize: "34px", fontWeight: 900, margin: 0, letterSpacing: "-1px", lineHeight: 1.2 },
  highlight:       { color: "#93c5fd" },
  sub:             { fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: "1.6", maxWidth: "420px" },
  rolePill:        { display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "rgba(255,255,255,0.15)", borderRadius: "999px", fontSize: "13px", fontWeight: 700, width: "fit-content", backdropFilter: "blur(4px)" },
  logoutBtn:       { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", zIndex: 1, backdropFilter: "blur(4px)", flexShrink: 0 },
  deco1:           { position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", top: "-60px", right: "80px", pointerEvents: "none" },
  deco2:           { position: "absolute", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: "-40px", right: "20px", pointerEvents: "none" },

  // A: Stats
  statsBar:        { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  statItem:        { borderRadius: "16px", padding: "20px 24px", textAlign: "center" },
  statNum:         { fontSize: "32px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1 },
  statLabel:       { fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },

  // D: Profile progress
  progressCard:    { background: "#fff", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "12px" },
  progressHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" },
  progressTitle:   { fontSize: "15px", fontWeight: 800, color: "#0f172a" },
  progressMsg:     { fontSize: "13px", color: "#64748b", marginTop: "2px" },
  progressEditBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", border: "1px solid", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  progressBarBg:   { height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: "999px", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" },
  progressPct:     { fontSize: "13px", fontWeight: 800, textAlign: "right" },

  // Cards
  sectionTitle:    { fontSize: "18px", fontWeight: 800, color: "#0f172a" },
  grid:            { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "18px" },
  card:            { background: "#fff", borderRadius: "20px", padding: "26px 22px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "10px" },
  cardPrimary:     { border: "2px solid #bfdbfe", background: "linear-gradient(135deg,#fff,#eff6ff)" },
  cardIcon:        { fontSize: "30px" },
  cardTitle:       { fontSize: "16px", fontWeight: 800, margin: 0, color: "#0f172a" },
  cardDesc:        { fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0, flex: 1 },
  cardBtn:         { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer", marginTop: "4px" },
  cardBtnPrimary:  { background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff" },
  cardBtnDisabled: { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" },
};
