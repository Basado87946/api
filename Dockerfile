FROM node:18-alpine
WORKDIR /app

# Instalar dependencias sólo del subproyecto mock-api
COPY mock-api/package*.json ./mock-api/
# Si no hay package-lock.json, usa npm install en lugar de npm ci
RUN cd mock-api && if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copiar el código del mock-api
COPY mock-api/ ./mock-api/

# Arrancar el servidor. Railway inyecta $PORT y server.js lo usa.
CMD ["node", "mock-api/server.js"]