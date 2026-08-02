import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { casosService, getUser } from "../../services/api";
import { GridSkeleton } from "../../components/Skeleton/Skeleton";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import Modal from "../../components/Modal/Modal";

// ── Iconos ────────────────────────────────────────────────────────────────────
const IconPlus   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const IconBack   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>);
const IconTooth  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8 2 5 5 5 9c0 2.5.8 4.5 1.5 6.5L7 20c.3 1.2 1 2 2 2s1.5-.8 2-2l1-3 1 3c.5 1.2 1 2 2 2s1.7-.8 2-2l.5-4.5C18.2 13.5 19 11.5 19 9c0-4-3-7-7-7z"/></svg>);
const IconStar   = () => (<svg width="14" height="14" viewBox="0 0 24 24" style={{ fill: "var(--color-warning)", stroke: "var(--color-warning)" }} strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IconSearch = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);

// ── Tarjeta de caso ───────────────────────────────────────────────────────────
function CasoCard({ caso, role, onClick }) {
  const fecha = new Date(caso.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={s.card} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}>
      <div style={s.cardTop}>
        <div style={s.cardIconWrap}><IconTooth /></div>
        <div style={{ flex: 1 }}>
          <div style={s.cardTitle}>{caso.titulo}</div>
          {caso.tipo_tratamiento && <div style={s.cardType}>{caso.tipo_tratamiento}</div>}
        </div>
        <StatusBadge estado={caso.estado} />
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

// ── Detalle de caso (modal) ──────────────────────────────────────────────────
// Nota: esta vista difiere de CasoModal (Marketplace) — acá se muestra tanto
// la perspectiva del paciente (estudiante asignado) como la del estudiante
// (datos del paciente), y no hay acción de "aplicar". Por eso conserva su
// propio contenido, pero usa el <Modal> compartido en vez de un overlay a mano.
function CasoDetail({ caso, role, onClose }) {
  const fecha = new Date(caso.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <Modal open onClose={onClose} title={caso.titulo} maxWidth="560px">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px" }}>
        <StatusBadge estado={caso.estado} />
        {caso.tipo_tratamiento && <span style={s.cardType}>{caso.tipo_tratamiento}</span>}
      </div>

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
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{caso.pacientes.nombre}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{caso.pacientes.edad} años · {caso.pacientes.problema_dental}</div>
          </div>
        </div>
      )}

      {role === "paciente" && caso.estudiantes && (
        <div style={s.modalSection}>
          <div style={s.modalLabel}>Estudiante asignado</div>
          <div style={s.patientCard}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{caso.estudiantes.nombre}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{caso.estudiantes.universidad}</div>
            {caso.estudiantes.rating > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <IconStar /> <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning)" }}>{caso.estudiantes.rating}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={s.modalFooter}>
        <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>Publicado el {fecha}</span>
      </div>
    </Modal>
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
              <label htmlFor="casos-search" style={s.srOnly}>Buscar casos</label>
              <span style={s.searchIcon}><IconSearch /></span>
              <input
                id="casos-search"
                style={s.searchInput}
                placeholder="Buscar por título o tratamiento..."
                aria-label="Buscar casos"
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
          <GridSkeleton count={4} type="row" />
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
  page:          { minHeight: "100vh", background: "var(--bg-page)", padding: "36px 20px 60px" },
  container:     { maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },

  pageHeader:    { background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "28px 32px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "16px" },
  pageTitleRow:  { display: "flex", alignItems: "center" },
  backBtn:       { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--color-primary)", fontWeight: 600, fontSize: "14px", cursor: "pointer" },
  pageTitleBlock:{ display: "flex", alignItems: "center", gap: "14px" },
  pageIcon:      { fontSize: "36px" },
  pageTitle:     { fontSize: "26px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" },
  pageSub:       { fontSize: "14px", color: "var(--text-secondary)", margin: "3px 0 0" },
  headerActions: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  srOnly:        { position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 },
  searchWrap:    { flex: 1, minWidth: "200px", position: "relative" },
  searchIcon:    { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" },
  searchInput:   { width: "100%", height: "44px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0 16px 0 42px", fontSize: "14px", outline: "none", boxSizing: "border-box", color: "var(--text-primary)", background: "var(--bg-input)" },
  createBtn:     { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },

  count:         { fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 600 },
  grid:          { display: "flex", flexDirection: "column", gap: "14px" },

  card:          { background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "24px 28px", boxShadow: "var(--shadow-sm)", cursor: "pointer", border: "1px solid var(--border)", transition: "border-color .15s ease, box-shadow .15s ease" },
  cardTop:       { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  cardIconWrap:  { width: "40px", height: "40px", minWidth: "40px", borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" },
  cardTitle:     { fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" },
  cardType:      { fontSize: "12px", color: "var(--color-primary)", fontWeight: 600, background: "var(--color-info-bg)", padding: "2px 8px", borderRadius: "var(--radius-full)", display: "inline-block", marginTop: "4px" },
  cardDesc:      { fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 14px" },
  cardFooter:    { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  cardDate:      { fontSize: "12px", color: "var(--text-tertiary)" },
  assignedPill:  { fontSize: "12px", color: "var(--color-success)", fontWeight: 600, background: "var(--color-success-bg)", padding: "2px 10px", borderRadius: "var(--radius-full)" },
  patientInfo:   { fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 },
  ratingPill:    { display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", fontWeight: 700, color: "var(--color-warning)" },
  viewMore:      { marginLeft: "auto", fontSize: "13px", color: "var(--color-primary)", fontWeight: 700 },

  errorBox:      { padding: "16px", background: "var(--color-danger-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--color-danger)", fontSize: "14px" },
  empty:         { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "60px 20px", textAlign: "center" },
  emptyIcon:     { fontSize: "56px" },
  emptyText:     { fontSize: "15px", color: "var(--text-secondary)", maxWidth: "380px", lineHeight: "1.7" },
  createBtnLarge:{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: "15px", fontWeight: 700, cursor: "pointer" },

  // Modal (contenido interno de CasoDetail, el wrapper ahora es el <Modal> compartido)
  modalSection:  { marginBottom: "20px" },
  modalLabel:    { fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" },
  modalText:     { fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.7", margin: 0 },
  patientCard:   { background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "14px 16px" },
  modalFooter:   { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" },
};
