import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import handler from './api/amazon-guardian.mjs';
import mcpHandler from './api/mcp.mjs';

const assets = {
  '/': ['amazon-judge.html', 'text/html'],
  '/amazon-judge.html': ['amazon-judge.html', 'text/html'],
  '/amazon-judge.js': ['amazon-judge.js', 'text/javascript'],
  '/amazon-judge.css': ['amazon-judge.css', 'text/css'],
  '/assets/cover.webp': ['assets/cover.webp', 'image/webp'],
  '/assets/worlds.webp': ['assets/worlds.webp', 'image/webp']
};
for (const name of [...Array.from({length:10}, (_,i)=>'voice-'+String(i+1).padStart(2,'0')), 'instrumental']) {
  assets['/audio/'+name+'.mp3'] = ['audio/'+name+'.mp3', 'audio/mpeg'];
}
// Serve only existing, allowlisted public files, including the approved flight chunks.
for (const dir of ['assets','audio']) {
  for (const name of await readdir(new URL('./public/'+dir+'/', import.meta.url))) {
    const type = {mp4:'video/mp4',mp3:'audio/mpeg',jpg:'image/jpeg',webp:'image/webp',json:'application/json',bin:'application/octet-stream'}[name.split('.').pop()];
    if (type) assets['/'+dir+'/'+name] = [dir+'/'+name,type];
  }
}
const port = Number(process.env.PORT || 3335);
http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/api/amazon-guardian' || path === '/api/mcp') {
      // Demo-only runner serves free simulation modes; no AWS adapter is included.
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 16384) { res.writeHead(413); return res.end(); }
      }
      let body;
      if (path === '/api/mcp') return await mcpHandler({method:req.method, headers:req.headers, body:raw || '{}'}, res);
      try { body = raw ? JSON.parse(raw) : {}; }
      catch { res.writeHead(400); return res.end('Invalid JSON'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) { res.writeHead(400); return res.end('Expected a JSON object'); }
      // Bedrock mode invokes AWS only when server-side credentials and model configuration exist.
      res.status = code => { res.statusCode = code; return res; };
      res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); return res; };
      return await (path === '/api/mcp' ? mcpHandler : handler)({method:req.method, headers:req.headers, body}, res);
    }
    const asset = Object.hasOwn(assets, path) ? assets[path] : null;
    if (req.method !== 'GET' || !asset) { res.writeHead(404); return res.end(); }
    const bytes = await readFile(new URL('./public/' + asset[0], import.meta.url));
    res.writeHead(200, {'Content-Type':asset[1], 'Cache-Control':'no-store'});
    res.end(bytes);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end('Local judge runner failed');
  }
}).listen(port, '127.0.0.1', () => console.log('Guardian simulation: http://127.0.0.1:' + port));


