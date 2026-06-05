import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, casosService, matchService } from "../../services/api";

// ── Estrellas de rating ───────────────────────────────────────────────────────
const Stars = ({ rating }) => {
  const full = Math.round(rating);
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= full ? "#f59e0b" : "#e2e8f0", fontSize: "14px" }}>★</span>
      ))}
    </div>
  );
};

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

        {/* Indicadores de swipe */}
        {drag > 30 && (
          <div style={{ ...sw.indicator, ...sw.indicatorRight }}>MATCH 💚</div>
        )}
        {drag < -30 && (
          <div style={{ ...sw.indicator, ...sw.indicatorLeft }}>PASAR 💔</div>
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
            <Stars rating={est.rating ?? 0} />
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
  card:           { background: "#fff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", userSelect: "none" },
  imgArea:        { position: "relative", height: "300px", overflow: "hidden" },
  img:            { width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" },
  imgPlaceholder: { width: "100%", height: "100%", background: "linear-gradient(135deg,#1e40af,#2563eb,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" },
  bigAvatar:      { width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "42px", fontWeight: 900, border: "3px solid rgba(255,255,255,0.4)" },
  imgGradient:    { position: "absolute", bottom: 0, left: 0, right: 0, height: "120px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", pointerEvents: "none" },
  nameOverlay:    { position: "absolute", bottom: "16px", left: "20px", right: "20px" },
  cardName:       { fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", fontFamily: "'Inter',sans-serif" },
  cardUni:        { fontSize: "13px", color: "rgba(255,255,255,0.85)", marginTop: "2px" },
  cardYear:       { fontSize: "12px", color: "rgba(255,255,255,0.7)" },
  body:           { padding: "20px 22px 24px", display: "flex", flexDirection: "column", gap: "12px" },
  ratingRow:      { display: "flex", alignItems: "center", gap: "6px" },
  ratingNum:      { fontWeight: 800, fontSize: "14px", color: "#f59e0b" },
  caseCount:      { fontSize: "13px", color: "#94a3b8" },
  desc:           { fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  tagRow:         { display: "flex", gap: "6px", flexWrap: "wrap" },
  tag:            { fontSize: "11px", color: "#2563eb", background: "#eff6ff", padding: "3px 10px", borderRadius: "999px", fontWeight: 700, border: "1px solid #bfdbfe" },
  tagMore:        { fontSize: "11px", color: "#94a3b8", padding: "3px 8px" },
  availRow:       { display: "flex", alignItems: "center", gap: "6px" },
  availIcon:      { fontSize: "14px" },
  availText:      { fontSize: "13px", color: "#64748b" },
  indicator:      { position: "absolute", top: "20px", padding: "8px 18px", borderRadius: "999px", fontSize: "16px", fontWeight: 900, zIndex: 20, border: "3px solid", backdropFilter: "blur(4px)" },
  indicatorRight: { right: "20px", color: "#16a34a", borderColor: "#16a34a", background: "rgba(240,253,244,0.9)" },
  indicatorLeft:  { left: "20px", color: "#dc2626", borderColor: "#dc2626", background: "rgba(254,242,242,0.9)" },
};

// ── Match overlay ─────────────────────────────────────────────────────────────
function MatchOverlay({ estudiante, onContinue }) {
  return (
    <div style={mo.overlay}>
      <div style={mo.box}>
        <div style={mo.emoji}>🎉</div>
        <h2 style={mo.title}>¡Es un Match!</h2>
        <p style={mo.sub}>
          <strong>{estudiante?.nombre}</strong> va a atender tu caso.
          Te contactará pronto para coordinar el turno.
        </p>
        <div style={mo.avatarRow}>
          <div style={mo.matchAvatar}>👤</div>
          <div style={mo.heart}>💙</div>
          <div style={mo.matchAvatar}>{estudiante?.nombre?.charAt(0).toUpperCase()}</div>
        </div>
        <button style={mo.btn} onClick={onContinue}>¡Genial!</button>
      </div>
    </div>
  );
}

const mo = {
  overlay:   { position: "fixed", inset: 0, background: "linear-gradient(135deg,rgba(30,64,175,0.92),rgba(37,99,235,0.88))", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(8px)" },
  box:       { background: "#fff", borderRadius: "28px", padding: "48px 40px", textAlign: "center", maxWidth: "380px", width: "90%", boxShadow: "0 40px 100px rgba(0,0,0,0.3)" },
  emoji:     { fontSize: "64px", marginBottom: "12px" },
  title:     { fontSize: "32px", fontWeight: 900, color: "#0f172a", margin: "0 0 12px", letterSpacing: "-1px" },
  sub:       { fontSize: "15px", color: "#64748b", lineHeight: "1.7", margin: "0 0 28px" },
  avatarRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "28px" },
  matchAvatar:{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 800 },
  heart:     { fontSize: "28px" },
  btn:       { padding: "14px 36px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 6px 20px rgba(37,99,235,0.35)" },
};

// ── Página principal ──────────────────────────────────────────────────────────
export default function MatchPage() {
  const navigate = useNavigate();
  const user     = getUser();
  const [casos,        setCasos]        = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [casoIdx,      setCasoIdx]      = useState(0);
  const [cardIdx,      setCardIdx]      = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [matchedEst,   setMatchedEst]   = useState(null);
  const [done,         setDone]         = useState(false);

  useEffect(() => {
    casosService.listar()
      .then(async (casosData) => {
        const abiertos = (casosData || []).filter(c => c.estado === "abierto" || c.estado === "en_progreso");
        setCasos(abiertos);
        if (abiertos.length > 0) {
          const apls = await matchService.aplicantes(abiertos[0].id);
          setAplicaciones(Array.isArray(apls) ? apls : []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      }
    } catch {}
    setCardIdx(i => i + 1);
  };

  const handleContinue = () => {
    setMatchedEst(null);
    navigate("/casos");
  };

  if (loading) return (
    <div style={pg.center}>
      <div style={{ width: "40px", height: "40px", border: "4px solid #bfdbfe", borderTop: "4px solid #2563eb", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
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

  if (cardIdx >= aplicaciones.length) return (
    <div style={pg.center}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>⌛</div>
        <h3 style={pg.emptyTitle}>Sin aplicaciones nuevas</h3>
        <p style={pg.emptyText}>Todavía no hay estudiantes que aplicaron a tu caso. Volvé más tarde.</p>
        <button style={pg.cta} onClick={() => navigate("/casos")}>Ver mis casos</button>
      </div>
    </div>
  );

  return (
    <div style={pg.root}>

      {/* Header */}
      <div style={pg.header}>
        <button style={pg.backBtn} onClick={() => navigate("/home")}>← Inicio</button>
        <div style={pg.logoText}>Dental<span style={{ color: "#2563eb" }}>Match</span></div>
        <div style={pg.casoPill}>{currentCaso.titulo}</div>
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
  root:       { minHeight: "100vh", background: "linear-gradient(160deg,#f8fafc 0%,#eff6ff 55%,#fff7ed 100%)", fontFamily: "'Inter',sans-serif", display: "flex", flexDirection: "column" },
  header:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "#fff", borderBottom: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" },
  backBtn:    { background: "none", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  logoText:   { fontSize: "18px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" },
  casoPill:   { fontSize: "12px", color: "#3b82f6", background: "#eff6ff", padding: "4px 12px", borderRadius: "999px", fontWeight: 600, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  stackArea:  { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 40px", gap: "20px" },
  counter:    { fontSize: "13px", color: "#94a3b8", fontWeight: 600 },
  stack:      { position: "relative", width: "100%", maxWidth: "380px", height: "520px" },
  hint:       { display: "flex", gap: "16px", alignItems: "center" },
  hintLeft:   { fontSize: "13px", color: "#ef4444", fontWeight: 600 },
  hintText:   { fontSize: "13px", color: "#94a3b8" },
  hintRight:  { fontSize: "13px", color: "#10b981", fontWeight: 600 },
  btnRow:     { display: "flex", gap: "24px" },
  rejectBtn:  { width: "60px", height: "60px", borderRadius: "50%", background: "#fff", border: "2px solid #fecaca", color: "#ef4444", fontSize: "22px", cursor: "pointer", boxShadow: "0 4px 16px rgba(239,68,68,0.2)", transition: "all .2s" },
  matchBtn:   { width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", color: "#fff", fontSize: "22px", cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.35)", transition: "all .2s" },
  center:     { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", background: "#f8fafc" },
  emptyTitle: { fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "0 0 8px" },
  emptyText:  { fontSize: "15px", color: "#64748b", marginBottom: "24px" },
  cta:        { padding: "14px 28px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
};
