import { buildGuardianPlan, judgeScenario } from '../src/guardian-core.mjs';

const help = 'Welcome to Star Ward Guardian. Say plan dinner, plan my meeting tomorrow, or run the demo. I prepare checklists and drafts for your review. Nothing is sent, booked or changed.';
function say(text, end = false) {
  return { version: '1.0', response: {
    outputSpeech: { type: 'PlainText', text },
    card: { type: 'Simple', title: 'STAARWAARDD Guardian', content: text },
    ...(!end ? { reprompt: { outputSpeech: { type: 'PlainText', text: 'Say plan dinner, plan my meeting tomorrow, or run the demo.' } } } : {}),
    shouldEndSession: end
  } };
}
const publicDemo = 'https://staarwaardd-guardian-amazon-demo.vercel.app';
const xml = text => String(text).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function withDisplay(result, event, plan) {
  if (!event?.context?.System?.device?.supportedInterfaces?.['Alexa.Presentation.APL']) return result;
  const properties={};let nextText=0;
  const text=(value,size=24,color='#ffffff')=>{const key='text'+(++nextText);properties[key]=xml(value).replaceAll('\n','<br/>');return {type:'Text',width:'100%',height:'auto',maxLines:0,shrink:0,text:'${payload.guardian.properties.'+key+'}',fontSize:size,color};};
  const card=(badge,title,detail)=>({type:'Frame',width:'100%',height:'auto',shrink:0,backgroundColor:'#182940',borderColor:'#8faac1',borderWidth:1,borderRadius:12,padding:18,spacing:14,item:{type:'Container',items:[text(badge,18,'#c9deef'),text(title,28),text(detail,22,'#dce9f2')]}});
  const cards=plan ? [
    ...(plan.questions.length?[card('DETAIL NEEDED','Please clarify',plan.questions.join(' '))]:[]),
    ...plan.steps.map(step=>card(step.status==='needs_clarification'?'DETAIL NEEDED':step.externalAction?'APPROVAL REQUIRED':'PREPARATION ONLY',step.portal+' · '+step.title,(step.timing.length?step.timing.join(' / ')+'\n':'')+step.output)),
    ...(plan.restrictions.length?[card('YOUR CONSTRAINTS','Kept for review',plan.restrictions.join('; '))]:[])
  ] : [card('GUARDIAN',event?.request?.type==='LaunchRequest'?'Your next steps, together':'Your decision stays yours',result.response.outputSpeech.text)];
  // A single full-viewport scroller owns all content. Cards grow with text;
  // a fixed poster row cannot consume the space needed by long drafts.
  const content={type:'ScrollView',id:'guardianPlanScroll',width:'100%',height:'100%',item:{
    type:'Container',width:'100%',height:'auto',paddingLeft:20,paddingRight:20,paddingTop:20,paddingBottom:32,items:[
      text('STAARWAARDD GUARDIAN',22,'#c9deef'),
      text('0 ACTIONS EXECUTED · Swipe up for every task and draft',18,'#a9d7ed'),
      {type:'Image',source:publicDemo+'/assets/guardian-poster.jpg',width:80,height:100,scale:'best-fit',shrink:0},
      ...cards,
      text('END OF PLAN · Review before using any draft',18,'#a9d7ed')
    ]
  }};
  result.response.directives=[{type:'Alexa.Presentation.APL.RenderDocument',token:'guardian-plan',document:{type:'APL',version:'1.7',theme:'dark',mainTemplate:{parameters:['payload'],items:[{type:'Frame',width:'100vw',height:'100vh',backgroundColor:'#0c182c',item:content}]}},datasources:{guardian:{type:'object',properties}}}];
  return result;
}
function speakPlan(plan,event) {
  if(plan.questions.length)return withDisplay(say('I need a detail before finishing this plan. '+plan.questions[0]+' Say plan followed by your complete revised request. Nothing was executed.'),event,plan);
  const details=plan.steps.slice(0,4).map(step=>step.portal+': '+step.title+'. '+(step.externalAction?'Approval required. ':'Preparation only. ')).join(' ');
  const timing=plan.timing.length?' Timing: '+plan.timing.join(', ')+'.':'';
  const constraints=plan.restrictions.length?' Your instruction '+plan.restrictions.join('; ')+' is preserved.':'';
  const tail=plan.steps.length>4?' The remaining steps are on your plan card.':'';
  const draft=plan.steps.find(s=>s.portal==='Relationships'&&/Draft:/.test(s.output));
  const preview=draft?' Suggested message: '+draft.output.split('Draft: ')[1].split('\n')[0]+'. Review before sending.':'';
  const result=withDisplay(say('I prepared '+plan.steps.length+(plan.steps.length===1?' step. ':' steps. ')+details+timing+constraints+tail+preview+(plan.approvalRequired?' The marked actions remain on hold. This demo cannot execute them, even if you say yes.':' No messages were sent, bookings made, or devices changed.')),event,plan);
  return result;
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
      if (typeof value !== 'string' || !value.trim()) return withDisplay(say('Tell me what to prepare. For example, say plan dinner or plan my meeting tomorrow.'),event);
      return speakPlan(buildGuardianPlan(value.trim().slice(0, 2000), { source: 'Alexa custom skill' }),event);
    }
    case 'GuardianDemoIntent': return speakPlan(judgeScenario(),event);
    case 'AMAZON.StopIntent':
    case 'AMAZON.CancelIntent': return say('Guardian closed. No external actions were executed.', true);
    case 'AMAZON.YesIntent': return withDisplay(say('This demo prepares plans only. Saying yes does not execute an action. Say plan followed by a new request.'),event);
    case 'AMAZON.NoIntent': return withDisplay(say('No external actions were executed. Say plan followed by a new request.'),event);
    case 'AMAZON.FallbackIntent': return withDisplay(say('I did not catch the task. Try plan dinner, plan my meeting tomorrow, or run the demo. Please repeat the whole request. Nothing was executed.'),event);
    default: return withDisplay(say(help),event);
  }
}
