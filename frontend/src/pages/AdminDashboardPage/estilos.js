export const s = {
  page:      { minHeight: "100vh", background: "transparent", padding: "72px 20px 60px" },
  container: { maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" },
  header:    { display: "flex", flexDirection: "column", gap: "4px" },
  title:     { fontSize: "26px", fontWeight: 900, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" },
  sub:       { fontSize: "14px", color: "var(--text-secondary)", margin: 0 },

  tabs:      { display: "flex", gap: "8px", flexWrap: "wrap" },
  tab:       { padding: "8px 18px", borderRadius: "999px", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  tabActive: { background: "var(--color-primary)", borderColor: "var(--color-primary)", color: "#fff" },

  grid:          { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" },
  card:          { borderRadius: "var(--radius-lg)", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textAlign: "center" },
  cardIcon:      { fontSize: "28px" },
  cardValue:     { fontSize: "32px", fontWeight: 900 },
  cardLabel:     { fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 },
  skeletonCard:  { borderRadius: "var(--radius-lg)", height: "120px", background: "var(--bg-subtle)" },

  errorBox: { padding: "16px", background: "var(--color-danger-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--color-danger)", fontSize: "14px" },
  vacio:    { padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" },

  tableSection: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow-sm)", overflowX: "auto" },
  tableTitle:   { fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px" },
  table:        { width: "100%", borderCollapse: "collapse" },
  th:           { textAlign: "left", fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px 8px 0", borderBottom: "1px solid var(--border)" },
  td:           { padding: "12px 12px 12px 0", fontSize: "14px", color: "var(--text-primary)", borderBottom: "1px solid var(--border)" },

  filtros: { display: "flex", gap: "12px", flexWrap: "wrap" },
  campo:   { padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "14px" },

  casosGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" },
  casoCard:   { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-sm)" },
  casoImg:    { width: "100%", height: "160px", objectFit: "cover", background: "var(--bg-subtle)" },
  casoSinImg: { height: "160px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-subtle)", color: "var(--text-tertiary)", fontSize: "13px" },
  casoBody:   { padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  casoTitulo: { fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 },
  casoMeta:   { fontSize: "13px", color: "var(--text-secondary)", margin: 0 },
  acciones:   { display: "flex", gap: "8px", padding: "0 16px 16px", flexWrap: "wrap" },
  botonPeligro: { padding: "7px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger)", background: "transparent", color: "var(--color-danger)", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  botonSuave:   { padding: "7px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
};
