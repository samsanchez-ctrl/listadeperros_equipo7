// Pruebas unitarias de las funciones puras (logica.js)
const { calcularPorcentaje, extraerRaza, validarRespuestaApi } = require('../logica');

describe('calcularPorcentaje', () => {
  test('sin reacciones devuelve 0 (no divide por cero)', () => {
    expect(calcularPorcentaje(0, 0)).toBe(0);
  });

  test('solo likes devuelve 100', () => {
    expect(calcularPorcentaje(5, 0)).toBe(100);
  });

  test('solo dislikes devuelve 0', () => {
    expect(calcularPorcentaje(0, 3)).toBe(0);
  });

  test('redondea al entero más cercano', () => {
    expect(calcularPorcentaje(1, 2)).toBe(33);
    expect(calcularPorcentaje(2, 1)).toBe(67);
  });

  test('rechaza valores negativos o no numéricos', () => {
    expect(() => calcularPorcentaje(-1, 2)).toThrow();
    expect(() => calcularPorcentaje('abc', 2)).toThrow();
  });
});

describe('extraerRaza', () => {
  test('obtiene la raza desde una URL de dog.ceo', () => {
    expect(extraerRaza('https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg'))
      .toBe('hound-afghan');
  });

  test('devuelve "desconocida" con URL sin /breeds/', () => {
    expect(extraerRaza('https://ejemplo.cl/foto.jpg')).toBe('desconocida');
  });

  test('devuelve "desconocida" con valores inválidos', () => {
    expect(extraerRaza(undefined)).toBe('desconocida');
    expect(extraerRaza('https://images.dog.ceo/breeds/')).toBe('desconocida');
  });
});

describe('validarRespuestaApi', () => {
  test('acepta una respuesta válida y devuelve la URL', () => {
    const url = 'https://images.dog.ceo/breeds/pug/n02110958_1975.jpg';
    expect(validarRespuestaApi({ status: 'success', message: url })).toBe(url);
  });

  test('rechaza respuestas con estado de error', () => {
    expect(() => validarRespuestaApi({ status: 'error', message: 'x' })).toThrow();
  });

  test('rechaza respuestas vacías', () => {
    expect(() => validarRespuestaApi(null)).toThrow();
  });

  test('rechaza URLs que no sean https', () => {
    expect(() => validarRespuestaApi({ status: 'success', message: 'http://inseguro.cl/a.jpg' }))
      .toThrow(/https/);
  });
});
