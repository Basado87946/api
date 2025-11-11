# SWA Mock API

API mínima para probar la app sin tocar la carpeta `SWA`.

## Requisitos
- Node.js 16+.

## Uso
1. Abrir terminal en `mock-api`.
2. Instalar dependencias: `npm install`.
3. Arrancar: `npm start` (por defecto en `http://localhost:3030/`).

## Conectar la app
La app puede leer un `config.json` externo si defines la variable de entorno `SWA_CONFIG_URL`.

Ejemplo (PowerShell):

```
$env:SWA_CONFIG_URL="http://localhost:3030/config.json"
```

Luego ejecuta la app: usará `api = http://localhost:3030/` y los endpoints aquí definidos.

## Endpoints
- `GET /config.json` — configuración de la API para la app.
- `GET /api/v3/fetch/:gameId` — metadatos del juego.
- `GET /api/v3/file/:gameId.zip` — ZIP del juego (colócalo en `files/`).
- `GET /api/v3/get/:filename` — descargas genéricas (pon archivos en `downloads/`).
- `GET /api/v3/heartbeat` — salud.
- `GET /api/v3/version/` — versión.

## Datos
- Edita `data/games.json` para añadir más juegos.
- Coloca imágenes en `static/` y zips en `files/`. Crea `downloads/` si necesitas instaladores.