import React from "react";
import imagenInicio from "./assets/Foto-Pagina-Inicio-DentalMatch.jpg";

const IconEstudiante = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
    <path d="M12 3L1 9l11 6l9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82Z"/>
  </svg>
);

const IconPaciente = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#1e293b">
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
        <div className="blob-animated-slow" style={styles.blobOrange1}></div>
        <div className="blob-animated-slower" style={styles.blobBlue}></div>
        <div className="pulse-glow-slow" style={styles.blobOrange2}></div>
        <div className="blob-animated-slow" style={styles.blobAmber}></div>

        <div style={styles.dotPatternTL}></div>
        <div style={styles.dotPatternBR}></div>

        <div style={styles.left}>
          <h1 style={styles.title}>
            Dental <span style={styles.titleHighlight}>Match</span>
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
                transform: hoverEstudiante ? "translateY(-4px) scale(1.03)" : clickEstudiante ? "scale(0.95)" : "scale(1)",
                boxShadow: hoverEstudiante ? "0 25px 50px rgba(59,130,246,0.5)" : "0 15px 35px rgba(59,130,246,0.35)"
              }}
              onMouseEnter={() => setHoverEstudiante(true)}
              onMouseLeave={() => setHoverEstudiante(false)}
              onClick={handleSelectEstudiante}
            >
              <div style={styles.iconBg}>
                <IconEstudiante />
              </div>
              <span style={{
                transition: "all 0.3s ease",
                transform: hoverEstudiante ? "translateX(6px)" : "translateX(0)"
              }}>Soy Estudiante</span>
              <span style={{
                ...styles.arrowWhite,
                transform: hoverEstudiante ? "translateX(8px)" : "translateX(0)"
              }}>→</span>
            </button>

            <button
              style={{
                ...styles.secondaryBtn,
                transform: hoverPaciente ? "translateY(-4px) scale(1.03)" : clickPaciente ? "scale(0.95)" : "scale(1)",
                boxShadow: hoverPaciente ? "0 25px 50px rgba(253,186,116,0.4)" : "0 15px 35px rgba(253,186,116,0.25)"
              }}
              onMouseEnter={() => setHoverPaciente(true)}
              onMouseLeave={() => setHoverPaciente(false)}
              onClick={handleSelectPaciente}
            >
              <div style={styles.iconBg}>
                <IconPaciente />
              </div>
              <span style={{
                transition: "all 0.3s ease",
                transform: hoverPaciente ? "translateX(6px)" : "translateX(0)"
              }}>Soy Paciente</span>
              <span style={{
                ...styles.arrowDark,
                transform: hoverPaciente ? "translateX(8px)" : "translateX(0)"
              }}>→</span>
            </button>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.badge}>DENTAL MATCH</div>

          <div style={styles.heroGlow}></div>
          <div className="blob-animated-slow" style={styles.blobHero}></div>

          <div className="blob-animated-slow" style={styles.heroBlob}>
            <img src={imagenInicio} style={styles.img} alt="hero"/>
          </div>

          <div className="blob-animated-micro" style={styles.glass}>
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
    background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #fff7ed 100%)"
  },

  card: {
    width: "1200px",
    height: "700px",
    display: "flex",
    borderRadius: "30px",
    overflow: "hidden",
    background: "rgba(255, 255, 255, 0.95)",
    boxShadow: "0 40px 120px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5) inset",
    position: "relative",
    backdropFilter: "blur(20px)"
  },

  blobOrange1: {
    position: "absolute",
    top: "-100px",
    left: "100px",
    width: "500px",
    height: "500px",
    background: "linear-gradient(135deg, #fdba74, #fed7aa)",
    borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
    filter: "blur(120px)",
    opacity: 0.35,
    pointerEvents: "none"
  },

  blobBlue: {
    position: "absolute",
    bottom: "-150px",
    right: "50px",
    width: "600px",
    height: "600px",
    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    borderRadius: "40% 60% 70% 30% / 40% 70% 30% 60%",
    filter: "blur(120px)",
    opacity: 0.35,
    pointerEvents: "none"
  },

  blobOrange: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "400px",
    height: "400px",
    background: "linear-gradient(135deg, #fed7aa, #ffedd5)",
    borderRadius: "50%",
    filter: "blur(100px)",
    opacity: 0.25,
    pointerEvents: "none",
    transform: "translate(-50%, -50%)"
  },

  blobAmber: {
    position: "absolute",
    top: "30%",
    right: "200px",
    width: "350px",
    height: "350px",
    background: "linear-gradient(135deg, #fdba74, #fed7aa)",
    borderRadius: "50% 50% 30% 70% / 40% 60% 40% 60%",
    filter: "blur(100px)",
    opacity: 0.3,
    pointerEvents: "none"
  },

  dotPatternTL: {
    position: "absolute",
    top: "40px",
    left: "40px",
    width: "80px",
    height: "80px",
    backgroundImage: "radial-gradient(circle, rgba(59,130,246,0.15) 2px, transparent 2px)",
    backgroundSize: "12px 12px",
    opacity: 0.6,
    pointerEvents: "none"
  },

  dotPatternBR: {
    position: "absolute",
    bottom: "40px",
    right: "40px",
    width: "80px",
    height: "80px",
    backgroundImage: "radial-gradient(circle, rgba(253,186,116,0.15) 2px, transparent 2px)",
    backgroundSize: "12px 12px",
    opacity: 0.6,
    pointerEvents: "none"
  },

  left: {
    flex: 1.1,
    padding: "90px 80px",
    position: "relative",
    zIndex: 2
  },

  title: {
    fontSize: "64px",
    fontWeight: 900,
    margin: 0,
    color: "#0f172a",
    letterSpacing: "-3px",
    lineHeight: "1.1",
    fontFamily: "'Inter', sans-serif"
  },

  titleHighlight: {
    color: "#2563eb",
    fontWeight: 900,
    textShadow: "0 2px 20px rgba(59,130,246,0.15)"
  },

  line: {
    width: "80px",
    height: "5px",
    background: "linear-gradient(90deg, #3b82f6, #60a5fa, #fdba74)",
    margin: "28px 0",
    borderRadius: "3px"
  },

  desc: {
    color: "#475569",
    lineHeight: "1.9",
    fontSize: "18px",
    maxWidth: "460px",
    marginBottom: "55px",
    fontWeight: 400,
    fontFamily: "'Inter', sans-serif"
  },

  question: {
    fontWeight: 800,
    marginBottom: "28px",
    fontSize: "22px",
    color: "#1e293b",
    fontFamily: "'Inter', sans-serif"
  },

  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "500px"
  },

  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "22px 32px",
    borderRadius: "20px",
    border: "none",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "18px",
    boxShadow: "0 15px 35px rgba(59,130,246,0.35)",
    cursor: "pointer",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "-0.5px"
  },

  secondaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "22px 32px",
    borderRadius: "20px",
    border: "none",
    background: "linear-gradient(135deg, #fed7aa, #ffedd5)",
    color: "#1e293b",
    fontWeight: 800,
    fontSize: "18px",
    boxShadow: "0 15px 35px rgba(253,186,116,0.25)",
    cursor: "pointer",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "-0.5px"
  },

  iconBg: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "14px",
    boxShadow: "0 0 15px rgba(255,255,255,0.3)"
  },

  arrowWhite: {
    color: "#fff",
    fontSize: "22px",
    transition: "all 0.3s ease",
    fontWeight: 700
  },

  arrowDark: {
    color: "#1e293b",
    fontSize: "22px",
    transition: "all 0.3s ease",
    fontWeight: 700
  },

  arrowBlue: {
    color: "#3B82F6",
    fontSize: "20px",
    transition: "all 0.3s ease"
  },

  right: {
    flex: 1,
    position: "relative",
    background: "linear-gradient(135deg, rgba(219,234,254,0.9), rgba(224,242,254,0.9), rgba(255,237,213,0.7))",
    backgroundSize: "200% 200%",
    animation: "gradientShift 8s ease infinite",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible"
  },

  badge: {
    position: "absolute",
    top: "35px",
    right: "35px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "1.5px",
    boxShadow: "0 8px 25px rgba(59,130,246,0.3)"
  },

  heroGlow: {
    position: "absolute",
    width: "480px",
    height: "480px",
    background: "radial-gradient(circle, rgba(59,130,246,0.3), rgba(147,197,253,0.2), rgba(253,186,116,0.15), transparent)",
    borderRadius: "50%",
    pointerEvents: "none"
  },

  blobHero: {
    position: "absolute",
    width: "380px",
    height: "380px",
    background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(147,197,253,0.15))",
    borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
    filter: "blur(60px)",
    pointerEvents: "none"
  },

  heroBlob: {
    width: "350px",
    height: "350px",
    borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
    overflow: "hidden",
    border: "8px solid rgba(255,255,255,0.95)",
    boxShadow: "0 40px 100px rgba(0,0,0,0.25), 0 0 60px rgba(59,130,246,0.25)",
    zIndex: 2,
    position: "relative"
  },

  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  glass: {
    position: "absolute",
    bottom: "50px",
    left: "50px",
    right: "50px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "24px 28px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 15px 50px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)",
    zIndex: 3
  },

  glassTitle: {
    fontWeight: 900,
    color: "#0369A1",
    fontSize: "16px",
    fontFamily: "'Inter', sans-serif"
  },

  glassSub: {
    fontSize: "14px",
    color: "#075985",
    marginTop: "3px",
    fontFamily: "'Inter', sans-serif"
  }

};
