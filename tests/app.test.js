// Pruebas de integración de la interfaz (index.html + index.js) usando jsdom.
// La API dog.ceo se simula (mock) para que los tests no dependan de internet.
const fs = require('fs');
const path = require('path');
const logica = require('../logica');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const IMG_URL = 'https://images.dog.ceo/breeds/pug/n02110958_1975.jpg';

const respuestaOk = () =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success', message: IMG_URL }) });

// Espera a que terminen las promesas pendientes (fetch simulado)
const esperar = () => new Promise((r) => setTimeout(r, 0));

function cargarApp(fetchMock) {
  document.documentElement.innerHTML = html.replace(/<script[^>]*><\/script>/g, '');
  Object.assign(global, logica); // en el navegador estas funciones vienen de logica.js
  global.fetch = fetchMock;
  jest.isolateModules(() => require('../index.js'));
}

const $ = (id) => document.getElementById(id);

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('al iniciar carga una imagen y habilita los botones', async () => {
  cargarApp(jest.fn(respuestaOk));
  await esperar();

  expect($('dog-img').src).toBe(IMG_URL);
  expect($('total').textContent).toBe('1');
  expect($('btn-like').disabled).toBe(false);
  expect($('error-msg').hidden).toBe(true);
});

test('like actualiza contador, porcentaje e historial (mostrarPorcentaje conectado)', async () => {
  cargarApp(jest.fn(respuestaOk));
  await esperar();

  $('btn-like').click();
  await esperar();

  expect($('likes').textContent).toBe('1');
  expect($('porcentaje').textContent).toBe('100%');
  expect($('lista-historial').firstElementChild.textContent).toBe('👍 — pug');
});

test('el porcentaje combina likes y dislikes', async () => {
  cargarApp(jest.fn(respuestaOk));
  await esperar();

  $('btn-like').click();
  await esperar();
  $('btn-dislike').click();
  await esperar();
  $('btn-dislike').click();
  await esperar();

  expect($('likes').textContent).toBe('1');
  expect($('dislikes').textContent).toBe('2');
  expect($('porcentaje').textContent).toBe('33%');
  expect($('lista-historial').children).toHaveLength(3);
});

test('"Nueva imagen" pide otra imagen sin sumar reacciones', async () => {
  const fetchMock = jest.fn(respuestaOk);
  cargarApp(fetchMock);
  await esperar();

  $('btn-nueva').click();
  await esperar();

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect($('total').textContent).toBe('2');
  expect($('likes').textContent).toBe('0');
});

test('si la API falla muestra un mensaje de error visible', async () => {
  cargarApp(jest.fn(() => Promise.resolve({ ok: false, status: 500 })));
  await esperar();

  expect($('error-msg').hidden).toBe(false);
  expect($('error-msg').textContent).toMatch(/No se pudo cargar/);
  expect($('btn-like').disabled).toBe(true);
});

test('si no hay conexión muestra el error y luego se recupera', async () => {
  const fetchMock = jest.fn()
    .mockImplementationOnce(() => Promise.reject(new Error('sin red')))
    .mockImplementation(respuestaOk);
  cargarApp(fetchMock);
  await esperar();
  expect($('error-msg').hidden).toBe(false);

  $('btn-nueva').click();
  await esperar();
  expect($('error-msg').hidden).toBe(true);
  expect($('dog-img').src).toBe(IMG_URL);
});
