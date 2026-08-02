import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, casosService, matchService } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useDebounce } from "../../hooks/useDebounce";
import { GridSkeleton } from "../../components/Skeleton/Skeleton";
import PatientCard from "./PatientCard";
import CasoModal   from "./CasoModal";

// Filtros principales: análisis (para junior) vs todos los casos abiertos
const FILTROS = [
  { key: "todos",    label: "Todos" },
  { key: "analisis", label: "🎓 Solo análisis" },
  { key: "normales", label: "Casos avanzados" },
];

export default function MarketplacePage() {
  const navigate         = useNavigate();
  const user             = getUser();
  const toast            = useToast();
  const [casos,    setCasos]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const debouncedSearch         = useDebounce(search, 250);
  const [filter,   setFilter]   = useState("todos");
  const [selected, setSelected] = useState(null);
  const [applied,  setApplied]  = useState(new Set());

  // Cargar casos al montar y cuando vuelvas a la pestaña
  const cargar = () => {
    casosService.listar()
      .then(setCasos)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);
  useAutoRefresh(cargar);

  const filtered = casos.filter((c) => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q
      || c.titulo.toLowerCase().includes(q)
      || c.descripcion.toLowerCase().includes(q)
      || (c.pacientes?.nombre ?? "").toLowerCase().includes(q);
    let matchFilter = true;
    if      (filter === "analisis") matchFilter = !!c.es_analisis;
    else if (filter === "normales") matchFilter = !c.es_analisis;
    return matchSearch && matchFilter;
  });

  const handleAplicar = async (casoId) => {
    try {
      const data = await matchService.aplicar(casoId);
      setApplied((prev) => new Set([...prev, casoId]));
      toast.success("Aplicación enviada al paciente ✓");
      return data;
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  };

  const nombre = user?.email?.split("@")[0] ?? "Estudiante";

  return (
    <div style={p.root}>

      {/* ── HEADER ── */}
      <header style={p.header}>
        <div style={p.headerInner}>
          <div style={p.logo} onClick={() => navigate("/home")}>
            <div style={p.logoIcon}>🦷</div>
            <span style={p.logoText}>Dental<span style={p.logoBlue}>Match</span></span>
          </div>

          <div style={p.searchBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              style={p.searchInput}
              placeholder="Buscar pacientes..."
              aria-label="Buscar pacientes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={p.clearBtn} onClick={() => setSearch("")} aria-label="Limpiar búsqueda">✕</button>
            )}
          </div>

          <div style={p.avatarWrap}>
            <div style={p.avatar}>{nombre.charAt(0).toUpperCase()}</div>
            <div style={p.avatarInfo} data-header-name>
              <div style={p.avatarName}>{nombre}</div>
              <div style={p.avatarRole}>Estudiante</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={p.main}>

        {/* Filtros + count */}
        <div style={p.toolbar}>
          <div style={p.filterRow} data-scroll-x>
            {FILTROS.map((f) => (
              <button key={f.key} style={{ ...p.filterBtn, ...(filter === f.key ? p.filterActive : {}) }} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={p.statChip}>
            <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>{filtered.length}</span>
            <span style={{ color: "var(--text-tertiary)" }}> disponibles</span>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <GridSkeleton count={6} type="card" />
        ) : filtered.length === 0 ? (
          <div style={p.emptyState}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>🔍</div>
            <h3 style={p.emptyTitle}>Sin resultados</h3>
            <p style={p.emptyText}>Probá con otro término o cambiá el filtro.</p>
          </div>
        ) : (
          <div style={p.grid} data-grid="cards">
            {filtered.map((caso) => (
              <PatientCard
                key={caso.id}
                caso={caso}
                onClick={() => setSelected(caso)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selected && (
        <CasoModal
          caso={selected}
          onClose={() => setSelected(null)}
          onAplicar={handleAplicar}
        />
      )}
    </div>
  );
}

const p = {
  root:         { minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)" },

  header:       { background: "var(--bg-card)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100, boxShadow: "var(--shadow-sm)" },
  headerInner:  { maxWidth: "1200px", margin: "0 auto", padding: "0 20px", height: "64px", display: "flex", alignItems: "center", gap: "16px" },
  logo:         { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 },
  logoIcon:     { fontSize: "22px" },
  logoText:     { fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  logoBlue:     { color: "var(--color-primary)" },
  searchBox:    { flex: 1, minWidth: 0, maxWidth: "480px", height: "40px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "0 14px", display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-subtle)" },
  searchInput:  { flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontSize: "14px", color: "var(--text-primary)" },
  clearBtn:     { background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: "12px", padding: "2px 4px" },
  avatarWrap:   { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  avatar:       { width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-primary)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 800 },
  avatarInfo:   { lineHeight: 1.3 },
  avatarName:   { fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" },
  avatarRole:   { fontSize: "11px", color: "var(--text-tertiary)" },

  main:         { maxWidth: "1200px", margin: "0 auto", padding: "24px 20px 60px" },
  toolbar:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "12px", flexWrap: "wrap" },
  filterRow:    { display: "flex", gap: "8px", flexWrap: "wrap" },
  filterBtn:    { padding: "7px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-full)", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)", transition: "all .15s" },
  filterActive: { background: "var(--color-primary)", color: "var(--color-primary-text)", border: "1px solid var(--color-primary)" },
  statChip:     { fontSize: "13px" },

  grid:         { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" },

  emptyState:   { textAlign: "center", padding: "80px 20px" },
  emptyTitle:   { fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" },
  emptyText:    { fontSize: "15px", color: "var(--text-secondary)" },
};
