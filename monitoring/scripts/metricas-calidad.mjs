// Convierte los resultados de Jest (pruebas y cobertura) a formato Prometheus
// para enviarlos al Pushgateway. Uso: node metricas-calidad.mjs > metricas/calidad.prom
import { readFileSync } from 'node:fs';

const cobertura = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8')).total;
const pruebas = JSON.parse(readFileSync('jest-resultados.json', 'utf8'));

const lineas = [
  `ci_cobertura_lineas_porcentaje ${cobertura.lines.pct}`,
  `ci_cobertura_ramas_porcentaje ${cobertura.branches.pct}`,
  `ci_cobertura_funciones_porcentaje ${cobertura.functions.pct}`,
  `ci_tests_total ${pruebas.numTotalTests}`,
  `ci_tests_fallidos ${pruebas.numFailedTests}`,
];
console.log(lineas.join('\n'));
