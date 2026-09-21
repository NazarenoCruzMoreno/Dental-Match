import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, turnosService, casosService } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { RowSkeleton } from "../../components/Skeleton/Skeleton";
import StatusBadge, { ESTADOS } from "../../components/StatusBadge/StatusBadge";
import AgendarTurnoModal from "../../components/AgendarTurnoModal/AgendarTurnoModal";

const DIAS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const fmtFecha = (f) => {
  const d = new Date(f + "T12:00:00");
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
};

const esPasado = (fecha, hora) => new Date(`${fecha}T${hora}`) < new Date();

// ── Card de turno ─────────────────────────────────────────────────────────────
function TurnoCard({ turno, role, onAccion }) {
  const [loading, setLoading] = useState(false);
  const pasado = esPasado(turno.fecha, turno.hora);

  const accion = async (estado) => {
    setLoading(true);
    try { await onAccion(turno.id, estado); }
    finally { setLoading(false); }
  };

  const otra = role === "estudiante" ? turno.pacientes : turno.estudiantes;
  const otraLabel = role === "estudiante" ? "Paciente" : "Estudiante";

  return (
    <div style={{ ...tc.card, ...(pasado && turno.estado !== "completado" ? tc.cardPasado : {}) }}>
      {/* Fecha y hora — columna izquierda */}
      <div style={tc.dateCol}>
        <div style={tc.dia}>{new Date(turno.fecha + "T12:00:00").getDate()}</div>
        <div style={tc.mes}>{MESES[new Date(turno.fecha + "T12:00:00").getMonth()].slice(0,3).toUpperCase()}</div>
        <div style={tc.hora}>{turno.hora.slice(0, 5)}</div>
      </div>

      {/* Info */}
      <div style={tc.info}>
        <div style={tc.topRow}>
          <div style={tc.casoTitle}>{turno.casos?.titulo ?? "Turno"}</div>
          <StatusBadge estado={turno.estado} />
        </div>
        {turno.casos?.tipo_tratamiento && <span style={tc.type}>{turno.casos.tipo_tratamiento}</span>}
        <div style={tc.personRow}>
          <div style={tc.personAvatar}>{otra?.nombre?.charAt(0) ?? "?"}</div>
          <span style={tc.personName}>{otraLabel}: <strong>{otra?.nombre ?? "-"}</strong></span>
        </div>
        {turno.notas && <p style={tc.notas}>📝 {turno.notas}</p>}
        {pasado && turno.estado === "confirmado" && (
          <p style={tc.vencido}>⚠️ Este turno ya pasó</p>
        )}
      </div>

      {/* Acciones */}
      <div style={tc.actions}>
        {/* Paciente recibe propuesta del estudiante */}
        {role === "paciente" && turno.estado === "propuesto" && !pasado && (
          <>
            <button style={tc.btnConfirm} disabled={loading} onClick={() => accion("confirmado")}>✓ Aceptar</button>
            <button style={tc.btnCancel}  disabled={loading} onClick={() => accion("rechazado")}>✕ Rechazar</button>
          </>
        )}
        {/* Estudiante confirma o cancela un turno reservado por paciente */}
        {role === "estudiante" && turno.estado === "pendiente" && !pasado && (
          <>
            <button style={tc.btnConfirm} disabled={loading} onClick={() => accion("confirmado")}>✓ Confirmar</button>
            <button style={tc.btnCancel}  disabled={loading} onClick={() => accion("cancelado")}>✕</button>
          </>
        )}
        {/* Estudiante marca como completado */}
        {role === "estudiante" && turno.estado === "confirmado" && pasado && (
          <button style={tc.btnComplete} disabled={loading} onClick={() => accion("completado")}>✓ Completado</button>
        )}
        {/* Paciente cancela su propio turno pendiente o confirmado */}
        {(turno.estado === "pendiente" || turno.estado === "confirmado") && role === "paciente" && (
          <button style={tc.btnCancel} disabled={loading} onClick={() => accion("cancelado")}>Cancelar</button>
        )}
        {/* Estudiante cancela un propuesto suyo */}
        {role === "estudiante" && turno.estado === "propuesto" && !pasado && (
          <button style={tc.btnCancel} disabled={loading} onClick={() => accion("cancelado")}>Cancelar</button>
        )}
      </div>
    </div>
  );
}

