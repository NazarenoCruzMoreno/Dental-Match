import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import imagenInicio from "../../assets/Foto-Pagina-Inicio-DentalMatch.jpg";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import { validatePassword } from "../../utils/validation";
import { authService } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const IconLock = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [errors, setErrors]                    = useState({});
  const [serverError, setServerError]          = useState("");
  const [submitting, setSubmitting]            = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const passResult = validatePassword(password);
    const newErrors = {};
    if (!passResult.valid) newErrors.password = passResult.error;
    if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      toast.success("Contraseña actualizada. Iniciá sesión de nuevo.");
      navigate("/login");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Card title="Elegir" highlight="nueva contraseña" badge={true} badgeText="DENTAL MATCH" imageSrc={imagenInicio} imageAlt="hero">
        {!token ? (
          <div style={styles.errorState}>
            <div style={styles.errorIcon}>⚠️</div>
            <p style={styles.successText}>Este link no es válido. Pedí uno nuevo para restablecer tu contraseña.</p>
            <Button variant="primary" arrow={false} onClick={() => navigate("/forgot-password")}>
              Pedir un link nuevo
            </Button>
          </div>
        ) : (
          <>
            <p style={styles.desc}>Elegí tu nueva contraseña.</p>
            <form onSubmit={handleSubmit} style={styles.form}>
              {serverError && (
                <div style={styles.errorBox}>
                  {serverError}
                  {" "}
                  <span style={styles.link} onClick={() => navigate("/forgot-password")}>Pedir un link nuevo</span>
                </div>
              )}
              <Input label="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="••••••••" icon={<IconLock />} />
              <Input label="Confirmar contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} placeholder="••••••••" icon={<IconLock />} />
              <Button type="submit" variant="primary" fullWidth disabled={submitting} arrow={!submitting}>
                {submitting ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          </>
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
  errorState:  { textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  errorIcon:   { fontSize: "48px" },
  successText: { fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.7", margin: 0 },
  backLink:    { marginTop: "20px", fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" },
  link:        { color: "var(--color-primary)", fontWeight: 600, cursor: "pointer" },
};
