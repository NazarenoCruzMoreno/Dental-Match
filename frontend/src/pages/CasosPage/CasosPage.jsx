import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { casosService, getUser } from "../../services/api";

// ── Iconos ────────────────────────────────────────────────────────────────────
const IconPlus   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const IconBack   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>);
const IconTooth  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8 2 5 5 5 9c0 2.5.8 4.5 1.5 6.5L7 20c.3 1.2 1 2 2 2s1.5-.8 2-2l1-3 1 3c.5 1.2 1 2 2 2s1.7-.8 2-2l.5-4.5C18.2 13.5 19 11.5 19 9c0-4-3-7-7-7z"/></svg>);
const IconStar   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IconSearch = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);

// ── Badge de estado ───────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  abierto:     { label: "Abierto",      color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
  en_progreso: { label: "En progreso",  color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  completado:  { label: "Completado",   color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  cancelado:   { label: "Cancelado",    color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.abierto;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: "'Inter',sans-serif" }}>
      {cfg.label}
    </span>
  );
}

// ── Tarjeta de caso ───────────────────────────────────────────────────────────
function CasoCard({ caso, role, onClick }) {
  const fecha = new Date(caso.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={s.card} onClick={onClick}>
      <div style={s.cardTop}>
        <div style={s.cardIconWrap}><IconTooth /></div>
        <div style={{ flex: 1 }}>
          <div style={s.cardTitle}>{caso.titulo}</div>
          {caso.tipo_tratamiento && <div style={s.cardType}>{caso.tipo_tratamiento}</div>}
        </div>
        <EstadoBadge estado={caso.estado} />
      </div>

      <p style={s.cardDesc}>{caso.descripcion.slice(0, 140)}{caso.descripcion.length > 140 ? "…" : ""}</p>

      <div style={s.cardFooter}>
        <span style={s.cardDate}>📅 {fecha}</span>
        {/* Paciente ve si tiene estudiante asignado */}
        {role === "paciente" && caso.estudiantes && (
          <span style={s.assignedPill}>🎓 {caso.estudiantes.nombre}</span>
        )}
        {/* Estudiante ve datos del paciente */}
        {role === "estudiante" && caso.pacientes && (
          <span style={s.patientInfo}>👤 {caso.pacientes.nombre} · {caso.pacientes.edad} años</span>
        )}
        {/* Rating del estudiante si aplica */}
        {role === "estudiante" && caso.estudiantes?.rating > 0 && (
          <span style={s.ratingPill}><IconStar /> {caso.estudiantes.rating}</span>
        )}
        <span style={s.viewMore}>Ver detalles →</span>
      </div>
    </div>
  );
}

