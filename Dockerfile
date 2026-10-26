# ————————————————————————————————————————
# Dockerfile — Lista de Perros 🐶 (Equipo 7)
# Servidor web Nginx para contenido estático
# ————————————————————————————————————————

# Imagen oficial y ligera de Nginx basada en Alpine Linux
FROM nginx:alpine

# Copiar los archivos de la aplicación web al directorio público por defecto de Nginx
COPY index.html /usr/share/nginx/html/
COPY index.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/

# Exponer el puerto 80 para que el contenedor reciba tráfico web
EXPOSE 80

# Nginx se ejecuta automáticamente en primer plano con la directiva daemon off
CMD ["nginx", "-g", "daemon off;"]