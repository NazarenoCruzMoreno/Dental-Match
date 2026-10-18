import { useState } from "react";
import AdminResumen from "./AdminResumen";
import AdminUsuarios from "./AdminUsuarios";
import AdminCasos from "./AdminCasos";
import { s } from "./estilos";

const SECCIONES = [
  { id: "resumen",  label: "Resumen",  Vista: AdminResumen },
  { id: "usuarios", label: "Usuarios", Vista: AdminUsuarios },
  { id: "casos",    label: "Casos e imágenes", Vista: AdminCasos },
];

export default function AdminDashboardPage() {
  const [activa, setActiva] = useState("resumen");
  const { Vista } = SECCIONES.find((x) => x.id === activa);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>Panel de administración</h1>
          <p style={s.sub}>Vista general y moderación de la plataforma</p>
        </div>

        <div style={s.tabs} role="tablist">
          {SECCIONES.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={activa === x.id}
              style={{ ...s.tab, ...(activa === x.id ? s.tabActive : {}) }} onClick={() => setActiva(x.id)}>
              {x.label}
            </button>
          ))}
        </div>

        <Vista />
      </div>
    </div>
  );
}
