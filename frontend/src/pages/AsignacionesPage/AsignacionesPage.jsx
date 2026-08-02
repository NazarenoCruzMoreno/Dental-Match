import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, asignacionesService } from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { RowSkeleton } from "../../components/Skeleton/Skeleton";
import StatusBadge, { ESTADOS } from "../../components/StatusBadge/StatusBadge";
import Modal from "../../components/Modal/Modal";
import FinalizarCasoModal from "./FinalizarCasoModal";

const IconBack  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>);
const IconTooth = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8 2 5 5 5 9c0 2.5.8 4.5 1.5 6.5L7 20c.3 1.2 1 2 2 2s1.5-.8 2-2l1-3 1 3c.5 1.2 1 2 2 2s1.7-.8 2-2l.5-4.5C18.2 13.5 19 11.5 19 9c0-4-3-7-7-7z"/></svg>);

// Modal de detalle de asignación
function AsignacionModal({ caso, onClose, onFinalizar }) {
  const pac = caso.pacientes;
  return (
    <Modal open onClose={onClose} title={caso.titulo} maxWidth="560px">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <StatusBadge estado={caso.estado} />
        {caso.tipo_tratamiento && <span style={m.type}>{caso.tipo_tratamiento}</span>}
      </div>

      {/* Imagen del caso */}
      {caso.imagen_url ? (
        <div style={m.imgWrap}>
          <img src={caso.imagen_url} alt="Caso" style={m.img}/>
        </div>
      ) : (
        <div style={m.imgPlaceholder}>
          <span style={{ fontSize: "40px" }}>🦷</span>
        </div>
      )}

      {/* Paciente */}
      {pac && (
        <div style={m.patCard}>
          <div style={m.patAvatar}>{pac.nombre?.charAt(0)}</div>
          <div>
            <div style={m.patName}>{pac.nombre}</div>
            <div style={m.patSub}>{pac.edad} años{pac.telefono ? ` · 📱 ${pac.telefono}` : ""}</div>
          </div>
        </div>
      )}

      <div style={m.section}>
        <div style={m.sLabel}>Descripción del caso</div>
        <p style={m.sText}>{caso.descripcion}</p>
      </div>

      {pac?.problema_dental && (
        <div style={m.section}>
          <div style={m.sLabel}>Problema dental registrado</div>
          <p style={m.sText}>{pac.problema_dental}</p>
        </div>
      )}

      {caso.notas && (
        <div style={m.section}>
          <div style={m.sLabel}>Notas del paciente</div>
          <p style={m.sText}>{caso.notas}</p>
        </div>
      )}

      <div style={m.footer}>
        <span style={m.date}>
          Asignado el {new Date(caso.updated_at).toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" })}
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          {caso.estado === "en_progreso" && (
            <button style={m.finalizarBtn} onClick={onFinalizar}>
              ✓ Finalizar caso
            </button>
          )}
          <button style={m.closeAct} onClick={onClose}>Cerrar</button>
        </div>
      </div>

      {/* Mostrar diagnóstico si ya está finalizado */}
      {caso.estado === "completado" && (caso.diagnostico || caso.tratamiento_asignado) && (
        <div style={m.diagBox}>
          <div style={m.diagLabel}>Diagnóstico final</div>
          {caso.diagnostico && <p style={m.diagText}>{caso.diagnostico}</p>}
          {caso.tratamiento_asignado && (
            <div style={m.tratamientoChip}>🦷 {caso.tratamiento_asignado}</div>
          )}
        </div>
      )}
    </Modal>
  );
}

const m = {
  type:       { display: "inline-block", fontSize: "12px", color: "var(--color-primary)", background: "var(--color-info-bg)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 600 },
  imgWrap:    { borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: "16px" },
  img:        { width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" },
  imgPlaceholder: { height: "120px", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-md)", marginBottom: "16px" },
  patCard:    { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", marginBottom: "16px" },
  patAvatar:  { width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-primary)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, flexShrink: 0 },
  patName:    { fontWeight: 700, color: "var(--text-primary)" },
  patSub:     { fontSize: "13px", color: "var(--text-secondary)" },
  section:    { marginBottom: "16px" },
  sLabel:     { fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
  sText:      { fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7", margin: 0 },
  footer:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" },
  date:       { fontSize: "12px", color: "var(--text-tertiary)" },
  closeAct:   { padding: "10px 20px", background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  finalizarBtn:{ padding: "10px 18px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-sm)" },
  diagBox:    { marginTop: "16px", padding: "14px 16px", background: "var(--color-purple-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" },
  diagLabel:  { fontSize: "11px", fontWeight: 700, color: "var(--color-purple)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
  diagText:   { fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5", margin: 0 },
  tratamientoChip:{ display: "inline-block", marginTop: "8px", padding: "4px 12px", background: "var(--bg-card)", color: "var(--color-purple)", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 700, border: "1px solid var(--border)" },
};

// ── Página principal ──────────────────────────────────────────────────────────
export default function AsignacionesPage() {
  const navigate     = useNavigate();
  const [casos,    setCasos]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [finalizando, setFinalizando] = useState(null);
  const [refresh,     setRefresh]     = useState(0);
  const [filter,   setFilter]   = useState("todos");

  const cargar = () => {
    asignacionesService.misAsignaciones()
      .then(d => setCasos(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, [refresh]);
  useAutoRefresh(cargar);

  const FILTROS = ["todos", "en_progreso", "completado", "abierto"];
  const filtered = filter === "todos" ? casos : casos.filter(c => c.estado === filter);

  const stats = {
    total:       casos.length,
    en_progreso: casos.filter(c => c.estado === "en_progreso").length,
    completado:  casos.filter(c => c.estado === "completado").length,
  };

  return (
    <div style={pg.page}>
      <div style={pg.container}>

        {/* Header */}
        <div style={pg.header}>
          <button style={pg.backBtn} onClick={() => navigate("/home")}><IconBack /> Inicio</button>
          <div style={pg.titleRow}>
            <div style={pg.icon}>📋</div>
            <div>
              <h1 style={pg.title}>Mis asignaciones</h1>
              <p style={pg.sub}>Casos que estás atendiendo como estudiante</p>
            </div>
          </div>

          {/* Stats */}
          <div style={pg.statsRow}>
            {[
              { label: "Total",       value: stats.total,       color: "var(--color-primary)" },
              { label: "En curso",    value: stats.en_progreso, color: "var(--color-warning)" },
              { label: "Completados", value: stats.completado,  color: "var(--color-success)" },
            ].map(s => (
              <div key={s.label} style={pg.statCard}>
                <div style={{ ...pg.statNum, color: s.color }}>{s.value}</div>
                <div style={pg.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div style={pg.filterRow}>
          {FILTROS.map(f => (
            <button key={f} style={{ ...pg.filterBtn, ...(filter === f ? pg.filterActive : {}) }}
              onClick={() => setFilter(f)}>
              {f === "todos" ? "Todos" : ESTADOS[f]?.label ?? f}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <RowSkeleton/><RowSkeleton/><RowSkeleton/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>📋</div>
            <h3 style={pg.emptyTitle}>
              {filter === "todos" ? "Todavía no tenés casos asignados" : "Sin casos en este estado"}
            </h3>
            <p style={pg.emptyText}>
              {filter === "todos"
                ? "Explorá los pacientes disponibles y aplicá a sus casos."
                : "Cambiá el filtro para ver otros estados."}
            </p>
            {filter === "todos" && (
              <button style={pg.cta} onClick={() => navigate("/marketplace")}>Ver pacientes</button>
            )}
          </div>
        ) : (
          <div style={pg.list}>
            {filtered.map(caso => (
              <div
                key={caso.id}
                style={pg.card}
                onClick={() => setSelected(caso)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(caso);
                  }
                }}
              >
                {/* Imagen miniatura */}
                <div style={pg.cardImg}>
                  {caso.imagen_url
                    ? <img src={caso.imagen_url} alt="" style={pg.img}/>
                    : <div style={pg.imgPlaceholder}><IconTooth /></div>}
                </div>

                {/* Info */}
                <div style={pg.cardBody}>
                  <div style={pg.cardTop}>
                    <div style={pg.cardTitle}>{caso.titulo}</div>
                    <StatusBadge estado={caso.estado} />
                  </div>
                  {caso.tipo_tratamiento && <span style={pg.type}>{caso.tipo_tratamiento}</span>}
                  <p style={pg.cardDesc}>{caso.descripcion.slice(0, 100)}…</p>
                  {caso.pacientes && (
                    <div style={pg.patRow}>
                      <div style={pg.patMini}>{caso.pacientes.nombre?.charAt(0)}</div>
                      <span style={pg.patName}>{caso.pacientes.nombre} · {caso.pacientes.edad} años</span>
                    </div>
                  )}
                </div>

                <div style={pg.arrow}>→</div>
              </div>
            ))}
          </div>
        )}

      </div>

      {selected && (
        <AsignacionModal
          caso={selected}
          onClose={() => setSelected(null)}
          onFinalizar={() => { setFinalizando(selected); setSelected(null); }}
        />
      )}
      {finalizando && (
        <FinalizarCasoModal
          caso={finalizando}
          onClose={() => setFinalizando(null)}
          onDone={() => setRefresh((r) => r + 1)}
        />
      )}
    </div>
  );
}

const pg = {
  page:        { minHeight: "100vh", background: "var(--bg-page)", padding: "36px 20px 60px" },
  container:   { maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },
  header:      { background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "28px 32px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "16px" },
  backBtn:     { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--color-primary)", fontWeight: 600, fontSize: "14px", cursor: "pointer", width: "fit-content" },
  titleRow:    { display: "flex", alignItems: "center", gap: "14px" },
  icon:        { fontSize: "32px" },
  title:       { fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" },
  sub:         { fontSize: "14px", color: "var(--text-secondary)", margin: "3px 0 0" },
  statsRow:    { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" },
  statCard:    { background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "16px", textAlign: "center" },
  statNum:     { fontSize: "28px", fontWeight: 900, lineHeight: 1 },
  statLabel:   { fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, marginTop: "4px" },
  filterRow:   { display: "flex", gap: "8px", flexWrap: "wrap" },
  filterBtn:   { padding: "7px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-full)", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)" },
  filterActive:{ background: "var(--color-primary)", color: "var(--color-primary-text)", border: "1px solid var(--color-primary)" },
  list:        { display: "flex", flexDirection: "column", gap: "12px" },
  card:        { background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "16px 20px", boxShadow: "var(--shadow-sm)", display: "flex", gap: "16px", alignItems: "center", cursor: "pointer", border: "1px solid var(--border)", transition: "border-color .15s ease, box-shadow .15s ease" },
  cardImg:     { width: "72px", height: "72px", minWidth: "72px", borderRadius: "var(--radius-md)", overflow: "hidden" },
  img:         { width: "100%", height: "100%", objectFit: "cover" },
  imgPlaceholder:{ width: "100%", height: "100%", background: "var(--color-info-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" },
  cardBody:    { flex: 1, display: "flex", flexDirection: "column", gap: "6px", overflow: "hidden" },
  cardTop:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" },
  cardTitle:   { fontWeight: 800, fontSize: "15px", color: "var(--text-primary)" },
  type:        { fontSize: "11px", color: "var(--color-primary)", background: "var(--color-info-bg)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 600, width: "fit-content" },
  cardDesc:    { fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" },
  patRow:      { display: "flex", alignItems: "center", gap: "6px" },
  patMini:     { width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-primary)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, flexShrink: 0 },
  patName:     { fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 },
  arrow:       { color: "var(--border-strong)", fontSize: "18px", flexShrink: 0 },
  center:      { display: "flex", justifyContent: "center", padding: "60px 0" },
  spinner:     { width: "36px", height: "36px", border: "4px solid var(--color-info-bg)", borderTop: "4px solid var(--color-primary)", borderRadius: "50%", animation: "spin .8s linear infinite" },
  empty:       { textAlign: "center", padding: "60px 20px" },
  emptyTitle:  { fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" },
  emptyText:   { fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" },
  cta:         { padding: "12px 24px", background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
};
