import { buildGuardianPlan, judgeScenario } from '../src/guardian-core.mjs';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    return response.status(200).json({
      ok: true,
      product: 'STAARWAARDD Guardian',
      track: 'Alexa+ simulated experience',
      miniChallenge: 'None claimed',
      mode: 'competition-judge-api',
      awsRuntime: 'Optional server-side Bedrock adapter; not used by the MCP judge path',
      
      portals: ['Creativity','Work','Home','Wellbeing','Relationships','Community','Style']
    });
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.input !== 'string' || !body.input.trim() || body.input.length > 2000 || (body.mode !== undefined && !['plan','judge','bedrock'].includes(body.mode))) {
    return response.status(400).json({ok:false, error:'Enter a request of 1–2000 characters and a supported mode.'});
  }
  const input = body.input.trim();

  if (body.mode === 'bedrock') {
    try {
      const { invokeGuardianBedrock } = await import('./bedrock-adapter.mjs');
      const result = await invokeGuardianBedrock(input);
      return response.status(200).json(result);
    } catch (error) {
      const unavailable = error.message === 'BEDROCK_NOT_CONFIGURED';
      return response.status(unavailable ? 503 : 502).json({ok:false, verifiedExecution:false, error:unavailable ? 'Bedrock credentials, region or model are not configured' : 'Bedrock invocation failed'});
    }
  }

  const mode = body.mode === 'judge' ? 'judge' : 'plan';
  const raw = mode === 'judge'
    ? judgeScenario()
    : buildGuardianPlan(input, { source: 'Alexa+ simulated experience' });
  const domains = raw.portals || [];
  const steps = raw.steps || [];
  const exchanges = domains.slice(1).map((domain, index) => ({
    from: domains[index],
    to: domain,
    signal: `${domains[index]} context passed only because it affects ${domain}`
  }));
  const tasks = steps.map((step, index) => ({
    domain: step.portal,
    title: step.title || step.capability.replaceAll('_', ' '),
    detail: step.summary,
    time: index < 2 ? 'Now' : 'Today',
    sensitive: Boolean(step.externalAction),
    action: step.status
  }));
  const approvalsRequired = tasks.filter((item) => item.sensitive).length;
  const plan = {
    summary: raw.outcome,
    domains,
    questions: raw.questions,
    dependency: raw.dependency,
    coordination: {
      detected: raw.request,
      agents: domains,
      exchanges,
      decision: raw.approvalRequired
        ? 'Review required. This demo cannot send, publish, book, buy or control a device, even after review.'
        : 'Preparation only. Review the suggested steps and supply the missing details.'
    },
    now: tasks.slice(0, Math.min(3, tasks.length)),
    today: tasks.slice(Math.min(3, tasks.length)),
    week: []
  };

  return response.status(200).json({
    ok: true,
    mode,
    architecture: {
      interface: 'Alexa+-style web simulation',
      protocol: 'HTTPS JSON demo API; no Alexa/MCP connection',
      orchestrator: 'Guardian',
      aws: 'No AWS invocation in this demo'
    },
    plan,
    raw,
    narration: raw.narration || [],
    metrics: {
      userRequests: raw.metrics?.userRequestsRequired ?? 1,
      portalsActivated: raw.metrics?.portalsCoordinated ?? domains.length,
      crossPortalExchanges: exchanges.length,
      approvalsRequired,
      externalActionsExecuted: raw.metrics?.unsafeAutomaticActions ?? 0
    }
  });
}
