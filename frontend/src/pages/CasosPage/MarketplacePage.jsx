import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, casosService, matchService } from "../../services/api";

const timeAgo = (date) => {
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (d === 0) return "Hoy";
  if (d === 1) return "Ayer";
  if (d < 7)  return `Hace ${d} días`;
  return new Date(date).toLocaleDateString("es-AR", { day:"2-digit", month:"short" });
};

// Síntomas inferidos del texto
const inferSintomas = (desc = "") => {
  const lower = desc.toLowerCase();
  const map = [
    ["dolor",        "Dolor"],
    ["inflam",       "Inflamación"],
    ["sangr",        "Sangrado"],
    ["sensibil",     "Sensibilidad"],
    ["caries",       "Caries"],
    ["ortodoncia",   "Ortodoncia"],
    ["muela",        "Muela del juicio"],
    ["encía",        "Encías"],
  ];
  return map.filter(([k]) => lower.includes(k)).map(([, v]) => v).slice(0, 4);
};

// ── Modal de detalle ──────────────────────────────────────────────────────────
function CasoModal({ caso, onClose, onAplicar }) {
  const [applying, setApplying] = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState("");
  const sintomas = inferSintomas(caso.descripcion);

  const handleAplicar = async () => {
    setApplying(true); setErr("");
    try {
      await onAplicar(caso.id);
      setDone(true);
    } catch (e) { setErr(e.message); }
    finally { setApplying(false); }
  };

  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>

        {/* Imagen */}
        {caso.imagen_url ? (
          <div style={m.imgWrap}>
            <img src={caso.imagen_url} alt="Foto caso" style={m.img} />
            <div style={m.imgOverlay} />
            <button style={m.closeAbsolute} onClick={onClose}>✕</button>
          </div>
        ) : (
          <div style={m.imgPlaceholder}>
            <span style={{ fontSize: "52px" }}>🦷</span>
            <button style={m.closeAbsolute} onClick={onClose}>✕</button>
          </div>
        )}

        <div style={m.body}>
          {/* Header */}
          <div style={m.mHeader}>
            <div>
              <h2 style={m.mTitle}>{caso.titulo}</h2>
              <div style={m.mMeta}>
                <span style={m.availBadge}>● Disponible</span>
                {caso.tipo_tratamiento && <span style={m.typePill}>{caso.tipo_tratamiento}</span>}
                <span style={m.date}>{timeAgo(caso.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Info paciente */}
          {caso.pacientes && (
            <div style={m.patSection}>
              <div style={m.patAvatar}>{caso.pacientes.nombre?.charAt(0).toUpperCase()}</div>
              <div>
                <div style={m.patName}>{caso.pacientes.nombre}</div>
                <div style={m.patAge}>{caso.pacientes.edad} años</div>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div style={m.section}>
            <div style={m.sLabel}>Descripción completa</div>
            <p style={m.sText}>{caso.descripcion}</p>
          </div>

          {/* Notas */}
          {caso.notas && (
            <div style={m.section}>
              <div style={m.sLabel}>Notas adicionales</div>
              <p style={m.sText}>{caso.notas}</p>
            </div>
          )}

          {/* Síntomas */}
          {sintomas.length > 0 && (
            <div style={m.section}>
              <div style={m.sLabel}>Síntomas detectados</div>
              <div style={m.tagRow}>
                {sintomas.map(s => <span key={s} style={m.tag}>{s}</span>)}
              </div>
            </div>
          )}

          {/* Acciones */}
          {err && <div style={m.errBox}>{err}</div>}
          <div style={m.actions}>
            <button style={m.cancelBtn} onClick={onClose}>Cerrar</button>
            {done ? (
              <div style={m.successPill}>✅ Aplicación enviada</div>
            ) : (
              <button style={m.applyBtn} onClick={handleAplicar} disabled={applying}>
                {applying ? "Enviando..." : "Tomar Paciente"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const m = {
  overlay:       { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(6px)", padding: "20px" },
  modal:         { background: "#fff", borderRadius: "24px", maxWidth: "560px", width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.25)" },
  imgWrap:       { position: "relative", height: "220px", overflow: "hidden", borderRadius: "24px 24px 0 0" },
  img:           { width: "100%", height: "100%", objectFit: "cover" },
  imgOverlay:    { position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3))" },
  imgPlaceholder:{ height: "160px", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "24px 24px 0 0", position: "relative" },
  closeAbsolute: { position: "absolute", top: "14px", right: "14px", background: "rgba(0,0,0,0.35)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", cursor: "pointer", fontSize: "14px", backdropFilter: "blur(4px)" },
  body:          { padding: "28px 32px 32px" },
  mHeader:       { marginBottom: "16px" },
  mTitle:        { fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px", fontFamily: "'Inter',sans-serif" },
  mMeta:         { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" },
  availBadge:    { fontSize: "12px", fontWeight: 700, color: "#10b981", background: "#f0fdf4", padding: "3px 10px", borderRadius: "999px", border: "1px solid #bbf7d0" },
  typePill:      { fontSize: "12px", color: "#3b82f6", background: "#eff6ff", padding: "3px 10px", borderRadius: "999px", fontWeight: 600 },
  date:          { fontSize: "12px", color: "#94a3b8" },
  patSection:    { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "#f8fafc", borderRadius: "14px", marginBottom: "20px" },
  patAvatar:     { width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, flexShrink: 0 },
  patName:       { fontWeight: 700, color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  patAge:        { fontSize: "13px", color: "#64748b" },
  section:       { marginBottom: "18px" },
  sLabel:        { fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
  sText:         { fontSize: "15px", color: "#374151", lineHeight: "1.7", margin: 0, fontFamily: "'Inter',sans-serif" },
  tagRow:        { display: "flex", gap: "8px", flexWrap: "wrap" },
  tag:           { padding: "5px 12px", background: "#eff6ff", color: "#2563eb", borderRadius: "999px", fontSize: "12px", fontWeight: 700, border: "1px solid #bfdbfe" },
  errBox:        { padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626", fontSize: "13px", marginBottom: "12px" },
  actions:       { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn:     { padding: "12px 24px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  applyBtn:      { padding: "12px 28px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" },
  successPill:   { padding: "12px 20px", background: "#f0fdf4", color: "#16a34a", borderRadius: "12px", fontSize: "14px", fontWeight: 700 },
};

// ── Tarjeta de paciente ───────────────────────────────────────────────────────
function PatientCard({ caso, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ ...c.card, ...(hover ? c.cardHover : {}) }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Imagen / placeholder */}
      <div style={c.imgArea}>
        {caso.imagen_url
          ? <img src={caso.imagen_url} alt="Foto" style={c.img} />
          : <div style={c.imgPlaceholder}><span style={{ fontSize: "36px" }}>🦷</span></div>
        }
        <div style={c.availBadge}>● Disponible</div>
      </div>

      <div style={c.body}>
        {/* Info paciente */}
        <div style={c.patRow}>
          <div style={c.avatar}>{caso.pacientes?.nombre?.charAt(0) ?? "P"}</div>
          <div>
            <div style={c.name}>{caso.pacientes?.nombre ?? "Paciente"}</div>
            <div style={c.age}>{caso.pacientes?.edad} años</div>
          </div>
        </div>

        {/* Título */}
        <div style={c.title}>{caso.titulo}</div>

        {/* Descripción — max 2 líneas */}
        <p style={c.desc}>{caso.descripcion}</p>

        {/* Footer */}
        <div style={c.footer}>
          {caso.tipo_tratamiento && <span style={c.type}>{caso.tipo_tratamiento}</span>}
          <span style={c.date}>{timeAgo(caso.created_at)}</span>
        </div>

        <button style={{ ...c.btn, ...(hover ? c.btnHover : {}) }}>
          Ver Caso →
        </button>
      </div>
    </div>
  );
}

const c = {
  card:        { background: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", cursor: "pointer", transition: "all .22s ease", display: "flex", flexDirection: "column" },
  cardHover:   { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(37,99,235,0.13)", border: "1px solid #bfdbfe" },
  imgArea:     { position: "relative", height: "160px", overflow: "hidden", flexShrink: 0 },
  img:         { width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s ease" },
  imgPlaceholder:{ height: "100%", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center" },
  availBadge:  { position: "absolute", top: "10px", right: "10px", background: "rgba(16,185,129,0.9)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", backdropFilter: "blur(4px)" },
  body:        { padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 },
  patRow:      { display: "flex", alignItems: "center", gap: "10px" },
  avatar:      { width: "36px", height: "36px", minWidth: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800 },
  name:        { fontWeight: 700, fontSize: "14px", color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  age:         { fontSize: "12px", color: "#94a3b8" },
  title:       { fontWeight: 800, fontSize: "15px", color: "#0f172a", lineHeight: 1.3, fontFamily: "'Inter',sans-serif" },
  desc:        { fontSize: "13px", color: "#64748b", lineHeight: "1.55", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  footer:      { display: "flex", alignItems: "center", gap: "8px", marginTop: "auto" },
  type:        { fontSize: "11px", color: "#3b82f6", background: "#eff6ff", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 },
  date:        { fontSize: "11px", color: "#94a3b8", marginLeft: "auto" },
  btn:         { width: "100%", padding: "10px", background: "#f8fafc", color: "#2563eb", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all .2s", marginTop: "4px" },
  btnHover:    { background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "1px solid transparent", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" },
};

// ── Página principal (Marketplace) ───────────────────────────────────────────
export default function MarketplacePage() {
  const navigate         = useNavigate();
  const user             = getUser();
  const [casos,    setCasos]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("todos");
  const [selected, setSelected] = useState(null);
  const [applied,  setApplied]  = useState(new Set());

  useEffect(() => {
    casosService.listar()
      .then(setCasos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const TIPOS = ["todos", "Ortodoncia", "Endodoncia", "Periodoncia", "Cirugía oral", "Estética dental", "Otro"];

  const filtered = casos.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.titulo.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q) || (c.pacientes?.nombre ?? "").toLowerCase().includes(q);
    const matchFilter = filter === "todos" || c.tipo_tratamiento === filter;
    return matchSearch && matchFilter;
  });

  const handleAplicar = async (casoId) => {
    const data = await matchService.aplicar(casoId);
    setApplied(prev => new Set([...prev, casoId]));
    return data;
  };

  const nombre = user?.email?.split("@")[0] ?? "Estudiante";

  return (
    <div style={p.root}>

      {/* ── HEADER ── */}
      <header style={p.header}>
        <div style={p.headerInner}>
          {/* Logo */}
          <div style={p.logo} onClick={() => navigate("/home")}>
            <div style={p.logoIcon}>🦷</div>
            <span style={p.logoText}>Dental<span style={p.logoBlue}>Match</span></span>
          </div>

          {/* Search */}
          <div style={p.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={p.searchInput}
              placeholder="Buscar pacientes por nombre, problema o tratamiento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button style={p.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>

          {/* Avatar */}
          <div style={p.avatarWrap}>
            <div style={p.avatar}>{nombre.charAt(0).toUpperCase()}</div>
            <div style={p.avatarInfo}>
              <div style={p.avatarName}>{nombre}</div>
              <div style={p.avatarRole}>Estudiante</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={p.main}>

        {/* Filtros + stats */}
        <div style={p.toolbar}>
          <div style={p.filterRow}>
            {TIPOS.map(t => (
              <button key={t} style={{ ...p.filterBtn, ...(filter === t ? p.filterActive : {}) }} onClick={() => setFilter(t)}>
                {t === "todos" ? "Todos los casos" : t}
              </button>
            ))}
          </div>
          <div style={p.statsRow}>
            <div style={p.statChip}>
              <span style={{ fontWeight: 800, color: "#2563eb" }}>{filtered.length}</span>
              <span style={{ color: "#94a3b8" }}> casos disponibles</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={p.centerMsg}>
            <div style={p.spinner} />
            <p style={p.loadMsg}>Cargando casos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={p.emptyState}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>🔍</div>
            <h3 style={p.emptyTitle}>Sin resultados</h3>
            <p style={p.emptyText}>Probá con otro término o remové el filtro activo.</p>
          </div>
        ) : (
          <div style={p.grid}>
            {filtered.map(caso => (
              <PatientCard
                key={caso.id}
                caso={caso}
                onClick={() => setSelected(caso)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selected && (
        <CasoModal
          caso={selected}
          onClose={() => setSelected(null)}
          onAplicar={handleAplicar}
        />
      )}
    </div>
  );
}

const p = {
  root:          { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter',sans-serif" },

  // Header
  header:        { background: "#fff", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(0,0,0,0.05)" },
  headerInner:   { maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", gap: "24px" },
  logo:          { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 },
  logoIcon:      { fontSize: "22px" },
  logoText:      { fontSize: "18px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" },
  logoBlue:      { color: "#2563eb" },
  searchBox:     { flex: 1, maxWidth: "480px", height: "40px", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0 14px", display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc" },
  searchInput:   { flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "14px", color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  clearBtn:      { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px", padding: "2px 4px" },
  avatarWrap:    { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  avatar:        { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 800 },
  avatarInfo:    { lineHeight: 1.3 },
  avatarName:    { fontSize: "13px", fontWeight: 700, color: "#0f172a" },
  avatarRole:    { fontSize: "11px", color: "#94a3b8" },

  // Main
  main:          { maxWidth: "1200px", margin: "0 auto", padding: "32px 32px 60px" },
  toolbar:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", gap: "16px", flexWrap: "wrap" },
  filterRow:     { display: "flex", gap: "8px", flexWrap: "wrap" },
  filterBtn:     { padding: "7px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#64748b", fontFamily: "'Inter',sans-serif", transition: "all .15s" },
  filterActive:  { background: "#2563eb", color: "#fff", border: "1px solid #2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" },
  statsRow:      { display: "flex", alignItems: "center" },
  statChip:      { fontSize: "14px", fontFamily: "'Inter',sans-serif" },

  grid:          { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },

  centerMsg:     { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "80px 0" },
  spinner:       { width: "40px", height: "40px", border: "4px solid #bfdbfe", borderTop: "4px solid #2563eb", borderRadius: "50%", animation: "spin .8s linear infinite" },
  loadMsg:       { color: "#64748b", fontSize: "15px" },
  emptyState:    { textAlign: "center", padding: "80px 20px" },
  emptyTitle:    { fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" },
  emptyText:     { fontSize: "15px", color: "#64748b" },
};
