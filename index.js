// index.js — Lista de Perros 🐶
// Equipo 7 · DOY0101 Ingeniería DevOps

const API_URL = 'https://dog.ceo/api/breeds/image/random';

let totalVistas = 0;
let totalLikes = 0;
let totalDislikes = 0;

const imgEl      = document.getElementById('dog-img');
const btnLike    = document.getElementById('btn-like');
const btnDislike = document.getElementById('btn-dislike');
const btnNueva   = document.getElementById('btn-nueva');
const spanTotal  = document.getElementById('total');
const spanLikes  = document.getElementById('likes');
const spanDislikes = document.getElementById('dislikes');
const listaHistorial = document.getElementById('lista-historial');

// ——— Obtener imagen desde la API ———
async function obtenerPerro() {
  try {
    imgEl.classList.add('cargando');
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const datos = await respuesta.json();
    imgEl.src = datos.message;
    imgEl.alt = 'Perro aleatorio';
    totalVistas++;
    actualizarContador();
    habilitarBotones(true);
  } catch (error) {
    imgEl.alt = '⚠️ No se pudo cargar la imagen. Revisa tu conexión.';
    imgEl.src = '';
    console.error('Error al obtener imagen:', error);
  } finally {
    imgEl.classList.remove('cargando');
  }
}

// ——— Actualizar contadores en pantalla ———
function actualizarContador() {
  spanTotal.textContent    = totalVistas;
  spanLikes.textContent    = totalLikes;
  spanDislikes.textContent = totalDislikes;
}

// ——— Agregar entrada al historial ———
function agregarHistorial(reaccion) {
  const raza = imgEl.src.split('/breeds/')[1]?.split('/')[0] ?? 'desconocida';
  const item = document.createElement('li');
  item.textContent = `${reaccion} — ${raza}`;
  listaHistorial.prepend(item);
}

// ——— Habilitar / deshabilitar botones de reacción ———
function habilitarBotones(estado) {
  btnLike.disabled    = !estado;
  btnDislike.disabled = !estado;
}

// ——— Eventos ———
btnLike.addEventListener('click', () => {
  totalLikes++;
  actualizarContador();
  agregarHistorial('👍');
  habilitarBotones(false);
  obtenerPerro();
});

btnDislike.addEventListener('click', () => {
  totalDislikes++;
  actualizarContador();
  agregarHistorial('👎');
  habilitarBotones(false);
  obtenerPerro();
});

btnNueva.addEventListener('click', () => {
  habilitarBotones(false);
  obtenerPerro();
});

// ——— Inicio ———
habilitarBotones(false);
obtenerPerro();

// --- Feature: Porcentaje de likes ---
function mostrarPorcentaje() {
  if (totalVistas === 0) return;
  const pct = Math.round((totalLikes / totalVistas) * 100);
  const el = document.getElementById('porcentaje');
  if (el) el.textContent = `Aprobacion: ${pct}%`;
}
