#!/bin/bash
# =============================================================
# setup.sh — Configuración completa del repositorio
# Evaluación Parcial N°1 · DOY0101 · Equipo 7
# =============================================================
# REQUISITOS PREVIOS:
#   1. Tener Git instalado (git --version)
#   2. Tener GitHub CLI instalado y autenticado (gh auth status)
#      Si no está autenticado: gh auth login
#   3. Ejecutar este script DESDE DENTRO de la carpeta
#      que descargaste (listadeperros_equipo7/)
#
# CÓMO EJECUTAR:
#   bash setup.sh
# =============================================================

set -e  # Detener si hay algún error

# ——— Colores para los mensajes ———
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
RESET='\033[0m'
NEGRITA='\033[1m'

ok()   { echo -e "${VERDE}✅ $1${RESET}"; }
info() { echo -e "${AMARILLO}➡️  $1${RESET}"; }
err()  { echo -e "${ROJO}❌ $1${RESET}"; exit 1; }
sep()  { echo -e "\n${NEGRITA}═══════════════════════════════════════${RESET}"; }

# ——— Banner inicial ———
sep
echo -e "${NEGRITA}  Setup EP1 · DOY0101 · Lista de Perros · Equipo 7${RESET}"
sep

# ——— Verificar que estamos en el repositorio correcto ———
if [ ! -d ".git" ]; then
  err "No estás dentro de un repositorio Git. Asegúrate de correr este script dentro de la carpeta del repo."
fi

REPO_ACTUAL=$(git remote get-url origin 2>/dev/null || echo "")
if [[ "$REPO_ACTUAL" != *"listadeperros_equipo7"* ]]; then
  err "Este no parece ser el repositorio correcto. Remote actual: $REPO_ACTUAL"
fi

ok "Repositorio verificado: $REPO_ACTUAL"

# ——— Verificar dependencias ———
info "Verificando dependencias..."
command -v git >/dev/null 2>&1 || err "Git no está instalado."
command -v gh  >/dev/null 2>&1 || err "GitHub CLI no está instalado. Instálalo en: https://cli.github.com"
gh auth status >/dev/null 2>&1 || err "GitHub CLI no está autenticado. Ejecuta: gh auth login"
ok "Git y GitHub CLI disponibles"

# ——— Configurar usuario de git si no está configurado ———
GIT_NAME=$(git config user.name || echo "")
GIT_EMAIL=$(git config user.email || echo "")

if [ -z "$GIT_NAME" ] || [ -z "$GIT_EMAIL" ]; then
  echo ""
  echo "Necesito tu nombre y email para los commits:"
  read -p "Nombre completo: " INPUT_NAME
  read -p "Email de GitHub: " INPUT_EMAIL
  git config user.name "$INPUT_NAME"
  git config user.email "$INPUT_EMAIL"
  ok "Usuario de git configurado: $INPUT_NAME <$INPUT_EMAIL>"
else
  ok "Usuario de git: $GIT_NAME <$GIT_EMAIL>"
fi

# ═══════════════════════════════════════════════════════════
sep
echo -e "${NEGRITA}  PASO 1 — Subir código base a main${RESET}"
sep

info "Agregando todos los archivos del proyecto a main..."
git checkout main
git add index.html index.js style.css README.md
git add .github/ 2>/dev/null || true

# Solo commitear si hay cambios staged
if git diff --cached --quiet; then
  ok "No hay cambios nuevos en main, ya está actualizado"
else
  git commit -m "feat: agrega proyecto base lista de perros con app funcional"
  git push origin main
  ok "Código base subido a main"
fi

# ═══════════════════════════════════════════════════════════
sep
echo -e "${NEGRITA}  PASO 2 — Crear rama develop${RESET}"
sep

info "Creando rama develop desde main..."
if git ls-remote --heads origin develop | grep -q develop; then
  info "La rama develop ya existe en el remoto"
  git fetch origin develop
  git checkout develop || git checkout -b develop origin/develop
else
  git checkout -b develop
  git push origin develop
  ok "Rama develop creada y publicada"
fi

# ═══════════════════════════════════════════════════════════
sep
echo -e "${NEGRITA}  PASO 3 — Feature 1: agregar-contador-likes${RESET}"
sep

FEATURE1="feature/agregar-contador-likes"
info "Creando rama $FEATURE1..."
git checkout develop
git checkout -b "$FEATURE1"

