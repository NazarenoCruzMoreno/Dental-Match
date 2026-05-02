import { useState } from "react";
import "./Input.css";

export default function Input({ label, type = "text", value, onChange, onBlur, error, placeholder, icon }) {
  const [focused, setFocused] = useState(false);
  const handleFocus = () => setFocused(true);
  const handleBlur = () => { setFocused(false); if (onBlur) onBlur(); };

  const hasError = error && error.length > 0;

  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>
      <div style={{
        ...styles.inputWrapper,
        borderColor: hasError ? "#ef4444" : focused ? "#3b82f6" : "#e2e8f0",
        borderWidth: hasError ? "2px" : "2px",
        boxShadow: hasError ? "0 0 0 3px rgba(239,68,68,0.15)" : focused ? "0 0 0 3px rgba(59,130,246,0.1)" : "none"
      }}>
        {icon && <span style={{ ...styles.icon, color: hasError ? "#ef4444" : "#64748b" }}>{icon}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={styles.input} onFocus={handleFocus} onBlur={handleBlur} />
      </div>
      {hasError && <span style={styles.error}>{error}</span>}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", fontWeight: 600, color: "#1e293b", fontFamily: "'Inter', sans-serif" },
  inputWrapper: { display: "flex", alignItems: "center", gap: "10px", padding: "0 16px", height: "52px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "#fff", transition: "all 0.3s ease" },
  icon: { transition: "color 0.3s ease" },
  input: { flex: 1, border: "none", outline: "none", fontSize: "15px", fontFamily: "'Inter', sans-serif", color: "#0f172a", background: "transparent" },
  error: { fontSize: "12px", color: "#ef4444", fontWeight: 500, marginTop: "2px" }
};
