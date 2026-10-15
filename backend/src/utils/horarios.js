// Ojo con los formatos: Postgres devuelve un TIME como "10:00:00", pero el
// cliente manda "10:00" — por eso se compara en minutos, nunca como strings.
const aMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const seSolapan = (inicioA, durA, inicioB, durB) =>
  inicioA < inicioB + durB && inicioB < inicioA + durA;

module.exports = { aMinutos, seSolapan };
