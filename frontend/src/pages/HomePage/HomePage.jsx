import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getUser, profileService, statsService, turnosService } from "../../services/api";
import NotificationsBell from "../../components/Notifications/NotificationsBell";
import UserMenu from "../../components/UserMenu/UserMenu";
import MatchIllustration from "../../components/MatchIllustration/MatchIllustration";
import OnboardingTour from "../../components/OnboardingTour/OnboardingTour";
import ActivityGraph from "../../components/ActivityGraph/ActivityGraph";
import { Skeleton } from "../../components/Skeleton/Skeleton";
import "./HomePage.css";

// ── Iconos vectoriales (trazo estilo Lucide) ──────────────────────────────────
const Svg = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IconUser     = (p) => <Svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>;
const IconUsers    = (p) => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
const IconCap      = (p) => <Svg {...p}><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></Svg>;
const IconCalendar = (p) => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>;
const IconFile     = (p) => <Svg {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>;
const IconCheck    = (p) => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>;
const IconHeartHandshake = (p) => <Svg {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/></Svg>;
const IconArrow    = (p) => <Svg size={16} {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Svg>;
const IconChevron  = (p) => <Svg size={16} {...p}><polyline points="9 18 15 12 9 6"/></Svg>;
const IconEdit     = (p) => <Svg size={14} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const ESTADOS_TURNO = {
  confirmado: { label: "Confirmado",  tone: "success" },
  propuesto:  { label: "Por confirmar", tone: "info" },
  pendiente:  { label: "Pendiente",   tone: "warning" },
};

// ── Contador animado ───────────────────────────────────────────────────────────
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

// Una sola tarjeta con los 3 números separados por líneas verticales sutiles
function Metrics({ stats }) {
  const items = [
    { value: stats.estudiantes, label: "Estudiantes" },
    { value: stats.pacientes,   label: "Pacientes" },
    { value: stats.matches,     label: "Matches" },
  ];
  return (
    <section className="dm-panel dm-metrics" aria-label="Métricas de la plataforma">
      {items.map((item, i) => (
        <div key={item.label} className="dm-metric">
          <div className="dm-metric-num"><AnimatedCounter target={item.value} duration={1500 + i * 200} /></div>
          <div className="dm-metric-label">{item.label}</div>
        </div>
      ))}
    </section>
  );
}

// ── Widget: completitud del perfil (anillo) ────────────────────────────────────
const RING_R = 34;
const RING_C = 2 * Math.PI * RING_R;

function ProfileWidget({ perfil, role, onEdit }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const fields = role === "estudiante"
    ? ["nombre", "universidad", "descripcion", "materias", "disponibilidad", "anio_carrera"]
    : ["nombre", "edad", "problema_dental", "telefono", "imagen_url"];
  const filled = perfil
    ? fields.filter((f) => { const v = perfil[f]; return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0); }).length
    : 0;
  const pct   = Math.round((filled / fields.length) * 100);
  const tone  = pct < 50 ? "warning" : pct < 100 ? "info" : "success";
  const msg   = pct < 50  ? "Completá tu perfil para aparecer en las búsquedas."
              : pct < 100 ? "¡Casi listo! Agregá los datos que faltan."
              : "Tu perfil está completo.";

  return (
    <section className="dm-panel dm-widget" aria-label="Completitud del perfil">
      <h2 className="dm-widget-title">Tu perfil</h2>
      <div className="dm-profile-row">
        <div className="dm-ring" role="img" aria-label={`${pct}% completo`}>
          <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
            <circle cx="42" cy="42" r={RING_R} fill="none" stroke="var(--bg-subtle)" strokeWidth="8" />
            <circle cx="42" cy="42" r={RING_R} fill="none" stroke={`var(--color-${tone})`} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={shown ? RING_C * (1 - pct / 100) : RING_C}
              transform="rotate(-90 42 42)" className="dm-ring-fill" />
          </svg>
          <span className="dm-ring-label">{pct === 100 ? <IconCheck size={26} /> : `${pct}%`}</span>
        </div>
        <p className="dm-profile-msg">{msg}</p>
      </div>
      <button className="dm-btn-ghost" onClick={onEdit}><IconEdit /> Editar perfil</button>
    </section>
  );
}

// ── Widget: próximos turnos ────────────────────────────────────────────────────
function UpcomingWidget({ turnos, role, onSeeAll }) {
  return (
    <section className="dm-panel dm-widget" aria-label="Próximos turnos">
      <h2 className="dm-widget-title">Próximos turnos</h2>
      {turnos.length === 0 ? (
        <div className="dm-empty">
          <span className="dm-empty-icon"><IconCalendar size={22} /></span>
          <p className="dm-empty-text">No tenés turnos próximos.</p>
        </div>
      ) : (
        <ul className="dm-turnos">
          {turnos.map((t) => {
            const d = new Date(`${t.fecha}T12:00:00`);
            const otro = role === "estudiante" ? t.pacientes?.nombre : t.estudiantes?.nombre;
            const est = ESTADOS_TURNO[t.estado] ?? ESTADOS_TURNO.pendiente;
            return (
              <li key={t.id} className="dm-turno">
                <div className="dm-turno-date">
                  <span className="dm-turno-day">{d.getDate()}</span>
                  <span className="dm-turno-month">{MESES[d.getMonth()]}</span>
                </div>
                <div className="dm-turno-info">
                  <div className="dm-turno-name">{otro ?? "Turno"}</div>
                  <div className="dm-turno-meta">{String(t.hora).slice(0, 5)} hs · {t.casos?.titulo ?? "Consulta"}</div>
                  <span className="dm-turno-status" style={{ background: `var(--color-${est.tone}-bg)` }}>
                    <span className="dm-turno-dot" style={{ background: `var(--color-${est.tone})` }} />{est.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <button className="dm-btn-ghost" onClick={onSeeAll}>Ver todos los turnos</button>
    </section>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const user     = getUser();
  const role     = user?.role;
  const [perfil,  setPerfil]  = useState(null);
  const [stats,   setStats]   = useState({ estudiantes: 0, pacientes: 0, matches: 0 });
  const [turnos,  setTurnos]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hoy = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local
    Promise.allSettled([
      profileService.get().then(({ perfil }) => setPerfil(perfil)),
      statsService.publicas().then(setStats),
      turnosService.listar({ desde: hoy }).then((lista) => {
        setTurnos((Array.isArray(lista) ? lista : []).filter((t) => ESTADOS_TURNO[t.estado]).slice(0, 3));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const esEstudiante = role === "estudiante";
  const nombre   = perfil?.nombre ?? user?.email?.split("@")[0] ?? "usuario";
  const fraseRol = esEstudiante
    ? "Conectá con pacientes reales y sumá experiencia clínica."
    : "El estudiante ideal para tu tratamiento está a un click.";
  const RoleIcon = esEstudiante ? IconCap : IconUser;

  const principal = esEstudiante
    ? { Icon: IconUsers, kicker: "Casos disponibles", title: "Pacientes",
        desc: "Explorá los casos disponibles para atender y sumá experiencia clínica real.",
        label: "Ver pacientes", heroLabel: "Ver pacientes", to: "/marketplace" }
    : { Icon: IconHeartHandshake, kicker: "Match con estudiantes", title: "Dental Match",
        desc: "Swipeá estudiantes que quieren atenderte y encontrá al indicado para tu tratamiento.",
        label: "¡Buscar match!", heroLabel: "Buscar match", to: "/match" };

  const accesos = [
    { Icon: IconUser,     variant: "violet", title: "Mi perfil",  desc: esEstudiante ? "Universidad y materias" : "Tus datos y tu caso",   to: "/profile" },
    { Icon: IconFile,     variant: "blue",   title: "Mis casos",  desc: esEstudiante ? "Casos que atendés" : "Publicá y seguí casos",      to: esEstudiante ? "/asignaciones" : "/casos" },
    { Icon: IconCalendar, variant: "orange", title: "Mis turnos", desc: "Citas y horarios",                                                  to: "/turnos" },
  ];

  if (loading) {
    return (
      <div className="dm-home-page">
        <div style={s.page}>
          <div className="dm-home-container">
            <div className="dm-layout">
              <div className="dm-main">
                <Skeleton height="190px" borderRadius="16px" />
                <Skeleton height="96px" borderRadius="16px" />
                <Skeleton height="230px" borderRadius="16px" />
                <Skeleton height="260px" borderRadius="16px" />
              </div>
              <div className="dm-side">
                <Skeleton height="210px" borderRadius="16px" />
                <Skeleton height="260px" borderRadius="16px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dm-home-page">
      <OnboardingTour />

      <div style={s.page}>
        <div className="dm-home-container">
          <div className="dm-layout">

            {/* ── Columna principal ── */}
            <div className="dm-main">

              {/* Sin overflow:hidden para que el dropdown de notificaciones no se corte */}
              <section className="dm-panel dm-hero">
                <div className="dm-hero-main">
                  <span className="dm-role-badge"><RoleIcon size={14} />{esEstudiante ? "Estudiante" : "Paciente"}</span>
                  <h1 className="dm-home-title">Hola, <span className="dm-name">{nombre}</span></h1>
                  <p className="dm-hero-sub">{fraseRol}</p>
                  <button className="dm-btn-primary" onClick={() => navigate(principal.to)}>
                    {principal.heroLabel}<IconArrow />
                  </button>
                </div>
                <div className="dm-hero-controls">
                  <NotificationsBell />
                  <UserMenu inline />
                </div>
              </section>

              <Metrics stats={stats} />

              <section className="dm-featured">
                <MatchIllustration />
                <div className="dm-featured-body">
                  <span className="dm-featured-kicker"><principal.Icon size={14} />{principal.kicker}</span>
                  <h2 className="dm-featured-title">{principal.title}</h2>
                  <p className="dm-featured-desc">{principal.desc}</p>
                  <button className="dm-btn-bright" onClick={() => navigate(principal.to)}>
                    {principal.label}<IconArrow />
                  </button>
                </div>
              </section>

              <div className="dm-quick">
                {accesos.map(({ Icon, ...a }) => (
                  <button key={a.title} className={`dm-panel dm-quick-item dm-quick-item--${a.variant}`} onClick={() => navigate(a.to)}>
                    <span className="dm-quick-icon"><Icon size={22} /></span>
                    <span className="dm-quick-text">
                      <span className="dm-quick-title">{a.title}</span>
                      <span className="dm-quick-desc">{a.desc}</span>
                    </span>
                    <span className="dm-quick-chevron"><IconChevron /></span>
                  </button>
                ))}
              </div>

              <ActivityGraph role={role} />
            </div>

            {/* ── Panel lateral ── */}
            <aside className="dm-side">
              {perfil !== null && <ProfileWidget perfil={perfil} role={role} onEdit={() => navigate("/profile/edit")} />}
              <UpcomingWidget turnos={turnos} role={role} onSeeAll={() => navigate("/turnos")} />
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { position: "relative", zIndex: 1, padding: "36px 20px 48px" },
};
