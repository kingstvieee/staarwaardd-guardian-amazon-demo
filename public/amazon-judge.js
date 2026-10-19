const $ = (s) => document.querySelector(s);

let mcpConnection;
let mcpId = 0;
const mcpVersion = '2025-11-25';
function protocolLine(text) {
  const entry = document.createElement('li'); entry.textContent = text;
  $('#mcpTrace')?.append(entry);
  while ($('#mcpTrace')?.children.length > 7) $('#mcpTrace').children[3].remove();
}
async function mcpRpc(method, params, notification = false) {
  const id = notification ? undefined : ++mcpId;
  const response = await fetch('/api/mcp', {
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream', ...(method === 'initialize' ? {} : {'MCP-Protocol-Version':mcpVersion})},
    body:JSON.stringify({jsonrpc:'2.0', ...(notification ? {} : {id}), method, params}),
    signal:AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`MCP ${method} failed (HTTP ${response.status})`);
  if (notification) {if (response.status !== 202) throw new Error('MCP notification was not accepted'); return;}
  let message;
  if (response.headers.get('content-type')?.includes('text/event-stream')) {
    const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
    try {
      while (!message) {
        const {value,done} = await reader.read();
        buffer += decoder.decode(value, {stream:!done}).replaceAll('\r\n','\n');
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0,boundary); buffer = buffer.slice(boundary+2);
          const data = block.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
          if (data) {const candidate = JSON.parse(data); if (candidate.id === id) message = candidate;}
        }
        if (done) break;
      }
    } finally {await reader.cancel();}
  } else message = await response.json();
  if (!message || message.jsonrpc !== '2.0' || message.id !== id) throw new Error('MCP response did not match the request');
  if (message.error) throw new Error(message.error.message);
  return message.result;
}
async function connectMcp() {
  if (window.demoOffline) throw new Error('This downloaded preview runs locally. Open the hosted demo for a real MCP connection.');
  if (!mcpConnection) mcpConnection = (async()=>{
    $('#mcpStatus').textContent = 'Connecting Guardian MCP…';
    const initialized = await mcpRpc('initialize', {protocolVersion:mcpVersion, capabilities:{}, clientInfo:{name:'staarwaardd-web-demo',version:'1.1.0'}});
    if (initialized.protocolVersion !== mcpVersion) throw new Error('Unsupported server protocol');
    protocolLine(`initialize → ${initialized.serverInfo.name} / ${initialized.protocolVersion}`);
    await mcpRpc('notifications/initialized', {}, true);
    protocolLine('notifications/initialized → HTTP 202 accepted');
    const listed = await mcpRpc('tools/list', {});
    if (!listed.tools?.some(tool=>tool.name === 'staarwardd_plan')) throw new Error('Guardian planning tool is unavailable');
    protocolLine('tools/list → staarwardd_plan discovered');
    $('#mcpStatus').textContent = 'MCP CONNECTED · GUARDIAN TOOL AVAILABLE';
    return listed;
  })().catch(error=>{mcpConnection=undefined; $('#mcpStatus').textContent=error.message; throw error;});
  return mcpConnection;
}
async function guardianRequest(mode, input) {
  // The downloadable source preview is explicitly local; the hosted UI uses MCP.
  if (window.demoOffline) {
    const response = await fetch('/api/amazon-guardian', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,input})});
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Preview failed'); return data;
  }
  await connectMcp();
  protocolLine(`tools/call → staarwardd_plan (${mode})`);
  const result = await mcpRpc('tools/call', {name:'staarwardd_plan', arguments:{request:input, mode}});
  if (result.isError || !result.structuredContent?.ok) throw new Error('Guardian MCP could not prepare a plan');
  protocolLine(`tools/call ✓ ${result.structuredContent.metrics.portalsActivated} domains / ${result.structuredContent.metrics.externalActionsExecuted} external actions`);
  return result.structuredContent;
}
$('#connectMcp')?.addEventListener('click', ()=>connectMcp().catch(error=>{$('#status').textContent=error.message;}));

async function run(mode) {
  const status = $('#status');
  const result = $('#result');
  status.textContent = 'Guardian is coordinating across the relevant portals…';
  result.hidden = true;
  try {
    const data = await guardianRequest(mode, $('#request').value);
    render(data);
    status.textContent = 'Guardian coordination complete. Sensitive actions remain approval-gated.';
    return data;
  } catch (error) {
    status.textContent = error.message;
  }
}

