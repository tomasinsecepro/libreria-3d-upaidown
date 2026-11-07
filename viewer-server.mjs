import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3333;

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
  '.hdr': 'application/octet-stream',
};

const htmlPath = path.join(__dirname, 'viewer.html');
const HTML_CONTENT = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '<h1>Viewer</h1>';

function scanDir(dir, maxDepth = 2, currentDepth = 0) {
  let res = [];
  try {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (item === 'node_modules' || item === '.git' || item === '.gemini') continue;
      const full = path.join(dir, item);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory() && currentDepth < maxDepth) {
          res = res.concat(scanDir(full, maxDepth, currentDepth + 1));
        } else if (!stat.isDirectory()) {
          res.push({ name: item, dir: dir, path: full, size: stat.size, mtime: stat.mtime });
        }
      } catch (e) {}
    }
  } catch (e) {}
  return res;
}

try {
  const localFiles = scanDir(__dirname, 2);
  const parentFiles = scanDir(path.join(__dirname, '..'), 1);
  const all = [...localFiles, ...parentFiles];
  // Filter recently modified or image files
  const interesting = all.filter(f => {
    const ext = path.extname(f.name).toLowerCase();
    const isImg = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.jfif'].includes(ext);
    const isToday = new Date(f.mtime).toISOString().startsWith('2026-11-07');
    return isImg || isToday;
  });
  fs.writeFileSync(path.join(__dirname, 'recent-files.json'), JSON.stringify(interesting, null, 2));
} catch (err) {
  console.error('Error scanning recent files:', err);
}


