import { useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import { setUserType } from "../../utils/storage";
import "./SelectionPage.css";

const IconCalendar = () => (<svg width="28" height="28" viewBox="0 0 24 24" style={{ color: "var(--color-primary)" }}><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>);
const IconGo = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);

const SPARK = "M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z";

// Mini ilustraciones de cada rol
function StudentArt() {
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden="true" focusable="false">
      <g transform="translate(17 20) scale(2.65)" fill="rgba(255,255,255,0.22)" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10 12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c3 2 9 2 12 0v-5" fill="none" />
      </g>
      <path d={SPARK} transform="translate(76 20)" fill="#e0f2fe" />
      <path d={SPARK} transform="translate(17 77) scale(0.7)" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}

function PatientArt() {
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="dmRoleTooth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#fbcfe8" /></linearGradient>
      </defs>
      <g transform="translate(20 15) scale(0.58)">
        <path d="M50 8 C 36 0, 14 4, 10 26 C 7 42, 15 52, 17 68 C 19 86, 20 112, 31 112 C 40 112, 41 86, 50 86 C 59 86, 60 112, 69 112 C 80 112, 81 86, 83 68 C 85 52, 93 42, 90 26 C 86 4, 64 0, 50 8 Z" fill="url(#dmRoleTooth)" stroke="rgba(255,255,255,0.85)" strokeWidth="3" />
        <path d="M24 24 C 27 16, 36 12, 43 15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g transform="translate(60 56)">
        <rect width="28" height="28" rx="9" fill="#fb7185" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
        <g transform="translate(6.5 6.5) scale(0.62)" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></g>
      </g>
      <path d={SPARK} transform="translate(76 16) scale(0.8)" fill="#fdf2f8" />
    </svg>
  );
}

// Tarjeta de rol con inclinación 3D y brillo que sigue al mouse (solo con mouse y sin "reducir movimiento")
function RoleCard({ variant, title, desc, Art, onClick, disabled, picked }) {
  const ref = useRef(null);
  const animable = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e) => {
    if (disabled || !animable()) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${((px - 0.5) * 10).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - py) * 8).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    ["--rx", "--ry"].forEach((p) => el.style.setProperty(p, "0deg"));
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`dm-role dm-role--${variant}${picked ? " is-picked" : ""}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="dm-role-art"><Art /></span>
      <span className="dm-role-text">
        <span className="dm-role-title">{title}</span>
        <span className="dm-role-desc">{desc}</span>
      </span>
      <span className="dm-role-go"><IconGo /></span>
      <span className="dm-role-glare" aria-hidden="true" />
    </button>
  );
}

export default function SelectionPage() {
  const [clickEstudiante, setClickEstudiante] = useState(false);
  const [clickPaciente, setClickPaciente] = useState(false);

  const handleSelectEstudiante = () => {
    setClickEstudiante(true);
    setTimeout(() => { setUserType("estudiante"); window.location.href = "/register"; }, 400);
  };
  const handleSelectPaciente = () => {
    setClickPaciente(true);
    setTimeout(() => { setUserType("paciente"); window.location.href = "/register"; }, 400);
  };
  const ocupado = clickEstudiante || clickPaciente;

  return (
    <Layout>
      <Card title="Dental" highlight="Match" description="Plataforma web que conecta estudiantes de odontología con pacientes, permitiendo que consigan práctica clínica real y atención de calidad." badge={true} badgeText="DENTAL MATCH" glassContent={<> <IconCalendar /> <div> <div style={styles.glassTitle}>Panel Digital</div> <div style={styles.glassSub}>Gestión de turnos en tiempo real.</div> </div> <span style={{ color: "var(--color-primary)", fontSize: "20px" }}>→</span> </>}>
        <h3 style={styles.question}>¿Sos estudiante o paciente?</h3>
        <div style={styles.buttons}>
          <RoleCard variant="student" title="Soy Estudiante" desc="Conseguí práctica clínica real con pacientes." Art={StudentArt} onClick={handleSelectEstudiante} disabled={ocupado} picked={clickEstudiante} />
          <RoleCard variant="patient" title="Soy Paciente" desc="Encontrá atención de calidad cerca tuyo." Art={PatientArt} onClick={handleSelectPaciente} disabled={ocupado} picked={clickPaciente} />
        </div>
      </Card>
    </Layout>
  );
}

const styles = { question: { fontWeight: 800, marginBottom: "20px", fontSize: "22px", color: "var(--text-primary)" }, buttons: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }, glassTitle: { fontWeight: 900, color: "var(--text-primary)", fontSize: "16px" }, glassSub: { fontSize: "14px", color: "var(--text-secondary)", marginTop: "3px" } };