function render(data) {
  const plan = data.plan || data;
  const coordination = plan.coordination || {};
  const domains = plan.domains || [];
  $('#summary').textContent = plan.summary || 'Guardian coordinated the request.';
  $('#decision').textContent = coordination.decision || 'Prepared actions only; approval required for external changes.';

  $('#techProof').textContent = `${data.architecture?.interface || 'Web simulation'} → ${data.architecture?.protocol || 'HTTPS JSON'} → ${data.architecture?.orchestrator || 'Guardian'}. This source export makes no AWS calls.`;
  $('#designProof').textContent = 'One request becomes a visible plan: selected domains, illustrative preparation steps and permission markers.';
  $('#impactProof').textContent = 'Illustrates fewer app handoffs; no real-world time saving or customer adoption is measured in this demo.';
  $('#ideaProof').textContent = 'STAARWAARDD explores one connected-life view, with Guardian preparing the relevant next steps and the human retaining authority.';

  $('#portals').innerHTML = domains.map((domain, index) => `
    <article class="portal-card">
      <span>${String(index + 1).padStart(2,'0')}</span>
      <b>${esc(domain)}</b>
      <small>PLANNED DOMAIN</small>
    </article>`).join('');

  $('#exchanges').innerHTML = (coordination.exchanges || []).map((x) => `
    <li><b>${esc(x.from)}</b><span>${esc(x.signal)}</span><b>${esc(x.to)}</b></li>`).join('') || '<li>No unnecessary cross-portal exchange was required.</li>';

  const actions = [...(plan.now || []), ...(plan.today || []), ...(plan.week || [])];
  $('#actionsList').innerHTML = actions.map((item) => `
    <article class="action-card ${item.sensitive ? 'approval' : ''}">
      <div><span>${esc(item.domain)}</span>${item.sensitive ? '<em>APPROVAL REQUIRED</em>' : '<em>SAFE TO PREPARE</em>'}</div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.detail)}</p>
      <small>${esc(item.time || '')}</small>
    </article>`).join('');

  const metrics = data.metrics || {
    portalsActivated: domains.length,
    externalActionsExecuted: 0,
    approvalsRequired: actions.filter(a => a.sensitive).length,
    userRequests: 1
  };
  $('#metrics').innerHTML = [
    ['User requests', metrics.userRequests ?? 1],
    ['Relevant portals', metrics.portalsActivated ?? domains.length],
    ['Cross-portal exchanges', metrics.crossPortalExchanges ?? (coordination.exchanges || []).length],
    ['External actions executed', metrics.externalActionsExecuted ?? 0]
  ].map(([label, value]) => `<div><b>${esc(String(value))}</b><span>${esc(label)}</span></div>`).join('');

  $('#standby').hidden = true;
  $('#result').hidden = false;
  $('#studio').scrollIntoView({behavior:'smooth', block:'start'});
}

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

$('#runJudge').addEventListener('click', () => run('judge'));
$('#runCustom').addEventListener('click', () => run('plan'));



const verseMotion = $('#verseMotion');
verseMotion?.addEventListener('click', () => {
  const paused = $('#staarverse').classList.toggle('motion-paused');
  verseMotion.setAttribute('aria-pressed', String(paused));
  verseMotion.textContent = paused ? 'RESUME PORTAL MOTION' : 'PAUSE PORTAL MOTION';
});


