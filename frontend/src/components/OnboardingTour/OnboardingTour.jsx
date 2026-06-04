import { useState, useEffect } from "react";

const TOUR_KEY = "dental_tour_v2"; // v2 fuerza reset del tour anterior

const steps = [
  { icon: "🦷", title: "¡Bienvenido a Dental Match!", text: "Esta es tu pantalla de inicio. Desde acá accedés a todo lo que necesitás para conectarte." },
  { icon: "👤", title: "Tu perfil",                  text: "Completá tu perfil para aparecer en las búsquedas y conectarte con otros usuarios." },
  { icon: "📊", title: "Stats en tiempo real",        text: "Estos números muestran cuántos estudiantes, pacientes y matches hay en la plataforma." },
  { icon: "🌙", title: "Modo oscuro",                 text: "Podés cambiar entre modo claro y oscuro con el botón luna/sol en el header." },
  { icon: "🔔", title: "Notificaciones",              text: "La campana te avisa cuando tenés novedades: nuevos matches, turnos confirmados y más." },
  { icon: "🚀", title: "¡Listo para empezar!",        text: "Ya sabés todo. Completá tu perfil y empezá a conectarte con la comunidad dental." },
];

export default function OnboardingTour({ onDone }) {
  const [step,    setStep]    = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  const cur    = steps[step];
  const isLast = step === steps.length - 1;

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
    onDone?.();
  };

  return (
    <div style={st.overlay} onClick={(e) => e.target === e.currentTarget && finish()}>
      <div style={st.card}>
        <div style={st.dots}>
          {steps.map((_, i) => (
            <div key={i} style={{ ...st.dot, ...(i === step ? st.dotActive : i < step ? st.dotDone : {}) }}
              onClick={() => setStep(i)} />
          ))}
        </div>
        <div style={st.icon}>{cur.icon}</div>
        <h2 style={st.title}>{cur.title}</h2>
        <p style={st.text}>{cur.text}</p>
        <div style={st.actions}>
          <button style={st.skipBtn} onClick={finish}>Saltar tour</button>
          <button style={st.nextBtn} onClick={() => isLast ? finish() : setStep(s => s + 1)}>
            {isLast ? "¡Empezar! 🚀" : "Siguiente →"}
          </button>
        </div>
        <div style={st.hint}>Paso {step + 1} de {steps.length}</div>
      </div>
    </div>
  );
}

const st = {
  overlay:   { position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(6px)" },
  card:      { background: "#fff", borderRadius: "28px", padding: "44px 40px 32px", maxWidth: "440px", width: "90%", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.3)" },
  dots:      { display: "flex", justifyContent: "center", gap: "8px", marginBottom: "28px" },
  dot:       { width: "8px", height: "8px", borderRadius: "50%", background: "#e2e8f0", cursor: "pointer", transition: "all .25s" },
  dotActive: { background: "#3b82f6", width: "28px", borderRadius: "4px" },
  dotDone:   { background: "#bfdbfe" },
  icon:      { fontSize: "56px", marginBottom: "14px", lineHeight: 1 },
  title:     { fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "0 0 10px", fontFamily: "'Inter',sans-serif", letterSpacing: "-0.5px" },
  text:      { fontSize: "15px", color: "#64748b", lineHeight: "1.7", margin: "0 0 30px", fontFamily: "'Inter',sans-serif" },
  actions:   { display: "flex", gap: "12px", justifyContent: "center" },
  skipBtn:   { padding: "11px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" },
  nextBtn:   { padding: "11px 28px", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 8px 20px rgba(59,130,246,0.35)" },
  hint:      { marginTop: "16px", fontSize: "12px", color: "#94a3b8", fontFamily: "'Inter',sans-serif" },
};