// ── Detalle de caso (modal inline) ───────────────────────────────────────────
function CasoDetail({ caso, role, onClose }) {
  const fecha = new Date(caso.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <div>
            <div style={s.modalTitle}>{caso.titulo}</div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
              <EstadoBadge estado={caso.estado} />
              {caso.tipo_tratamiento && <span style={s.cardType}>{caso.tipo_tratamiento}</span>}
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalDivider} />

        <div style={s.modalSection}>
          <div style={s.modalLabel}>Descripción</div>
          <p style={s.modalText}>{caso.descripcion}</p>
        </div>

        {caso.notas && (
          <div style={s.modalSection}>
            <div style={s.modalLabel}>Notas adicionales</div>
            <p style={s.modalText}>{caso.notas}</p>
          </div>
        )}

        {role === "estudiante" && caso.pacientes && (
          <div style={s.modalSection}>
            <div style={s.modalLabel}>Paciente</div>
            <div style={s.patientCard}>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{caso.pacientes.nombre}</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>{caso.pacientes.edad} años · {caso.pacientes.problema_dental}</div>
            </div>
          </div>
        )}

        {role === "paciente" && caso.estudiantes && (
          <div style={s.modalSection}>
            <div style={s.modalLabel}>Estudiante asignado</div>
            <div style={s.patientCard}>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{caso.estudiantes.nombre}</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>{caso.estudiantes.universidad}</div>
              {caso.estudiantes.rating > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                  <IconStar /> <span style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b" }}>{caso.estudiantes.rating}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={s.modalFooter}>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>Publicado el {fecha}</span>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CasosPage() {
  const navigate         = useNavigate();
  const user             = getUser();
  const role             = user?.role;
  const [casos,    setCasos]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    casosService.listar()
      .then(setCasos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = casos.filter(c =>
    c.titulo.toLowerCase().includes(search.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    (c.tipo_tratamiento ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const titulo  = role === "paciente" ? "Mis casos clínicos" : "Casos disponibles";
  const icono   = role === "paciente" ? "🦷" : "🔍";
  const vacioMsg = role === "paciente"
    ? "Todavía no publicaste ningún caso. ¡Publicá uno para encontrar un estudiante!"
    : "No hay casos abiertos disponibles por el momento.";

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.pageHeader}>
          <div style={s.pageTitleRow}>
            <button style={s.backBtn} onClick={() => navigate("/home")}>
              <IconBack /> Inicio
            </button>
          </div>
          <div style={s.pageTitleBlock}>
            <div style={s.pageIcon}>{icono}</div>
            <div>
              <h1 style={s.pageTitle}>{titulo}</h1>
              <p style={s.pageSub}>
                {role === "paciente"
                  ? "Publicá un caso para que estudiantes puedan ayudarte"
                  : "Explorá los casos abiertos y ofrecé tu ayuda"}
              </p>
            </div>
          </div>

          <div style={s.headerActions}>
            {/* Buscador */}
            <div style={s.searchWrap}>
              <span style={s.searchIcon}><IconSearch /></span>
              <input
                style={s.searchInput}
                placeholder="Buscar por título o tratamiento..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Botón crear — solo pacientes */}
            {role === "paciente" && (
              <button style={s.createBtn} onClick={() => navigate("/casos/nuevo")}>
                <IconPlus /> Nuevo caso
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div style={s.center}><div style={s.spinner} /><p style={s.loadingText}>Cargando casos...</p></div>
        ) : error ? (
          <div style={s.errorBox}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>{icono}</div>
            <p style={s.emptyText}>{search ? "Sin resultados para tu búsqueda." : vacioMsg}</p>
            {role === "paciente" && !search && (
              <button style={s.createBtnLarge} onClick={() => navigate("/casos/nuevo")}>
                <IconPlus /> Publicar mi primer caso
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={s.count}>{filtered.length} caso{filtered.length !== 1 ? "s" : ""}</div>
            <div style={s.grid}>
              {filtered.map(caso => (
                <CasoCard key={caso.id} caso={caso} role={role} onClick={() => setSelected(caso)} />
              ))}
            </div>
          </>
        )}

      </div>

      {/* Modal de detalle */}
      {selected && <CasoDetail caso={selected} role={role} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = {
  page:          { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc 0%,#eff6ff 55%,#fff7ed 100%)", padding: "36px 20px 60px", fontFamily: "'Inter',sans-serif" },
  container:     { maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },

  pageHeader:    { background: "#fff", borderRadius: "24px", padding: "28px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "16px" },
  pageTitleRow:  { display: "flex", alignItems: "center" },
  backBtn:       { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  pageTitleBlock:{ display: "flex", alignItems: "center", gap: "14px" },
  pageIcon:      { fontSize: "36px" },
  pageTitle:     { fontSize: "26px", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  pageSub:       { fontSize: "14px", color: "#64748b", margin: "3px 0 0" },
  headerActions: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  searchWrap:    { flex: 1, minWidth: "200px", position: "relative" },
  searchIcon:    { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  searchInput:   { width: "100%", height: "44px", border: "2px solid #e2e8f0", borderRadius: "12px", padding: "0 16px 0 42px", fontSize: "14px", fontFamily: "'Inter',sans-serif", outline: "none", boxSizing: "border-box", color: "#0f172a" },
  createBtn:     { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" },

  count:         { fontSize: "13px", color: "#94a3b8", fontWeight: 600 },
  grid:          { display: "flex", flexDirection: "column", gap: "14px" },

  card:          { background: "#fff", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", cursor: "pointer", border: "2px solid transparent", transition: "all .2s ease" },
  cardTop:       { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  cardIconWrap:  { width: "40px", height: "40px", minWidth: "40px", borderRadius: "12px", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" },
  cardTitle:     { fontSize: "16px", fontWeight: 800, color: "#0f172a" },
  cardType:      { fontSize: "12px", color: "#3b82f6", fontWeight: 600, background: "#eff6ff", padding: "2px 8px", borderRadius: "999px", display: "inline-block", marginTop: "4px" },
  cardDesc:      { fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: "0 0 14px" },
  cardFooter:    { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  cardDate:      { fontSize: "12px", color: "#94a3b8" },
  assignedPill:  { fontSize: "12px", color: "#10b981", fontWeight: 600, background: "#f0fdf4", padding: "2px 10px", borderRadius: "999px", border: "1px solid #bbf7d0" },
  patientInfo:   { fontSize: "12px", color: "#64748b", fontWeight: 500 },
  ratingPill:    { display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", fontWeight: 700, color: "#f59e0b" },
  viewMore:      { marginLeft: "auto", fontSize: "13px", color: "#3b82f6", fontWeight: 700 },

  center:        { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "60px 0" },
  spinner:       { width: "36px", height: "36px", border: "4px solid #bfdbfe", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin .8s linear infinite" },
  loadingText:   { color: "#64748b", fontSize: "14px" },
  errorBox:      { padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", color: "#dc2626", fontSize: "14px" },
  empty:         { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "60px 20px", textAlign: "center" },
  emptyIcon:     { fontSize: "56px" },
  emptyText:     { fontSize: "15px", color: "#64748b", maxWidth: "380px", lineHeight: "1.7" },
  createBtnLarge:{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 8px 20px rgba(59,130,246,0.3)" },

  // Modal
  overlay:       { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(4px)", padding: "20px" },
  modal:         { background: "#fff", borderRadius: "24px", padding: "36px", maxWidth: "560px", width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.2)" },
  modalHeader:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" },
  modalTitle:    { fontSize: "22px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" },
  closeBtn:      { background: "#f1f5f9", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "14px", color: "#64748b", flexShrink: 0 },
  modalDivider:  { height: "1px", background: "#f1f5f9", margin: "20px 0" },
  modalSection:  { marginBottom: "20px" },
  modalLabel:    { fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" },
  modalText:     { fontSize: "15px", color: "#374151", lineHeight: "1.7", margin: 0 },
  patientCard:   { background: "#f8fafc", borderRadius: "12px", padding: "14px 16px" },
  modalFooter:   { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" },
};