const tc = {
  card:        { background:"var(--bg-card)", borderRadius:"var(--radius-lg)", padding:"18px 20px", boxShadow:"var(--shadow-sm)", display:"flex", gap:"16px", alignItems:"flex-start", border:"1px solid var(--border)", transition:"all .2s" },
  cardPasado:  { opacity:0.7 },
  dateCol:     { display:"flex", flexDirection:"column", alignItems:"center", minWidth:"52px", background:"var(--color-info-bg)", borderRadius:"var(--radius-md)", padding:"10px 8px", textAlign:"center" },
  dia:         { fontSize:"24px", fontWeight:900, color:"var(--color-primary)", lineHeight:1 },
  mes:         { fontSize:"10px", fontWeight:700, color:"var(--text-secondary)", marginTop:"2px", letterSpacing:"0.5px" },
  hora:        { fontSize:"13px", fontWeight:700, color:"var(--text-primary)", marginTop:"6px", padding:"3px 6px", background:"var(--bg-card)", borderRadius:"6px" },
  info:        { flex:1, display:"flex", flexDirection:"column", gap:"6px" },
  topRow:      { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"8px" },
  casoTitle:   { fontWeight:800, fontSize:"15px", color:"var(--text-primary)" },
  type:        { fontSize:"11px", color:"var(--color-primary)", background:"var(--color-info-bg)", padding:"2px 8px", borderRadius:"var(--radius-full)", fontWeight:600, width:"fit-content" },
  personRow:   { display:"flex", alignItems:"center", gap:"8px" },
  personAvatar:{ width:"22px", height:"22px", borderRadius:"50%", background:"var(--color-primary)", color:"var(--color-primary-text)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:800, flexShrink:0 },
  personName:  { fontSize:"13px", color:"var(--text-secondary)" },
  notas:       { fontSize:"12px", color:"var(--text-tertiary)", margin:0, lineHeight:"1.4" },
  vencido:     { fontSize:"12px", color:"var(--color-warning)", margin:0, fontWeight:600 },
  actions:     { display:"flex", flexDirection:"column", gap:"6px", flexShrink:0 },
  btnConfirm:  { padding:"8px 14px", background:"var(--color-success)", color:"var(--color-primary-text)", border:"none", borderRadius:"var(--radius-sm)", fontSize:"12px", fontWeight:700, cursor:"pointer" },
  btnComplete: { padding:"8px 14px", background:"var(--color-purple)", color:"var(--color-primary-text)", border:"none", borderRadius:"var(--radius-sm)", fontSize:"12px", fontWeight:700, cursor:"pointer" },
  btnCancel:   { padding:"8px 14px", background:"var(--color-danger-bg)", color:"var(--color-danger)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:"12px", fontWeight:700, cursor:"pointer" },
};

// ── Página principal ──────────────────────────────────────────────────────────
export default function TurnosPage() {
  const navigate     = useNavigate();
  const toast        = useToast();
  const user         = getUser();
  const role         = user?.role;
  const [turnos,   setTurnos]   = useState([]);
  const [casos,    setCasos]    = useState([]);   // casos con estudiante asignado (para paciente)
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("todos");
  const [modal,    setModal]    = useState(null); // caso seleccionado para reservar
  const [refresh,  setRefresh]  = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      turnosService.listar(),
      role === "paciente" ? casosService.listar() : Promise.resolve([]),
    ])
      .then(([t, c]) => {
        setTurnos(Array.isArray(t) ? t : []);
        setCasos(Array.isArray(c) ? c.filter(x => x.estado === "en_progreso") : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refresh, role]);

  // Refrescar al volver del background — útil para turnos que cambian
  useAutoRefresh(() => setRefresh(r => r + 1));

  const handleAccion = async (turnoId, estado) => {
    const labels = { confirmado: "confirmado ✓", cancelado: "cancelado", completado: "marcado como completado 🎉" };
    try {
      await turnosService.actualizar(turnoId, { estado });
      toast.success(`Turno ${labels[estado] ?? "actualizado"}`);
    } catch (e) {
      toast.error(e.message || "No se pudo actualizar el turno");
    }
    setRefresh(r => r + 1);
  };

  const filtrados = filter === "todos"
    ? turnos
    : turnos.filter(t => t.estado === filter);

  // Separar próximos y pasados
  const proximos = filtrados.filter(t => !esPasado(t.fecha, t.hora) || t.estado === "pendiente");
  const pasados  = filtrados.filter(t =>  esPasado(t.fecha, t.hora) && t.estado !== "pendiente");

  const stats = {
    total:      turnos.length,
    confirmado: turnos.filter(t => t.estado === "confirmado").length,
    pendiente:  turnos.filter(t => t.estado === "pendiente").length,
    completado: turnos.filter(t => t.estado === "completado").length,
  };

  return (
    <div style={pg.page}>
      <div style={pg.container}>

        {/* Header */}
        <div style={pg.header}>
          <button style={pg.backBtn} onClick={() => navigate("/home")}><span>←</span> Inicio</button>
          <div style={pg.titleRow}>
            <div style={pg.icon}>📅</div>
            <div>
              <h1 style={pg.title}>
                {role === "estudiante" ? "Mis turnos" : "Mis turnos agendados"}
              </h1>
              <p style={pg.sub}>
                {role === "estudiante"
                  ? "Gestioná tus citas con pacientes"
                  : "Reservá y seguí tus citas con estudiantes"}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={pg.statsRow}>
            {[
              { k:"total",      label:"Total",      color:"var(--color-primary)" },
              { k:"confirmado", label:"Confirmados", color:"var(--color-success)" },
              { k:"pendiente",  label:"Pendientes",  color:"var(--color-warning)" },
              { k:"completado", label:"Completados", color:"var(--color-purple)" },
            ].map(s => (
              <div key={s.k} style={pg.statCard}>
                <div style={{ ...pg.statNum, color:s.color }}>{stats[s.k]}</div>
                <div style={pg.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservar turno — solo pacientes con casos asignados */}
        {role === "paciente" && casos.length > 0 && (
          <div style={pg.reserveBox}>
            <div style={pg.reserveText}>
              <div style={pg.reserveTitle}>📅 Agendá un turno</div>
              <div style={pg.reserveSub}>Tenés {casos.length} caso{casos.length > 1 ? "s" : ""} con estudiante asignado</div>
            </div>
            <div style={pg.casosList}>
              {casos.map(c => (
                <button key={c.id} style={pg.casoBtn} onClick={() => setModal(c)}>
                  🦷 {c.titulo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={pg.filterRow}>
          {["todos","pendiente","confirmado","completado","cancelado"].map(f => (
            <button key={f} style={{ ...pg.filterBtn, ...(filter === f ? pg.filterActive : {}) }}
              onClick={() => setFilter(f)}>
              {f === "todos" ? "Todos" : ESTADOS[f]?.label ?? f}
            </button>
          ))}
        </div>

        {/* Turnos */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <RowSkeleton/><RowSkeleton/><RowSkeleton/>
          </div>
        ) : filtrados.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize:"52px", marginBottom:"12px" }}>📅</div>
            <h3 style={pg.emptyTitle}>
              {filter === "todos" ? "No tenés turnos agendados" : `Sin turnos ${ESTADOS[filter]?.label?.toLowerCase() ?? filter}`}
            </h3>
            <p style={pg.emptySub}>
              {role === "paciente" && filter === "todos"
                ? "Una vez que hagas match con un estudiante, podrás agendar tu primer turno."
                : "Cambiá el filtro para ver otros estados."}
            </p>
          </div>
        ) : (
          <>
            {proximos.length > 0 && (
              <div>
                <div style={pg.secTitle}>Próximos</div>
                <div style={pg.list}>
                  {proximos.map(t => <TurnoCard key={t.id} turno={t} role={role} onAccion={handleAccion}/>)}
                </div>
              </div>
            )}
            {pasados.length > 0 && (
              <div>
                <div style={pg.secTitle}>Historial</div>
                <div style={pg.list}>
                  {pasados.map(t => <TurnoCard key={t.id} turno={t} role={role} onAccion={handleAccion}/>)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal reservar turno */}
      {modal && (
        <AgendarTurnoModal
          open
          caso={modal}
          mode="reservar"
          onClose={() => setModal(null)}
          onSubmit={({ fecha, hora, notas }) => turnosService.reservar({ caso_id: modal.id, fecha, hora, notas })}
          onSuccess={() => { setModal(null); setRefresh(r => r + 1); }}
        />
      )}
    </div>
  );
}

const pg = {
  page:        { minHeight:"100vh", background:"var(--bg-page)", padding:"36px 20px 60px" },
  container:   { maxWidth:"760px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"20px" },
  header:      { background:"var(--bg-card)", borderRadius:"var(--radius-lg)", padding:"28px 32px", boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column", gap:"16px" },
  backBtn:     { display:"flex", alignItems:"center", gap:"6px", background:"none", border:"none", color:"var(--color-primary)", fontWeight:600, fontSize:"14px", cursor:"pointer", width:"fit-content" },
  titleRow:    { display:"flex", alignItems:"center", gap:"14px" },
  icon:        { fontSize:"32px" },
  title:       { fontSize:"24px", fontWeight:900, color:"var(--text-primary)", margin:0, letterSpacing:"-0.5px" },
  sub:         { fontSize:"14px", color:"var(--text-secondary)", margin:"3px 0 0" },
  statsRow:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" },
  statCard:    { background:"var(--bg-subtle)", borderRadius:"var(--radius-md)", padding:"14px", textAlign:"center" },
  statNum:     { fontSize:"24px", fontWeight:900, lineHeight:1 },
  statLabel:   { fontSize:"11px", color:"var(--text-secondary)", fontWeight:600, marginTop:"4px" },
  reserveBox:  { background:"var(--color-info-bg)", borderRadius:"var(--radius-lg)", padding:"20px 24px", border:"1px solid var(--border)" },
  reserveText: { marginBottom:"12px" },
  reserveTitle:{ fontWeight:800, fontSize:"15px", color:"var(--text-primary)" },
  reserveSub:  { fontSize:"13px", color:"var(--text-secondary)", marginTop:"2px" },
  casosList:   { display:"flex", gap:"10px", flexWrap:"wrap" },
  casoBtn:     { padding:"9px 16px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:"13px", fontWeight:700, cursor:"pointer", color:"var(--color-primary)", boxShadow:"var(--shadow-sm)" },
  filterRow:   { display:"flex", gap:"8px", flexWrap:"wrap" },
  filterBtn:   { padding:"7px 16px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-full)", fontSize:"13px", fontWeight:600, cursor:"pointer", color:"var(--text-secondary)" },
  filterActive:{ background:"var(--color-primary)", color:"var(--color-primary-text)", border:"1px solid var(--color-primary)" },
  secTitle:    { fontSize:"13px", fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"10px" },
  list:        { display:"flex", flexDirection:"column", gap:"10px", marginBottom:"24px" },
  center:      { display:"flex", justifyContent:"center", padding:"60px 0" },
  spinner:     { width:"36px", height:"36px", border:"4px solid var(--border)", borderTop:"4px solid var(--color-primary)", borderRadius:"50%", animation:"spin .8s linear infinite" },
  empty:       { textAlign:"center", padding:"60px 20px" },
  emptyTitle:  { fontSize:"20px", fontWeight:800, color:"var(--text-primary)", margin:"0 0 8px" },
  emptySub:    { fontSize:"14px", color:"var(--text-secondary)" },
};
