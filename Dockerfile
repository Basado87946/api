FROM node:18-alpine
WORKDIR /app

# Instalar dependencias sólo del subproyecto mock-api
COPY mock-api/package*.json ./mock-api/
RUN cd mock-api && npm ci --omit=dev

# Copiar el código del mock-api
COPY mock-api/ ./mock-api/

# Arrancar el servidor. Railway inyecta $PORT y server.js lo usa.
CMD ["node", "mock-api/server.js"]