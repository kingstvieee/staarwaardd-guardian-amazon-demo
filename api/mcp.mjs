// Consolidates staarwardd PR #3's MCP tool with this export's tested planner.
// Stateless MCP 2025-11-25 / Streamable HTTP, JSON response mode.
import guardianHandler from './amazon-guardian.mjs';

export const PROTOCOL_VERSION = '2025-11-25';
export const TOOL_NAME = 'staarwardd_plan';
const tool = {
  name: TOOL_NAME,
  title: 'STAARWAARDD Guardian Plan',
  description: 'Prepare an inspectable plan across the seven STAARWAARDD life domains. External-action requests remain approval-gated; this tool executes no external actions. STAARVERSE is a separate visual game preview.',
  inputSchema: {
    type: 'object',
    properties: {
      request: {type: 'string', minLength: 1, maxLength: 2000},
      mode: {type: 'string', enum: ['plan','judge'], default: 'plan'}
    },
    required: ['request'], additionalProperties: false
  },
  annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false}
};
const result = (id, value) => ({jsonrpc: '2.0', id, result: value});
const error = (id, code, message) => ({jsonrpc: '2.0', id: id ?? null, error: {code, message}});
const object = value => value && typeof value === 'object' && !Array.isArray(value);

export async function dispatchMcp(message) {
  if (!object(message) || message.jsonrpc !== '2.0') return error(null, -32600, 'Invalid JSON-RPC request');
  const hasId = Object.hasOwn(message, 'id');
  if (hasId && !['number','string'].includes(typeof message.id)) return error(null, -32600, 'Invalid request id');
  if (!hasId && !message.method && (Object.hasOwn(message, 'result') || Object.hasOwn(message, 'error'))) return null;
  if (typeof message.method !== 'string' || !message.method) return error(message.id, -32600, 'A method is required');
  // Notifications, including notifications/initialized, have no JSON-RPC response.
  if (!hasId) return null;
  const {id, method, params = {}} = message;
  if (!object(params)) return error(id, -32602, 'Expected object parameters');
  if (method === 'initialize') {
    if (typeof params.protocolVersion !== 'string' || !object(params.capabilities) || !object(params.clientInfo) || typeof params.clientInfo.name !== 'string' || typeof params.clientInfo.version !== 'string') return error(id, -32602, 'Invalid initialize parameters');
    return result(id, {protocolVersion: PROTOCOL_VERSION, capabilities: {tools: {}}, serverInfo: {name: 'staarwaardd-guardian', version: '1.1.0'}, instructions: 'A public planning demonstration. Seven life domains; no account, device, or external action execution. Alexa+ device connection is not demonstrated.'});
  }
  if (method === 'ping') return result(id, {});
  if (method === 'tools/list') return result(id, {tools: [tool]});
  if (method === 'tools/call') {
    const args = params.arguments;
    if (params.name !== TOOL_NAME || !object(args) || typeof args.request !== 'string' || !args.request.trim() || args.request.length > 2000 || Object.keys(args).some(key => !['request','mode'].includes(key)) || (args.mode !== undefined && !['plan','judge'].includes(args.mode))) return error(id, -32602, 'Expected staarwardd_plan with a request of 1–2000 characters and optional plan/judge mode');
    let status = 200, payload;
    await guardianHandler({method: 'POST', body: {input: args.request, mode: args.mode || 'plan'}}, {
      setHeader() {}, status(code) {status = code; return this;}, json(value) {payload = value; return this;}
    });
    if (status !== 200 || !payload?.ok) return result(id, {content: [{type: 'text', text: 'Guardian could not prepare this request.'}], isError: true});
    payload.architecture = {interface: 'Alexa+ track web MCP client', protocol: 'MCP 2025-11-25 / Streamable HTTP', orchestrator: 'Guardian', aws: 'No AWS runtime invocation', tool: TOOL_NAME};
    return result(id, {content: [{type: 'text', text: JSON.stringify(payload)}], structuredContent: payload, isError: false});
  }
  return error(id, -32601, 'Method not found');
}

function validOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return true; // Non-browser MCP clients do not send Origin.
  try {
    const url = new URL(origin);
    const host = req.headers.host;
    const allowed = new Set(['staarwaardd-guardian-amazon-demo.vercel.app', process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean));
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host || '')) allowed.add(host);
    return ['http:','https:'].includes(url.protocol) && url.host === host && allowed.has(host);
  } catch {return false;}
}

export default async function mcpHandler(req, res) {
  const send = (status, body) => {
    res.statusCode = status;
    res.setHeader('Cache-Control', 'no-store');
    if (body !== undefined) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(body === undefined ? undefined : JSON.stringify(body));
  };
  if (!validOrigin(req)) return send(403, error(null, -32000, 'Origin is not allowed'));
  if (req.headers?.['mcp-protocol-version'] && req.headers['mcp-protocol-version'] !== PROTOCOL_VERSION) return send(400, error(null, -32000, 'Unsupported MCP protocol version'));
  if (req.method !== 'POST') {res.setHeader('Allow', 'POST'); return send(405);}
  const accept = req.headers?.accept || '';
  if (!accept.includes('application/json') || !accept.includes('text/event-stream')) return send(406, error(null, -32000, 'Accept must include application/json and text/event-stream'));
  if (!(req.headers?.['content-type'] || '').includes('application/json')) return send(415, error(null, -32000, 'Expected application/json'));
  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
    if (JSON.stringify(body || '').length > 16384) return send(413, error(null, -32000, 'Request is too large'));
  } catch {return send(400, error(null, -32700, 'Parse error'));}
  try {
    const response = await dispatchMcp(body);
    return response === null ? send(202) : send(200, response);
  } catch {return send(500, error(body?.id, -32603, 'Guardian MCP request failed'));}
}
