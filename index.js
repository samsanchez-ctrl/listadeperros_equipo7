// index.js — Lista de Perros 🐶
// Equipo 7 · DOY0101 Ingeniería DevOps
// La lógica pura (cálculos y validaciones) vive en logica.js para poder testearla.

/* global calcularPorcentaje, extraerRaza, validarRespuestaApi */

const API_URL = 'https://dog.ceo/api/breeds/image/random';

let totalVistas = 0;
let totalLikes = 0;
let totalDislikes = 0;

const imgEl          = document.getElementById('dog-img');
const btnLike        = document.getElementById('btn-like');
const btnDislike     = document.getElementById('btn-dislike');
const btnNueva       = document.getElementById('btn-nueva');
const spanTotal      = document.getElementById('total');
const spanLikes      = document.getElementById('likes');
const spanDislikes   = document.getElementById('dislikes');
const spanPorcentaje = document.getElementById('porcentaje');
const errorEl        = document.getElementById('error-msg');
const listaHistorial = document.getElementById('lista-historial');

// ——— Mensaje de error visible (hotfix EP1) ———
function mostrarError(mensaje) {
  errorEl.textContent = mensaje;
  errorEl.hidden = false;
}

function ocultarError() {
  errorEl.textContent = '';
  errorEl.hidden = true;
}

// ——— Obtener imagen desde la API ———
async function obtenerPerro() {
  try {
    imgEl.classList.add('cargando');
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const datos = await respuesta.json();
    imgEl.src = validarRespuestaApi(datos);
    imgEl.alt = 'Perro aleatorio';
    totalVistas++;
    ocultarError();
    actualizarContador();
    habilitarBotones(true);
  } catch (error) {
    imgEl.alt = 'No se pudo cargar la imagen';
    imgEl.removeAttribute('src');
    mostrarError('⚠️ No se pudo cargar la imagen. Revisa tu conexión e intenta con "Nueva imagen".');
    console.error('Error al obtener imagen:', error);
  } finally {
    imgEl.classList.remove('cargando');
  }
}

// ——— Porcentaje de aprobación (likes / total de reacciones) ———
function mostrarPorcentaje() {
  const pct = calcularPorcentaje(totalLikes, totalDislikes);
  spanPorcentaje.textContent = `${pct}%`;
}

// ——— Actualizar contadores en pantalla ———
function actualizarContador() {
  spanTotal.textContent    = totalVistas;
  spanLikes.textContent    = totalLikes;
  spanDislikes.textContent = totalDislikes;
  mostrarPorcentaje();
}

// ——— Agregar entrada al historial ———
function agregarHistorial(reaccion) {
  const raza = extraerRaza(imgEl.src);
  const item = document.createElement('li');
  item.textContent = `${reaccion} — ${raza}`;
  listaHistorial.prepend(item);
}

// ——— Habilitar / deshabilitar botones de reacción ———
function habilitarBotones(estado) {
  btnLike.disabled    = !estado;
  btnDislike.disabled = !estado;
}

// ——— Reaccionar (like / dislike) ———
function reaccionar(tipo) {
  if (tipo === 'like') totalLikes++;
  else totalDislikes++;
  actualizarContador();
  agregarHistorial(tipo === 'like' ? '👍' : '👎');
  habilitarBotones(false);
  return obtenerPerro();
}

// ——— Eventos ———
btnLike.addEventListener('click', () => reaccionar('like'));
btnDislike.addEventListener('click', () => reaccionar('dislike'));
btnNueva.addEventListener('click', () => {
  habilitarBotones(false);
  obtenerPerro();
});

// ——— Inicio ———
habilitarBotones(false);
obtenerPerro();
