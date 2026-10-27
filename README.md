# Lista de Perros 🐶 — Equipo 7

![CI/CD](https://github.com/samsanchez-ctrl/listadeperros_equipo7/actions/workflows/ci.yml/badge.svg)

Aplicación web que muestra imágenes aleatorias de perros obtenidas desde la API pública [dog.ceo](https://dog.ceo/dog-api/) y permite al usuario reaccionar con "me gusta" o "no me gusta". Incluye contador de reacciones, porcentaje de aprobación e historial de razas vistas.

- **Evaluación Parcial N°1:** flujo colaborativo con Git, GitHub y un CI básico.
- **Evaluación Parcial N°2:** pipeline CI/CD completo en GitHub Actions con contenedores, pruebas automatizadas, análisis de seguridad, despliegue automático y orquestación.

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

> ✍️ **Completar por el equipo (sin IA, según la pauta).** Una o dos frases por punto. Reemplazar los textos entre `[ ]`.

- **Snyk en vez de SonarQube:** [por qué]
- **Docker Compose para staging y Kubernetes para producción:** [por qué]
- **Umbrales (cobertura 80%, bloquear desde severidad HIGH):** [por qué]
- **Imagen `nginx-unprivileged` (no-root):** [por qué]
- **Cómo resolvimos el bloqueo de Trivy:** [qué pasó y qué aprendimos]

---

## 👥 Autores

- **Integrante 1** — Freddy Muñoz
- **Integrante 2** — Vicente Maulén
- **Integrante 3** — Samuel Sánchez

---

## 💭 Reflexiones individuales

> ✍️ Cada integrante escribe la suya **sin apoyo de IA** (requisito de la pauta). Reemplazar los textos entre `[ ]`.

### Freddy Muñoz

**¿Qué aprendí?** [qué no sabías hacer antes y ahora sí]

**¿Qué me costó más?** [una dificultad concreta y cómo la resolviste]

**Mi aporte al proyecto:** [qué hiciste tú]

### Vicente Maulén

**¿Qué aprendí?** [qué no sabías hacer antes y ahora sí]

**¿Qué me costó más?** [una dificultad concreta y cómo la resolviste]

**Mi aporte al proyecto:** [qué hiciste tú]

### Samuel Sánchez

**¿Qué aprendí?** [qué no sabías hacer antes y ahora sí]

**¿Qué me costó más?** [una dificultad concreta y cómo la resolviste]

**Mi aporte al proyecto:** [qué hiciste tú]

---

## 🤖 Uso de Inteligencia Artificial

> ✍️ **Revisen y ajusten este texto para que refleje exactamente cómo usaron la IA.**

Se utilizó **Claude (Anthropic)** como herramienta de apoyo para:
- EP1: estructurar el README, diseñar el workflow inicial y verificar la sintaxis del script de configuración.
- EP2: proponer la estructura del pipeline de GitHub Actions, el Dockerfile multi-stage, los manifiestos de Kubernetes, la configuración de Docker Compose y ejemplos de pruebas con Jest.

Todo el contenido generado fue revisado, ejecutado y validado por el equipo. Las decisiones técnicas, justificaciones, conclusiones y reflexiones individuales fueron escritas por los integrantes sin apoyo de IA.

> Referencia de citación IA: https://bibliotecas.duoc.cl/ia
