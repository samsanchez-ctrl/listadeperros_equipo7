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

// Ventana alta: Grafana 12 solo dibuja los paneles que están dentro de la pantalla,
// así que se usa una ventana donde cabe el dashboard completo.
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 3000 } });
pagina.on('console', (m) => { if (m.type() === 'error') console.log(`[grafana] ${m.text()}`); });

await pagina.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

// Recorre la página para activar la carga de todos los paneles
for (let y = 0; y <= 3000; y += 500) {
  await pagina.mouse.wheel(0, 500);
  await pagina.waitForTimeout(300);
}
await pagina.mouse.wheel(0, -5000);

// Espera a que existan los paneles y a que terminen de consultar datos
const selector = '[data-viz-panel-key], [data-testid="data-testid panel content"], .react-grid-item';
await pagina.waitForSelector(selector, { timeout: 60000 }).catch(() => {});
await pagina.waitForTimeout(20000);
const paneles = await pagina.locator(selector).count();
console.log(`Paneles encontrados en la página: ${paneles}`);

await pagina.screenshot({ path: salida, fullPage: true });
await navegador.close();
console.log(`Captura guardada en ${salida}`);
