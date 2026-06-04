import { useState, useEffect } from "react";

const TOUR_KEY = "dental_tour_done";

const steps = [
  {
    title: "¡Bienvenido a Dental Match! 🦷",
    text: "Esta es tu pantalla de inicio. Desde acá accedés a todo lo que necesitás.",
    position: "center",
  },
  {
    title: "Tu perfil 👤",
    text: "Completá tu perfil para aparecer en las búsquedas y conectarte con otros usuarios.",
    position: "center",
  },
  {
    title: "Stats en tiempo real 📊",
    text: "Estos números muestran cuántos estudiantes, pacientes y matches hay en la plataforma.",
    position: "center",
  },
  {
    title: "Modo oscuro 🌙",
    text: "Podés cambiar entre modo claro y oscuro con el botón en la esquina superior.",
    position: "center",
  },
  {
    title: "¡Listo para empezar! 🚀",
    text: "Ya sabés todo. Completá tu perfil y empezá a conectarte.",
    position: "center",
  },
];

export default function OnboardingTour({ onDone }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  if (!visible) return null;

  const current = steps[step];
  const isLast  = step === steps.length - 1;

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
    onDone?.();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Progreso */}
        <div style={styles.dots}>
          {steps.map((_, i) => (
            <div key={i} style={{ ...styles.dot, ...(i === step ? styles.dotActive : {}) }} />
          ))}
        </div>

        <div style={styles.icon}>
          {["🦷", "👤", "📊", "🌙", "🚀"][step]}
        </div>
        <h2 style={styles.title}>{current.title}</h2>
        <p style={styles.text}>{current.text}</p>

        <div style={styles.actions}>
          <button style={styles.skipBtn} onClick={finish}>Saltar</button>
          <button style={styles.nextBtn} onClick={() => isLast ? finish() : setStep(s => s + 1)}>
            {isLast ? "¡Empezar!" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay:   { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" },
  card:      { background: "#fff", borderRadius: "24px", padding: "40px 36px", maxWidth: "420px", width: "90%", textAlign: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "fadeIn .3s ease" },
  dots:      { display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px" },
  dot:       { width: "8px", height: "8px", borderRadius: "50%", background: "#e2e8f0", transition: "all .3s" },
  dotActive: { background: "#3b82f6", width: "24px", borderRadius: "4px" },
  icon:      { fontSize: "52px", marginBottom: "12px" },
  title:     { fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 10px", fontFamily: "'Inter', sans-serif" },
  text:      { fontSize: "15px", color: "#64748b", lineHeight: "1.7", margin: "0 0 28px", fontFamily: "'Inter', sans-serif" },
  actions:   { display: "flex", gap: "12px", justifyContent: "center" },
  skipBtn:   { padding: "10px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
  nextBtn:   { padding: "10px 24px", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
};
