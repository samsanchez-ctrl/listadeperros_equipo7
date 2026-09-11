# Lista de Perros 🐶 — Equipo 7

Aplicación web que muestra imágenes aleatorias de perros obtenidas desde la API pública [dog.ceo](https://dog.ceo/dog-api/) y permite al usuario reaccionar con "me gusta" o "no me gusta". Incluye contador de reacciones e historial de razas vistas.

Este repositorio es la base de trabajo para la **Evaluación Parcial N°1** de Ingeniería DevOps (DOY0101). A partir de este código, el equipo construyó su propio flujo de trabajo colaborativo aplicando Git, GitHub y GitHub Actions.

---

## 🚀 Cómo levantar el proyecto localmente

No requiere instalación de dependencias. Basta con abrir `index.html` directamente en el navegador, o servirlo con cualquier servidor estático:

```bash
npx serve .
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

## ⚙️ Automatización CI/CD

Configuramos un workflow en `.github/workflows/ci.yml` que se activa automáticamente en dos eventos:

- **Push a `develop`**: valida que los archivos clave del proyecto existan y tengan contenido
- **Pull Request hacia `main`**: ejecuta la misma verificación antes de permitir el merge

### ¿Qué hace el workflow?

1. Clona el repositorio en un servidor Ubuntu limpio (sin estado anterior)
2. Verifica que `index.html`, `index.js` y `style.css` existan y no estén vacíos
3. Reporta el resultado de cada verificación con mensajes claros

### Rol dentro de CI/CD

Esta automatización simula la fase de **Integración Continua (CI)**. En un flujo real de DevOps, el propósito es que cada vez que un desarrollador sube cambios al repositorio, el sistema verifique automáticamente que el código no rompe el proyecto base, sin necesidad de intervención manual.

En proyectos más grandes, en este mismo paso se ejecutarían:
- Tests unitarios y de integración
- Análisis de calidad de código (linters)
- Construcción del artefacto (build)
- Publicación en un entorno de staging

El **Despliegue Continuo (CD)** correspondería al siguiente paso: tomar el artefacto verificado y desplegarlo automáticamente en un servidor o plataforma cloud.

---

## 📁 Estructura de carpetas

```
listadeperros_equipo7/
├── .github/
│   └── workflows/
│       └── ci.yml          ← Pipeline de GitHub Actions
├── index.html              ← Estructura HTML de la aplicación
├── index.js                ← Lógica: fetch a API, eventos, historial
├── style.css               ← Estilos visuales
└── README.md               ← Esta guía
```

---

## 👥 Autores

- **Integrante 1** — [Freddy Munoz]
- **Integrante 2** — [Vicente Maulen]
- **Integrante 2** — [Samuel Sanchez]

---

## 🤖 Uso de Inteligencia Artificial

Se utilizó **Claude (Anthropic)** como herramienta de apoyo para:
- Estructurar el formato del README
- Diseñar el workflow de GitHub Actions
- Verificar la sintaxis del script de configuración

Todas las decisiones técnicas (elección de GitFlow, convenciones de commits, estrategia de revisión) y las justificaciones fueron elaboradas y validadas por el equipo.

> Referencia de citación IA: https://bibliotecas.duoc.cl/ia
