import { useState } from "react";
import "./Input.css";

const IconEyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function Input({ label, type = "text", value, onChange, onBlur, error, placeholder, icon }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => setFocused(true);
  const handleBlur = () => { setFocused(false); if (onBlur) onBlur(); };

  const hasError = error && error.length > 0;
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>
      <div style={{
        ...styles.inputWrapper,
        borderColor: hasError ? "#ef4444" : focused ? "#3b82f6" : "#e2e8f0",
        boxShadow: hasError ? "0 0 0 3px rgba(239,68,68,0.15)" : focused ? "0 0 0 3px rgba(59,130,246,0.1)" : "none"
      }}>
        {icon && <span style={{ ...styles.icon, color: hasError ? "#ef4444" : "#64748b" }}>{icon}</span>}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={styles.input}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{ ...styles.eyeBtn, color: hasError ? "#ef4444" : "#94a3b8" }}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <IconEyeOpen /> : <IconEyeClosed />}
          </button>
        )}
      </div>
      {hasError && <span style={styles.error}>{error}</span>}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", fontWeight: 600, color: "#1e293b", fontFamily: "'Inter', sans-serif" },
  inputWrapper: { display: "flex", alignItems: "center", gap: "10px", padding: "0 16px", height: "52px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "#fff", transition: "all 0.3s ease" },
  icon: { transition: "color 0.3s ease", flexShrink: 0 },
  input: { flex: 1, border: "none", outline: "none", fontSize: "15px", fontFamily: "'Inter', sans-serif", color: "#0f172a", background: "transparent", minWidth: 0 },
  eyeBtn: { background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", flexShrink: 0, transition: "color 0.2s ease" },
  error: { fontSize: "12px", color: "#ef4444", fontWeight: 500, marginTop: "2px" }
};
