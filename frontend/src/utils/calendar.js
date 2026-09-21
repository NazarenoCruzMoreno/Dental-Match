const CALENDAR_URL = "https://calendar.google.com/calendar/render";
const TIMEZONE = "America/Argentina/Buenos_Aires";

const pad = (n) => String(n).padStart(2, "0");

// YYYYMMDDTHHMMSS con la hora "de pared", SIN pasar a UTC. El huso horario se
// fija aparte con ctz, así el evento cae a la hora correcta sin importar en
// qué zona esté el navegador (con toISOString() saldría corrido).
const formatWallClock = (d) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
  `T${pad(d.getHours())}${pad(d.getMinutes())}00`;

// Arma un Date con fecha "YYYY-MM-DD" y hora "HH:MM[:SS]" (como vienen de la
// tabla turnos). No usar new Date("YYYY-MM-DD") a secas: se interpreta como
// UTC y en Argentina (UTC-3) caería el día anterior.
export function combinarFechaHora(fecha, hora) {
  const [y, m, d] = String(fecha).split("-").map(Number);
  const [hh, mm] = String(hora).split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm || 0);
}

// Devuelve el link para crear el evento en Google Calendar del usuario, o
// null si fechaInicio no es una fecha válida (así se puede usar en un render
// sin que un dato raro tire la pantalla).
export function generarLinkGoogleCalendar(titulo, detalles, fechaInicio, duracionHoras = 1) {
  if (!(fechaInicio instanceof Date) || Number.isNaN(fechaInicio.getTime())) return null;

  const fin = new Date(fechaInicio);
  fin.setMinutes(fin.getMinutes() + Math.round(duracionHoras * 60));

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    details: detalles,
    dates: `${formatWallClock(fechaInicio)}/${formatWallClock(fin)}`,
    ctz: TIMEZONE,
  });

  return `${CALENDAR_URL}?${params.toString()}`;
}
