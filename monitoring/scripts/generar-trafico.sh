#!/usr/bin/env bash
# Genera tráfico de prueba contra el balanceador para que el dashboard tenga datos:
# peticiones normales y algunas a rutas inexistentes (errores 404 controlados).
# Uso: monitoring/scripts/generar-trafico.sh [url_base] [cantidad]
set -euo pipefail

BASE="${1:-http://localhost:8080}"
CANTIDAD="${2:-200}"

echo "Generando $CANTIDAD peticiones contra $BASE ..."
for i in $(seq 1 "$CANTIDAD"); do
  curl -s -o /dev/null "$BASE/"
  curl -s -o /dev/null "$BASE/logica.js"
  # 1 de cada 10 peticiones va a una ruta que no existe → error 404 registrado
  if (( i % 10 == 0 )); then
    curl -s -o /dev/null "$BASE/ruta-que-no-existe-$i"
  fi
done
echo "Listo."
