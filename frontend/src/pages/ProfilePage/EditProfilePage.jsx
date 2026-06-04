import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileService, getUser } from "../../services/api";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";

// ── Iconos ────────────────────────────────────────────────────────────────────
const IconUser   = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconPhone  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const IconPlus   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const IconX      = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconBack   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>);

// ── TagInput: campo para arrays de strings ────────────────────────────────────
function TagInput({ label, tags, onChange, placeholder, color = "#3b82f6" }) {
  const [input, setInput] = useState("");
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };
  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));
  return (
    <div style={tagStyles.container}>
      <label style={tagStyles.label}>{label}</label>
      <div style={tagStyles.inputRow}>
        <div style={tagStyles.inputWrap}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder={placeholder}
            style={tagStyles.input}
          />
        </div>
        <button type="button" onClick={add} style={{ ...tagStyles.addBtn, background: color === "#3b82f6" ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          <IconPlus />
        </button>
      </div>
      {tags.length > 0 && (
        <div style={tagStyles.tagList}>
          {tags.map((tag, i) => (
            <span key={i} style={{ ...tagStyles.tag, background: color === "#3b82f6" ? "#eff6ff" : "#fff7ed", color, border: `1px solid ${color === "#3b82f6" ? "#bfdbfe" : "#fed7aa"}` }}>
              {tag}
              <button type="button" onClick={() => remove(i)} style={tagStyles.removeBtn}><IconX /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const tagStyles = {
  container:  { display: "flex", flexDirection: "column", gap: "8px" },
  label:      { fontSize: "14px", fontWeight: 600, color: "#1e293b", fontFamily: "'Inter', sans-serif" },
  inputRow:   { display: "flex", gap: "8px" },
  inputWrap:  { flex: 1, border: "2px solid #e2e8f0", borderRadius: "12px", padding: "0 14px", height: "50px", display: "flex", alignItems: "center", background: "#fff" },
  input:      { flex: 1, border: "none", outline: "none", fontSize: "15px", fontFamily: "'Inter', sans-serif", color: "#0f172a", background: "transparent" },
  addBtn:     { width: "50px", height: "50px", minWidth: "50px", borderRadius: "12px", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  tagList:    { display: "flex", flexWrap: "wrap", gap: "8px" },
  tag:        { display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 10px 5px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 600 },
  removeBtn:  { background: "none", border: "none", cursor: "pointer", padding: "0", display: "flex", color: "inherit", opacity: 0.7 },
};

// ── Formulario Estudiante ─────────────────────────────────────────────────────
function EstudianteForm({ data, onChange }) {
  return (
    <>
      <Input label="Nombre completo" value={data.nombre} onChange={(e) => onChange("nombre", e.target.value)} placeholder="Juan Pérez" icon={<IconUser />} />
      <Input label="Universidad" value={data.universidad} onChange={(e) => onChange("universidad", e.target.value)} placeholder="UBA, UNC, UNLP..." icon={<span>🏛️</span>} />
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <Input label="Año de carrera" type="number" value={data.anio_carrera} onChange={(e) => onChange("anio_carrera", Number(e.target.value))} placeholder="1 - 6" icon={<span>📚</span>} />
        </div>
      </div>
      <div>
        <label style={styles.textareaLabel}>Descripción</label>
        <textarea
          value={data.descripcion}
          onChange={(e) => onChange("descripcion", e.target.value)}
          placeholder="Contá brevemente sobre vos y tu experiencia..."
          style={styles.textarea}
          rows={3}
        />
      </div>
      <TagInput label="Materias" tags={data.materias} onChange={(v) => onChange("materias", v)} placeholder="Ej: Ortodoncia (Enter para agregar)" color="#3b82f6" />
      <TagInput label="Disponibilidad" tags={data.disponibilidad} onChange={(v) => onChange("disponibilidad", v)} placeholder="Ej: Lunes 9-12 (Enter para agregar)" color="#f59e0b" />
    </>
  );
}

// ── Formulario Paciente ───────────────────────────────────────────────────────
function PacienteForm({ data, onChange }) {
  return (
    <>
      <Input label="Nombre completo" value={data.nombre} onChange={(e) => onChange("nombre", e.target.value)} placeholder="Juan Pérez" icon={<IconUser />} />
      <Input label="Edad" type="number" value={data.edad} onChange={(e) => onChange("edad", Number(e.target.value))} placeholder="25" icon={<span>🎂</span>} />
      <Input label="Teléfono (opcional)" value={data.telefono} onChange={(e) => onChange("telefono", e.target.value)} placeholder="+54 9 11 1234 5678" icon={<IconPhone />} />
      <div>
        <label style={styles.textareaLabel}>Problema dental</label>
        <textarea
          value={data.problemaDental}
          onChange={(e) => onChange("problemaDental", e.target.value)}
          placeholder="Describí tu problema dental con el mayor detalle posible..."
          style={styles.textarea}
          rows={4}
        />
      </div>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function EditProfilePage() {
  const navigate = useNavigate();
  const user = getUser();
  const role = user?.role;

  const defaultEstudiante = { nombre: "", universidad: "", anio_carrera: "", descripcion: "", materias: [], disponibilidad: [] };
  const defaultPaciente   = { nombre: "", edad: "", telefono: "", problemaDental: "" };

  const [formData, setFormData] = useState(role === "estudiante" ? defaultEstudiante : defaultPaciente);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Pre-cargar datos existentes
  useEffect(() => {
    profileService.get()
      .then(({ perfil }) => {
        if (!perfil) return;
        if (role === "estudiante") {
          setFormData({
            nombre:        perfil.nombre        ?? "",
            universidad:   perfil.universidad   ?? "",
            anio_carrera:  perfil.anio_carrera  ?? "",
            descripcion:   perfil.descripcion   ?? "",
            materias:      perfil.materias      ?? [],
            disponibilidad:perfil.disponibilidad?? [],
          });
        } else {
          setFormData({
            nombre:        perfil.nombre         ?? "",
            edad:          perfil.edad           ?? "",
            telefono:      perfil.telefono       ?? "",
            problemaDental:perfil.problema_dental?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role]);

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await profileService.update(formData);
      setSuccess(true);
      setTimeout(() => navigate("/profile"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate("/profile")}>
            <IconBack /> Volver al perfil
          </button>
          <div style={styles.roleBadge}>
            {role === "estudiante" ? "🎓 Estudiante" : "👤 Paciente"}
          </div>
        </div>

        <div style={styles.card}>
          <h1 style={styles.title}>Editar <span style={styles.highlight}>perfil</span></h1>
          <div style={styles.line} />

          <form onSubmit={handleSubmit} style={styles.form}>
            {error   && <div style={styles.errorBox}>{error}</div>}
            {success && <div style={styles.successBox}>✅ Perfil guardado correctamente</div>}

            {role === "estudiante" && <EstudianteForm data={formData} onChange={handleChange} />}
            {role === "paciente"   && <PacienteForm   data={formData} onChange={handleChange} />}

            <Button variant="primary" fullWidth disabled={submitting} arrow={!submitting}>
              {submitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page:         { minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #fff7ed 100%)", padding: "40px 20px", fontFamily: "'Inter', sans-serif" },
  container:    { maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },
  center:       { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" },
  spinner:      { width: "40px", height: "40px", border: "4px solid #bfdbfe", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  topBar:       { display: "flex", alignItems: "center", justifyContent: "space-between" },
  backBtn:      { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'Inter', sans-serif" },
  roleBadge:    { padding: "6px 14px", background: "#eff6ff", color: "#2563eb", borderRadius: "999px", fontSize: "13px", fontWeight: 700 },
  card:         { background: "#fff", borderRadius: "24px", padding: "40px", boxShadow: "0 4px 30px rgba(0,0,0,0.08)" },
  title:        { fontSize: "36px", fontWeight: 900, color: "#0f172a", margin: 0, fontFamily: "'Inter', sans-serif", letterSpacing: "-1px" },
  highlight:    { color: "#2563eb" },
  line:         { width: "60px", height: "4px", background: "linear-gradient(90deg,#3b82f6,#60a5fa,#fdba74)", borderRadius: "3px", margin: "16px 0 28px" },
  form:         { display: "flex", flexDirection: "column", gap: "18px" },
  textareaLabel:{ fontSize: "14px", fontWeight: 600, color: "#1e293b", display: "block", marginBottom: "6px" },
  textarea:     { width: "100%", border: "2px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px", fontSize: "15px", fontFamily: "'Inter', sans-serif", color: "#0f172a", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: "1.6" },
  errorBox:     { padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#dc2626", fontSize: "14px", fontWeight: 500, textAlign: "center" },
  successBox:   { padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", color: "#16a34a", fontSize: "14px", fontWeight: 600, textAlign: "center" },
};
