import { buildGuardianPlan, judgeScenario } from '../src/guardian-core.mjs';

const help = 'Welcome to Star Ward Guardian. Say run the demo, or say plan for followed by your request. I prepare plans only; I cannot send messages, make purchases, or control devices.';
function say(text, end = false) {
  return { version: '1.0', response: {
    outputSpeech: { type: 'PlainText', text },
    card: { type: 'Simple', title: 'STAARWAARDD Guardian', content: text },
    ...(!end ? { reprompt: { outputSpeech: { type: 'PlainText', text: 'Say plan for my meeting, or run the demo.' } } } : {}),
    shouldEndSession: end
  } };
}
function speakPlan(plan) {
  const summary = `I prepared a plan across ${plan.portals.join(', ')}. `;
  const details = plan.steps.map(step => `${step.portal}: ${step.capability.replaceAll('_', ' ')}.`).join(' ');
  return say(summary + details + (plan.approvalRequired
    ? ' This request includes actions requiring approval. Everything remains on hold. This demo cannot execute those actions, even if you say yes.'
    : ' This is preparation only. No messages were sent, bookings made, or devices changed.'));
}

// Lambda invocation only. Do not expose this function through a public Function URL.
// Require an Alexa Skills Kit trigger restricted to this same skill ID.
export async function handler(event) {
  const expected = process.env.ALEXA_SKILL_ID;
  if (!expected || !expected.startsWith('amzn1.ask.skill.')) throw new Error('ALEXA_SKILL_ID_NOT_CONFIGURED');
  const ids = [event?.context?.System?.application?.applicationId, event?.session?.application?.applicationId].filter(Boolean);
  if (!ids.length || ids.some(id => id !== expected)) throw new Error('INVALID_SKILL_ID');
  const timestamp = Date.parse(event?.request?.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 150000) throw new Error('INVALID_REQUEST_TIMESTAMP');
  if (event?.version !== '1.0') throw new Error('INVALID_REQUEST_VERSION');
  const request = event.request;
  if (request.type === 'SessionEndedRequest') return { version: '1.0', response: {} };
  if (request.type === 'LaunchRequest') return say(help);
  if (request.type !== 'IntentRequest') return say('That request is not supported. ' + help);
  const intent = request.intent;
  switch (intent?.name) {
    case 'GuardianPlanIntent': {
      const value = intent.slots?.request?.value;
      if (typeof value !== 'string' || !value.trim()) return say('Tell me what to prepare. For example, say plan for my meeting tomorrow.');
      return speakPlan(buildGuardianPlan(value.trim().slice(0, 2000), { source: 'Alexa custom skill' }));
    }
    case 'GuardianDemoIntent': return speakPlan(judgeScenario());
    case 'AMAZON.StopIntent':
    case 'AMAZON.CancelIntent': return say('Guardian closed. No external actions were executed.', true);
    case 'AMAZON.YesIntent': return say('This demo prepares plans only. Saying yes does not execute an action. Say plan for followed by a new request.');
    case 'AMAZON.NoIntent': return say('No external actions were executed. Say plan for followed by a new request.');
    default: return say(help);
  }
}
