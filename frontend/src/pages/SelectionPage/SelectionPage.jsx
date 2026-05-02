import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import { setUserType } from "../../utils/storage";

const IconEstudiante = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 3L1 9l11 6l9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82Z"/></svg>);
const IconPaciente = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="#1e293b"><path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 12c4.418 0 8 2 8 4.5V21H4v-2.5C4 16 7.582 14 12 14Z"/></svg>);
const IconCalendar = () => (<svg width="28" height="28" viewBox="0 0 24 24"><path fill="#3B82F6" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>);
import imagenInicio from "../../assets/Foto-Pagina-Inicio-DentalMatch.jpg";

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

  return (
    <Layout>
      <Card title="Dental" highlight="Match" description="Plataforma web que conecta estudiantes de odontología con pacientes, permitiendo que consigan práctica clínica real y atención de calidad." badge={true} badgeText="DENTAL MATCH" imageSrc={imagenInicio} imageAlt="hero" glassContent={<> <IconCalendar /> <div> <div style={styles.glassTitle}>Panel Digital</div> <div style={styles.glassSub}>Gestión de turnos en tiempo real.</div> </div> <span style={{ color: "#3B82F6", fontSize: "20px" }}>→</span> </>}>
        <h3 style={styles.question}>¿Sos estudiante o paciente?</h3>
        <div style={styles.buttons}>
          <Button variant="primary" icon={<IconEstudiante />} onClick={handleSelectEstudiante} disabled={clickEstudiante || clickPaciente}>Soy Estudiante</Button>
          <Button variant="secondary" icon={<IconPaciente />} onClick={handleSelectPaciente} disabled={clickEstudiante || clickPaciente}>Soy Paciente</Button>
        </div>
      </Card>
    </Layout>
  );
}

const styles = { question: { fontWeight: 800, marginBottom: "28px", fontSize: "22px", color: "#1e293b", fontFamily: "'Inter', sans-serif" }, buttons: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "500px" }, glassTitle: { fontWeight: 900, color: "#0369A1", fontSize: "16px", fontFamily: "'Inter', sans-serif" }, glassSub: { fontSize: "14px", color: "#075985", marginTop: "3px", fontFamily: "'Inter', sans-serif" } };
