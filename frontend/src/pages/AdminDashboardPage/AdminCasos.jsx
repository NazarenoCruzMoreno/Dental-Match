import { useEffect, useState } from "react";
import { adminService } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { s } from "./estilos";

function CasoCard({ caso, onQuitarImagen, onEliminar }) {
  return (
    <div style={s.casoCard}>
      {caso.imagen_url
        ? <img style={s.casoImg} src={caso.imagen_url} alt={`Imagen del caso ${caso.titulo ?? ""}`} loading="lazy" />
        : <div style={s.casoSinImg}>Sin imagen</div>}
      <div style={s.casoBody}>
        <h3 style={s.casoTitulo}>{caso.titulo || "Sin título"}</h3>
        <p style={s.casoMeta}>{caso.pacientes?.nombre ?? "Paciente desconocido"} · {caso.estado}</p>
      </div>
      <div style={s.acciones}>
        {caso.imagen_url && <button type="button" style={s.botonSuave} onClick={() => onQuitarImagen(caso)}>Quitar imagen</button>}
        <button type="button" style={s.botonPeligro} onClick={() => onEliminar(caso)}>Eliminar caso</button>
      </div>
    </div>
  );
}

export default function AdminCasos() {
  const toast = useToast();
  const [casos, setCasos]         = useState(null);
  const [conImagen, setConImagen] = useState(false);
  const [error, setError]         = useState("");

  const cargar = () => adminService.casos({ conImagen })
    .then((datos) => { setCasos(datos); setError(""); })
    .catch((e) => setError(e.message));

  useEffect(() => { cargar(); }, [conImagen]); // eslint-disable-line react-hooks/exhaustive-deps

  const ejecutar = async (confirmacion, accion, exito) => {
    if (!window.confirm(confirmacion)) return;
    try {
      await accion();
      toast.success(exito);
      await cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const quitarImagen = (caso) => ejecutar(
    "¿Quitar esta imagen de toda la plataforma? Se borra el archivo y desaparece de todos los casos y perfiles que la usen.",
    () => adminService.quitarImagen(caso.id), "Imagen eliminada");
  const eliminar = (caso) => ejecutar(
    `¿Eliminar el caso "${caso.titulo ?? ""}"? También se borran sus aplicaciones, turnos y mensajes. No se puede deshacer.`,
    () => adminService.eliminarCaso(caso.id), "Caso eliminado");

  return (
    <>
      <label style={{ ...s.sub, display: "flex", gap: "8px", alignItems: "center" }}>
        <input type="checkbox" checked={conImagen} onChange={(e) => setConImagen(e.target.checked)} />
        Mostrar solo casos con imagen
      </label>

      {error ? <div style={s.errorBox}>{error}</div> : casos === null ? (
        <div style={s.vacio}>Cargando…</div>
      ) : casos.length === 0 ? (
        <div style={s.vacio}>No hay casos para mostrar.</div>
      ) : (
        <div style={s.casosGrid}>
          {casos.map((c) => <CasoCard key={c.id} caso={c} onQuitarImagen={quitarImagen} onEliminar={eliminar} />)}
        </div>
      )}
    </>
  );
}
