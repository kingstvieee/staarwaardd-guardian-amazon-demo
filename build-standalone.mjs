import { readFile, writeFile, mkdir } from 'node:fs/promises';
const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const [html, css, core, api, ui] = await Promise.all([
  read('public/amazon-judge.html'), read('public/amazon-judge.css'),
  read('src/guardian-core.mjs'), read('api/amazon-guardian.mjs'), read('public/amazon-judge.js')
]);
// Bundle the canonical planner and handler unchanged, apart from module syntax.
// This adapter invokes that handler locally; it never pretends to make a network request.
const adapter = `async function localDemoRequest(_url, options) {
  let code = 200, payload;
  const response = {setHeader(){}, status(value){code=value;return this;}, json(value){payload=value;return this;}};
  await handler({method:options.method, body:JSON.parse(options.body)}, response);
  if (payload.architecture) payload.architecture.protocol = 'Local in-browser handler; no network/Alexa/MCP connection';
  return {ok:code>=200 && code<300, json:async()=>payload};
}`;
const script = [core.replaceAll('export ', ''), api.replace(/^import .*;\n/m, '').replace('export default ', ''), adapter,
  ui.replace("await fetch('/api/amazon-guardian'", "await localDemoRequest('/api/amazon-guardian'")].join('\n');
let bundled = html.replace('<link rel="stylesheet" href="/amazon-judge.css">', '<style>'+css.replace(/^@import[^;]+;/m, '')+'</style>')
  .replace('<div><span>DEMO API</span><b>HTTPS JSON</b></div>', '<div><span>LOCAL PREVIEW</span><b>Same handler · no network</b></div>')
  .replace('<section id="status"', '<p class="status">Offline source preview: the same planner and handler run inside this browser. No backend, AWS, AI model or Alexa connection is used.</p>\n<section id="status"')
  .replace('<script src="/amazon-judge.js" defer></script>', '<script>'+script.replaceAll('</script', '<\\/script')+'</script>');
const artwork = {};
for (const name of ['cover', 'worlds']) {
  const bytes = await readFile(new URL('public/assets/'+name+'.webp', import.meta.url));
  artwork[name] = 'data:image/webp;base64,'+bytes.toString('base64');
  bundled = bundled.replaceAll('src="/assets/'+name+'.webp"', 'data-art="'+name+'"');
  bundled = bundled.replaceAll("url('/assets/"+name+".webp')", 'var(--'+name+'-art)');
}
const imageBootstrap = 'const demoArtwork='+JSON.stringify(artwork)+';document.querySelectorAll("[data-art]").forEach(el=>el.src=demoArtwork[el.dataset.art]);for(const [name,url] of Object.entries(demoArtwork))document.documentElement.style.setProperty("--"+name+"-art", "url("+url+")");';
bundled = bundled.replace('<script>', '<script>'+imageBootstrap);
await mkdir(new URL('dist/', import.meta.url), {recursive:true});
await writeFile(new URL('dist/guardian-demo.html', import.meta.url), bundled);
console.log('Built dist/guardian-demo.html from canonical source. Open the file directly in a browser.');
