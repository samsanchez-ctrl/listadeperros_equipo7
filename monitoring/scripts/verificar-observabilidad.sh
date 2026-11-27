#!/usr/bin/env bash
# Verifica que la observabilidad funciona de verdad: cada métrica y log clave
# debe existir en Prometheus/Loki. Si algo falta, el pipeline se detiene
# (no se despliega una versión que no se puede monitorear).
set -uo pipefail

PROM="${PROM_URL:-http://localhost:9090}"
LOKI="${LOKI_URL:-http://localhost:3100}"
INTENTOS="${INTENTOS:-18}"   # 18 × 10 s = 3 minutos máximo por verificación
FALLAS=0
RESUMEN="${GITHUB_STEP_SUMMARY:-/dev/null}"

echo "| Verificación | Consulta | Resultado |" >> "$RESUMEN"
echo "|---|---|---|" >> "$RESUMEN"

consulta_prom() {
  curl -fsS --get "$PROM/api/v1/query" --data-urlencode "query=$1" | jq -r '.data.result[0].value[1] // empty'
}

consulta_loki() {
  curl -fsS --get "$LOKI/loki/api/v1/query" --data-urlencode "query=$1" | jq -r '.data.result[0].value[1] // empty'
}

verificar() {
  local nombre="$1" fuente="$2" consulta="$3" condicion="$4"
  local valor=""
  for _ in $(seq 1 "$INTENTOS"); do
    if [ "$fuente" = "prom" ]; then valor=$(consulta_prom "$consulta" 2>/dev/null); else valor=$(consulta_loki "$consulta" 2>/dev/null); fi
    if [ -n "$valor" ] && awk -v v="$valor" "BEGIN { exit !(v $condicion) }"; then
      echo "✅ $nombre = $valor"
      echo "| ✅ $nombre | \`$consulta\` | $valor |" >> "$RESUMEN"
      return 0
    fi
    sleep 10
  done
  echo "❌ $nombre: valor '${valor:-sin datos}' no cumple '$condicion'"
  echo "| ❌ $nombre | \`$consulta\` | ${valor:-sin datos} |" >> "$RESUMEN"
  FALLAS=$((FALLAS + 1))
}

verificar "Disponibilidad (/health responde)"      prom 'probe_success{endpoint="http://lb:8080/health"}' '== 1'
verificar "Métricas de Nginx (exportador activo)"   prom 'nginx_up'                                         '== 1'
verificar "Peticiones registradas por Nginx"        prom 'sum(nginx_http_requests_total)'                   '> 0'
verificar "CPU de las réplicas (cAdvisor)"          prom 'count(container_cpu_usage_seconds_total{container_label_com_docker_compose_service="app"})' '>= 3'
verificar "Memoria de las réplicas (cAdvisor)"      prom 'sum(container_memory_working_set_bytes{container_label_com_docker_compose_service="app"})' '> 0'
verificar "Métricas del pipeline (Pushgateway)"     prom 'ci_cobertura_lineas_porcentaje'                   '>= 0'
verificar "Reglas de alerta cargadas"               prom 'count(prometheus_rule_group_rules)'               '> 0'
verificar "Logs de la app en Loki"                  loki 'sum(count_over_time({service="lb"}[10m]))'        '> 0'
verificar "Errores 4xx registrados en Loki"         loki 'sum(count_over_time({service="lb", status=~"4.."}[10m]))' '> 0'

if [ "$FALLAS" -gt 0 ]; then
  echo "::error title=Observabilidad incompleta::$FALLAS verificaciones fallaron"
  exit 1
fi
echo "Todas las verificaciones de observabilidad pasaron."