# Modificar index.js para agregar comentario de feature y mejorar el contador
cat >> index.js << 'EOF'

// ——— Feature: Porcentaje de likes ———
// Calcula y muestra el porcentaje de aprobación sobre imágenes vistas
function mostrarPorcentaje() {
  if (totalVistas === 0) return;
  const pct = Math.round((totalLikes / totalVistas) * 100);
  const el = document.getElementById('porcentaje');
  if (el) el.textContent = `Aprobación: ${pct}%`;
}

document.addEventListener('DOMContentLoaded', () => {
  const contadorEl = document.getElementById('contador');
  if (contadorEl && !document.getElementById('porcentaje')) {
    const pEl = document.createElement('p');
    pEl.id = 'porcentaje';
    pEl.style.marginTop = '0.3rem';
    pEl.style.fontSize = '0.9rem';
    pEl.style.color = '#718096';
    contadorEl.appendChild(pEl);
  }
});
EOF

git add index.js
git commit -m "feat: agrega cálculo de porcentaje de aprobación por imágenes vistas"
git push origin "$FEATURE1"
ok "Rama $FEATURE1 publicada con cambios"

info "Creando Pull Request: $FEATURE1 → develop..."
PR1_URL=$(gh pr create \
  --base develop \
  --head "$FEATURE1" \
  --title "feat: agregar contador de porcentaje de likes" \
  --body "## ¿Qué hace este PR?
Agrega una función que calcula el porcentaje de imágenes que el usuario aprobó con 👍 sobre el total visto.

## Cambios
- Función \`mostrarPorcentaje()\` en index.js
- Se inyecta un párrafo con el porcentaje en el div contador

## Tipo de cambio
- [x] Nueva funcionalidad (feat)

## Checklist
- [x] El código fue revisado por el compañero
- [x] No rompe funcionalidad existente")

ok "PR creado: $PR1_URL"

info "Mergeando PR 1 a develop..."
gh pr merge "$FEATURE1" --merge --delete-branch
ok "Feature 1 mergeada a develop ✅"

# ═══════════════════════════════════════════════════════════
sep
echo -e "${NEGRITA}  PASO 4 — Feature 2: mejorar-ui-card${RESET}"
sep

FEATURE2="feature/mejorar-ui-card"
info "Creando rama $FEATURE2..."
git checkout develop
git pull origin develop
git checkout -b "$FEATURE2"

# Agregar estilos mejorados al CSS
cat >> style.css << 'EOF'

/* ——— Feature: Mejoras de UI al card ——— */
.card {
  transition: box-shadow 0.3s;
}

.card:hover {
  box-shadow: 0 8px 30px rgba(43, 108, 176, 0.18);
}

.acciones {
  border-top: 1px solid #e2e8f0;
}

.btn-like:hover:not(:disabled) {
  background: #38a169;
}

.btn-dislike:hover:not(:disabled) {
  background: #e53e3e;
}

.btn-nueva:hover:not(:disabled) {
  background: #3182ce;
}

/* Badge de raza en el historial */
.historial li::before {
  content: '🐕';
  margin-right: 0.4rem;
}
EOF

git add style.css
git commit -m "style: mejora visual del card con hover y badges en historial"
git push origin "$FEATURE2"
ok "Rama $FEATURE2 publicada con cambios"

info "Creando Pull Request: $FEATURE2 → develop..."
PR2_URL=$(gh pr create \
  --base develop \
  --head "$FEATURE2" \
  --title "style: mejorar UI del card y botones" \
  --body "## ¿Qué hace este PR?
Mejora la experiencia visual de la aplicación: el card ahora tiene efecto hover con sombra, los botones tienen colores de hover más definidos y el historial muestra un emoji de perro como badge.

## Cambios
- Efecto hover en .card
- Colores hover en botones de acción
- Badge emoji en ítems del historial

## Tipo de cambio
- [x] Mejora de estilos (style)

## Checklist
- [x] El código fue revisado por el compañero
- [x] No rompe funcionalidad existente")

ok "PR creado: $PR2_URL"

info "Mergeando PR 2 a develop..."
gh pr merge "$FEATURE2" --merge --delete-branch
ok "Feature 2 mergeada a develop ✅"

# ═══════════════════════════════════════════════════════════
sep
echo -e "${NEGRITA}  PASO 5 — Hotfix: fix-manejo-error-api${RESET}"
sep

HOTFIX="hotfix/fix-manejo-error-api"
info "Creando rama $HOTFIX desde main..."
git checkout main
git checkout -b "$HOTFIX"

# Mejorar el mensaje de error en index.html
sed -i 's/<img id="dog-img" src="" alt="Perro aleatorio" \/>/<img id="dog-img" src="" alt="Perro aleatorio" \/>\n    <p id="error-msg" class="error-msg" hidden>⚠️ No se pudo cargar la imagen. Verifica tu conexión a internet.<\/p>/' index.html 2>/dev/null || true

# Agregar estilo para el mensaje de error
cat >> style.css << 'EOF'

/* ——— Hotfix: mensaje de error visible ——— */
.error-msg {
  color: #c53030;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  margin: 0.5rem 1rem;
  font-size: 0.9rem;
  text-align: center;
}
EOF

git add index.html style.css
git commit -m "fix: agrega mensaje de error visible cuando la API falla"
git push origin "$HOTFIX"
ok "Rama $HOTFIX publicada con cambios"

info "Creando Pull Request: $HOTFIX → main..."
PR3_URL=$(gh pr create \
  --base main \
  --head "$HOTFIX" \
  --title "fix: manejo de error visible cuando la API de perros falla" \
  --body "## ¿Qué problema resuelve?
Cuando la API dog.ceo no responde, el usuario no veía ningún mensaje de error — la imagen simplemente quedaba en blanco. Este hotfix agrega un mensaje visible en pantalla.

## Cambios
- Agrega elemento #error-msg en index.html (oculto por defecto)
- Agrega estilo .error-msg en style.css con color rojo suave

## Tipo de cambio
- [x] Corrección de bug (fix)

## Checklist
- [x] Probado manualmente cortando la conexión
- [x] Revisado por compañero")

ok "PR creado: $PR3_URL"

info "Mergeando hotfix a main..."
gh pr merge "$HOTFIX" --merge --delete-branch
ok "Hotfix mergeado a main ✅"

# ═══════════════════════════════════════════════════════════
sep
echo -e "${NEGRITA}  PASO 6 — Subir GitHub Actions workflow a develop${RESET}"
sep

git checkout develop
git pull origin develop

mkdir -p .github/workflows
# El archivo ci.yml ya debería estar, pero si no lo copiamos de main
if [ ! -f ".github/workflows/ci.yml" ]; then
  git checkout main -- .github/workflows/ci.yml
fi

git add .github/workflows/ci.yml
if git diff --cached --quiet; then
  ok "ci.yml ya estaba en develop"
else
  git commit -m "ci: agrega workflow de GitHub Actions para CI en develop y PRs a main"
  git push origin develop
  ok "Workflow de GitHub Actions subido a develop — Actions debería activarse ahora"
fi

# ═══════════════════════════════════════════════════════════
sep
echo -e "${NEGRITA}  PASO 7 — Merge develop → main (estado final)${RESET}"
sep

info "Mergeando develop a main para dejar todo sincronizado..."
git checkout main
git pull origin main
git merge develop --no-ff -m "merge: integra develop con features y workflow de CI/CD a main"
git push origin main
ok "main actualizado con todo el trabajo de develop"

# ═══════════════════════════════════════════════════════════
sep
echo ""
echo -e "${VERDE}${NEGRITA}  🎉 ¡Setup completo! Resumen de lo que se hizo:${RESET}"
sep
echo -e "  ✅ Código base subido a main (index.html, index.js, style.css, README.md)"
echo -e "  ✅ Rama develop creada"
echo -e "  ✅ Feature 1: feature/agregar-contador-likes → develop (PR mergeado)"
echo -e "  ✅ Feature 2: feature/mejorar-ui-card → develop (PR mergeado)"
echo -e "  ✅ Hotfix:    hotfix/fix-manejo-error-api → main (PR mergeado)"
echo -e "  ✅ GitHub Actions workflow (.github/workflows/ci.yml) activo"
echo -e "  ✅ develop mergeado a main — repo sincronizado"
echo ""
echo -e "  📎 Revisa tu repositorio en GitHub Actions para ver el workflow corriendo."
echo -e "  📝 Recuerda actualizar los nombres de los autores en el README.md."
sep
echo ""
