// Toma una captura del dashboard de Grafana para dejarla como evidencia
// en los artefactos del pipeline. Uso: node captura-dashboard.mjs <salida.png>
import { chromium } from 'playwright';

const salida = process.argv[2] || 'dashboard.png';
const url = process.env.GRAFANA_URL
  || 'http://localhost:3000/d/listadeperros-obs?orgId=1&from=now-15m&to=now&kiosk';

// Usa el Google Chrome ya instalado en el equipo (los runners de GitHub lo traen);
// con NAVEGADOR=chromium usa el navegador descargado por Playwright.
const canal = process.env.NAVEGADOR || 'chrome';
const navegador = await chromium.launch(canal === 'chromium' ? {} : { channel: canal });
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 } });
await pagina.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
// Espera a que los paneles terminen de consultar los datos
await pagina.waitForTimeout(15000);
await pagina.screenshot({ path: salida, fullPage: true });
await navegador.close();
console.log(`Captura guardada en ${salida}`);
