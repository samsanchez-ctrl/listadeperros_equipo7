# Lista de Perros 🐶 — Equipo 7

![CI/CD](https://github.com/samsanchez-ctrl/listadeperros_equipo7/actions/workflows/ci.yml/badge.svg)

Aplicación web que muestra imágenes aleatorias de perros obtenidas desde la API pública [dog.ceo](https://dog.ceo/dog-api/) y permite al usuario reaccionar con "me gusta" o "no me gusta". Incluye contador de reacciones, porcentaje de aprobación e historial de razas vistas.

- **Evaluación Parcial N°1:** flujo colaborativo con Git, GitHub y un CI básico.
- **Evaluación Parcial N°2:** pipeline CI/CD completo en GitHub Actions con contenedores, pruebas automatizadas, análisis de seguridad, despliegue automático y orquestación.
- **Evaluación Parcial N°3:** observabilidad (Prometheus, Grafana, Loki, Alloy), métricas del pipeline en un dashboard y políticas de cumplimiento automatizadas que detienen el pipeline ante fallas críticas. Ver [Observabilidad y Cumplimiento](#-observabilidad-y-cumplimiento-ep3).

---

## 🚀 Cómo levantar el proyecto

### Opción 1 — Desarrollo (Node.js 22)

```bash
npm ci            # instala dependencias de desarrollo
npm run lint      # ESLint
npm test          # pruebas unitarias e integración (Jest)
npm run test:ci   # pruebas + reporte de cobertura
npx serve .       # sirve la app en http://localhost:3000
```

### Opción 2 — Contenedores con Docker Compose (balanceador + 3 réplicas)

```bash
docker compose up -d --build      # construye la imagen y levanta todo
# abrir http://localhost:8080
docker compose up -d --scale app=5   # escalar a 5 réplicas
docker compose down
```

### Opción 2b — Con monitoreo (Prometheus + Grafana + Loki)

```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d --build
# Grafana: http://localhost:3000 · Prometheus: http://localhost:9090
```

### Opción 3 — Kubernetes local (kind)

```bash
docker build -t listadeperros:local .
kind create cluster --name listadeperros
kind load docker-image listadeperros:local --name listadeperros
kubectl apply -f k8s/
kubectl rollout status deployment/listadeperros
kubectl port-forward service/listadeperros 8080:80
```

---

## 🌳 Estrategia de ramificación

Elegimos **GitFlow** como estrategia de ramificación porque:

- Nuestro equipo tiene 2 personas y necesitamos separar claramente el entorno de **desarrollo activo** (`develop`) del de **producción estable** (`main`).
- GitFlow permite trabajar en nuevas funcionalidades de forma aislada en ramas `feature/`, sin afectar el código que ya funciona.
- La frecuencia de cambios es baja (proyecto académico con entregas por sprints), lo que hace viable mantener ramas de feature individuales por cada tarea.
- Comparado con Trunk-Based Development, GitFlow es más adecuado para equipos pequeños que aún están aprendiendo el flujo colaborativo, ya que obliga a revisar cada cambio mediante Pull Requests antes de integrarlo.

### Estructura de ramas

| Rama | Propósito |
|---|---|
| `main` | Código estable, listo para "producción" |
| `develop` | Integración continua de nuevas funcionalidades |
| `feature/<nombre>` | Desarrollo de cada funcionalidad nueva (sale de `develop`, vuelve a `develop`) |
| `hotfix/<nombre>` | Correcciones urgentes sobre `main` (sale de `main`, vuelve a `main`) |

---

## 📝 Convenciones de commits

Usamos el estándar **Conventional Commits** para que el historial sea legible y trazable:

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | Se agrega una nueva funcionalidad |
| `fix:` | Se corrige un bug o error |
| `style:` | Cambios de CSS o apariencia visual, sin lógica |
| `docs:` | Cambios en documentación (README, comentarios) |
| `refactor:` | Reorganización de código sin cambiar comportamiento |
| `ci:` | Cambios en el pipeline de CI/CD (GitHub Actions) |

**Formato:** `<tipo>: <descripción corta en minúsculas, modo imperativo>`

**Ejemplos reales de este proyecto:**
- `feat: agrega contador de likes y dislikes`
- `fix: agrega manejo de error cuando la API falla`
- `style: mejora diseño del card y botones`
- `ci: agrega workflow básico de GitHub Actions`
- `docs: completa README con convenciones y estrategia GitFlow`

---

## 🔀 Naming de ramas

El formato para nombrar ramas es:

```
feature/<descripcion-en-kebab-case>
hotfix/<descripcion-en-kebab-case>
```

**Criterio:** el nombre debe describir brevemente qué hace esa rama, usando palabras separadas por guiones (`-`), sin mayúsculas ni espacios.

**Ejemplos de este proyecto:**
- `feature/agregar-contador-likes` — agrega el contador de reacciones
- `feature/mejorar-ui-card` — mejora el diseño visual del card
- `hotfix/fix-manejo-error-api` — corrige el manejo de errores al llamar la API

---

## 🔍 Estrategia de revisión (Pull Requests)

Para que un Pull Request sea aprobado y mergeado, debe cumplir:

1. **Título descriptivo** usando el mismo formato de commits (`feat:`, `fix:`, etc.)
2. **Descripción** explicando qué cambió y por qué
3. **Revisión del compañero**: el otro integrante del equipo debe leer el código y aprobarlo
4. **Sin errores evidentes**: el workflow de GitHub Actions debe pasar correctamente
5. **No se hace merge directo a `main`** sin PR aprobado — todo pasa por revisión

Flujo de trabajo para features:
```
feature/<nombre> → (Pull Request revisado) → develop → (PR final) → main
```

Flujo de trabajo para hotfixes:
```
hotfix/<nombre> → (Pull Request revisado) → main
```

---

## ⚙️ Pipeline CI/CD (EP2)

Archivo: [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Se ejecuta en cada push y Pull Request hacia `develop` y `main`.

```
 ┌──────────────┐
 │ 1. Calidad   │ ESLint + Jest (cobertura mínima 80%)
 └──────┬───────┘
        │            ┌──────────────────┐
        ├────────────┤ 2. Seguridad     │ npm audit + Snyk Open Source + Snyk Code
        ▼            └────────┬─────────┘
 ┌─────────────────────────────▼────┐
 │ 3. Build                         │ imagen Docker multi-stage (tag = SHA del commit)
 │                                  │ + escaneo Trivy (bloquea CRITICAL/HIGH)
 └──────────────┬───────────────────┘
                ▼
 ┌──────────────────────────────────┐
 │ 4. Staging (Docker Compose)      │ balanceador + 3 réplicas, healthchecks, smoke tests
 └──────────────┬───────────────────┘
                ▼   solo en push a main
 ┌──────────────────────────────────┐
 │ 5. Producción (Kubernetes/kind)  │ Deployment 3 réplicas, rolling update, HPA, smoke test
 └──────────────┬───────────────────┘
                ▼
 ┌──────────────────────────────────┐
 │ 6. Publicar en GHCR              │ ghcr.io/<owner>/listadeperros:<sha> y :latest
 └──────────────────────────────────┘
```

Cada etapa depende de la anterior (`needs:`): **si una falla, el pipeline se detiene y no se despliega nada.**

| Etapa | Qué hace | Indicador |
|---|---|---|
| 1 · Calidad | `npm ci`, ESLint y Jest con umbral de cobertura definido en `package.json` | IE2 |
| 2 · Seguridad | `npm audit --audit-level=high`, `snyk test` y `snyk code test` con `--severity-threshold=high` | IE3 |
| 3 · Build | Construye la imagen con Buildx (caché de GitHub), la escanea con Trivy y la guarda como artefacto | IE1, IE3 |
| 4 · Staging | `docker compose up --wait` con la imagen del commit; prueba index, `/health`, cabecera CSP y reparto entre réplicas | IE4, IE5 |
| 5 · Producción | Cluster Kubernetes efímero con kind; `kubectl apply`, `rollout status` y smoke test | IE4, IE5 |
| 6 · Publicar | Sube la imagen a GitHub Container Registry y escribe un resumen de trazabilidad | IE4 |

### 🐳 Contenedores (IE1)

- `Dockerfile` **multi-stage**: la etapa `calidad` corre lint y tests dentro del build (si fallan, no hay imagen); la etapa `produccion` solo contiene los 4 archivos estáticos.
- Imagen base `nginxinc/nginx-unprivileged:alpine`: liviana y ejecutada como **usuario no-root** (uid 101) en el puerto 8080.
- `HEALTHCHECK` contra `/health` y `.dockerignore` para no copiar `.git`, `node_modules`, etc.
- `apk upgrade` en la etapa final: instala las versiones corregidas de los paquetes del sistema de la imagen base (ver *Evidencia del bloqueo de seguridad*).

### 🔒 Seguridad (IE3)

- **Dependabot** (`.github/dependabot.yml`): revisa semanalmente npm, GitHub Actions y la imagen Docker, y abre PRs hacia `develop`.
- **Snyk** (dependencias y código) + **npm audit** + **Trivy** (imagen): cualquier hallazgo HIGH o CRITICAL **hace fallar el pipeline** y bloquea el despliegue.
- Token de GitHub con **mínimo privilegio** (`contents: read`; solo el job de publicación tiene `packages: write`). Secretos solo en GitHub Secrets.
- Nginx con cabeceras de seguridad (CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`) y sin mostrar su versión.
- Contenedores con sistema de archivos de solo lectura, `no-new-privileges` y todas las *capabilities* eliminadas (Compose y Kubernetes).
- **Evidencia del bloqueo de seguridad:** en la primera ejecución del pipeline (PR del pipeline), Trivy encontró **47 vulnerabilidades HIGH** en paquetes del sistema de la imagen base (curl, openssl, expat, pcre2, util-linux, etc.). El pipeline **se detuvo en la etapa 3** y no desplegó. Se corrigió agregando `apk upgrade` al Dockerfile y la siguiente ejecución pasó el escaneo.
- Acciones de terceros con versión fija (ej.: `trivy-action@0.35.0`, publicada como release inmutable tras el incidente de cadena de suministro de marzo de 2026).

### 📈 Escalabilidad y orquestación (IE3, IE5)

| | Docker Compose (staging) | Kubernetes (producción) |
|---|---|---|
| Réplicas | 3 (`deploy.replicas`), escalable con `--scale` | 3, autoescalado 3–10 con HPA (CPU 70%) |
| Balanceo | Nginx como balanceador (`loadbalancer/nginx.conf`) | `Service` ClusterIP |
| Recursos | Límite 0.25 CPU / 64 MB por réplica | requests/limits de CPU y memoria |
| Salud | `healthcheck` + `depends_on: service_healthy` | `readinessProbe` y `livenessProbe` |
| Disponibilidad | `restart: unless-stopped` | Rolling update con `maxUnavailable: 0` + PodDisruptionBudget (mín. 2) |

### 🧾 Trazabilidad y calidad (IE4)

La cadena completa de un cambio queda registrada:

```
issue / tarea → rama feature/* → commits (Conventional Commits) → Pull Request revisado
   → ejecución del pipeline (#run) → imagen listadeperros:<SHA> → despliegue (change-cause con SHA y autor)
```

- La imagen se etiqueta con el **SHA del commit** y lleva la etiqueta OCI `revision`, así cualquier contenedor en ejecución se puede rastrear hasta su commit.
- En Kubernetes, cada despliegue anota `change-cause` con commit, autor y número de ejecución (`kubectl rollout history`), lo que permite hacer **rollback** a una versión conocida.
- Los environments `staging` y `production` de GitHub registran cada despliegue.
- El job final escribe un **resumen** (commit, autor, ejecución, imagen) en la pestaña Summary de Actions.
- Reportes de cobertura guardados como artefactos por 14 días.
- Protección de rama: `main` y `develop` exigen PR aprobado y pipeline en verde.

### 🔧 Configuración necesaria en GitHub (una sola vez)

1. **Snyk:** crear cuenta en snyk.io → Account settings → copiar el *Auth Token* → en GitHub: *Settings → Secrets and variables → Actions → New repository secret* con nombre `SNYK_TOKEN`. Agregar el mismo secret en *Secrets → Dependabot* para que los PRs de Dependabot también pasen. Activar **Snyk Code** en *Settings → Snyk Code* dentro de Snyk.
2. **Environments:** *Settings → Environments* → crear `staging` y `production`.
3. **Protección de ramas:** *Settings → Branches* → regla para `main` y `develop`: requerir PR, 1 aprobación y que pasen los checks del pipeline.
4. **Dependabot alerts:** *Settings → Code security* → activar *Dependabot alerts* y *Dependabot security updates*.

---

## 🔭 Observabilidad y Cumplimiento (EP3)

En la EP3 el pipeline se extendió para que el microservicio **se pueda observar en ejecución** (métricas, logs, disponibilidad y alertas), para que el propio pipeline **mida su calidad** y la muestre en un dashboard, y para que **ninguna versión llegue a producción si no cumple las políticas** de seguridad y calidad.

### Arquitectura de observabilidad

```
                         ┌──────────────────── métricas ─────────────────────┐
  lb / app (Nginx) ──► nginx-exporter (peticiones, conexiones) ─┐            │
  contenedores ──────► cAdvisor (CPU, memoria por contenedor) ──┤            ▼
  /health y / ───────► Blackbox exporter (disponibilidad) ──────┼──► Prometheus ──► Grafana
  pipeline CI/CD ────► Pushgateway (cobertura, tiempos, vulns) ─┘   (alertas)       ▲
  logs JSON de Nginx ► Alloy ───────────────────────────────────────► Loki ─────────┘
```

| Herramienta | Rol | Qué permite observar | Archivo |
|---|---|---|---|
| **Prometheus** | Recolecta y guarda métricas; evalúa alertas | Todo lo numérico: tráfico, recursos, disponibilidad, CI/CD | `monitoring/prometheus/` |
| **Grafana** | Dashboard personalizado | Una vista única de app + pipeline | `monitoring/grafana/` |
| **Loki** | Almacena logs | Búsqueda de logs y conteo de errores 4xx/5xx | `monitoring/loki/` |
| **Alloy** | Recolecta logs de los contenedores | Envía los logs a Loki etiquetados por servicio y código HTTP | `monitoring/alloy/` |
| **Nginx Exporter** | Traduce `stub_status` de Nginx a métricas | Peticiones por segundo, conexiones activas | `docker-compose.monitoring.yml` |
| **cAdvisor** | Métricas de contenedores | Uso de CPU y memoria de cada réplica | `docker-compose.monitoring.yml` |
| **Blackbox Exporter** | Prueba la app desde afuera | Disponibilidad (`/health`) y latencia de la página | `monitoring/prometheus/prometheus.yml` |
| **Pushgateway** | Recibe métricas del pipeline | Cobertura, pruebas, tiempo de despliegue, vulnerabilidades, políticas | `docker-compose.monitoring.yml` |
| **kube-prometheus-stack** | Monitoreo en Kubernetes (producción) | Réplicas, reinicios, memoria por pod, métricas de Nginx vía `ServiceMonitor` | `k8s/monitoring/` |

**Cambios en la app para hacerla observable:**
- Nginx escribe sus logs de acceso en **JSON** (`nginx.conf`, `loadbalancer/nginx.conf`), lo que permite filtrar por código HTTP.
- Nginx expone `stub_status` en un **puerto interno 8081** (solo redes privadas), que lee el exportador.
- En Kubernetes cada réplica lleva un **sidecar `nginx-exporter`** y el `Service` publica el puerto `metrics`.

### Levantar el monitoreo localmente

```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d --build
bash monitoring/scripts/generar-trafico.sh      # genera tráfico y algunos 404 controlados
```

| Servicio | URL |
|---|---|
| App | http://localhost:8080 |
| Grafana (dashboard) | http://localhost:3000 |
| Prometheus (métricas y alertas) | http://localhost:9090/alerts |
| Pushgateway | http://localhost:9091 |

La clave de administrador de Grafana se define con la variable `GRAFANA_ADMIN_PASSWORD` (no está escrita en el código). Para ver el dashboard no hace falta iniciar sesión: hay acceso anónimo de solo lectura.

### Dashboard: "Lista de Perros — Observabilidad y CI/CD"

Archivo versionado: `monitoring/grafana/dashboards/listadeperros.json` (Grafana lo carga solo al iniciar).

| Sección | Métricas | Fuente |
|---|---|---|
| 🟢 Disponibilidad | Estado de `/health`, % de disponibilidad, réplicas activas, latencia, peticiones/s, alertas activas | Blackbox, cAdvisor, Nginx Exporter, Prometheus |
| 🚀 Pipeline CI/CD | **Cobertura de pruebas**, pruebas ejecutadas y fallidas, **tiempo de despliegue**, vulnerabilidades HIGH/CRITICAL, políticas de cumplimiento OK, duración de cada etapa, commit desplegado | Pushgateway (enviado por el pipeline) |
| ⚠️ Errores y logs | **Errores registrados** por código HTTP, total de errores, últimos logs con error | Loki |
| 🖥️ Recursos | **Uso de CPU y memoria** por servicio, tráfico y conexiones | cAdvisor, Nginx Exporter |

### Alertas configuradas

| Alerta | Condición | Decisión que habilita |
|---|---|---|
| `ListaDePerrosCaida` | `/health` falla por 1 minuto | Revisar logs en Loki y reiniciar o hacer rollback |
| `LatenciaAlta` | La página tarda más de 1 s por 2 minutos | Escalar réplicas o revisar recursos |
| `MetricasNginxNoDisponibles` | El exportador no puede leer Nginx | Revisar el puerto interno 8081 |
| `MemoriaAltaReplica` | Una réplica supera 50 MB (límite 64 MB) | Buscar fuga de memoria o ajustar límites |
| `CoberturaBajoUmbral` | Cobertura < 80% | No desplegar hasta agregar pruebas |
| `VulnerabilidadesEnImagen` | Trivy reporta HIGH/CRITICAL | Actualizar imagen base antes de desplegar |
| `ListaDePerrosSinReplicasDisponibles` (K8s) | Menos de 2 réplicas disponibles | Revisar eventos del deployment |
| `ListaDePerrosReinicios` (K8s) | Más de 2 reinicios en 10 minutos | Revisar logs del pod |

### Integración en el pipeline CI/CD

| Etapa | Qué agrega en la EP3 | Métricas que envía al dashboard |
|---|---|---|
| 1 · Calidad | Reporte de cobertura en JSON | `ci_cobertura_*`, `ci_tests_total`, `ci_tests_fallidos` |
| 2 · Seguridad | — | Duración de la etapa |
| 3 · **Cumplimiento** *(nueva)* | Título de PR, **Gitleaks** (secretos en código e historial) y **auditoría de políticas** | `ci_auditoria_politicas_*` |
| 4 · Build | Trivy genera reporte JSON y un **gate** explícito decide si sigue | `ci_vulnerabilidades`, tamaño de imagen |
| 5 · Staging | Mide el **tiempo de despliegue** | `ci_despliegue_duracion_segundos` |
| 6 · **Observabilidad** *(nueva)* | Levanta app + monitoreo, envía las métricas del pipeline al Pushgateway, genera tráfico, **verifica** que métricas, logs y alertas existan y **toma una captura del dashboard** | — |
| 7 · Producción | Instala **kube-prometheus-stack** en el cluster, aplica `ServiceMonitor` y `PrometheusRule`, y **verifica** que Prometheus monitorea las 3 réplicas | Tiempo de despliegue en Kubernetes (resumen) |

**Evidencias que deja cada ejecución** (pestaña *Actions → ejecución → Artifacts*):
- `observabilidad-<sha>`: captura del dashboard (`dashboard-grafana.png`), targets y alertas de Prometheus, logs de error de Loki y las métricas enviadas.
- `auditoria-<sha>`: reporte JSON de la auditoría de cumplimiento.
- `cobertura-<sha>`: reporte de cobertura de Jest.

**Cómo apoya la toma de decisiones técnicas:**
- **¿Se puede desplegar?** El dashboard y los gates muestran cobertura, vulnerabilidades y políticas antes de llegar a producción.
- **¿El pipeline se está volviendo lento?** La duración por etapa muestra dónde optimizar.
- **¿La app está sana?** Disponibilidad, latencia y errores 4xx/5xx en tiempo real; las alertas avisan sin tener que mirar.
- **¿Hace falta escalar?** CPU y memoria por réplica frente a los límites definidos.
- **¿Qué versión está corriendo?** El panel "Commit desplegado" y la anotación `listadeperros/commit` en Kubernetes.

### 📋 Políticas de cumplimiento (auditoría automatizada)

`scripts/auditoria.mjs` revisa el repositorio en cada ejecución. Una política **crítica** que no se cumple **detiene el pipeline**. El resultado se publica en el resumen de la ejecución y como artefacto.

| ID | Política | Norma de referencia | Severidad |
|---|---|---|---|
| POL-01 | La imagen final no se ejecuta como root | CIS Docker Benchmark 4.1 | Crítica |
| POL-02 | La imagen define un HEALTHCHECK | CIS Docker Benchmark 4.6 | Crítica |
| POL-03 | Imágenes con versión fija (sin `:latest`) | CIS Docker Benchmark 4.2 · OWASP CICD-SEC-3 | Crítica |
| POL-04 | Pods con contexto de seguridad restringido | Kubernetes Pod Security Standards (restricted) | Crítica |
| POL-05 | Todos los contenedores limitan CPU y memoria | CIS Kubernetes Benchmark 5.7 · ISO/IEC 25010 | Crítica |
| POL-06 | Sondas de salud liveness y readiness | ISO/IEC 25010 (fiabilidad) | Crítica |
| POL-07 | El pipeline usa permisos mínimos | OWASP CICD-SEC-5 | Crítica |
| POL-08 | Acciones de terceros con versión fija | OWASP CICD-SEC-8 | Crítica |
| POL-09 | No hay secretos escritos en el repositorio | OWASP CICD-SEC-6 · ISO/IEC 27001 A.8.24 | Crítica |
| POL-10 | Dependencias solo con licencias permitidas | ISO/IEC 27001 A.5.32 | Crítica |
| POL-11 | Commits del PR siguen Conventional Commits | OWASP CICD-SEC-1 | Crítica |
| POL-12 | El servicio desplegado es observable | OWASP CICD-SEC-10 | Crítica |
| POL-13 | Documentación obligatoria presente | ISO/IEC 27001 A.5.37 | Advertencia |

Además de la auditoría:
- **Gitleaks** busca secretos en los archivos actuales y en **todo el historial** de commits.
- El **título de cada Pull Request** debe seguir Conventional Commits.
- **Protección de ramas** en GitHub para `main` y `develop` (ver abajo).
- Se mantienen los controles de la EP2: ESLint, cobertura mínima, npm audit, Snyk, Trivy y Dependabot.

#### Configurar la protección de ramas (dueño del repositorio, una sola vez)

*Settings → Branches → Add branch ruleset* (o *Add rule*) para `main` y luego para `develop`:
1. **Require a pull request before merging** → *Require approvals*: 1.
2. **Require status checks to pass** → agregar: `1 · Lint y pruebas unitarias`, `2 · Seguridad (npm audit + Snyk)`, `3 · Cumplimiento y auditoría (políticas + secretos)`, `4 · Build de imagen Docker + gate de seguridad Trivy`, `5 · Despliegue staging (Docker Compose, 3 réplicas)` y `6 · Observabilidad (Prometheus, Grafana, Loki) y métricas del pipeline`.
3. **Block force pushes** y **Restrict deletions**.

Con esto, GitHub no permite mergear un cambio que no pasó los controles.

### 🛑 El pipeline se detiene ante fallas críticas

| Falla | Dónde se detecta | Qué pasa |
|---|---|---|
| Un test falla o la cobertura baja de 80% | 1 · Calidad | No se construye la imagen |
| Dependencia vulnerable (HIGH/CRITICAL) | 2 · Seguridad (npm audit, Snyk) | No se construye la imagen |
| Secreto en el código o en el historial | 3 · Cumplimiento (Gitleaks, POL-09) | No se construye la imagen |
| Política crítica incumplida (root, sin límites, sin probes, etc.) | 3 · Cumplimiento (auditoría) | No se construye la imagen |
| Imagen con vulnerabilidades HIGH/CRITICAL | 4 · Build (gate Trivy) | La imagen no se despliega |
| La app no responde o falla un smoke test | 5 · Staging | No llega a producción |
| La app no se puede monitorear (faltan métricas o logs) | 6 · Observabilidad | No llega a producción |
| Rollout fallido o Prometheus no ve las réplicas | 7 · Producción | No se publica la imagen |

**Demostración controlada:** *Actions → CI/CD — Lista de Perros → Run workflow* y elegir en **simular_falla**:
- `calidad`: exige 101% de cobertura → la etapa 1 falla y nada se despliega.
- `seguridad`: agrega una clave privada falsa → Gitleaks y la auditoría la detectan, la etapa 3 falla y nada se despliega.

Evidencia real previa (EP2): Trivy detectó **47 vulnerabilidades HIGH** en la imagen base y el pipeline se detuvo hasta corregirlas.

### ☁️ Entorno de ejecución

El entorno productivo es un **cluster Kubernetes (kind) creado en cada ejecución sobre los runners en la nube de GitHub Actions**, con el monitoreo instalado automáticamente por el pipeline. Es un entorno cloud simulado: se crea, se despliega, se verifica y se destruye en cada ejecución, por lo que sus métricas quedan registradas en el resumen y los artefactos de cada ejecución.

---

## 📁 Estructura de carpetas

```
listadeperros_equipo7/
├── .github/
│   ├── workflows/ci.yml          ← Pipeline CI/CD
│   ├── dependabot.yml            ← Actualizaciones automáticas de dependencias
│   └── pull_request_template.md  ← Checklist de cada PR
├── k8s/                          ← Manifiestos de Kubernetes
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── pdb.yaml
├── k8s/monitoring/               ← ServiceMonitor, alertas y valores de kube-prometheus-stack
├── monitoring/                   ← Prometheus, Grafana (dashboard), Loki, Alloy y scripts
├── scripts/                      ← Auditoría de cumplimiento y gate de Trivy
├── docker-compose.monitoring.yml ← Stack de observabilidad
├── loadbalancer/nginx.conf       ← Balanceador para Docker Compose
├── tests/
│   ├── logica.test.js            ← Pruebas unitarias
│   └── app.test.js               ← Pruebas de integración de la interfaz (jsdom)
├── Dockerfile                    ← Imagen multi-stage
├── docker-compose.yml            ← Orquestación local / staging
├── nginx.conf                    ← Configuración del servidor dentro del contenedor
├── eslint.config.js              ← Reglas de linting
├── package.json                  ← Scripts, dependencias y umbral de cobertura
├── index.html / index.js / style.css
├── logica.js                     ← Funciones puras (testeables)
└── README.md
```

---

## 🧠 Decisiones técnicas del equipo

**¿Por qué usamos Snyk y no SonarQube?**
Porque Snyk era mucho más rápido de conectar y te revisa todo de una. SonarQube nos pedía armar un servidor aparte y era complicarse la vida sin necesidad.

**¿Por qué Docker Compose para staging y Kubernetes para producción?**
Compose sirve para hacer pruebas rápidas y ver que la página levante bien. Kubernetes se usa al final porque si la página se cae, la levanta sola y aguanta a mucha gente sin pegarse.

**¿Por qué un mínimo de 80% de cobertura y bloquear desde vulnerabilidades HIGH?**
El 80% te asegura que probaste casi todo el código sin volverte loco. Y lo paramos en HIGH porque esos sí son errores graves; si frenamos por errores chicos, no avanzamos nunca.

**¿Por qué la imagen `nginx-unprivileged` en vez de la normal?**
Porque no tiene permisos de dueño. Si alguien se mete a hackear el contenedor, no va a poder hacer casi nada porque no tiene el control.

**¿Qué pasó con el bloqueo de Trivy y qué aprendimos?**
La base de la app venía con fallos de fábrica. Trivy nos frenó todo y aprendimos que hay que actualizar las cosas desde el principio para que el sistema no te rebaje el trabajo.

---

## 🧠 Decisiones técnicas EP3

> ✍️ **Completar por el equipo (sin IA, según la pauta).** Una o dos frases por punto.

**¿Por qué Prometheus + Grafana + Loki y no AWS CloudWatch?**
[por qué]

**¿Qué métricas elegimos para el dashboard y qué decisión permite tomar cada una?**
[por qué]

**¿Por qué el pipeline se detiene si la app no se puede monitorear?**
[por qué]

**¿Por qué estas políticas de cumplimiento y estas normas (CIS, OWASP, ISO 27001)?**
[por qué]

**¿Qué haríamos distinto en un entorno productivo real?**
[por qué]

---

## 👥 Autores

- **Integrante 1** — Freddy Muñoz
- **Integrante 2** — Vicente Maulén
- **Integrante 3** — Samuel Sánchez

---

## 💭 Conclusiones y reflexiones individuales (EP3)

> ✍️ Cada integrante escribe la suya **sin apoyo de IA** (requisito de la pauta).

### Vicente Maulén

**¿Qué aprendí?** [qué no sabías hacer antes y ahora sí]

**¿Qué me costó más?** [una dificultad concreta y cómo la resolviste]

**Mi aporte al proyecto:** [qué hiciste tú]

### [Compañero/a de pareja]

**¿Qué aprendí?** [qué no sabías hacer antes y ahora sí]

**¿Qué me costó más?** [una dificultad concreta y cómo la resolviste]

**Mi aporte al proyecto:** [qué hiciste tú]

---

## 💭 Reflexiones individuales (EP2)

> Escritas por cada integrante sin apoyo de IA.

### Vicente Maulén

**¿Qué aprendí?** No sabía cómo usar Docker para meter la app en un contenedor y que corriera igual en cualquier lado.

**¿Qué me costó más?** Me costó que el contenedor levantara a la primera porque me faltaban cosas en la configuración. Lo arreglé mirando los errores en la terminal y probando de nuevo.

**Mi aporte al proyecto:** Armé el archivo de Docker y probé que la app funcionara bien empaquetada.

### Freddy Muñoz

**¿Qué aprendí?** No sabía cómo pasarle herramientas de seguridad como Snyk o Trivy al proyecto para buscar fallos.

**¿Qué me costó más?** Entender las alertas de seguridad que salían en los escaneos. Lo solucioné actualizando las librerías que daban problemas y volviendo a probar que la página cargara los perros sin caerse.

**Mi aporte al proyecto:** Me encargué de correr los escaneos de seguridad y solucionar los fallos que iban saliendo.

### Samuel Sánchez

**¿Qué aprendí?** Aprendí a configurar el pipeline para automatizar las pruebas y a usar Kubernetes para subir la app.

**¿Qué me costó más?** Que el pipeline pasara completo sin fallar en las pruebas o en el despliegue. Lo solucioné revisando los fallos que tiraba el flujo y haciendo ajustes con el grupo.

**Mi aporte al proyecto:** Subí el código, configuré la automatización del pipeline y la parte de Kubernetes.

---

## 🤖 Uso de Inteligencia Artificial

> ✍️ **Revisen y ajusten este texto para que refleje exactamente cómo usaron la IA.**

Se utilizó **Claude (Anthropic)** como herramienta de apoyo para:
- EP1: estructurar el README, diseñar el workflow inicial y verificar la sintaxis del script de configuración.
- EP2: proponer la estructura del pipeline de GitHub Actions, el Dockerfile multi-stage, los manifiestos de Kubernetes, la configuración de Docker Compose y ejemplos de pruebas con Jest.
- EP3: proponer la configuración del stack de monitoreo (Prometheus, Grafana, Loki, Alloy y exporters), el dashboard, los scripts de auditoría y de verificación de observabilidad, y la extensión del pipeline.

Todo el contenido generado fue revisado, ejecutado y validado por el equipo. Las decisiones técnicas, justificaciones, conclusiones y reflexiones individuales fueron escritas por los integrantes sin apoyo de IA.

> Referencia de citación IA: https://bibliotecas.duoc.cl/ia
