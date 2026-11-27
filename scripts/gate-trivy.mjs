// Gate de seguridad de la imagen: lee el reporte JSON de Trivy, muestra las
// vulnerabilidades HIGH/CRITICAL y DETIENE el pipeline si hay alguna.
// También deja las cifras como métricas para el dashboard.
// Uso: node scripts/gate-trivy.mjs trivy.json metricas/vulnerabilidades.prom
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const [reporte = 'trivy.json', archivoMetricas] = process.argv.slice(2);
const datos = JSON.parse(readFileSync(reporte, 'utf8'));

const vulnerabilidades = (datos.Results || []).flatMap((r) => r.Vulnerabilities || []);
const conteo = { CRITICAL: 0, HIGH: 0 };
for (const v of vulnerabilidades) {
  if (v.Severity in conteo) conteo[v.Severity] += 1;
}

if (archivoMetricas) {
  writeFileSync(archivoMetricas, Object.entries(conteo)
    .map(([sev, n]) => `ci_vulnerabilidades{severidad="${sev}"} ${n}`).join('\n') + '\n');
}

const total = conteo.CRITICAL + conteo.HIGH;
const resumen = process.env.GITHUB_STEP_SUMMARY;
if (resumen) {
  appendFileSync(resumen, `### 🛡️ Gate de seguridad (Trivy)\n\nCRITICAL: **${conteo.CRITICAL}** · HIGH: **${conteo.HIGH}**\n\n`);
}

if (total > 0) {
  console.log('Paquete | Vulnerabilidad | Severidad | Instalada | Corregida');
  for (const v of vulnerabilidades) {
    console.log(`${v.PkgName} | ${v.VulnerabilityID} | ${v.Severity} | ${v.InstalledVersion} | ${v.FixedVersion || '-'}`);
  }
  console.log(`::error title=Gate de seguridad::La imagen tiene ${total} vulnerabilidades HIGH/CRITICAL con corrección disponible. El despliegue se detiene.`);
  process.exit(1);
}
console.log('✅ Sin vulnerabilidades HIGH/CRITICAL con corrección disponible.');