const tourChapters = [
  {
    "title": "Welcome to STAARWAARDD",
    "target": "cover",
    "text": "Alright, welcome to Star Ward. Life moves. You lead. Let me show you how Guardian turns one request into a plan you can actually see. Eight portals are on the cover: seven for everyday life, plus Star Verse, an immersive game in development."
  },
  {
    "title": "Eight worlds, one view",
    "target": "worlds",
    "text": "Here’s the world atlas. Work handles priorities. Creativity covers ideas and launches. Home covers arrival. Wellbeing makes room to reset. Relationships keeps commitments in view. Community brings in connection. Style makes room for expression. Star Verse opens the game-world preview. These visuals show the vision, not connected services."
  },
  {
    "title": "How Guardian connects through MCP",
    "target": "studio",
    "action": "integration",
    "text": "Here’s the connection. The web client initializes Guardian’s M C P server, discovers the Star Ward plan tool, and sends your request. The server returns the plan on screen. The trace shows those real calls. This is an Alexa Plus track demonstration through a web client; device access depends on Amazon’s preview tools."
  },
  {
    "title": "Prepare meeting notes",
    "target": "studio",
    "action": "notes",
    "text": "First, prepare my meeting notes. Guardian selects Work and marks the step safe to prepare. You can inspect the proposal. It hasn’t opened your calendar or created a document. That zero at the bottom means no external action was executed."
  },
  {
    "title": "Approval before action",
    "target": "studio",
    "action": "approval",
    "text": "Now let’s raise the stakes: publish my campaign and unlock my home door. Creativity and Home both show approval required. The demo prepares illustrative steps, but it publishes nothing and unlocks nothing. Seeing a plan is never the same as giving permission."
  },
  {
    "title": "The full evening scenario",
    "target": "studio",
    "action": "judge",
    "text": "Here’s the full scenario. A pitch runs late, and the evening includes a launch, fitting, dinner, gift delivery, wellbeing reset, and getting home. Guardian selects six relevant domains. External-action words conservatively hold every selected domain for review, even when the request says not to send."
  },
  {
    "title": "Inspect the coordination",
    "target": "metrics",
    "action": "trace",
    "text": "Check the numbers: one request, six relevant portals, five illustrative exchanges, and zero external actions. Open the trace and follow how the domains pass context. This is a visible simulation, not proof that live services exchanged data or that measured time was saved."
  },
  {
    "title": "The human boundary",
    "target": "boundaries",
    "text": "This is the human boundary. Prepare the move. Keep the permission. The examples explain what the demo does and where it stops. The planner is keyword based, so it can miss negation and action ownership. That limitation is stated openly. The final say stays with you."
  },
  {
    "title": "Enter STAARVERSE",
    "target": "staarverse",
    "text": "And this is Star Verse: the immersive game being developed inside the Star Ward universe. The chrome gateway gives the game its own entrance. You can pause or resume the portal animation. This is a visual preview; playable access and game mechanics are not demonstrated here."
  },
  {
    "title": "Explore and inspect",
    "target": "finale",
    "text": "That’s the walkthrough. Try a fresh request to explore the working planner, or open the public demo source to inspect the interface, JSON handler, and tests. The broader app stays proprietary. Eight portals. One Guardian. More of your life in view. Every decision still yours."
  }
];

