/*
 * SWA Mock API - Servidor mínimo para integrarse con la app
 * Ejecuta: npm install && npm start
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3030;
const BASE = process.env.API_BASE || `http://localhost:${PORT}/`;

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas estáticas (coloca aquí imágenes y zips reales)
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/files', express.static(path.join(__dirname, 'files')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Cargar juegos desde JSON
const gamesPath = path.join(__dirname, 'data', 'games.json');
let games = {};
try {
  games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
} catch (e) {
  console.warn('No se pudo cargar data/games.json, usando dataset vacío');
}

// Configuración para la app (ApiConfiguration)
app.get('/config.json', (req, res) => {
  res.json({
    api: BASE,
    login_api: BASE,
    version: "1.0.0",
    update_url: `${BASE}api/v3/get/latest.exe`,
    steam_url: `${BASE}api/v3/get/SWAV2_installer.zip`,
    ui: {
      local: 1,
      paths: { login: "/login", dashboard: "/dashboard", css: "/css/", js: "/js/" }
    },
    api_endpoints: {
      game_fetch: "/api/v3/fetch/",
      file_download: "/api/v3/file/",
      get_file: "/api/v3/get/",
      patch_notes: "/api/v3/patch_notes/",
      version: "/api/v3/version/",
      socials: "/api/v3/socials/",
      launchers: "/api/v3/launchers/",
      heartbeat: "/api/v3/heartbeat",
      banner: "/api/v3/banner/"
    },
    maintenance: {
      scheduled: "false",
      start_time: "",
      end_time: "",
      message: ""
    },
    heartbeat: { enabled: true, interval_ms: 60000, enabled_for_guests: true }
  });
});

// Fetch de juegos
app.get('/api/v3/fetch/:gameId', (req, res) => {
  const id = String(req.params.gameId);
  const game = games[id];

  const now = new Date();
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}-${pad(now.getMinutes())}`;

  if (!game) {
    return res.json({
      File: "1", // marcar como disponible aunque sea genérico
      name: `Game ${id}`,
      image: "https://placehold.co/600x800/png?text=Game",
      developers: ["Unknown"],
      genres: ["Action", "Other"],
      metacritic: { score: 0 },
      drm_notice: "",
      ext_user_account_notice: "Requires Steam account",
      last_update: stamp,
      access: "1"
    });
  }

  // Normalizar formatos de géneros (string o objeto)
  const genres = (game.genres || []).map(g => typeof g === 'string' ? g : (g.description || 'Other'));

  res.json({
    File: "1",
    name: game.name,
    image: game.image || "https://placehold.co/600x800/png?text=Game",
    developers: game.developers || ["Unknown"],
    genres,
    metacritic: game.metacritic || { score: 0 },
    drm_notice: game.drm_notice || "",
    ext_user_account_notice: game.ext_user_account_notice || "",
    last_update: game.last_update || stamp,
    access: game.access || "1"
  });
});

// Descarga de archivos de juego: /api/v3/file/:gameId.zip -> files/:gameId.zip
app.get('/api/v3/file/:gameId.zip', (req, res) => {
  const id = String(req.params.gameId);
  const filePath = path.join(__dirname, 'files', `${id}.zip`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ZIP no encontrado. Coloca files/' + id + '.zip' });
  }
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${id}.zip"`);
  fs.createReadStream(filePath).pipe(res);
});

// Descargas genéricas (instaladores/updates)
app.get('/api/v3/get/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado en downloads/' + req.params.filename });
  }
  res.download(filePath);
});

// Extras mínimos
app.get('/api/v3/version/', (req, res) => res.json({ version: '1.0.0' }));
app.get('/api/v3/heartbeat', (req, res) => res.json({ status: 'ok' }));
app.get('/api/v3/launchers/', (req, res) => res.json({ steam: true }));
app.get('/api/v3/banner/', (req, res) => res.json({ items: [] }));
app.get('/api/v3/Banner/', (req, res) => res.json({ items: [] })); // compat mayúsculas

app.listen(PORT, () => {
  console.log(`SWA Mock API corriendo en ${BASE} (puerto ${PORT})`);
});