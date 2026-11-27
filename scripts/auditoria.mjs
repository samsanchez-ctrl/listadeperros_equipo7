// scripts/auditoria.mjs — Auditoría automatizada de cumplimiento
//
// Revisa el repositorio contra políticas basadas en estándares del sector
// (CIS Docker Benchmark, Kubernetes Pod Security Standards, OWASP Top 10
// CI/CD Security Risks e ISO/IEC 27001). Si una política CRÍTICA falla,
// termina con código 1 y el pipeline se detiene.
//
// Uso: node scripts/auditoria.mjs [archivo_metricas.prom]
// Variables opcionales: BASE_SHA y HEAD_SHA (commits de un Pull Request).

import { readFileSync, existsSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { parseAllDocuments } from 'yaml';

const resultados = [];

function politica(id, nombre, norma, severidad, evaluar) {
  let detalle;
  try {
    detalle = evaluar() || [];
  } catch (error) {
    detalle = [`No se pudo evaluar: ${error.message}`];
  }
  resultados.push({ id, nombre, norma, severidad, cumple: detalle.length === 0, detalle });
}

const leer = (ruta) => readFileSync(ruta, 'utf8');
const yamlDocs = (ruta) => parseAllDocuments(leer(ruta)).map((d) => d.toJS()).filter(Boolean);

// ——— Contenedores (CIS Docker Benchmark) ———

const dockerfile = leer('Dockerfile');
const etapas = dockerfile.split(/^FROM /m).slice(1);
const etapaFinal = etapas[etapas.length - 1] || '';

politica('POL-01', 'La imagen final no se ejecuta como root', 'CIS Docker Benchmark 4.1', 'critica', () => {
  const usuarios = [...etapaFinal.matchAll(/^USER\s+(\S+)/gm)].map((m) => m[1]);
  const ultimo = usuarios[usuarios.length - 1];
  return !ultimo || ['root', '0'].includes(ultimo) ? [`Último USER de la etapa final: ${ultimo || 'ninguno'}`] : [];
});

politica('POL-02', 'La imagen define un HEALTHCHECK', 'CIS Docker Benchmark 4.6', 'critica', () =>
  /^HEALTHCHECK\s+(?!NONE)/m.test(etapaFinal) ? [] : ['La etapa final no tiene HEALTHCHECK']);

politica('POL-03', 'Imágenes con versión fija (sin :latest ni etiqueta vacía)', 'CIS Docker Benchmark 4.2 · OWASP CICD-SEC-3', 'critica', () => {
  const imagenes = [...dockerfile.matchAll(/^FROM\s+(\S+)/gm)].map((m) => ['Dockerfile', m[1]]);
  for (const archivo of ['docker-compose.yml', 'docker-compose.monitoring.yml']) {
    for (const doc of yamlDocs(archivo)) {
      for (const [nombre, servicio] of Object.entries(doc.services || {})) {
        if (servicio.image && !servicio.image.includes('${')) imagenes.push([`${archivo} (${nombre})`, servicio.image]);
      }
    }
  }
  for (const doc of yamlDocs('k8s/deployment.yaml')) {
    for (const c of doc.spec?.template?.spec?.containers || []) {
      if (c.image !== 'listadeperros:local') imagenes.push([`k8s/deployment.yaml (${c.name})`, c.image]);
    }
  }
  return imagenes
    .filter(([, img]) => !img.includes(':') || img.endsWith(':latest'))
    .map(([donde, img]) => `${donde}: ${img}`);
});

// ——— Kubernetes (Pod Security Standards "restricted" · CIS Kubernetes) ———

const deployment = yamlDocs('k8s/deployment.yaml').find((d) => d.kind === 'Deployment');
const pod = deployment?.spec?.template?.spec || {};
const contenedores = pod.containers || [];

politica('POL-04', 'Pods con contexto de seguridad restringido', 'Kubernetes Pod Security Standards (restricted)', 'critica', () => {
  const fallas = [];
  if (pod.securityContext?.runAsNonRoot !== true) fallas.push('El pod no declara runAsNonRoot: true');
  for (const c of contenedores) {
    const sc = c.securityContext || {};
    if (sc.allowPrivilegeEscalation !== false) fallas.push(`${c.name}: allowPrivilegeEscalation debe ser false`);
    if (sc.readOnlyRootFilesystem !== true) fallas.push(`${c.name}: readOnlyRootFilesystem debe ser true`);
    if (!(sc.capabilities?.drop || []).includes('ALL')) fallas.push(`${c.name}: debe eliminar todas las capabilities`);
  }
  return fallas;
});

politica('POL-05', 'Todos los contenedores limitan CPU y memoria', 'CIS Kubernetes Benchmark 5.7 · ISO/IEC 25010 (eficiencia)', 'critica', () =>
  contenedores.flatMap((c) => {
    const r = c.resources || {};
    return ['cpu', 'memory'].flatMap((recurso) => [
      r.requests?.[recurso] ? null : `${c.name}: falta requests.${recurso}`,
      r.limits?.[recurso] ? null : `${c.name}: falta limits.${recurso}`,
    ]).filter(Boolean);
  }));

politica('POL-06', 'La aplicación tiene sondas de salud (liveness y readiness)', 'ISO/IEC 25010 (fiabilidad)', 'critica', () => {
  const web = contenedores.find((c) => c.name === 'web');
  if (!web) return ['No existe el contenedor web'];
  return [!web.livenessProbe && 'Falta livenessProbe', !web.readinessProbe && 'Falta readinessProbe'].filter(Boolean);
});

// ——— Pipeline CI/CD (OWASP Top 10 CI/CD Security Risks) ———

const workflow = yamlDocs('.github/workflows/ci.yml')[0];

politica('POL-07', 'El pipeline usa permisos mínimos', 'OWASP CICD-SEC-5', 'critica', () => {
  const fallas = [];
  const global = workflow.permissions;
  if (!global) fallas.push('Falta el bloque permissions global');
  if (global === 'write-all') fallas.push('permissions global es write-all');
  if (global && typeof global === 'object' && Object.values(global).includes('write')) fallas.push('El bloque global otorga permisos de escritura');
  for (const [nombre, job] of Object.entries(workflow.jobs || {})) {
    if (job.permissions === 'write-all') fallas.push(`${nombre}: write-all`);
  }
  return fallas;
});

politica('POL-08', 'Acciones de terceros con versión fija (no @main/@master)', 'OWASP CICD-SEC-8', 'critica', () =>
  Object.entries(workflow.jobs || {}).flatMap(([nombre, job]) =>
    (job.steps || [])
      .filter((s) => s.uses && !s.uses.startsWith('./'))
      .filter((s) => !s.uses.includes('@') || /@(main|master|latest)$/.test(s.uses))
      .map((s) => `${nombre}: ${s.uses}`)));

// ——— Secretos (OWASP CICD-SEC-6 · ISO/IEC 27001 A.8.24) ———

const archivos = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' })
  .split('\n')
  .filter((f) => f && existsSync(f) && !f.startsWith('node_modules/') && f !== 'scripts/auditoria.mjs' && f !== 'package-lock.json');

const patronesSecretos = [
  ['Clave privada', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AWS Access Key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Token de GitHub', /\b(ghp|gho|ghs|ghu)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
  ['Token de Slack', /\bxox[abpr]-[A-Za-z0-9-]{10,}/],
  ['Contraseña escrita en el código', /(password|passwd|contrasena|clave)\s*[:=]\s*["'][^"'${}\s]{6,}["']/i],
];

politica('POL-09', 'No hay secretos escritos en el repositorio', 'OWASP CICD-SEC-6 · ISO/IEC 27001 A.8.24', 'critica', () =>
  archivos.flatMap((archivo) => {
    let contenido;
    try { contenido = leer(archivo); } catch { return []; }
    return patronesSecretos.filter(([, re]) => re.test(contenido)).map(([tipo]) => `${archivo}: posible ${tipo}`);
  }));

// ——— Dependencias (ISO/IEC 27001 A.5.32 · OWASP CICD-SEC-3) ———

const licenciasPermitidas = /^(MIT|MIT-0|ISC|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|0BSD|BlueOak-1\.0\.0|CC0-1\.0|CC-BY-4\.0|Python-2\.0|Unlicense)$/;

politica('POL-10', 'Dependencias solo con licencias permitidas', 'ISO/IEC 27001 A.5.32', 'critica', () => {
  const paquetes = JSON.parse(leer('package-lock.json')).packages || {};
  return Object.entries(paquetes)
    .filter(([ruta]) => ruta)
    .flatMap(([ruta, p]) => {
      const licencia = typeof p.license === 'string' ? p.license : '';
      const partes = licencia.replace(/[()]/g, '').split(/\s+(?:OR|AND)\s+/);
      const ok = licencia && (licencia.includes(' OR ')
        ? partes.some((l) => licenciasPermitidas.test(l))
        : partes.every((l) => licenciasPermitidas.test(l)));
      return ok ? [] : [`${ruta.replace(/^node_modules\//, '')}: ${licencia || 'sin licencia declarada'}`];
    });
});

// ——— Trazabilidad (OWASP CICD-SEC-1) ———

politica('POL-11', 'Commits del Pull Request siguen Conventional Commits', 'OWASP CICD-SEC-1 (trazabilidad)', 'critica', () => {
  const { BASE_SHA, HEAD_SHA } = process.env;
  if (!BASE_SHA || !HEAD_SHA) return [];
  const convencional = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|release)(\([\w./-]+\))?!?: .+/;
  return execSync(`git log --no-merges --format=%s ${BASE_SHA}..${HEAD_SHA}`, { encoding: 'utf8' })
    .split('\n').filter(Boolean)
    .filter((mensaje) => !convencional.test(mensaje))
    .map((mensaje) => `Mensaje no convencional: "${mensaje}"`);
});

// ——— Observabilidad (OWASP CICD-SEC-10) ———

politica('POL-12', 'El servicio desplegado es observable (métricas, logs y alertas)', 'OWASP CICD-SEC-10', 'critica', () => {
  const requeridos = [
    'docker-compose.monitoring.yml',
    'monitoring/prometheus/prometheus.yml',
    'monitoring/prometheus/reglas/alertas.yml',
    'monitoring/alloy/config.alloy',
    'monitoring/grafana/dashboards/listadeperros.json',
    'k8s/monitoring/servicemonitor.yaml',
    'k8s/monitoring/alertas.yaml',
  ];
  const fallas = requeridos.filter((f) => !existsSync(f)).map((f) => `Falta ${f}`);
  if (!contenedores.some((c) => (c.ports || []).some((p) => p.name === 'metrics'))) {
    fallas.push('Ningún contenedor del deployment expone el puerto "metrics"');
  }
  return fallas;
});

politica('POL-13', 'Documentación obligatoria presente', 'ISO/IEC 27001 A.5.37 (procedimientos documentados)', 'advertencia', () => {
  const readme = leer('README.md');
  return ['Uso de Inteligencia Artificial', 'Reflexiones', 'Observabilidad', 'Cumplimiento']
    .filter((seccion) => !readme.includes(seccion))
    .map((seccion) => `El README no tiene la sección "${seccion}"`);
});

// ——— Reporte ———

const fallasCriticas = resultados.filter((r) => !r.cumple && r.severidad === 'critica');
const fallidas = resultados.filter((r) => !r.cumple);

mkdirSync('reportes', { recursive: true });
writeFileSync('reportes/auditoria.json', JSON.stringify({
  fecha: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  total: resultados.length,
  fallidas: fallidas.length,
  resultados,
}, null, 2));

const tabla = [
  '### 📋 Auditoría de cumplimiento',
  '',
  `**${resultados.length - fallidas.length} de ${resultados.length} políticas cumplen.**`,
  '',
  '| | ID | Política | Norma de referencia | Severidad |',
  '|---|---|---|---|---|',
  ...resultados.map((r) => `| ${r.cumple ? '✅' : r.severidad === 'critica' ? '❌' : '⚠️'} | ${r.id} | ${r.nombre} | ${r.norma} | ${r.severidad} |`),
  '',
].join('\n');

console.log(tabla);
for (const r of fallidas) {
  console.log(`\n${r.severidad === 'critica' ? '❌' : '⚠️'} ${r.id} ${r.nombre}`);
  for (const d of r.detalle) console.log(`   - ${d}`);
}
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${tabla}\n`);

const archivoMetricas = process.argv[2];
if (archivoMetricas) {
  writeFileSync(archivoMetricas, [
    `ci_auditoria_politicas_total ${resultados.length}`,
    `ci_auditoria_politicas_fallidas ${fallidas.length}`,
  ].join('\n') + '\n');
}

if (fallasCriticas.length > 0) {
  console.log(`\n::error title=Auditoría de cumplimiento::${fallasCriticas.length} políticas críticas no se cumplen. El pipeline se detiene.`);
  process.exit(1);
}
console.log('\n✅ Todas las políticas críticas se cumplen.');
