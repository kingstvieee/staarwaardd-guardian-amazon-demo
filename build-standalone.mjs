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
const tourAudio = {};
for (const name of [...Array.from({length:10}, (_,i)=>'voice-'+String(i+1).padStart(2,'0')), 'instrumental','guardian-welcome']) {
  const path = '/audio/'+name+'.mp3';
  const bytes = await readFile(new URL('public'+path, import.meta.url));
  tourAudio[path] = 'data:audio/mpeg;base64,'+bytes.toString('base64');
  bundled = bundled.replaceAll('src="'+path+'"', 'data-audio="'+path+'"');
}
const flightManifest=JSON.parse(await read('public/assets/guardian-flight.json'));
const flight=Buffer.concat(await Promise.all(flightManifest.parts.map(name=>readFile(new URL('public/assets/'+name,import.meta.url)))));
const companion=await readFile(new URL('public/assets/guardian-center.mp4',import.meta.url));
const poster=await readFile(new URL('public/assets/guardian-poster.jpg',import.meta.url));
bundled=bundled.replaceAll('/assets/guardian-arrival.mp4','data:video/mp4;base64,'+flight.toString('base64')).replaceAll('/assets/guardian-center.mp4','data:video/mp4;base64,'+companion.toString('base64')).replaceAll('/assets/guardian-poster.jpg','data:image/jpeg;base64,'+poster.toString('base64'));
const audioBootstrap = 'window.demoTourAudio='+JSON.stringify(tourAudio)+';document.querySelectorAll("[data-audio]").forEach(el=>el.src=window.demoTourAudio[el.dataset.audio]);';
const imageBootstrap = 'window.demoOffline=true;document.getElementById("connectMcp").disabled=true;document.getElementById("mcpStatus").textContent="OFFLINE SOURCE PREVIEW / Open the hosted demo for real MCP calls";const demoArtwork='+JSON.stringify(artwork)+';document.querySelectorAll("[data-art]").forEach(el=>el.src=demoArtwork[el.dataset.art]);for(const [name,url] of Object.entries(demoArtwork))document.documentElement.style.setProperty("--"+name+"-art", "url("+url+")");';
bundled = bundled.replace('<script>', '<script>'+imageBootstrap+audioBootstrap);
await mkdir(new URL('dist/', import.meta.url), {recursive:true});
await writeFile(new URL('dist/guardian-demo.html', import.meta.url), bundled);
console.log('Built dist/guardian-demo.html from canonical source. Open the file directly in a browser.');

