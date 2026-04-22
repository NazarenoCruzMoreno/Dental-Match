import React from "react";
import imagenInicio from "./assets/Foto-Pagina-Inicio-DentalMatch.jpg";

const IconEstudiante = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#3B82F6">
    <path d="M12 3L1 9l11 6l9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82Z"/>
  </svg>
);

const IconPaciente = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#3B82F6">
    <path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 12c4.418 0 8 2 8 4.5V21H4v-2.5C4 16 7.582 14 12 14Z"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24">
    <path fill="#3B82F6" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/>
  </svg>
);

export default function App() {
  const [hoverEstudiante, setHoverEstudiante] = React.useState(false);
  const [hoverPaciente, setHoverPaciente] = React.useState(false);
  const [clickEstudiante, setClickEstudiante] = React.useState(false);
  const [clickPaciente, setClickPaciente] = React.useState(false);

  const handleSelectEstudiante = () => {
    setClickEstudiante(true);
    setTimeout(() => {
      localStorage.setItem("userType", "estudiante");
      window.location.reload();
    }, 400);
  };

  const handleSelectPaciente = () => {
    setClickPaciente(true);
    setTimeout(() => {
      localStorage.setItem("userType", "paciente");
      window.location.reload();
    }, 400);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* LEFT */}
        <div style={styles.left}>
          <h1 style={styles.title}>
            Dental <span style={{ color: "#3B82F6" }}>Match</span>
          </h1>

          <div style={styles.line}></div>

          <p style={styles.desc}>
            Plataforma web que conecta estudiantes de odontología con pacientes,
            permitiendo que consigan práctica clínica real y atención de calidad.
          </p>

          <h3 style={styles.question}>
            ¿Sos estudiante o paciente?
          </h3>

          <div style={styles.buttons}>
            <button 
              style={{
                ...styles.primaryBtn,
                transform: hoverEstudiante ? "translateY(-3px) scale(1.02)" : clickEstudiante ? "scale(0.95)" : "scale(1)",
                boxShadow: hoverEstudiante ? "0 15px 35px rgba(59,130,246,0.45)" : "0 10px 25px rgba(59,130,246,0.35)"
              }}
              onMouseEnter={() => setHoverEstudiante(true)}
              onMouseLeave={() => setHoverEstudiante(false)}
              onClick={handleSelectEstudiante}
            >
              <div style={{
                ...styles.iconCircle,
                background: hoverEstudiante ? "#bae6fd" : "#e0f2fe",
                transform: hoverEstudiante ? "scale(1.1)" : "scale(1)",
                transition: "all 0.3s ease"
              }}>
                <IconEstudiante />
              </div>
              <span style={{ transition: "all 0.3s ease", transform: hoverEstudiante ? "translateX(4px)" : "translateX(0)" }}>Soy Estudiante</span>
              <span style={{...styles.arrow, transform: hoverEstudiante ? "translateX(-4px) rotate(0deg)" : "rotate(0deg)" }}>→</span>
            </button>

            <button 
              style={{
                ...styles.secondaryBtn,
                transform: hoverPaciente ? "translateY(-3px) scale(1.02)" : clickPaciente ? "scale(0.95)" : "scale(1)",
                background: hoverPaciente ? "#e2e8f0" : "#f1f5f9",
                borderColor: hoverPaciente ? "#3B82F6" : "#e2e8f0"
              }}
              onMouseEnter={() => setHoverPaciente(true)}
              onMouseLeave={() => setHoverPaciente(false)}
              onClick={handleSelectPaciente}
            >
              <div style={{
                ...styles.iconCircle,
                background: hoverPaciente ? "#bae6fd" : "#e0f2fe",
                transform: hoverPaciente ? "scale(1.1)" : "scale(1)",
                transition: "all 0.3s ease"
              }}>
                <IconPaciente />
              </div>
              <span style={{ transition: "all 0.3s ease", transform: hoverPaciente ? "translateX(4px)" : "translateX(0)" }}>Soy Paciente</span>
              <span style={{...styles.arrowBlue, transform: hoverPaciente ? "translateX(-4px) rotate(0deg)" : "rotate(0deg)" }}>→</span>
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div style={styles.right}>
          <div style={styles.badge}>DENTAL MATCH</div>

          {/* blur fondo */}
          <div style={styles.blur}></div>

          {/* blob */}
          <div style={styles.blob}>
            <img src={imagenInicio} style={styles.img}/>
          </div>

          {/* glass */}
          <div style={styles.glass}>
            <IconCalendar />
            <div>
              <div style={styles.glassTitle}>Panel Digital</div>
              <div style={styles.glassSub}>Gestión de turnos en tiempo real.</div>
            </div>
            <span style={styles.arrowBlue}>→</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {

  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: `
      radial-gradient(circle at 20% 20%, rgba(59,130,246,0.08), transparent),
      radial-gradient(circle at 80% 80%, rgba(59,130,246,0.1), transparent),
      #f8fafc
    `
  },

  card: {
    width: "1200px",
    height: "650px",
    display: "flex",
    borderRadius: "30px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 30px 80px rgba(0,0,0,0.12)"
  },

  left: {
    flex: 1.1,
    padding: "80px 70px"
  },

  title: {
    fontSize: "56px",
    fontWeight: 800,
    margin: 0,
    color: "#0f172a"
  },

  line: {
    width: "60px",
    height: "4px",
    background: "linear-gradient(90deg,#3B82F6,#60A5FA)",
    margin: "20px 0"
  },

  desc: {
    color: "#64748b",
    lineHeight: "1.7",
    fontSize: "18px",
    maxWidth: "420px",
    marginBottom: "50px"
  },

  question: {
    fontWeight: 700,
    marginBottom: "20px"
  },

  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg,#3B82F6,#2563EB)",
    color: "#fff",
    fontWeight: 600,
    fontSize: "16px",
    boxShadow: "0 10px 25px rgba(59,130,246,0.35)",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },

  secondaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderRadius: "16px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    color: "#0f172a",
    fontWeight: 600,
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },

  iconCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px"
  },

  arrow: { color: "#fff" },
  arrowBlue: { color: "#3B82F6" },

  right: {
    flex: 1,
    position: "relative",
    background: "linear-gradient(135deg,#e0f2fe,#bfdbfe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  badge: {
    position: "absolute",
    top: "30px",
    right: "30px",
    background: "#0ea5e9",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700
  },

  blur: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "#3B82F6",
    opacity: 0.25,
    filter: "blur(100px)",
    borderRadius: "50%"
  },

  blob: {
    width: "320px",
    height: "320px",
    borderRadius: "42% 58% 55% 45% / 45% 45% 55% 55%",
    overflow: "hidden",
    border: "8px solid rgba(255,255,255,0.9)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.2)",
    zIndex: 2
  },

  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  glass: {
    position: "absolute",
    bottom: "40px",
    left: "40px",
    right: "40px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.4)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },

  glassTitle: {
    fontWeight: 700,
    color: "#0369A1"
  },

  glassSub: {
    fontSize: "13px",
    color: "#075985"
  }

};