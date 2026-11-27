# Despliegue AWS - EP3 Equipo 7

Configuraciones utilizadas para desplegar Lista de Perros
en una instancia AWS EC2 con Kubernetes K3s.

## Componentes

- Ingress: acceso HTTP mediante Traefik.
- Prometheus: recoleccion de metricas y almacenamiento persistente.
- Grafana: dashboard personalizado de observabilidad.
- Blackbox Exporter: disponibilidad y latencia HTTP.
- Loki: almacenamiento de logs con retencion de siete dias.
- Alloy: recoleccion de logs de Kubernetes.
- Pushgateway: almacenamiento persistente de metricas CI/CD.

## Integracion CI/CD

El pipeline de GitHub Actions automatiza las validaciones
de calidad, seguridad, cumplimiento, construccion de imagen,
staging, observabilidad y despliegue en su entorno de prueba.

El despliegue en AWS EC2 fue realizado manualmente utilizando
la imagen publicada en GitHub Container Registry.

Las metricas generadas por el pipeline fueron descargadas
desde sus artefactos y publicadas manualmente en Pushgateway
para su visualizacion mediante Prometheus y Grafana.

## Consideraciones

Estos archivos complementan los manifiestos originales.
No deben aplicarse todos juntos de forma indiscriminada.
Los archivos de configuracion requieren sus respectivos
ConfigMaps y componentes previamente instalados.

El almacenamiento local-path depende del nodo Kubernetes.
Grafana conserva su configuracion de almacenamiento temporal.
