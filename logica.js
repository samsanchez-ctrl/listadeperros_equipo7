// logica.js — Lista de Perros 🐶
// Funciones puras (sin DOM ni red) para que puedan probarse con Jest.
// En el navegador quedan disponibles como funciones globales;
// en Node (tests) se exportan con module.exports.

/**
 * Porcentaje de aprobación: likes sobre el total de reacciones.
 * Devuelve un entero entre 0 y 100. Sin reacciones devuelve 0.
 */
function calcularPorcentaje(likes, dislikes) {
  const l = Number(likes);
  const d = Number(dislikes);
  if (!Number.isFinite(l) || !Number.isFinite(d) || l < 0 || d < 0) {
    throw new Error('Los contadores deben ser números mayores o iguales a 0');
  }
  const total = l + d;
  if (total === 0) return 0;
  return Math.round((l / total) * 100);
}

/**
 * Obtiene la raza desde la URL que entrega dog.ceo.
 * Ej: https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg -> "hound-afghan"
 */
function extraerRaza(url) {
  if (typeof url !== 'string') return 'desconocida';
  const partes = url.split('/breeds/');
  if (partes.length < 2) return 'desconocida';
  const raza = partes[1].split('/')[0];
  return raza || 'desconocida';
}

/**
 * Valida la respuesta JSON de la API y devuelve la URL de la imagen.
 * Lanza un error si la respuesta no tiene el formato esperado.
 */
function validarRespuestaApi(datos) {
  if (!datos || datos.status !== 'success' || typeof datos.message !== 'string') {
    throw new Error('Respuesta inesperada de la API');
  }
  if (!datos.message.startsWith('https://')) {
    throw new Error('La URL de la imagen no es segura (se esperaba https)');
  }
  return datos.message;
}

/* istanbul ignore else */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcularPorcentaje, extraerRaza, validarRespuestaApi };
}
