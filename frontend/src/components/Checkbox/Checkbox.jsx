const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Checkbox({ checked, onChange, label, error, id }) {
  const toggle = () => onChange?.(!checked);
  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
  };

  return (
    <div style={styles.row}>
      <div
        id={id}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={toggle}
        onKeyDown={onKeyDown}
        style={{
          ...styles.box,
          ...(checked ? styles.boxChecked : {}),
          ...(error && !checked ? styles.boxError : {}),
        }}
      >
        {checked && <IconCheck />}
      </div>
      {label && (
        <label htmlFor={id} onClick={toggle} style={styles.label}>{label}</label>
      )}
    </div>
  );
}

const styles = {
  row: { display: "flex", alignItems: "flex-start", gap: "10px" },
  box: {
    width: "20px", height: "20px", minWidth: "20px", borderRadius: "6px",
    border: "1.5px solid var(--border-strong)", background: "var(--bg-input)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", marginTop: "1px", color: "transparent",
    transition: "background-color 0.15s ease, border-color 0.15s ease",
  },
  boxChecked: { background: "var(--color-primary)", borderColor: "var(--color-primary)", color: "#fff" },
  boxError: { borderColor: "var(--color-danger)" },
  label: { fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", cursor: "pointer", userSelect: "none" },
};