// Recorded narration follows real simulation results; no external action is executed.
(() => {
  const voice = $('#tourVoice'), bed = $('#tourBed'), player = $('#tourPlayer');
  let index = 0, active = false, preparing = false, sequence = 0, musicOn = true;
  const judgeInput = 'Guardian, my investor pitch is running late. Prepare my launch, fitting, anniversary dinner, gift delivery, wellbeing reset and home arrival. Draft a message about the dinner but do not send it.';
  const audioSource = path => window.demoTourAudio?.[path] || path;
  bed.volume = 0.7;
  function controls() {
    $('#tourPrev').disabled = preparing || index === 0;
    $('#tourNext').disabled = preparing || index === tourChapters.length - 1;
    $('#tourReplay').disabled = preparing;
    $('#tourPlay').disabled = preparing;
  }
  function pause() {
    voice.pause(); bed.pause();
    $('#tourPlay').textContent = 'RESUME';
    $('#tourState').textContent = 'Paused — your place is saved.';
  }
  function stop() {
    sequence++; active = false; preparing = false;
    voice.pause(); bed.pause();
    player.hidden = true; document.body.classList.remove('tour-active');
    document.querySelectorAll('.tour-focus').forEach(el => el.classList.remove('tour-focus'));
  }
  async function playAudio() {
    if (!active) return;
    try {
      await voice.play();
      if (!active) {voice.pause(); return;}
      if (musicOn) bed.play().catch(() => {$('#tourState').textContent = 'Narration playing. Tap MUSIC ON to start the instrumental.';});
      $('#tourPlay').textContent = 'PAUSE';
      $('#tourState').textContent = 'Guided walkthrough playing';
    } catch {
      $('#tourPlay').textContent = 'PLAY';
      $('#tourState').textContent = 'Tap PLAY to continue the recorded narration.';
    }
  }
  async function go(next, autoplay = true) {
    if (window.demoOffline && next === 2) next = next > index ? 3 : 1;
    if (preparing || next < 0 || next >= tourChapters.length) return;
    const stamp = ++sequence;
    index = next; active = true; preparing = true;
    voice.pause(); bed.pause(); player.hidden = false;
    document.body.classList.add('tour-active');
    controls();
    const chapter = tourChapters[index];
    $('#tourCounter').textContent = `${String(index + 1).padStart(2,'0')} / ${tourChapters.length}`;
    $('#tourTitle').textContent = chapter.title;
    $('#tourCaption').textContent = chapter.text;
    $('#tourProgress').value = 0;
    $('#tourState').textContent = 'Preparing this step…';
    try {
      if (chapter.action === 'integration') {
        await connectMcp();
        $('#request').value = 'Prepare my meeting notes';
        const result = await run('plan'); if (!result) throw new Error('The MCP tool call could not load. Try this step again.');
      } else if (chapter.action === 'notes') {
        $('#request').value = 'Prepare my meeting notes';
        const result = await run('plan'); if (!result) throw new Error('The meeting-notes preview could not load. Try this step again.');
      } else if (chapter.action === 'approval') {
        $('#request').value = 'Publish my campaign and unlock my home door';
        const result = await run('plan'); if (!result) throw new Error('The approval preview could not load. Try this step again.');
      } else if (chapter.action === 'judge') {
        $('#request').value = judgeInput;
        const result = await run('judge'); if (!result) throw new Error('The full scenario could not load. Try this step again.');
      } else if (chapter.action === 'trace') {
        if ($('#result').hidden || !$('#metrics').textContent.includes('6')) {
          $('#request').value = judgeInput;
          const result = await run('judge'); if (!result) throw new Error('The coordination preview could not load. Try this step again.');
        }
        $('#studio details').open = true;
      }
      if (stamp !== sequence || !active) return;
      if (chapter.action !== 'trace') $('#studio details').open = false;
      document.querySelectorAll('.tour-focus').forEach(el => el.classList.remove('tour-focus'));
      const target = document.getElementById(chapter.target);
      target.classList.add('tour-focus');
      target.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
      voice.src = audioSource(`/audio/voice-${String(index + 1).padStart(2,'0')}.mp3`);
      voice.load();
      preparing = false; controls();
      if (autoplay) await playAudio(); else pause();
    } catch(error) {
      if (stamp !== sequence) return;
      preparing = false; controls(); pause();
      $('#tourState').textContent = error.message;
    }
  }
  $('#startTour').addEventListener('click', () => go(0));
  $('#tourPrev').addEventListener('click', () => go(index - 1));
  $('#tourNext').addEventListener('click', () => go(index + 1));
  $('#tourReplay').addEventListener('click', () => go(index));
  $('#tourClose').addEventListener('click', stop);
  $('#tourPlay').addEventListener('click', () => {
    if (voice.paused) {
      if (voice.ended) return go(index);
      playAudio();
    } else pause();
  });
  $('#tourMusic').addEventListener('click', () => {
    musicOn = !musicOn;
    $('#tourMusic').textContent = musicOn ? 'MUSIC ON' : 'MUSIC OFF';
    $('#tourMusic').setAttribute('aria-pressed', String(musicOn));
    if (musicOn && !voice.paused) bed.play().catch(() => {}); else bed.pause();
  });
  $('#tourVolume').addEventListener('input', event => {voice.volume = Number(event.target.value);});
  voice.addEventListener('timeupdate', () => {$('#tourProgress').value = voice.duration ? voice.currentTime / voice.duration : 0;});
  voice.addEventListener('error', () => {
    if (!active || preparing) return;
    pause(); $('#tourState').textContent = 'Narration could not load. The transcript is visible; use NEXT to continue.';
  });
  voice.addEventListener('ended', () => {
    if (!active) return;
    if (index < tourChapters.length - 1) go(index + 1);
    else {bed.pause(); $('#tourPlay').textContent = 'REPLAY'; $('#tourState').textContent = 'Walkthrough complete. Explore a fresh request or inspect the source.';}
  });
  // Returning to a backgrounded tab never starts sound unexpectedly.
  document.addEventListener('visibilitychange', () => {if (document.hidden && active) pause();});
  document.addEventListener('keydown', event => {if (event.key === 'Escape' && active) stop();});
  document.querySelectorAll('.mastnav a,.hero-portals a,.finale-actions a').forEach(link => link.addEventListener('click', () => {if (active) stop();}));
  ['#runCustom','#runJudge'].forEach(selector => $(selector).addEventListener('click', () => {if(active) stop();}));
})();
