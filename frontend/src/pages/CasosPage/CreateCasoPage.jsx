import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, casosService } from "../../services/api";
import { compressImage } from "../../utils/imageCompression";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

const TIPOS = [
  "Ortodoncia", "Endodoncia", "Periodoncia", "Cirugía oral",
  "Odontopediatría", "Prótesis", "Estética dental", "Otro",
];

const IconBack   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>);
const IconTooth  = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8 2 5 5 5 9c0 2.5.8 4.5 1.5 6.5L7 20c.3 1.2 1 2 2 2s1.5-.8 2-2l1-3 1 3c.5 1.2 1 2 2 2s1.7-.8 2-2l.5-4.5C18.2 13.5 19 11.5 19 9c0-4-3-7-7-7z"/></svg>);
const IconCamera = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);

export default function CreateCasoPage() {
  const navigate = useNavigate();
  const toast    = useToast();
  const fileRef  = useRef(null);

  const [form, setForm] = useState({
    titulo: "", descripcion: "", tipo_tratamiento: "", notas: "",
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors,       setErrors]       = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [serverErr,    setServerErr]    = useState("");

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.titulo.trim() || form.titulo.length < 5)
      e.titulo = "El título debe tener al menos 5 caracteres";
    if (!form.descripcion.trim() || form.descripcion.length < 20)
      e.descripcion = "Describí el caso con más detalle (mínimo 20 caracteres)";
    if (!imageFile)
      e.imagen = "Subí una foto de tu boca para que el estudiante pueda evaluar el caso";
    return e;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setServerErr("Solo se aceptan imágenes (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setServerErr("La imagen no puede superar 20MB antes de compresión");
      return;
    }
    // Comprimir antes de subir (reduce hasta 80% del peso)
    const compressed = await compressImage(file);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
    setServerErr("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErr("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      // Si hay imagen, usar multipart/form-data
      if (imageFile) {
        const fd = new FormData();
        fd.append("imagen",          imageFile);
        fd.append("titulo",          form.titulo.trim());
        fd.append("descripcion",     form.descripcion.trim());
        if (form.tipo_tratamiento) fd.append("tipo_tratamiento", form.tipo_tratamiento);
        if (form.notas)            fd.append("notas",            form.notas.trim());
        await casosService.crearMultipart(fd);
      } else {
        await casosService.crear({
          titulo:           form.titulo.trim(),
          descripcion:      form.descripcion.trim(),
          tipo_tratamiento: form.tipo_tratamiento || undefined,
          notas:            form.notas || undefined,
        });
      }
      toast.success("¡Caso publicado! Esperá aplicaciones de estudiantes.");
      navigate("/casos");
    } catch (err) {
      setServerErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>

        <div style={s.topBar}>
          <button style={s.backBtn} onClick={() => navigate("/casos")}>
            <IconBack /> Mis casos
          </button>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.iconCircle}><IconTooth /></div>
            <div>
              <h1 style={s.title}>Nuevo <span style={s.highlight}>caso clínico</span></h1>
              <p style={s.subtitle}>Describí tu necesidad para que un estudiante pueda ayudarte</p>
            </div>
          </div>
          <div style={s.divider} />

          <form onSubmit={handleSubmit} style={s.form}>
            {serverErr && <div style={s.errorBox}>{serverErr}</div>}

            {/* ── Imagen del caso (obligatoria) ── */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Foto del problema dental <span style={s.required}>*</span></label>
              <div
                style={{ ...s.dropZone, ...(imagePreview ? s.dropZoneActive : {}), ...(errors.imagen ? { borderColor: "#ef4444", background: "#fef2f2" } : {}) }}
                onClick={() => fileRef.current?.click()}
              >
                {imagePreview ? (
                  <div style={s.previewWrap}>
                    <img src={imagePreview} alt="Preview" style={s.preview} />
                    <div style={s.previewOverlay}>
                      <span style={s.previewText}>Click para cambiar</span>
                    </div>
                  </div>
                ) : (
                  <div style={s.dropContent}>
                    <div style={s.cameraIcon}><IconCamera /></div>
                    <div style={s.dropTitle}>Subir foto</div>
                    <div style={s.dropSub}>JPG, PNG o WEBP · Máx. 5MB</div>
                  </div>
                )}
              </div>
              {imageFile && (
                <button type="button" style={s.removeImgBtn}
                  onClick={() => { setImageFile(null); setImagePreview(null); }}>
                  ✕ Quitar imagen
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
              {errors.imagen && <span style={s.fieldErr}>{errors.imagen}</span>}
            </div>

            {/* Título */}
            <Input
              label="Título del caso"
              value={form.titulo}
              onChange={e => set("titulo", e.target.value)}
              error={errors.titulo}
              placeholder="Ej: Dolor molar inferior derecho"
              icon={<span style={{ fontSize: "16px" }}>📋</span>}
            />

            {/* Tipo */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Tipo de tratamiento (opcional)</label>
              <select value={form.tipo_tratamiento} onChange={e => set("tipo_tratamiento", e.target.value)} style={s.select}>
                <option value="">Seleccioná una categoría...</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Descripción */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Descripción del caso <span style={s.required}>*</span></label>
              <textarea
                value={form.descripcion}
                onChange={e => set("descripcion", e.target.value)}
                placeholder="Contá con detalle qué te pasa, hace cuánto tiempo, si tenés dolor, etc."
                rows={5}
                style={{ ...s.textarea, ...(errors.descripcion ? s.textareaError : {}) }}
              />
              <div style={s.charCount}>
                <span style={{ color: form.descripcion.length < 20 ? "#ef4444" : "#94a3b8" }}>
                  {form.descripcion.length}
                </span> / mínimo 20 caracteres
                {errors.descripcion && <span style={s.fieldErr}> · {errors.descripcion}</span>}
              </div>
            </div>

            {/* Notas */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Notas adicionales (opcional)</label>
              <textarea
                value={form.notas}
                onChange={e => set("notas", e.target.value)}
                placeholder="Alergias, horarios disponibles, preferencias..."
                rows={3}
                style={s.textarea}
              />
            </div>

            <div style={s.actions}>
              <button type="button" style={s.cancelBtn} onClick={() => navigate("/casos")}>Cancelar</button>
              <Button variant="primary" disabled={submitting} arrow={!submitting}>
                {submitting ? "Publicando..." : "Publicar caso"}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

const s = {
  page:          { minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc 0%,#eff6ff 55%,#fff7ed 100%)", padding: "36px 20px", fontFamily: "'Inter',sans-serif" },
  container:     { maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },
  topBar:        { display: "flex" },
  backBtn:       { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  card:          { background: "#fff", borderRadius: "24px", padding: "36px 40px", boxShadow: "0 4px 30px rgba(0,0,0,0.08)" },
  cardHeader:    { display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "4px" },
  iconCircle:    { width: "48px", height: "48px", minWidth: "48px", borderRadius: "14px", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" },
  title:         { fontSize: "28px", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  highlight:     { color: "#2563eb" },
  subtitle:      { fontSize: "14px", color: "#64748b", margin: "4px 0 0" },
  divider:       { height: "1px", background: "#f1f5f9", margin: "24px 0" },
  form:          { display: "flex", flexDirection: "column", gap: "20px" },
  label:         { fontSize: "14px", fontWeight: 600, color: "#1e293b", display: "block", marginBottom: "6px" },
  required:      { color: "#ef4444" },
  fieldGroup:    { display: "flex", flexDirection: "column" },
  // Dropzone imagen
  dropZone:      { border: "2px dashed #e2e8f0", borderRadius: "16px", cursor: "pointer", overflow: "hidden", minHeight: "140px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", background: "#fafafa" },
  dropZoneActive:{ border: "2px solid #bfdbfe", background: "#f0f8ff" },
  dropContent:   { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "32px" },
  cameraIcon:    { width: "48px", height: "48px", borderRadius: "14px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" },
  dropTitle:     { fontSize: "15px", fontWeight: 700, color: "#0f172a" },
  dropSub:       { fontSize: "13px", color: "#94a3b8" },
  previewWrap:   { position: "relative", width: "100%", height: "200px" },
  preview:       { width: "100%", height: "100%", objectFit: "cover" },
  previewOverlay:{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" },
  previewText:   { color: "#fff", fontWeight: 700, fontSize: "14px", opacity: 0, transition: "opacity .2s" },
  removeImgBtn:  { background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: "4px 0", fontFamily: "'Inter',sans-serif", marginTop: "6px", textAlign: "left", width: "fit-content" },
  select:        { height: "52px", border: "2px solid #e2e8f0", borderRadius: "12px", padding: "0 16px", fontSize: "15px", fontFamily: "'Inter',sans-serif", color: "#0f172a", background: "#fff", outline: "none" },
  textarea:      { border: "2px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px", fontSize: "15px", fontFamily: "'Inter',sans-serif", color: "#0f172a", outline: "none", resize: "vertical", lineHeight: "1.6", width: "100%", boxSizing: "border-box" },
  textareaError: { borderColor: "#ef4444" },
  charCount:     { fontSize: "12px", color: "#94a3b8", marginTop: "6px" },
  fieldErr:      { color: "#ef4444", fontWeight: 500 },
  errorBox:      { padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#dc2626", fontSize: "14px", fontWeight: 500 },
  actions:       { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn:     { padding: "12px 24px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
};
