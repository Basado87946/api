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

// Página de autorización simple (mock) para SWA Cloud
app.get('/authorize', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const base = BASE;
  res.send(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>SWA Cloud</title>
      <style>
        :root { --bg:#0b1220; --panel:#0e1628; --accent:#4f46e5; --accent-2:#06b6d4; --text:#e5e7eb; --muted:#94a3b8; --error:#ef4444; --success:#22c55e; }
        * { box-sizing: border-box; margin:0; padding:0; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; background: radial-gradient(1200px 600px at 20% 10%, #0f1a35 0%, #0b1220 50%, #070c18 100%); color: var(--text); min-height: 100vh; display: grid; place-items: center; }
        .shell { width: 100%; max-width: 820px; padding: 24px; }
        .chrome { display:flex; align-items:center; justify-content:space-between; margin-bottom: 16px; color: var(--muted); font-size: 12px; letter-spacing: .06em; }
        .badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; background: linear-gradient(180deg, rgba(79,70,229,.18), rgba(6,182,212,.12)); border: 1px solid rgba(148,163,184,.2); border-radius: 999px; }
        .grid { display:grid; grid-template-columns: 1.1fr .9fr; gap: 16px; }
        .panel { background: linear-gradient(180deg, rgba(14,22,40,.85), rgba(10,18,32,.85)); border: 1px solid rgba(148,163,184,.2); border-radius: 16px; box-shadow: 0 10px 24px rgba(0,0,0,.35); overflow: hidden; position: relative; }
        .panel::after { content:""; position:absolute; inset:-1px; border-radius: 16px; pointer-events:none; background: linear-gradient(120deg, rgba(79,70,229,.12), rgba(6,182,212,.08)); mix-blend: screen; }
        .panel-head { padding: 18px 20px; display:flex; align-items:center; justify-content:space-between; border-bottom: 1px solid rgba(148,163,184,.12); }
        .title { font-size: 14px; color: var(--muted); letter-spacing:.08em; text-transform: uppercase; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .content { padding: 20px; }
        .tabs { display:flex; gap:8px; margin-bottom:16px; }
        .tab { flex:1; padding:12px 14px; text-align:center; background: rgba(2,8,23,.6); border:1px solid rgba(148,163,184,.18); border-radius: 12px; color: var(--muted); cursor:pointer; transition:.2s; }
        .tab.active { background: linear-gradient(180deg, rgba(79,70,229,.25), rgba(6,182,212,.18)); color: var(--text); border-color: rgba(148,163,184,.28); }
        .fields { display:grid; gap:10px; }
        .field { display:grid; gap:6px; }
        .label { font-size:12px; color: var(--muted); letter-spacing:.06em; }
        .input { height:42px; border-radius:10px; background: rgba(2,8,23,.7); border:1px solid rgba(148,163,184,.2); color: var(--text); padding:0 12px; outline:none; transition:.2s; }
        .input:focus { border-color: var(--accent-2); box-shadow: 0 0 0 3px rgba(6,182,212,.18); }
        .row { display:flex; gap:8px; }
        .btn { height:42px; border-radius:10px; border:1px solid rgba(148,163,184,.24); padding:0 14px; color:#fff; font-weight:600; letter-spacing:.02em; cursor:pointer; transition:.2s; background: linear-gradient(180deg, rgba(79,70,229,.35), rgba(6,182,212,.32)); box-shadow: 0 8px 18px rgba(6,182,212,.2); }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(6,182,212,.28); }
        .btn.secondary { background: rgba(2,8,23,.7); }
        .note { font-size:12px; color: var(--muted); }
        .status { margin-top:12px; font-size:13px; }
        .status.error { color: var(--error); }
        .status.success { color: var(--success); }
        .post { display:none; padding: 20px; }
        .post h2 { font-size:18px; margin-bottom:8px; }
        .kpis { display:grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top:12px; }
        .kpi { background: rgba(2,8,23,.6); border:1px solid rgba(148,163,184,.2); border-radius: 12px; padding: 12px; text-align:center; }
        .kpi .big { font-size:20px; font-weight:700; }
        .aside { display:grid; gap: 12px; }
        .pill { padding: 12px; border-radius: 12px; background: rgba(2,8,23,.6); border:1px solid rgba(148,163,184,.16); }
        .muted { color: var(--muted); }
        .footer { margin-top:12px; display:flex; justify-content:flex-end; gap:8px; }
        .link { color:#93c5fd; text-decoration:none; }
      </style>
    </head>
    <body>
      <div class="shell">
        <div class="chrome">
          <div class="badge"><span class="mono">SWA CLOUD</span><span>Access</span></div>
          <div class="mono">${base}</div>
        </div>
        <div class="grid">
          <div class="panel">
            <div class="panel-head"><div class="title">Identity</div><div class="mono" id="deviceBadge"></div></div>
            <div class="content">
              <div class="tabs">
                <div class="tab active" id="tab-login">Login</div>
                <div class="tab" id="tab-register">Register</div>
              </div>
              <div id="form-login">
                <div class="fields">
                  <div class="field"><div class="label">Activation Code</div><input class="input" id="code" placeholder="SWA2-XXXX-XXXX" /></div>
                  <div class="row">
                    <button class="btn" id="btnLogin">Login</button>
                    <button class="btn secondary" id="btnGuest">Guest</button>
                  </div>
                </div>
                <div class="status" id="statusLogin"></div>
              </div>
              <div id="form-register" style="display:none;">
                <div class="fields">
                  <div class="row">
                    <div class="field" style="flex:1"><div class="label">Username</div><input class="input" id="reg_username" placeholder="user" /></div>
                    <div class="field" style="flex:1"><div class="label">Email</div><input class="input" id="reg_email" placeholder="user@example.com" /></div>
                  </div>
                  <div class="field"><div class="label">Password</div><input type="password" class="input" id="reg_password" placeholder="••••••••" /></div>
                  <div class="row">
                    <button class="btn" id="btnRegister">Create Account</button>
                    <button class="btn secondary" id="btnReset">Reset</button>
                  </div>
                </div>
                <div class="status" id="statusRegister"></div>
              </div>
              <div class="post" id="postRegister">
                <h2>Profile Created</h2>
                <div class="muted">Your account is active. Use the access code or guest to continue in the app.</div>
                <div class="kpis">
                  <div class="kpi"><div class="muted">User</div><div class="big" id="kUser"></div></div>
                  <div class="kpi"><div class="muted">Unique ID</div><div class="big mono" id="kUid"></div></div>
                  <div class="kpi"><div class="muted">Status</div><div class="big" id="kStatus">Active</div></div>
                </div>
                <div class="footer">
                  <a class="link" href="${base}authorize">Reload</a>
                </div>
              </div>
            </div>
          </div>
          <div class="aside">
            <div class="pill">
              <div class="muted">How it works</div>
              <div style="margin-top:8px">Login verifies an activation code against your device. Register creates a demo profile on this API for UI demonstration.</div>
            </div>
            <div class="pill">
              <div class="muted">Endpoints</div>
              <div style="margin-top:8px" class="mono">POST ${base}api/launcher/connect</div>
              <div class="mono">POST ${base}api/launcher/register</div>
            </div>
          </div>
        </div>
      </div>
      <script>
        const BASE = ${JSON.stringify(base)};
        const genId = () => 'HW-'+Math.random().toString(36).slice(2,10).toUpperCase();
        let deviceId = localStorage.getItem('swa_device_id') || genId();
        localStorage.setItem('swa_device_id', deviceId);
        document.getElementById('deviceBadge').textContent = deviceId;
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');
        tabLogin.onclick = () => { tabLogin.classList.add('active'); tabRegister.classList.remove('active'); formLogin.style.display='block'; formRegister.style.display='none'; };
        tabRegister.onclick = () => { tabRegister.classList.add('active'); tabLogin.classList.remove('active'); formLogin.style.display='none'; formRegister.style.display='block'; };
        const statusLogin = document.getElementById('statusLogin');
        const statusRegister = document.getElementById('statusRegister');
        document.getElementById('btnLogin').onclick = async () => {
          statusLogin.textContent = 'Connecting...';
          const code = document.getElementById('code').value.trim();
          if(!/^SWA2-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.toUpperCase())) { statusLogin.textContent='Enter a valid code (SWA2-XXXX-XXXX)'; statusLogin.className='status error'; return; }
          try {
            const r = await fetch(BASE+'api/launcher/connect', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code, device_id: deviceId, device_name: navigator.platform || 'web', device_os: navigator.userAgent || '' }) });
            const j = await r.json();
            if(j.success) { statusLogin.textContent='Connected. You can return to the app.'; statusLogin.className='status success'; } else { statusLogin.textContent=j.error||'Authentication failed'; statusLogin.className='status error'; }
          } catch(e) { statusLogin.textContent='Network error'; statusLogin.className='status error'; }
        };
        document.getElementById('btnGuest').onclick = () => { statusLogin.textContent='Guest mode available in app.'; statusLogin.className='status'; };
        document.getElementById('btnRegister').onclick = async () => {
          statusRegister.textContent = 'Creating account...';
          const username = document.getElementById('reg_username').value.trim();
          const email = document.getElementById('reg_email').value.trim();
          const password = document.getElementById('reg_password').value;
          if(!username || !email || !password) { statusRegister.textContent='Fill all fields'; statusRegister.className='status error'; return; }
          try {
            const r = await fetch(BASE+'api/launcher/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, email, password, device_id: deviceId }) });
            const j = await r.json();
            if(j.success) {
              statusRegister.textContent='Account created'; statusRegister.className='status success';
              document.getElementById('kUser').textContent = j.username || username;
              document.getElementById('kUid').textContent = j.unique_id;
              document.getElementById('postRegister').style.display='block';
              document.getElementById('form-register').style.display='none';
              tabRegister.classList.remove('active');
            } else {
              statusRegister.textContent=j.error||'Registration failed'; statusRegister.className='status error';
            }
          } catch(e) { statusRegister.textContent='Network error'; statusRegister.className='status error'; }
        };
        document.getElementById('btnReset').onclick = () => {
          document.getElementById('reg_username').value='';
          document.getElementById('reg_email').value='';
          document.getElementById('reg_password').value='';
          statusRegister.textContent=''; statusRegister.className='status';
        };
      </script>
    </body>
  </html>`);
});

app.get('/login', (req, res) => {
  res.redirect('/authorize');
});

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

app.post('/api/launcher/register', (req, res) => {
  const { username, email, password, device_id } = req.body || {};
  if (!username || !email || !password || !device_id) {
    return res.status(400).json({ success: false, error: 'Missing username, email, password or device_id' });
  }
  const userId = `user_${String(username).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'demo'}`;
  const uniqueId = `uid_${Buffer.from(`${username}:${email}:${Date.now()}`).toString('hex').slice(0, 16)}`;
  sessions.set(device_id, { user_id: userId, unique_id: uniqueId, username, status: 'Active' });
  deviceStatus.set(device_id, { disconnected: false });
  res.json({ success: true, user_id: userId, unique_id: uniqueId, username, status: 'Active' });
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