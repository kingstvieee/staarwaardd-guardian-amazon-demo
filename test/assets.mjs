import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'3347'},stdio:['ignore','pipe','pipe']});
try {
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(new Error('server exited '+code)));});
 const base='http://127.0.0.1:3347';
 const manifest=await (await fetch(base+'/assets/guardian-flight.json')).json();
 const pieces=await Promise.all(manifest.parts.map(async name=>{const response=await fetch(base+'/assets/'+name);assert.equal(response.status,200);return Buffer.from(await response.arrayBuffer());}));
 const bytes=Buffer.concat(pieces);
 assert.equal(bytes.length,manifest.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
 for (const path of ['/assets/guardian-center.mp4','/assets/guardian-poster.jpg','/audio/guardian-welcome.mp3','/amazon-judge.js','/']) assert.equal((await fetch(base+path)).status,200,path);
 assert.equal((await fetch(base+'/assets/does-not-exist')).status,404);
 const standalone=await readFile(new URL('../dist/guardian-demo.html',import.meta.url),'utf8');
 assert.ok(standalone.includes('data:video/mp4;base64,'));
 assert.ok(!standalone.includes('src="/assets/guardian-'));
 assert.ok(!standalone.includes('src="/audio/guardian-welcome.mp3"'));
 console.log('Local flight assets, approved SHA-256 and self-contained offline media passed.');
}finally{child.kill('SIGTERM');}
