import { useEffect, useState } from "react";
import { adminService } from "../../services/api";
import { s } from "./estilos";

const ROLES = [
  { value: "", label: "Todos los roles" },
  { value: "estudiante", label: "Estudiantes" },
  { value: "paciente", label: "Pacientes" },
  { value: "admin", label: "Administradores" },
];

const fecha = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminUsuarios() {
  const [rol, setRol]           = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError]       = useState("");

  // Espera 300 ms tras la última tecla para no consultar en cada letra
  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(() => {
      adminService.usuarios({ rol, q: busqueda })
        .then((datos) => { if (vigente) { setUsuarios(datos); setError(""); } })
        .catch((e) => { if (vigente) setError(e.message); });
    }, 300);
    return () => { vigente = false; clearTimeout(espera); };
  }, [rol, busqueda]);

  return (
    <>
      <div style={s.filtros}>
        <input style={{ ...s.campo, flex: 1, minWidth: "200px" }} type="search" placeholder="Buscar por correo…"
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <select style={s.campo} value={rol} onChange={(e) => setRol(e.target.value)}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {error ? <div style={s.errorBox}>{error}</div> : usuarios === null ? (
        <div style={s.vacio}>Cargando…</div>
      ) : usuarios.length === 0 ? (
        <div style={s.vacio}>No hay usuarios con ese filtro.</div>
      ) : (
        <div style={s.tableSection}>
          <table style={s.table}>
            <thead>
              <tr>{["Nombre", "Correo", "Rol", "Correo verificado", "Alta"].map((t) => <th key={t} style={s.th}>{t}</th>)}</tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td style={s.td}>{u.nombre ?? "—"}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>{u.role}</td>
                  <td style={s.td}>{u.email_verificado ? "Sí" : "No"}</td>
                  <td style={s.td}>{fecha(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
