import { useState } from "react";
import { useNavigate } from "react-router-dom";
import imagenInicio from "../../assets/Foto-Pagina-Inicio-DentalMatch.jpg";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { validateEmail } from "../../utils/validation";
import { authService } from "../../services/api";

const IconMail = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState("");
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = validateEmail(email);
    if (!result.valid) { setError(result.error); return; }

    setError("");
    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      // El backend nunca revela si el email existe, así que cualquier error
      // acá es de red/servidor genuino — igual mostramos éxito por seguridad.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Card
        title="Recuperar"
        highlight="contraseña"
        badge={true} badgeText="DENTAL MATCH"
        imageSrc={imagenInicio} imageAlt="hero"
      >
        {!sent ? (
          <>
            <p style={styles.desc}>Ingresá tu email y te mandamos un link para elegir una nueva contraseña.</p>
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && <div style={styles.errorBox}>{error}</div>}
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@email.com" icon={<IconMail />} />
              <Button type="submit" variant="primary" fullWidth disabled={submitting} arrow={!submitting}>
                {submitting ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
          </>
        ) : (
          <div style={styles.success}>
            <div style={styles.successIcon}>📬</div>
            <p style={styles.successText}>¡Listo! Si el email existe, vas a recibir un link para restablecer tu contraseña. Revisá también spam.</p>
          </div>
        )}
        <p style={styles.backLink}>
          <span style={styles.link} onClick={() => navigate("/login")}>← Volver al login</span>
        </p>
      </Card>
    </Layout>
  );
}

const styles = {
  desc:        { fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "20px" },
  form:        { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" },
  errorBox:    { padding: "12px 16px", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger)", borderRadius: "12px", color: "var(--color-danger)", fontSize: "14px", fontWeight: 500, textAlign: "center" },
  success:     { textAlign: "center", padding: "24px 0" },
  successIcon: { fontSize: "48px", marginBottom: "16px" },
  successText: { fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.7" },
  backLink:    { marginTop: "20px", fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" },
  link:        { color: "var(--color-primary)", fontWeight: 600, cursor: "pointer" },
};
