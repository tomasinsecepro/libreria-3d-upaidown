const http = require('http');
const fs = require('fs');
const path = require('path');

const PREFERRED_PORT = 3333;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);

  if (pathname === '/' || pathname === '/index.html' || pathname === '/viewer.html') {
    const htmlPath = path.join(__dirname, 'viewer.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(htmlPath).pipe(res);
      return;
    }
  }

  // Serve static files
  let safePath = path.normalize(path.join(__dirname, pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(safePath).pipe(res);
    return;
  }

  // Also check extracted-3d-lib/models/
  if (pathname.startsWith('/models/')) {
    const modelPath = path.join(__dirname, 'extracted-3d-lib', 'models', path.basename(pathname));
    if (fs.existsSync(modelPath)) {
      res.writeHead(200, {
        'Content-Type': 'model/gltf-binary',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(modelPath).pipe(res);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 No encontrado');
});

function startServer(port) {
  server.listen(port, () => {
    const msg = `\n======================================================\n` +
      ` [3D VIEWER ONLINE] Servidor activo en:\n` +
      ` -> http://localhost:${port}\n` +
      ` -> http://127.0.0.1:${port}\n` +
      `======================================================\n`;
    console.log(msg);
    try {
      fs.writeFileSync(path.join(__dirname, 'server-status.json'), JSON.stringify({ status: 'running', port, time: Date.now() }));
    } catch (e) {}
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[AVISO] Puerto ${port} en uso, intentando puerto ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[ERROR]', err);
    }
  });
}

startServer(PREFERRED_PORT);
