FROM node:18-alpine

# Working directory inside container
WORKDIR /app

# Copy mock API files
COPY mock-api/package.json ./
COPY mock-api/server.js ./
COPY mock-api/railway.json ./
COPY mock-api/data ./data

# Install dependencies
RUN npm install --production

# Expose API port
EXPOSE 3030

# Default environment
ENV PORT=3030
ENV API_BASE=http://localhost:3030/

# Run the mock API
CMD ["node", "server.js"]
WORKDIR /app

# Instalar dependencias sólo del subproyecto mock-api
COPY mock-api/package*.json ./mock-api/
# Si no hay package-lock.json, usa npm install en lugar de npm ci
RUN cd mock-api && if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copiar el código del mock-api
COPY mock-api/ ./mock-api/

# Arrancar el servidor. Railway inyecta $PORT y server.js lo usa.
CMD ["node", "mock-api/server.js"]