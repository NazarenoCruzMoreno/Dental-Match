const { PESOS } = require("./config");

const penalizacion = (peso) => peso / (peso + 25);

// Topes duros por duplicación
function topePorDuplicacion(duplicacionPct) {
  if (duplicacionPct >= 50) return 15;
  if (duplicacionPct >= 30) return 30;
  if (duplicacionPct >= 15) return 50;
  return 100;
}

function indiceDesdePeso(peso, duplicacionPct) {
  const bruto = 100 * (1 - penalizacion(peso));
  return Math.round(Math.min(bruto, topePorDuplicacion(duplicacionPct)));
}

// La consigna no detalla cómo se agregan las señales, así que se calculan las dos lecturas posibles:
//  - porTipo: cada tipo de señal presente suma su peso una sola vez (cota optimista)
//  - porOcurrencia: cada ocurrencia suma su peso (cota pesimista)
function calcularIndice(conteos, duplicacionPct, loc) {
  if (!loc) return { porTipo: 0, porOcurrencia: 0 };
  const claves = Object.keys(PESOS);
  const pesoPorTipo = claves.filter((k) => conteos[k] > 0).reduce((suma, k) => suma + PESOS[k], 0);
  const pesoPorOcurrencia = claves.reduce((suma, k) => suma + PESOS[k] * (conteos[k] || 0), 0);
  return {
    porTipo: indiceDesdePeso(pesoPorTipo, duplicacionPct),
    porOcurrencia: indiceDesdePeso(pesoPorOcurrencia, duplicacionPct),
  };
}

module.exports = { calcularIndice };
