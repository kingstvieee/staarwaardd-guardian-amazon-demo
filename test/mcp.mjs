import assert from 'node:assert/strict';
import http from 'node:http';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import mcpHandler from '../api/mcp.mjs';

const observed = [];
const server = http.createServer(async(req,res)=>{
  let body = ''; for await(const chunk of req) body += chunk;
  try {observed.push(JSON.parse(body).method);} catch {}
  await mcpHandler({method:req.method, headers:req.headers, body},res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const endpoint = new URL(`http://127.0.0.1:${server.address().port}/api/mcp`);
const client = new Client({name:'guardian-independent-sdk-test',version:'1.0.0'});
const transport = new StreamableHTTPClientTransport(endpoint);
const headers = {'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-11-25'};
const post = (body, extra={}) => fetch(endpoint,{method:'POST',headers:{...headers,...extra},body:typeof body==='string'?body:JSON.stringify(body)});
try {
  await client.connect(transport);
  assert.equal(client.getServerVersion().name,'staarwaardd-guardian');
  const listed = await client.listTools();
  assert.equal(listed.tools[0].name,'staarwardd_plan');
  const call = async(request,mode='plan') => {
    const output = await client.callTool({name:'staarwardd_plan',arguments:{request,mode}});
    assert.equal(output.isError,false);
    assert.equal(output.structuredContent.metrics.externalActionsExecuted,0);
    assert.equal(output.structuredContent.architecture.protocol,'MCP 2025-11-25 / Streamable HTTP');
    return output.structuredContent;
  };
  for(const [domain,request] of Object.entries({Work:'Prepare my meeting notes',Creativity:'Prepare a creative design',Home:'Prepare my home arrival',Wellbeing:'Prepare a wellbeing reset',Relationships:'Prepare my anniversary dinner',Community:'Prepare my local community event',Style:'Prepare my outfit fitting'})) {
    const response = await call(request);
    assert.ok(response.plan.domains.includes(domain),`${domain} must route through the MCP tool`);
  }
  const safe = await call('Prepare my meeting notes');
  assert.equal(safe.metrics.approvalsRequired,0);
  const mixed = await call('Publish my campaign and unlock my home door');
  assert.deepEqual(mixed.plan.domains,['Creativity','Home']);
  assert.equal(mixed.metrics.approvalsRequired,2);
  const all = await call('Prepare work, creative content, home arrival, wellbeing, family dinner, local community and outfit style');
  assert.equal(all.plan.domains.length,7);
  assert.ok(!all.plan.domains.includes('STAARVERSE'));
  const full = await call('Run the documented full scenario','judge');
  assert.equal(full.metrics.portalsActivated,6);
  assert.equal(full.metrics.crossPortalExchanges,5);
  assert.equal(full.metrics.approvalsRequired,0);
  assert.ok(observed.includes('initialize') && observed.includes('notifications/initialized') && observed.includes('tools/list') && observed.includes('tools/call'));

  assert.equal((await post({jsonrpc:'2.0',method:'notifications/initialized'})).status,202);
  assert.equal((await post('{bad')).status,400);
  assert.equal((await post({jsonrpc:'2.0',id:20,method:'ping'},{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await post({jsonrpc:'2.0',id:21,method:'ping'},{Accept:'application/json'})).status,406);
  assert.equal((await post({jsonrpc:'2.0',id:22,method:'ping'},{'MCP-Protocol-Version':'1900-01-01'})).status,400);
  const invalid = await (await post({jsonrpc:'2.0',id:23,method:'tools/call',params:{name:'staarwardd_plan',arguments:{request:'',mode:'plan'}}})).json();
  assert.equal(invalid.error.code,-32602);
  console.log('Independent official MCP SDK client: initialize, discovery, seven domains, mixed approval, full scenario and transport checks passed. No Alexa device or external action was used.');
} finally {
  await client.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
