import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, casosService } from "../../services/api";
import { compressImage } from "../../utils/imageCompression";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Checkbox from "../../components/Checkbox/Checkbox";

const IconBack   = () =>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>);
const IconTooth  = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8 2 5 5 5 9c0 2.5.8 4.5 1.5 6.5L7 20c.3 1.2 1 2 2 2s1.5-.8 2-2l1-3 1 3c.5 1.2 1 2 2 2s1.7-.8 2-2l.5-4.5C18.2 13.5 19 11.5 19 9c0-4-3-7-7-7z"/></svg>);
const IconCamera = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>);

export default function CreateCasoPage() {
  const navigate = useNavigate();
  const toast    = useToast();
  const fileRef  = useRef(null);

  const [form, setForm] = useState({
    titulo: "", descripcion: "", notas: "",
    es_analisis: false,
  });
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [errors,        setErrors]        = useState({});
  const [submitting,    setSubmitting]    = useState(false);
  const [serverErr,     setServerErr]     = useState("");
  const [esPrimerCaso,  setEsPrimerCaso]  = useState(false);
  const [hoveringImg,   setHoveringImg]   = useState(false);

  // ── Detectar si es el primer caso del paciente ────────────────────────────
  useEffect(() => {
    casosService.checkPrimerCaso()
      .then(({ esPrimerCaso }) => setEsPrimerCaso(esPrimerCaso))
      .catch(() => {});
  }, []);

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

  const openFilePicker = () => fileRef.current?.click();
  const handleDropZoneKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFilePicker(); }
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
        fd.append("imagen",      imageFile);
        fd.append("titulo",      form.titulo.trim());
        fd.append("descripcion", form.descripcion.trim());
        if (form.notas)       fd.append("notas", form.notas.trim());
        if (form.es_analisis) fd.append("es_analisis", "true");
        await casosService.crearMultipart(fd);
      } else {
        await casosService.crear({
          titulo:      form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          notas:       form.notas || undefined,
          es_analisis: form.es_analisis,
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
                style={{ ...s.dropZone, ...(imagePreview ? s.dropZoneActive : {}), ...(errors.imagen ? s.dropZoneErr : {}) }}
                onClick={openFilePicker}
                onMouseEnter={() => setHoveringImg(true)}
                onMouseLeave={() => setHoveringImg(false)}
                role="button"
                tabIndex={0}
                aria-label="Subir foto del problema dental"
                onKeyDown={handleDropZoneKeyDown}
              >
                {imagePreview ? (
                  <div style={s.previewWrap}>
                    <img src={imagePreview} alt="Preview" style={s.preview} />
                    <div style={{ ...s.previewOverlay, background: hoveringImg ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)" }}>
                      <span style={{ ...s.previewText, opacity: hoveringImg ? 1 : 0 }}>Click para cambiar</span>
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

            {/* Descripción — el paciente solo describe, no diagnostica */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Contanos qué te pasa <span style={s.required}>*</span></label>
              <textarea
                value={form.descripcion}
                onChange={e => set("descripcion", e.target.value)}
                placeholder="Contá con tus palabras qué te pasa, hace cuánto, si tenés dolor, etc. El estudiante se va a encargar del diagnóstico."
                rows={5}
                style={{ ...s.textarea, ...(errors.descripcion ? s.textareaError : {}) }}
              />
              <div style={s.charCount}>
                <span style={{ color: form.descripcion.length < 20 ? "var(--color-danger)" : "var(--text-tertiary)" }}>
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

            {/* ── Sugerencia: análisis con estudiante junior (solo primer caso) ── */}
            {esPrimerCaso && (
              <div style={analisis.card}>
                <div style={analisis.iconCol}>🎓</div>
                <div style={{ flex: 1 }}>
                  <div style={analisis.title}>¿Es tu primera vez?</div>
                  <p style={analisis.desc}>
                    Podés pedir un <strong>análisis</strong> con un estudiante de los primeros años.
                    Tu caso aparecerá primero entre los estudiantes en formación, ideal para chequeos
                    iniciales y diagnóstico sin compromiso.
                  </p>
                  <div style={{ ...analisis.checkRow, ...(form.es_analisis ? analisis.checkRowActive : {}) }}>
                    <Checkbox
                      id="es-analisis"
                      checked={form.es_analisis}
                      onChange={(val) => set("es_analisis", val)}
                      label={<span>Sí, marcar mi caso como <strong>análisis inicial</strong></span>}
                    />
                  </div>
                </div>
              </div>
            )}

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
  page:          { minHeight: "100vh", background: "var(--bg-page)", padding: "36px 20px" },
  container:     { maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },
  topBar:        { display: "flex" },
  backBtn:       { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--color-primary)", fontWeight: 600, fontSize: "14px", cursor: "pointer" },
  card:          { background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "36px 40px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" },
  cardHeader:    { display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "4px" },
  iconCircle:    { width: "48px", height: "48px", minWidth: "48px", borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" },
  title:         { fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" },
  highlight:     { color: "var(--color-primary)" },
  subtitle:      { fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0" },
  divider:       { height: "1px", background: "var(--border)", margin: "24px 0" },
  form:          { display: "flex", flexDirection: "column", gap: "20px" },
  label:         { fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: "6px" },
  required:      { color: "var(--color-danger)" },
  fieldGroup:    { display: "flex", flexDirection: "column" },
  // Dropzone imagen
  dropZone:      { border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)", cursor: "pointer", overflow: "hidden", minHeight: "140px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", background: "var(--bg-subtle)" },
  dropZoneActive:{ border: "2px solid var(--color-primary)", background: "var(--color-info-bg)" },
  dropZoneErr:   { borderColor: "var(--color-danger)", background: "var(--color-danger-bg)" },
  dropContent:   { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "32px" },
  cameraIcon:    { width: "48px", height: "48px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" },
  dropTitle:     { fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" },
  dropSub:       { fontSize: "13px", color: "var(--text-tertiary)" },
  previewWrap:   { position: "relative", width: "100%", height: "200px" },
  preview:       { width: "100%", height: "100%", objectFit: "cover" },
  previewOverlay:{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" },
  previewText:   { color: "var(--color-primary-text)", fontWeight: 700, fontSize: "14px", transition: "opacity .2s" },
  removeImgBtn:  { background: "none", border: "none", color: "var(--color-danger)", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: "4px 0", marginTop: "6px", textAlign: "left", width: "fit-content" },
  textarea:      { border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px 16px", fontSize: "15px", color: "var(--text-primary)", background: "var(--bg-input)", outline: "none", resize: "vertical", lineHeight: "1.6", width: "100%", boxSizing: "border-box" },
  textareaError: { borderColor: "var(--color-danger)" },
  charCount:     { fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px" },
  fieldErr:      { color: "var(--color-danger)", fontWeight: 500 },
  errorBox:      { padding: "12px 16px", background: "var(--color-danger-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--color-danger)", fontSize: "14px", fontWeight: 500 },
  actions:       { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" },
  cancelBtn:     { padding: "12px 24px", background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
};

const analisis = {
  card:        { display: "flex", gap: "16px", padding: "20px 22px", background: "var(--color-info-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", alignItems: "flex-start" },
  iconCol:     { fontSize: "38px", flexShrink: 0 },
  title:       { fontSize: "15px", fontWeight: 800, color: "var(--color-primary)", marginBottom: "6px" },
  desc:        { fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 12px" },
  checkRow:    { display: "flex", alignItems: "center", padding: "10px 14px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "2px solid transparent" },
  checkRowActive:{ border: "2px solid var(--color-primary)" },
};
