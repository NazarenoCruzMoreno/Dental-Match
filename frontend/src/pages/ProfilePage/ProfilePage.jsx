import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileService, getUser, clearAuth } from "../../services/api";

// ── Iconos ────────────────────────────────────────────────────────────────────
const IconUser    = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconMail    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const IconEdit    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IconLogout  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IconStar    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);

// ── Componente tarjeta de dato ────────────────────────────────────────────────
function DataRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={styles.dataRow}>
      <span style={styles.dataIcon}>{icon}</span>
      <div>
        <div style={styles.dataLabel}>{label}</div>
        <div style={styles.dataValue}>{value}</div>
      </div>
    </div>
  );
}

// ── Tags (materias / disponibilidad) ─────────────────────────────────────────
function TagList({ label, items, color = "#3b82f6" }) {
  if (!items?.length) return null;
  return (
    <div style={styles.tagSection}>
      <div style={styles.dataLabel}>{label}</div>
      <div style={styles.tagList}>
        {items.map((item, i) => (
          <span key={i} style={{ ...styles.tag, background: color === "#3b82f6" ? "#eff6ff" : "#fff7ed", color, border: `1px solid ${color === "#3b82f6" ? "#bfdbfe" : "#fed7aa"}` }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Vista Estudiante ──────────────────────────────────────────────────────────
function EstudianteView({ perfil }) {
  return (
    <div style={styles.section}>
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{perfil.rating ?? 0}</div>
          <div style={styles.statLabel}>Rating <IconStar /></div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{perfil.pacientes_atendidos ?? 0}</div>
          <div style={styles.statLabel}>Pacientes atendidos</div>
        </div>
        {perfil.anio_carrera && (
          <div style={styles.statCard}>
            <div style={styles.statNum}>{perfil.anio_carrera}°</div>
            <div style={styles.statLabel}>Año de carrera</div>
          </div>
        )}
      </div>
      <DataRow label="Universidad" value={perfil.universidad} icon="🏛️" />
      <DataRow label="Descripción" value={perfil.descripcion} icon="📝" />
      <TagList label="Materias" items={perfil.materias} color="#3b82f6" />
      <TagList label="Disponibilidad" items={perfil.disponibilidad} color="#f59e0b" />
    </div>
  );
}

// ── Vista Paciente ────────────────────────────────────────────────────────────
function PacienteView({ perfil }) {
  const estadoColor = { pendiente: "#f59e0b", asignado: "#3b82f6", completado: "#10b981" };
  const estadoLabel = { pendiente: "En espera de asignación", asignado: "Asignado a estudiante", completado: "Tratamiento completado" };
  return (
    <div style={styles.section}>
      <div style={{ ...styles.estadoBadge, background: `${estadoColor[perfil.estado]}18`, color: estadoColor[perfil.estado], border: `1px solid ${estadoColor[perfil.estado]}40` }}>
        ● {estadoLabel[perfil.estado] ?? perfil.estado}
      </div>
      {perfil.imagen_url && (
        <img src={perfil.imagen_url} alt="Foto perfil" style={styles.avatar} />
      )}
      <DataRow label="Edad" value={`${perfil.edad} años`} icon="🎂" />
      {perfil.telefono && <DataRow label="Teléfono" value={perfil.telefono} icon="📱" />}
      <DataRow label="Problema dental" value={perfil.problema_dental} icon="🦷" />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    profileService.get()
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Cargando perfil...</p>
    </div>
  );

  if (error) return (
    <div style={styles.center}>
      <p style={{ color: "#ef4444", fontFamily: "'Inter', sans-serif" }}>Error: {error}</p>
    </div>
  );

  const { perfil, perfilCompleto } = profile ?? {};
  const nombre = perfil?.nombre ?? user?.email ?? "Usuario";
  const role = user?.role;

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.avatarCircle}>
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div style={styles.headerInfo}>
            <h1 style={styles.nombre}>{nombre}</h1>
            <div style={styles.roleBadge}>
              {role === "estudiante" ? "🎓 Estudiante de Odontología" : "👤 Paciente"}
            </div>
            <DataRow icon={<IconMail />} label="Email" value={user?.email} />
          </div>
          <div style={styles.headerActions}>
            <button style={styles.editBtn} onClick={() => navigate("/profile/edit")}>
              <IconEdit /> Editar perfil
            </button>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              <IconLogout /> Salir
            </button>
          </div>
        </div>

        {/* Contenido según rol */}
        {!perfilCompleto ? (
          <div style={styles.incompleteBox}>
            <div style={styles.incompleteIcon}>📋</div>
            <h3 style={styles.incompleteTitle}>Completá tu perfil</h3>
            <p style={styles.incompleteText}>
              {role === "estudiante"
                ? "Agregá tu universidad, materias y disponibilidad para que los pacientes puedan encontrarte."
                : "Completá tus datos para que podamos asignarte un estudiante."}
            </p>
            <button style={styles.completeBtn} onClick={() => navigate("/profile/edit")}>
              Completar perfil →
            </button>
          </div>
        ) : (
          <>
            {role === "estudiante" && <EstudianteView perfil={perfil} />}
            {role === "paciente"   && <PacienteView   perfil={perfil} />}
          </>
        )}

      </div>
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = {
  page:            { minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #fff7ed 100%)", padding: "40px 20px", fontFamily: "'Inter', sans-serif" },
  container:       { maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" },
  center:          { height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" },
  spinner:         { width: "40px", height: "40px", border: "4px solid #bfdbfe", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText:     { color: "#64748b", fontFamily: "'Inter', sans-serif", fontSize: "15px" },

  // Header
  header:          { background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" },
  avatarCircle:    { width: "72px", height: "72px", minWidth: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 900 },
  headerInfo:      { flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
  nombre:          { fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: 0 },
  roleBadge:       { display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: "#eff6ff", color: "#2563eb", borderRadius: "999px", fontSize: "13px", fontWeight: 600, width: "fit-content" },
  headerActions:   { display: "flex", flexDirection: "column", gap: "10px" },
  editBtn:         { display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
  logoutBtn:       { display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" },

  // Sección de datos
  section:         { background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "20px" },
  dataRow:         { display: "flex", alignItems: "flex-start", gap: "12px" },
  dataIcon:        { fontSize: "20px", marginTop: "2px" },
  dataLabel:       { fontSize: "12px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" },
  dataValue:       { fontSize: "15px", color: "#1e293b", fontWeight: 500, lineHeight: "1.5" },

  // Stats estudiante
  statsRow:        { display: "flex", gap: "16px", flexWrap: "wrap" },
  statCard:        { flex: 1, minWidth: "100px", background: "linear-gradient(135deg, #eff6ff, #fff)", borderRadius: "14px", padding: "16px", textAlign: "center", border: "1px solid #bfdbfe" },
  statNum:         { fontSize: "28px", fontWeight: 900, color: "#2563eb" },
  statLabel:       { fontSize: "12px", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginTop: "4px" },

  // Tags
  tagSection:      { display: "flex", flexDirection: "column", gap: "8px" },
  tagList:         { display: "flex", flexWrap: "wrap", gap: "8px" },
  tag:             { padding: "5px 12px", borderRadius: "999px", fontSize: "13px", fontWeight: 600 },

  // Estado paciente
  estadoBadge:     { display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, width: "fit-content" },
  avatar:          { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #bfdbfe" },

  // Perfil incompleto
  incompleteBox:   { background: "#fff", borderRadius: "20px", padding: "40px 32px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", textAlign: "center" },
  incompleteIcon:  { fontSize: "48px", marginBottom: "16px" },
  incompleteTitle: { fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" },
  incompleteText:  { fontSize: "15px", color: "#64748b", lineHeight: "1.7", maxWidth: "400px", margin: "0 auto 24px" },
  completeBtn:     { padding: "14px 28px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" },
};
