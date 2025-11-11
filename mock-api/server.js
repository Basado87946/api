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

// Sesiones y estado de dispositivos en memoria (demo)
const sessions = new Map(); // key: device_id, value: { user_id, unique_id, username, status }
const deviceStatus = new Map(); // key: device_id, value: { disconnected: boolean }

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

// Endpoint de login que espera la app: POST /api/launcher/connect
// Body: { code, device_id, device_name, device_os }
app.post('/api/launcher/connect', (req, res) => {
  const { code, device_id, device_name, device_os } = req.body || {};

  if (!code || !device_id) {
    return res.status(400).json({ success: false, error: 'Missing code or device_id' });
  }

  const userId = `user_${(device_id || 'dev').replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`;
  const uniqueId = `uid_${(code || 'code').replace(/[^a-zA-Z0-9]/g, '').slice(-12)}`;

  // Guardar sesión en memoria
  sessions.set(device_id, {
    user_id: userId,
    unique_id: uniqueId,
    username: 'User',
    status: 'Active'
  });
  deviceStatus.set(device_id, { disconnected: false });

  // Respuesta en el formato que la app consume
  res.json({
    success: true,
    user_id: userId,
    unique_id: uniqueId,
    username: 'User',
    status: 'Active',
    hwid: device_id,
    device_name: device_name || '',
    device_os: device_os || ''
  });
});

// Fallback usado si el servidor devuelve 405: GET /api/launcher/status
app.get('/api/launcher/status', (req, res) => {
  const { code, device_id } = req.query;
  res.json({ success: true, status: 'ok', code: code || '', device_id: device_id || '' });
});

// La app verifica periódicamente si el dispositivo fue desconectado
// GET /api/user/device-status?device_id=HW-XXXX
app.get('/api/user/device-status', (req, res) => {
  const { device_id } = req.query;
  if (!device_id) {
    return res.status(400).json({ success: false, error: 'Missing device_id' });
  }
  const st = deviceStatus.get(device_id) || { disconnected: false };
  res.json({ success: true, disconnected: !!st.disconnected });
});

// Utilidad para simular desconexión: GET /api/user/disconnect?device_id=...
app.get('/api/user/disconnect', (req, res) => {
  const { device_id } = req.query;
  if (!device_id) return res.status(400).json({ success: false, error: 'Missing device_id' });
  deviceStatus.set(device_id, { disconnected: true });
  res.json({ success: true, message: 'Device flagged as disconnected' });
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

// Restricciones (la app consulta en login y dashboard)
// GET usa cabecera X-Hardware-ID
app.get('/api/v3/restriction', (req, res) => {
  const hwid = req.header('X-Hardware-ID') || '';
  // Demo: nunca restringimos
  res.json({ is_restricted: false, hwid_banned: false, ip_banned: false });
});

// POST con { hwid, unique_id, username }
app.post('/api/v3/restriction', (req, res) => {
  const { hwid, unique_id, username } = req.body || {};
  res.json({ is_restricted: false, hwid_banned: false, account_banned: false, unique_id_banned: false, ip_banned: false });
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