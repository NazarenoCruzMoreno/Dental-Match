import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, turnosService, casosService } from "../../services/api";

const DIAS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADO_CFG = {
  pendiente:   { label: "Pendiente",    color: "#f59e0b", bg: "#fff7ed", border: "#fed7aa" },
  confirmado:  { label: "Confirmado",   color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
  completado:  { label: "Completado",   color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  cancelado:   { label: "Cancelado",    color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
};

function Badge({ estado }) {
  const c = ESTADO_CFG[estado] ?? ESTADO_CFG.pendiente;
  return <span style={{ padding:"3px 10px", borderRadius:"999px", fontSize:"12px", fontWeight:700, color:c.color, background:c.bg, border:`1px solid ${c.border}` }}>{c.label}</span>;
}

const fmtFecha = (f) => {
  const d = new Date(f + "T12:00:00");
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
};

const esPasado = (fecha, hora) => new Date(`${fecha}T${hora}`) < new Date();

// ── Modal para reservar turno (paciente) ──────────────────────────────────────
function ReservarModal({ caso, onClose, onCreated }) {
  const [fecha,  setFecha]  = useState("");
  const [hora,   setHora]   = useState("");
  const [notas,  setNotas]  = useState("");
  const [slots,  setSlots]  = useState([]);
  const [loading,setLoading]= useState(false);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const cargarSlots = async (f) => {
    if (!f || !caso.estudiante_id) return;
    setLoading(true);
    try {
      const data = await turnosService.disponibilidad(caso.estudiante_id, f);
      setSlots(Array.isArray(data) ? data : []);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  };

  const handleFecha = (f) => { setFecha(f); setHora(""); cargarSlots(f); };

  const handleGuardar = async () => {
    if (!fecha || !hora) { setErr("Elegí fecha y horario"); return; }
    setSaving(true); setErr("");
    try {
      await turnosService.reservar({ caso_id: caso.id, fecha, hora, notas: notas || undefined });
      onCreated();
    } catch (e) { setErr(e.message); setSaving(false); }
  };

  // Fecha mínima = hoy
  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={mo.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={mo.modal}>
        <div style={mo.header}>
          <div>
            <h2 style={mo.title}>Reservar turno</h2>
            <p style={mo.sub}>{caso.titulo}</p>
          </div>
          <button style={mo.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={mo.divider}/>

        {err && <div style={mo.errBox}>{err}</div>}

        {/* Fecha */}
        <div style={mo.field}>
          <label style={mo.label}>Fecha</label>
          <input type="date" min={today} value={fecha} onChange={e => handleFecha(e.target.value)} style={mo.input}/>
        </div>

        {/* Slots de horario */}
        {fecha && (
          <div style={mo.field}>
            <label style={mo.label}>Horario disponible</label>
            {loading ? (
              <p style={mo.loadTxt}>Cargando horarios...</p>
            ) : (
              <div style={mo.slotGrid}>
                {slots.map(s => (
                  <button key={s.hora} disabled={!s.disponible} onClick={() => setHora(s.hora)}
                    style={{ ...mo.slot, ...(hora === s.hora ? mo.slotActive : {}), ...(!s.disponible ? mo.slotOcupado : {}) }}>
                    {s.hora}
                    {!s.disponible && <div style={mo.slotLabel}>Ocupado</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notas */}
        <div style={mo.field}>
          <label style={mo.label}>Notas adicionales (opcional)</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)}
            placeholder="Indicaciones especiales, dirección, etc." rows={3} style={mo.textarea}/>
        </div>

        <div style={mo.actions}>
          <button style={mo.cancelBtn} onClick={onClose}>Cancelar</button>
          <button style={mo.confirmBtn} disabled={saving || !fecha || !hora} onClick={handleGuardar}>
            {saving ? "Reservando..." : "Confirmar turno"}
          </button>
        </div>
      </div>
    </div>
  );
}

const mo = {
  overlay:    { position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, backdropFilter:"blur(4px)", padding:"20px" },
  modal:      { background:"#fff", borderRadius:"24px", padding:"32px", maxWidth:"500px", width:"100%", maxHeight:"88vh", overflowY:"auto", boxShadow:"0 30px 80px rgba(0,0,0,0.2)" },
  header:     { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" },
  title:      { fontSize:"20px", fontWeight:900, color:"#0f172a", margin:0, fontFamily:"'Inter',sans-serif" },
  sub:        { fontSize:"13px", color:"#64748b", margin:"4px 0 0" },
  closeBtn:   { background:"#f1f5f9", border:"none", borderRadius:"8px", width:"32px", height:"32px", cursor:"pointer", color:"#64748b", flexShrink:0 },
  divider:    { height:"1px", background:"#f1f5f9", margin:"20px 0" },
  field:      { marginBottom:"18px" },
  label:      { fontSize:"13px", fontWeight:700, color:"#1e293b", display:"block", marginBottom:"8px", fontFamily:"'Inter',sans-serif" },
  input:      { width:"100%", height:"46px", border:"2px solid #e2e8f0", borderRadius:"12px", padding:"0 16px", fontSize:"15px", fontFamily:"'Inter',sans-serif", outline:"none", boxSizing:"border-box" },
  loadTxt:    { fontSize:"13px", color:"#94a3b8", fontFamily:"'Inter',sans-serif" },
  slotGrid:   { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" },
  slot:       { padding:"10px 6px", border:"2px solid #e2e8f0", borderRadius:"10px", background:"#fff", fontSize:"14px", fontWeight:700, cursor:"pointer", color:"#0f172a", fontFamily:"'Inter',sans-serif", transition:"all .15s", position:"relative" },
  slotActive: { border:"2px solid #2563eb", background:"#eff6ff", color:"#2563eb" },
  slotOcupado:{ background:"#f8fafc", color:"#cbd5e1", cursor:"not-allowed", border:"2px solid #f1f5f9" },
  slotLabel:  { fontSize:"9px", color:"#94a3b8", display:"block", marginTop:"2px" },
  textarea:   { width:"100%", border:"2px solid #e2e8f0", borderRadius:"12px", padding:"12px 16px", fontSize:"14px", fontFamily:"'Inter',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" },
  errBox:     { padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"10px", color:"#dc2626", fontSize:"13px", marginBottom:"16px" },
  actions:    { display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"8px" },
  cancelBtn:  { padding:"11px 20px", background:"#f1f5f9", color:"#64748b", border:"none", borderRadius:"12px", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" },
  confirmBtn: { padding:"11px 24px", background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"#fff", border:"none", borderRadius:"12px", fontSize:"14px", fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:"0 4px 12px rgba(37,99,235,0.3)" },
};

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
        <div style={tc.hora}>{turno.hora}</div>
      </div>

      {/* Info */}
      <div style={tc.info}>
        <div style={tc.topRow}>
          <div style={tc.casoTitle}>{turno.casos?.titulo ?? "Turno"}</div>
          <Badge estado={turno.estado} />
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
        {role === "estudiante" && turno.estado === "pendiente" && !pasado && (
          <>
            <button style={tc.btnConfirm} disabled={loading} onClick={() => accion("confirmado")}>✓ Confirmar</button>
            <button style={tc.btnCancel}  disabled={loading} onClick={() => accion("cancelado")}>✕</button>
          </>
        )}
        {role === "estudiante" && turno.estado === "confirmado" && pasado && (
          <button style={tc.btnComplete} disabled={loading} onClick={() => accion("completado")}>✓ Completado</button>
        )}
        {turno.estado === "pendiente" && role === "paciente" && (
          <button style={tc.btnCancel} disabled={loading} onClick={() => accion("cancelado")}>Cancelar</button>
        )}
      </div>
    </div>
  );
}

const tc = {
  card:        { background:"#fff", borderRadius:"18px", padding:"18px 20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", gap:"16px", alignItems:"flex-start", border:"1px solid #f1f5f9", transition:"all .2s" },
  cardPasado:  { opacity:0.7 },
  dateCol:     { display:"flex", flexDirection:"column", alignItems:"center", minWidth:"52px", background:"linear-gradient(135deg,#eff6ff,#dbeafe)", borderRadius:"12px", padding:"10px 8px", textAlign:"center" },
  dia:         { fontSize:"24px", fontWeight:900, color:"#2563eb", lineHeight:1 },
  mes:         { fontSize:"10px", fontWeight:700, color:"#64748b", marginTop:"2px", letterSpacing:"0.5px" },
  hora:        { fontSize:"13px", fontWeight:700, color:"#0f172a", marginTop:"6px", padding:"3px 6px", background:"#fff", borderRadius:"6px" },
  info:        { flex:1, display:"flex", flexDirection:"column", gap:"6px" },
  topRow:      { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"8px" },
  casoTitle:   { fontWeight:800, fontSize:"15px", color:"#0f172a", fontFamily:"'Inter',sans-serif" },
  type:        { fontSize:"11px", color:"#3b82f6", background:"#eff6ff", padding:"2px 8px", borderRadius:"999px", fontWeight:600, width:"fit-content" },
  personRow:   { display:"flex", alignItems:"center", gap:"8px" },
  personAvatar:{ width:"22px", height:"22px", borderRadius:"50%", background:"#3b82f6", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:800, flexShrink:0 },
  personName:  { fontSize:"13px", color:"#64748b", fontFamily:"'Inter',sans-serif" },
  notas:       { fontSize:"12px", color:"#94a3b8", margin:0, lineHeight:"1.4" },
  vencido:     { fontSize:"12px", color:"#f59e0b", margin:0, fontWeight:600 },
  actions:     { display:"flex", flexDirection:"column", gap:"6px", flexShrink:0 },
  btnConfirm:  { padding:"8px 14px", background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", border:"none", borderRadius:"8px", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif" },
  btnComplete: { padding:"8px 14px", background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", color:"#fff", border:"none", borderRadius:"8px", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif" },
  btnCancel:   { padding:"8px 14px", background:"#fef2f2", color:"#ef4444", border:"1px solid #fecaca", borderRadius:"8px", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif" },
};

// ── Página principal ──────────────────────────────────────────────────────────
export default function TurnosPage() {
  const navigate     = useNavigate();
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

  const handleAccion = async (turnoId, estado) => {
    try { await turnosService.actualizar(turnoId, { estado }); }
    catch {}
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
              { k:"total",      label:"Total",      color:"#3b82f6" },
              { k:"confirmado", label:"Confirmados", color:"#10b981" },
              { k:"pendiente",  label:"Pendientes",  color:"#f59e0b" },
              { k:"completado", label:"Completados", color:"#8b5cf6" },
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
              {f === "todos" ? "Todos" : ESTADO_CFG[f]?.label ?? f}
            </button>
          ))}
        </div>

        {/* Turnos */}
        {loading ? (
          <div style={pg.center}><div style={pg.spinner}/></div>
        ) : filtrados.length === 0 ? (
          <div style={pg.empty}>
            <div style={{ fontSize:"52px", marginBottom:"12px" }}>📅</div>
            <h3 style={pg.emptyTitle}>
              {filter === "todos" ? "No tenés turnos agendados" : `Sin turnos ${ESTADO_CFG[filter]?.label?.toLowerCase() ?? filter}`}
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
        <ReservarModal
          caso={modal}
          onClose={() => setModal(null)}
          onCreated={() => { setModal(null); setRefresh(r => r + 1); }}
        />
      )}
    </div>
  );
}

const pg = {
  page:        { minHeight:"100vh", background:"linear-gradient(135deg,#f8fafc 0%,#eff6ff 55%,#fff7ed 100%)", padding:"36px 20px 60px", fontFamily:"'Inter',sans-serif" },
  container:   { maxWidth:"760px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"20px" },
  header:      { background:"#fff", borderRadius:"24px", padding:"28px 32px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", gap:"16px" },
  backBtn:     { display:"flex", alignItems:"center", gap:"6px", background:"none", border:"none", color:"#3b82f6", fontWeight:600, fontSize:"14px", cursor:"pointer", fontFamily:"'Inter',sans-serif", width:"fit-content" },
  titleRow:    { display:"flex", alignItems:"center", gap:"14px" },
  icon:        { fontSize:"32px" },
  title:       { fontSize:"24px", fontWeight:900, color:"#0f172a", margin:0, letterSpacing:"-0.5px" },
  sub:         { fontSize:"14px", color:"#64748b", margin:"3px 0 0" },
  statsRow:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" },
  statCard:    { background:"#f8fafc", borderRadius:"12px", padding:"14px", textAlign:"center" },
  statNum:     { fontSize:"24px", fontWeight:900, lineHeight:1 },
  statLabel:   { fontSize:"11px", color:"#64748b", fontWeight:600, marginTop:"4px" },
  reserveBox:  { background:"linear-gradient(135deg,#eff6ff,#dbeafe)", borderRadius:"20px", padding:"20px 24px", border:"1px solid #bfdbfe" },
  reserveText: { marginBottom:"12px" },
  reserveTitle:{ fontWeight:800, fontSize:"15px", color:"#0f172a" },
  reserveSub:  { fontSize:"13px", color:"#64748b", marginTop:"2px" },
  casosList:   { display:"flex", gap:"10px", flexWrap:"wrap" },
  casoBtn:     { padding:"9px 16px", background:"#fff", border:"1px solid #bfdbfe", borderRadius:"10px", fontSize:"13px", fontWeight:700, cursor:"pointer", color:"#2563eb", fontFamily:"'Inter',sans-serif", boxShadow:"0 2px 8px rgba(37,99,235,0.1)" },
  filterRow:   { display:"flex", gap:"8px", flexWrap:"wrap" },
  filterBtn:   { padding:"7px 16px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:"999px", fontSize:"13px", fontWeight:600, cursor:"pointer", color:"#64748b", fontFamily:"'Inter',sans-serif" },
  filterActive:{ background:"#2563eb", color:"#fff", border:"1px solid #2563eb" },
  secTitle:    { fontSize:"13px", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"10px" },
  list:        { display:"flex", flexDirection:"column", gap:"10px", marginBottom:"24px" },
  center:      { display:"flex", justifyContent:"center", padding:"60px 0" },
  spinner:     { width:"36px", height:"36px", border:"4px solid #bfdbfe", borderTop:"4px solid #3b82f6", borderRadius:"50%", animation:"spin .8s linear infinite" },
  empty:       { textAlign:"center", padding:"60px 20px" },
  emptyTitle:  { fontSize:"20px", fontWeight:800, color:"#0f172a", margin:"0 0 8px" },
  emptySub:    { fontSize:"14px", color:"#64748b" },
};
