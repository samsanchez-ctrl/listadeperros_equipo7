// eslint.config.js — reglas de calidad de código (se ejecutan en el pipeline)
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'coverage/'] },
  js.configs.recommended,
  {
    // Código que corre en el navegador (scripts clásicos, no módulos)
    files: ['index.js', 'logica.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, module: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^(calcularPorcentaje|extraerRaza|validarRespuestaApi)$' }],
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  {
    // Tests y archivos de configuración (Node + Jest)
    files: ['tests/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest, ...globals.browser },
    },
  },
];
