import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, casosService, matchService } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import RatingStars from "../../components/RatingStars/RatingStars";

// ── Tarjeta swipeable ─────────────────────────────────────────────────────────
function SwipeCard({ aplicacion, isTop, onSwipe }) {
  const ref      = useRef(null);
  const startX   = useRef(0);
  const currentX = useRef(0);
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState(null); // 'left' | 'right'

  const est = aplicacion?.estudiantes;
  if (!est) return null;

  // Mouse / touch drag
  const onStart = (x) => { startX.current = x; };
  const onMove  = (x) => {
    currentX.current = x - startX.current;
    setDrag(currentX.current);
  };
  const onEnd   = () => {
    const d = currentX.current;
    if (d > 100)       { triggerSwipe("right"); }
    else if (d < -100) { triggerSwipe("left"); }
    else               { setDrag(0); }
    currentX.current = 0;
  };

  const triggerSwipe = (dir) => {
    setLeaving(dir);
    setTimeout(() => onSwipe(dir, aplicacion), 380);
  };

  const rotation  = drag / 18;
  const opacity   = leaving ? 0 : 1;
  const translate = leaving === "right" ? 600 : leaving === "left" ? -600 : drag;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute", width: "100%",
        transform: `translateX(${translate}px) rotate(${rotation}deg)`,
        transition: leaving ? "transform .38s ease, opacity .38s ease" : drag ? "none" : "transform .3s ease",
        opacity, cursor: drag ? "grabbing" : "grab",
        zIndex: isTop ? 10 : 5,
      }}
      onMouseDown={e => onStart(e.clientX)}
      onMouseMove={e => drag !== 0 && onMove(e.clientX)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={e => onStart(e.touches[0].clientX)}
      onTouchMove={e => onMove(e.touches[0].clientX)}
      onTouchEnd={onEnd}
    >
      <div style={sw.card}>

        {/* Indicadores de swipe — opacidad proporcional al drag */}
        {drag > 30 && (
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{ ...sw.indicator, ...sw.indicatorRight, opacity: Math.min(drag/120, 1), transform: `rotate(${-15 + drag/8}deg) scale(${Math.min(0.8 + drag/300, 1.2)})` }}
          >
            💚 MATCH
          </div>
        )}
        {drag < -30 && (
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{ ...sw.indicator, ...sw.indicatorLeft, opacity: Math.min(-drag/120, 1), transform: `rotate(${15 + drag/8}deg) scale(${Math.min(0.8 + -drag/300, 1.2)})` }}
          >
            ✕ PASAR
          </div>
        )}

        {/* Foto / avatar */}
        <div style={sw.imgArea}>
          {est.imagen_url
            ? <img src={est.imagen_url} alt="Foto" style={sw.img} />
            : (
              <div style={sw.imgPlaceholder}>
                <div style={sw.bigAvatar}>{est.nombre?.charAt(0).toUpperCase()}</div>
              </div>
            )
          }
          <div style={sw.imgGradient} />
          {/* Info superpuesta */}
          <div style={sw.nameOverlay}>
            <div style={sw.cardName}>{est.nombre}</div>
            <div style={sw.cardUni}>🏛️ {est.universidad}</div>
            {est.anio_carrera && <div style={sw.cardYear}>Año {est.anio_carrera}</div>}
          </div>
        </div>

        {/* Cuerpo */}
        <div style={sw.body}>
          {/* Rating */}
          <div style={sw.ratingRow}>
            <RatingStars readOnly value={est.rating ?? 0} size={14} />
            <span style={sw.ratingNum}>{est.rating ?? 0}</span>
            <span style={sw.caseCount}>· {est.pacientes_atendidos ?? 0} casos atendidos</span>
          </div>

          {/* Descripción */}
          <p style={sw.desc}>{est.descripcion ?? "Estudiante de odontología buscando experiencia clínica."}</p>

          {/* Materias */}
          {est.materias?.length > 0 && (
            <div style={sw.tagRow}>
              {est.materias.slice(0, 3).map(m => (
                <span key={m} style={sw.tag}>{m}</span>
              ))}
              {est.materias.length > 3 && <span style={sw.tagMore}>+{est.materias.length - 3}</span>}
            </div>
          )}

          {/* Disponibilidad */}
          {est.disponibilidad?.length > 0 && (
            <div style={sw.availRow}>
              <span style={sw.availIcon}>📅</span>
              <span style={sw.availText}>{est.disponibilidad.slice(0, 2).join(" · ")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const sw = {
  card:           { background: "var(--bg-card)", borderRadius: "24px", overflow: "hidden", boxShadow: "var(--shadow-lg)", userSelect: "none" },
  imgArea:        { position: "relative", height: "300px", overflow: "hidden" },
  img:            { width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" },
  imgPlaceholder: { width: "100%", height: "100%", background: "linear-gradient(135deg, var(--color-primary-hover), var(--color-primary))", display: "flex", alignItems: "center", justifyContent: "center" },
  bigAvatar:      { width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", fontWeight: 900, border: "3px solid rgba(255,255,255,0.4)" },
  imgGradient:    { position: "absolute", bottom: 0, left: 0, right: 0, height: "120px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", pointerEvents: "none" },
  nameOverlay:    { position: "absolute", bottom: "16px", left: "20px", right: "20px" },
  cardName:       { fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" },
  cardUni:        { fontSize: "13px", color: "rgba(255,255,255,0.85)", marginTop: "2px" },
  cardYear:       { fontSize: "12px", color: "rgba(255,255,255,0.7)" },
  body:           { padding: "20px 22px 24px", display: "flex", flexDirection: "column", gap: "12px" },
  ratingRow:      { display: "flex", alignItems: "center", gap: "6px" },
  ratingNum:      { fontWeight: 800, fontSize: "14px", color: "var(--color-warning)" },
  caseCount:      { fontSize: "13px", color: "var(--text-tertiary)" },
  desc:           { fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  tagRow:         { display: "flex", gap: "6px", flexWrap: "wrap" },
  tag:            { fontSize: "11px", color: "var(--color-info)", background: "var(--color-info-bg)", padding: "3px 10px", borderRadius: "999px", fontWeight: 700, border: "1px solid var(--border)" },
  tagMore:        { fontSize: "11px", color: "var(--text-tertiary)", padding: "3px 8px" },
  availRow:       { display: "flex", alignItems: "center", gap: "6px" },
  availIcon:      { fontSize: "14px" },
  availText:      { fontSize: "13px", color: "var(--text-secondary)" },
  indicator:      { position: "absolute", top: "20px", padding: "8px 18px", borderRadius: "999px", fontSize: "16px", fontWeight: 900, zIndex: 20, border: "3px solid", backdropFilter: "blur(4px)" },
  indicatorRight: { right: "20px", color: "var(--color-success)", borderColor: "var(--color-success)", background: "var(--color-success-bg)" },
  indicatorLeft:  { left: "20px", color: "var(--color-danger)", borderColor: "var(--color-danger)", background: "var(--color-danger-bg)" },
};

// ── Confetti — partículas SVG que caen desde arriba ────────────────────────
// Paleta fija de 4 tonos de marca (valores del tema claro) — el confetti es un
// efecto corto de celebración sobre el overlay, no necesita seguir el tema.
const CONFETTI_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed"]; // primary / success / warning / purple
function Confetti() {
  const pieces = Array.from({ length: 50 });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {pieces.map((_, i) => {
        const left  = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const size  = 6 + Math.random() * 10;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const rot   = Math.random() * 360;
        return (
          <div key={i} style={{
            position: "absolute", top: "-20px", left: `${left}%`,
            width: size, height: size * 1.6, background: color,
            transform: `rotate(${rot}deg)`,
            animation: `confettiFall ${1.8 + Math.random() * 1.5}s ${delay}s ease-in forwards`,
            borderRadius: "2px",
          }}/>
        );
      })}
    </div>
  );
}

// ── Match overlay con animación tipo MercadoPago ───────────────────────────
function MatchOverlay({ estudiante, onContinue }) {
  return (
    <div style={mo.overlay} aria-live="polite" aria-atomic="true">
      <Confetti />
      <div style={mo.box}>
        {/* Check de éxito tipo MercadoPago */}
        <div style={mo.checkWrap}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={mo.checkSvg}>
            <circle cx="44" cy="44" r="40" fill="none" stroke="var(--color-success)" strokeWidth="4"
              strokeDasharray="251" strokeDashoffset="251"
              style={{ animation: "drawCircle .55s .15s ease-out forwards" }}/>
            <path d="M27 45 L40 58 L62 32" fill="none" stroke="var(--color-success)" strokeWidth="5"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="60" strokeDashoffset="60"
              style={{ animation: "drawCheck .35s .7s ease-out forwards" }}/>
          </svg>
        </div>

        <h2 style={mo.title}>¡Es un Match!</h2>
        <p style={mo.sub}>
          <strong>{estudiante?.nombre}</strong> va a atender tu caso.<br/>
          Ya pueden empezar a chatear.
        </p>

        <div style={mo.avatarRow}>
          <div style={{ ...mo.matchAvatar, animation: "avatarPop .5s 1s both" }}>👤</div>
          <div style={mo.heartConnect}>
            <span style={mo.heartEmoji}>💙</span>
          </div>
          <div style={{ ...mo.matchAvatar, animation: "avatarPop .5s 1.15s both" }}>
            {estudiante?.imagen_url
              ? <img src={estudiante.imagen_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }}/>
              : estudiante?.nombre?.charAt(0).toUpperCase()}
          </div>
        </div>

        <button style={mo.btn} onClick={onContinue}>💬 Empezar a chatear</button>
      </div>
    </div>
  );
}

const mo = {
  overlay:   { position: "fixed", inset: 0, background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 92%, transparent), color-mix(in srgb, var(--color-primary-hover) 88%, transparent))", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(8px)", overflow: "hidden" },
  box:       { background: "var(--bg-card)", borderRadius: "28px", padding: "48px 40px", textAlign: "center", maxWidth: "380px", width: "90%", boxShadow: "var(--shadow-lg)", position: "relative", zIndex: 1, animation: "matchBoxIn .5s cubic-bezier(0.34,1.56,0.64,1)" },
  checkWrap: { display: "flex", justifyContent: "center", marginBottom: "16px" },
  checkSvg:  { animation: "checkPulse 1s 1s ease-out" },
  title:     { fontSize: "30px", fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-1px", animation: "matchTextIn .5s .4s both" },
  sub:       { fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.7", margin: "0 0 24px", animation: "matchTextIn .5s .55s both" },
  avatarRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "28px" },
  matchAvatar:{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-primary-hover), var(--color-primary))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, overflow: "hidden", boxShadow: "0 6px 20px color-mix(in srgb, var(--color-primary) 40%, transparent)" },
  heartConnect:{ position: "relative", width: "40px", height: "2px", background: "linear-gradient(90deg, var(--color-primary), var(--color-purple), var(--color-primary))", borderRadius: "1px" },
  heartEmoji: { position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", fontSize: "26px", animation: "heartBeat 1.4s .7s ease-in-out infinite" },
  heart:     { fontSize: "28px" },
  btn:       { padding: "14px 36px", background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))", color: "var(--color-primary-text)", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px color-mix(in srgb, var(--color-primary) 35%, transparent)" },
};

// ── Página principal ──────────────────────────────────────────────────────────
export default function MatchPage() {
  const navigate = useNavigate();
  const toast    = useToast();
  const user     = getUser();
  const [casos,        setCasos]        = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [casoIdx,      setCasoIdx]      = useState(0);
  const [cardIdx,      setCardIdx]      = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [matchedEst,   setMatchedEst]   = useState(null);
  const [done,         setDone]         = useState(false);

  // Cargar todos los casos abiertos del paciente al montar
  useEffect(() => {
    casosService.listar()
      .then((casosData) => {
        const abiertos = (casosData || []).filter(c => c.estado === "abierto");
        setCasos(abiertos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Cuando cambia el caso activo, cargar sus aplicantes
  useEffect(() => {
    if (casos.length === 0) return;
    const casoActivo = casos[casoIdx];
    if (!casoActivo) return;
    setCardIdx(0);
    matchService.aplicantes(casoActivo.id)
      .then(apls => setAplicaciones(Array.isArray(apls) ? apls : []))
      .catch(() => setAplicaciones([]));
  }, [casos, casoIdx]);

  const currentCaso = casos[casoIdx];
  const currentCard = aplicaciones[cardIdx];
  const remaining   = aplicaciones.length - cardIdx;

  const handleSwipe = async (dir, aplicacion) => {
    try {
      if (dir === "right") {
        await matchService.hacerMatch(currentCaso.id, aplicacion.estudiantes.id);
        setMatchedEst(aplicacion.estudiantes);
      } else {
        await matchService.rechazar(currentCaso.id, aplicacion.estudiantes.id);
        toast.info("Estudiante descartado");
      }
    } catch (e) {
      toast.error(e.message || "No se pudo procesar la acción");
    }
    setCardIdx(i => i + 1);
  };

  const handleContinue = () => {
    setMatchedEst(null);
    // Llevar al chat con el estudiante elegido
    if (currentCaso) navigate(`/chat/${currentCaso.id}`);
    else navigate("/casos");
  };

  if (loading) return (
    <div style={pg.center}>
      <div style={{ width: "40px", height: "40px", border: "4px solid var(--border)", borderTop: "4px solid var(--color-primary)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    </div>
  );

  if (!currentCaso) return (
    <div style={pg.center}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🦷</div>
        <h3 style={pg.emptyTitle}>No tenés casos abiertos</h3>
        <p style={pg.emptyText}>Publicá un caso para empezar a recibir estudiantes.</p>
        <button style={pg.cta} onClick={() => navigate("/casos/nuevo")}>Publicar caso</button>
      </div>
    </div>
  );

  if (aplicaciones.length === 0 || cardIdx >= aplicaciones.length) return (
    <div style={pg.center}>
      <div style={{ textAlign: "center", maxWidth: "420px", padding: "0 20px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>⌛</div>
        <h3 style={pg.emptyTitle}>Sin aplicaciones nuevas</h3>
        <p style={pg.emptyText}>
          Para <strong>"{currentCaso.titulo}"</strong> todavía no hay estudiantes que apliquen.
        </p>
        {casos.length > 1 && (
          <div style={pg.casosSwitch}>
            <div style={pg.casosSwitchLabel}>Ver aplicantes de otro caso:</div>
            {casos.map((c, i) => (
              <button
                key={c.id}
                style={{ ...pg.casosSwitchBtn, ...(i === casoIdx ? pg.casosSwitchActive : {}) }}
                onClick={() => setCasoIdx(i)}
              >
                {c.titulo}
              </button>
            ))}
          </div>
        )}
        <button style={pg.cta} onClick={() => navigate("/casos")}>Ver mis casos</button>
      </div>
    </div>
  );

  return (
    <div style={pg.root}>

      {/* Header */}
      <div style={pg.header}>
        <button style={pg.backBtn} onClick={() => navigate("/home")}>← Inicio</button>
        <div style={pg.logoText}>Dental<span style={{ color: "var(--color-primary)" }}>Match</span></div>
        {casos.length > 1 ? (
          <select
            style={pg.casoSelect}
            value={casoIdx}
            onChange={(e) => setCasoIdx(Number(e.target.value))}
          >
            {casos.map((c, i) => (
              <option key={c.id} value={i}>{c.titulo}</option>
            ))}
          </select>
        ) : (
          <div style={pg.casoPill}>{currentCaso.titulo}</div>
        )}
      </div>

      {/* Stack de tarjetas */}
      <div style={pg.stackArea}>
        <div style={pg.counter}>{remaining} estudiante{remaining !== 1 ? "s" : ""} disponible{remaining !== 1 ? "s" : ""}</div>

        <div style={pg.stack}>
          {/* Carta de fondo */}
          {aplicaciones[cardIdx + 1] && (
            <div style={{ position: "absolute", width: "100%", transform: "scale(0.94) translateY(10px)", zIndex: 5 }}>
              <SwipeCard aplicacion={aplicaciones[cardIdx + 1]} isTop={false} onSwipe={() => {}} />
            </div>
          )}
          {/* Carta principal */}
          <SwipeCard
            key={cardIdx}
            aplicacion={currentCard}
            isTop={true}
            onSwipe={handleSwipe}
          />
        </div>

        {/* Instrucción */}
        <div style={pg.hint}>
          <span style={pg.hintLeft}>← Pasar</span>
          <span style={pg.hintText}>Deslizá para decidir</span>
          <span style={pg.hintRight}>Match 💚 →</span>
        </div>

        {/* Botones de acción */}
        <div style={pg.btnRow}>
          <button style={pg.rejectBtn} onClick={() => handleSwipe("left", currentCard)}>✕</button>
          <button style={pg.matchBtn}  onClick={() => handleSwipe("right", currentCard)}>💚</button>
        </div>
      </div>

      {/* Match overlay */}
      {matchedEst && <MatchOverlay estudiante={matchedEst} onContinue={handleContinue} />}
    </div>
  );
}

const pg = {
  root:       { minHeight: "100vh", background: "var(--bg-page)", display: "flex", flexDirection: "column" },
  header:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" },
  backBtn:    { background: "none", border: "none", color: "var(--color-primary)", fontWeight: 600, fontSize: "14px", cursor: "pointer" },
  logoText:   { fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  casoPill:   { fontSize: "12px", color: "var(--color-primary)", background: "var(--color-info-bg)", padding: "4px 12px", borderRadius: "999px", fontWeight: 600, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  casoSelect: { fontSize: "12px", color: "var(--color-primary)", background: "var(--color-info-bg)", padding: "5px 12px", borderRadius: "999px", fontWeight: 600, maxWidth: "200px", border: "1px solid var(--border)", cursor: "pointer" },
  casosSwitch: { margin: "24px 0", padding: "16px 18px", background: "var(--bg-subtle)", borderRadius: "14px", border: "1px solid var(--border)" },
  casosSwitchLabel: { fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 700, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" },
  casosSwitchBtn: { display: "block", width: "100%", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", cursor: "pointer", textAlign: "left" },
  casosSwitchActive: { background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))", color: "var(--color-primary-text)", border: "1px solid transparent" },
  stackArea:  { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 40px", gap: "20px" },
  counter:    { fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 600 },
  stack:      { position: "relative", width: "100%", maxWidth: "380px", height: "520px" },
  hint:       { display: "flex", gap: "16px", alignItems: "center" },
  hintLeft:   { fontSize: "13px", color: "var(--color-danger)", fontWeight: 600 },
  hintText:   { fontSize: "13px", color: "var(--text-tertiary)" },
  hintRight:  { fontSize: "13px", color: "var(--color-success)", fontWeight: 600 },
  btnRow:     { display: "flex", gap: "24px" },
  rejectBtn:  { width: "60px", height: "60px", borderRadius: "50%", background: "var(--bg-card)", border: "2px solid color-mix(in srgb, var(--color-danger) 35%, transparent)", color: "var(--color-danger)", fontSize: "22px", cursor: "pointer", boxShadow: "0 4px 16px color-mix(in srgb, var(--color-danger) 20%, transparent)", transition: "all .2s" },
  matchBtn:   { width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))", border: "none", color: "var(--color-primary-text)", fontSize: "22px", cursor: "pointer", boxShadow: "0 4px 16px color-mix(in srgb, var(--color-primary) 35%, transparent)", transition: "all .2s" },
  center:     { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)" },
  emptyTitle: { fontSize: "22px", fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" },
  emptyText:  { fontSize: "15px", color: "var(--text-secondary)", marginBottom: "24px" },
  cta:        { padding: "14px 28px", background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))", color: "var(--color-primary-text)", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },
};
