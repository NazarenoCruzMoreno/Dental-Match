import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, asignacionesService } from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { RowSkeleton } from "../../components/Skeleton/Skeleton";
import FinalizarCasoModal from "./FinalizarCasoModal";

const IconBack  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>);
const IconTooth = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8 2 5 5 5 9c0 2.5.8 4.5 1.5 6.5L7 20c.3 1.2 1 2 2 2s1.5-.8 2-2l1-3 1 3c.5 1.2 1 2 2 2s1.7-.8 2-2l.5-4.5C18.2 13.5 19 11.5 19 9c0-4-3-7-7-7z"/></svg>);

const ESTADO = {
  abierto:     { label: "Abierto",      color: "#10b981", bg: "#f0fdf4" },
  en_progreso: { label: "En progreso",  color: "#3b82f6", bg: "#eff6ff" },
  completado:  { label: "Completado",   color: "#8b5cf6", bg: "#f5f3ff" },
  cancelado:   { label: "Cancelado",    color: "#94a3b8", bg: "#f8fafc" },
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO[estado] ?? ESTADO.abierto;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, color: cfg.color, background: cfg.bg, fontFamily: "'Inter',sans-serif" }}>
      {cfg.label}
    </span>
  );
}

// Modal de detalle de asignación
function AsignacionModal({ caso, onClose, onFinalizar }) {
  const pac = caso.pacientes;
  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.modal}>

        {/* Imagen del caso */}
        {caso.imagen_url ? (
          <div style={m.imgWrap}>
            <img src={caso.imagen_url} alt="Caso" style={m.img}/>
            <div style={m.imgGrad}/>
            <button style={m.closeBtn} onClick={onClose}>✕</button>
          </div>
        ) : (
          <div style={m.imgPlaceholder}>
            <span style={{ fontSize: "48px" }}>🦷</span>
            <button style={m.closeBtn} onClick={onClose}>✕</button>
          </div>
        )}

        <div style={m.body}>
          <div style={m.titleRow}>
            <h2 style={m.title}>{caso.titulo}</h2>
            <EstadoBadge estado={caso.estado} />
          </div>

          {caso.tipo_tratamiento && <span style={m.type}>{caso.tipo_tratamiento}</span>}

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
        </div>
      </div>
    </div>
  );
}

