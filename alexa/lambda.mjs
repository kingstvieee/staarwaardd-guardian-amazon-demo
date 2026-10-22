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
const publicDemo = 'https://staarwaardd-guardian-amazon-demo.vercel.app';
const xml = text => String(text).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function withDisplay(result, event, plan) {
  if (!event?.context?.System?.device?.supportedInterfaces?.['Alexa.Presentation.APL']) return result;
  const heading = plan ? plan.outcome : 'One request. A plan you can inspect.';
  const body = plan ? plan.steps.map(s=>`${s.portal} / ${s.externalAction?'APPROVAL REQUIRED':'PREPARATION ONLY'}\n${s.title}\n${s.summary}`).join('\n\n') : 'Say run the demo, or say plan for followed by your request. Guardian prepares your next steps. Every decision stays yours.';
  const visualText = (key,size,color) => ({type:'Text',text:'${payload.guardian.properties.'+key+'}',fontSize:size,color});
  const content = {type:'Container',width:'100%',height:'100%',paddingLeft:24,paddingRight:24,paddingTop:20,paddingBottom:20,items:[
    {type:'Text',text:'STAARWAARDD GUARDIAN',fontSize:24,color:'#c9deef'},
    {type:'Container',direction:'row',grow:1,items:[
      {type:'Image',source:publicDemo+'/assets/guardian-poster.jpg',width:'22vw',height:'65vh',scale:'best-fit'},
      {type:'ScrollView',width:'70vw',height:'72vh',item:{type:'Container',items:[visualText('heading',25,'#ffffff'),visualText('body',19,'#dce9f2')]}}
    ]},
    {type:'Text',text:'PREPARATION ONLY / 0 EXTERNAL ACTIONS EXECUTED',fontSize:15,color:'#a9d7ed'}
  ]};
  result.response.directives = [{type:'Alexa.Presentation.APL.RenderDocument',token:'guardian-plan',document:{type:'APL',version:'1.7',theme:'dark',mainTemplate:{parameters:['payload'],items:[{type:'Frame',width:'100vw',height:'100vh',backgroundColor:'#0c182c',item:content}]}},datasources:{guardian:{type:'object',properties:{heading:xml(heading),body:xml(body)}}}}];
  return result;
}
function speakPlan(plan,event) {
  const summary = `I prepared a plan across ${plan.portals.join(', ')}. `;
  const details = plan.steps.map(step => `${step.portal}: ${step.title}.`).join(' ');
  const timing=plan.timing?.length?' I kept your timing: '+plan.timing.join(', ')+'.':'';
  const constraints=plan.restrictions?.length?' Your instruction '+plan.restrictions.join('; ')+' is preserved.':'';
  return withDisplay(say(summary + details + timing + constraints + (plan.approvalRequired
    ? ' The marked actions remain on hold. This demo cannot execute them, even if you say yes.'
    : ' This is preparation only. No messages were sent, bookings made, or devices changed.')),event,plan);
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
  if (request.type === 'LaunchRequest') return withDisplay(say(help),event);
  if (request.type !== 'IntentRequest') return say('That request is not supported. ' + help);
  const intent = request.intent;
  switch (intent?.name) {
    case 'GuardianPlanIntent': {
      const value = intent.slots?.request?.value;
      if (typeof value !== 'string' || !value.trim()) return say('Tell me what to prepare. For example, say plan for my meeting tomorrow.');
      return speakPlan(buildGuardianPlan(value.trim().slice(0, 2000), { source: 'Alexa custom skill' }),event);
    }
    case 'GuardianDemoIntent': return speakPlan(judgeScenario(),event);
    case 'AMAZON.StopIntent':
    case 'AMAZON.CancelIntent': return say('Guardian closed. No external actions were executed.', true);
    case 'AMAZON.YesIntent': return say('This demo prepares plans only. Saying yes does not execute an action. Say plan for followed by a new request.');
    case 'AMAZON.NoIntent': return say('No external actions were executed. Say plan for followed by a new request.');
    default: return say(help);
  }
}