try {
  // 1. Limpieza de arbol-olivo.glb
  const glbPathOlivo = path.join(__dirname, 'extracted-3d-lib', 'models', 'arbol-olivo.glb');
  if (fs.existsSync(glbPathOlivo)) {
    const buf = fs.readFileSync(glbPathOlivo);
    const jsonLen = buf.readUInt32LE(12);
    const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
    const gltf = JSON.parse(jsonStr);

    const removeNodeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    if (gltf.nodes[0] && Array.isArray(gltf.nodes[0].children)) {
      gltf.nodes[0].children = gltf.nodes[0].children.filter(id => !removeNodeIds.includes(id));
      removeNodeIds.forEach(id => {
        if (gltf.nodes[id]) {
          delete gltf.nodes[id].mesh;
          delete gltf.nodes[id].children;
        }
      });
      const newJsonStr = JSON.stringify(gltf);
      const padLen = (4 - (newJsonStr.length % 4)) % 4;
      const paddedJson = newJsonStr + ' '.repeat(padLen);
      const newJsonBuf = Buffer.from(paddedJson, 'utf8');
      const binChunk = buf.subarray(20 + jsonLen);
      const totalLen = 12 + 8 + newJsonBuf.length + binChunk.length;
      const newHeader = Buffer.alloc(20);
      newHeader.write('glTF', 0);
      newHeader.writeUInt32LE(2, 4);
      newHeader.writeUInt32LE(totalLen, 8);
      newHeader.writeUInt32LE(newJsonBuf.length, 12);
      newHeader.write('JSON', 16);
      fs.writeFileSync(glbPathOlivo, Buffer.concat([newHeader, newJsonBuf, binChunk]));
      console.log(`[GLB CLEANED] arbol-olivo.glb: suelo, piedras y raíces eliminados`);
    }
  }

  // 2. Limpieza de arbol-almendro.glb
  const glbPathAlmendro = path.join(__dirname, 'extracted-3d-lib', 'models', 'arbol-almendro.glb');
  if (fs.existsSync(glbPathAlmendro)) {
    const buf = fs.readFileSync(glbPathAlmendro);
    const jsonLen = buf.readUInt32LE(12);
    const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
    const gltf = JSON.parse(jsonStr);

    // 1: suelo montículo, 2..10: piedras perimetrales, 11..14: raíces basales
    const removeNodeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    if (gltf.nodes[0] && Array.isArray(gltf.nodes[0].children)) {
      gltf.nodes[0].children = gltf.nodes[0].children.filter(id => !removeNodeIds.includes(id));
      removeNodeIds.forEach(id => {
        if (gltf.nodes[id]) {
          delete gltf.nodes[id].mesh;
          delete gltf.nodes[id].children;
        }
      });
      const newJsonStr = JSON.stringify(gltf);
      const padLen = (4 - (newJsonStr.length % 4)) % 4;
      const paddedJson = newJsonStr + ' '.repeat(padLen);
      const newJsonBuf = Buffer.from(paddedJson, 'utf8');
      const binChunk = buf.subarray(20 + jsonLen);
      const totalLen = 12 + 8 + newJsonBuf.length + binChunk.length;
      const newHeader = Buffer.alloc(20);
      newHeader.write('glTF', 0);
      newHeader.writeUInt32LE(2, 4);
      newHeader.writeUInt32LE(totalLen, 8);
      newHeader.writeUInt32LE(newJsonBuf.length, 12);
      newHeader.write('JSON', 16);
      fs.writeFileSync(glbPathAlmendro, Buffer.concat([newHeader, newJsonBuf, binChunk]));
      console.log(`[GLB CLEANED] arbol-almendro.glb: suelo, piedras y raíces eliminados`);
    }
  }

  // 3. Limpieza de arbol-pistacho.glb
  const glbPathPistacho = path.join(__dirname, 'extracted-3d-lib', 'models', 'arbol-pistacho.glb');
  if (fs.existsSync(glbPathPistacho)) {
    const buf = fs.readFileSync(glbPathPistacho);
    const jsonLen = buf.readUInt32LE(12);
    const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
    const gltf = JSON.parse(jsonStr);

    // 1: suelo montículo, 2..9: piedras perimetrales, 10..13: raíces basales
    const removeNodeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    if (gltf.nodes[0] && Array.isArray(gltf.nodes[0].children)) {
      gltf.nodes[0].children = gltf.nodes[0].children.filter(id => !removeNodeIds.includes(id));
      removeNodeIds.forEach(id => {
        if (gltf.nodes[id]) {
          delete gltf.nodes[id].mesh;
          delete gltf.nodes[id].children;
        }
      });
      const newJsonStr = JSON.stringify(gltf);
      const padLen = (4 - (newJsonStr.length % 4)) % 4;
      const paddedJson = newJsonStr + ' '.repeat(padLen);
      const newJsonBuf = Buffer.from(paddedJson, 'utf8');
      const binChunk = buf.subarray(20 + jsonLen);
      const totalLen = 12 + 8 + newJsonBuf.length + binChunk.length;
      const newHeader = Buffer.alloc(20);
      newHeader.write('glTF', 0);
      newHeader.writeUInt32LE(2, 4);
      newHeader.writeUInt32LE(totalLen, 8);
      newHeader.writeUInt32LE(newJsonBuf.length, 12);
      newHeader.write('JSON', 16);
      fs.writeFileSync(glbPathPistacho, Buffer.concat([newHeader, newJsonBuf, binChunk]));
      console.log(`[GLB CLEANED] arbol-pistacho.glb: suelo, piedras y raíces eliminados`);
    }
  }
} catch (err) {
  console.error('Error cleaning glb trees:', err);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/' || pathname === '/index.html' || pathname === '/viewer.html') {
    const freshHtml = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : HTML_CONTENT;
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(freshHtml);
    return;
  }

  if (pathname === '/api/models-list') {
    const modelsDir = path.join(__dirname, 'extracted-3d-lib', 'models');
    const files = fs.existsSync(modelsDir) ? fs.readdirSync(modelsDir) : [];
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ dir: modelsDir, files }));
    return;
  }

  if (pathname === '/api/save-model' && req.method === 'POST') {
    const filename = url.searchParams.get('name') || 'model.glb';
    const cleanName = path.basename(filename);
    const modelsDir = path.join(__dirname, 'extracted-3d-lib', 'models');
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
    const targetFile = path.join(modelsDir, cleanName.endsWith('.glb') ? cleanName : (cleanName + '.glb'));
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(targetFile, buffer);
      console.log(`[MODEL SAVED] Guardado ${targetFile} (${Math.round(buffer.length / 1024)} KB)`);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: true, file: cleanName, bytes: buffer.length }));
    });
    return;
  }

  if (pathname === '/api/git-push' && req.method === 'POST') {
    import('child_process').then(({ execSync }) => {
      try {
        console.log('[GIT PUSH] Iniciando subida a GitHub...');
        execSync('git add -A', { cwd: __dirname });
        try {
          execSync('git commit -m "feat: actualizacion de modelos 3d, nave hormigon, cultivos y componentes"', { cwd: __dirname });
        } catch (e) {
          // Si no hay cambios que commitear, continúa con el push
        }
        const pushResult = execSync('git push origin main', { cwd: __dirname, encoding: 'utf8' });
        console.log('[GIT PUSH EXITO]', pushResult);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, message: 'Subido a GitHub correctamente!', details: pushResult }));
      } catch (err) {
        console.error('[GIT PUSH ERROR]', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve models from extracted-3d-lib/models/
  if (pathname.startsWith('/models/')) {
    const filename = path.basename(pathname);
    const filePath = path.join(__dirname, 'extracted-3d-lib', 'models', filename);

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);

      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  const localFile = path.join(__dirname, pathname);
  if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
    const ext = path.extname(localFile);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(localFile).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` [3D VIEWER ONLINE] Servidor activo en:`);
  console.log(` -> http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