const m = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(4px)", padding: "20px" },
  modal:      { background: "#fff", borderRadius: "24px", maxWidth: "520px", width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.2)" },
  imgWrap:    { position: "relative", height: "200px", overflow: "hidden", borderRadius: "24px 24px 0 0" },
  img:        { width: "100%", height: "100%", objectFit: "cover" },
  imgGrad:    { position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.25))" },
  imgPlaceholder: { height: "140px", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "24px 24px 0 0", position: "relative" },
  closeBtn:   { position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", cursor: "pointer", fontSize: "14px" },
  body:       { padding: "24px 28px 28px" },
  titleRow:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" },
  title:      { fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: 0, fontFamily: "'Inter',sans-serif" },
  type:       { display: "inline-block", fontSize: "12px", color: "#3b82f6", background: "#eff6ff", padding: "3px 10px", borderRadius: "999px", fontWeight: 600, marginBottom: "16px" },
  patCard:    { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#f8fafc", borderRadius: "12px", marginBottom: "16px" },
  patAvatar:  { width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, flexShrink: 0 },
  patName:    { fontWeight: 700, color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  patSub:     { fontSize: "13px", color: "#64748b" },
  section:    { marginBottom: "16px" },
  sLabel:     { fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
  sText:      { fontSize: "14px", color: "#374151", lineHeight: "1.7", margin: 0, fontFamily: "'Inter',sans-serif" },
  footer:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" },
  date:       { fontSize: "12px", color: "#94a3b8" },
  closeAct:   { padding: "10px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  finalizarBtn:{ padding: "10px 18px", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 4px 12px rgba(16,185,129,0.35)" },
  diagBox:    { marginTop: "16px", padding: "14px 16px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "12px" },
  diagLabel:  { fontSize: "11px", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" },
  diagText:   { fontSize: "13px", color: "#1e293b", lineHeight: "1.5", margin: 0 },
  tratamientoChip:{ display: "inline-block", marginTop: "8px", padding: "4px 12px", background: "#fff", color: "#7c3aed", borderRadius: "999px", fontSize: "12px", fontWeight: 700, border: "1px solid #ddd6fe" },
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
              { label: "Total",       value: stats.total,       color: "#3b82f6" },
              { label: "En curso",    value: stats.en_progreso, color: "#f59e0b" },
              { label: "Completados", value: stats.completado,  color: "#10b981" },
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
              {f === "todos" ? "Todos" : ESTADO[f]?.label ?? f}
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
              <div key={caso.id} style={pg.card} onClick={() => setSelected(caso)}>
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
                    <EstadoBadge estado={caso.estado} />
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
  page:        { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc 0%,#eff6ff 55%,#fff7ed 100%)", padding: "36px 20px 60px", fontFamily: "'Inter',sans-serif" },
  container:   { maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },
  header:      { background: "#fff", borderRadius: "24px", padding: "28px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "16px" },
  backBtn:     { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'Inter',sans-serif", width: "fit-content" },
  titleRow:    { display: "flex", alignItems: "center", gap: "14px" },
  icon:        { fontSize: "32px" },
  title:       { fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  sub:         { fontSize: "14px", color: "#64748b", margin: "3px 0 0" },
  statsRow:    { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" },
  statCard:    { background: "#f8fafc", borderRadius: "14px", padding: "16px", textAlign: "center" },
  statNum:     { fontSize: "28px", fontWeight: 900, lineHeight: 1 },
  statLabel:   { fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "4px" },
  filterRow:   { display: "flex", gap: "8px", flexWrap: "wrap" },
  filterBtn:   { padding: "7px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#64748b", fontFamily: "'Inter',sans-serif" },
  filterActive:{ background: "#2563eb", color: "#fff", border: "1px solid #2563eb" },
  list:        { display: "flex", flexDirection: "column", gap: "12px" },
  card:        { background: "#fff", borderRadius: "18px", padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: "16px", alignItems: "center", cursor: "pointer", border: "1px solid #f1f5f9", transition: "all .2s" },
  cardImg:     { width: "72px", height: "72px", minWidth: "72px", borderRadius: "12px", overflow: "hidden" },
  img:         { width: "100%", height: "100%", objectFit: "cover" },
  imgPlaceholder:{ width: "100%", height: "100%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" },
  cardBody:    { flex: 1, display: "flex", flexDirection: "column", gap: "6px", overflow: "hidden" },
  cardTop:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" },
  cardTitle:   { fontWeight: 800, fontSize: "15px", color: "#0f172a", fontFamily: "'Inter',sans-serif" },
  type:        { fontSize: "11px", color: "#3b82f6", background: "#eff6ff", padding: "2px 8px", borderRadius: "999px", fontWeight: 600, width: "fit-content" },
  cardDesc:    { fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.5" },
  patRow:      { display: "flex", alignItems: "center", gap: "6px" },
  patMini:     { width: "20px", height: "20px", borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, flexShrink: 0 },
  patName:     { fontSize: "12px", color: "#94a3b8", fontWeight: 500 },
  arrow:       { color: "#cbd5e1", fontSize: "18px", flexShrink: 0 },
  center:      { display: "flex", justifyContent: "center", padding: "60px 0" },
  spinner:     { width: "36px", height: "36px", border: "4px solid #bfdbfe", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin .8s linear infinite" },
  empty:       { textAlign: "center", padding: "60px 20px" },
  emptyTitle:  { fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" },
  emptyText:   { fontSize: "14px", color: "#64748b", marginBottom: "20px" },
  cta:         { padding: "12px 24px", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
};
