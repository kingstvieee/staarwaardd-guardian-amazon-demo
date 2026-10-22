import assert from 'node:assert/strict';
import { handler } from '../alexa/lambda.mjs';
const id = 'amzn1.ask.skill.local-test';
process.env.ALEXA_SKILL_ID = id;
function event(name, value) {
  return {version:'1.0',context:{System:{application:{applicationId:id}}},request:{type:'IntentRequest',timestamp:new Date().toISOString(),intent:{name,slots:{request:{value}}}}};
}
const speak = result => result.response.outputSpeech.text;
assert.match(speak(await handler({...event(),request:{type:'LaunchRequest',timestamp:new Date().toISOString()}})), /plan dinner/);
const preparation = await handler(event('GuardianPlanIntent','prepare my meeting notes'));
assert.match(speak(preparation), /Work/);
assert.match(speak(preparation), /Preparation only/);
assert.equal(preparation.response.shouldEndSession,false);
const held = await handler(event('GuardianPlanIntent','publish my campaign and unlock my home door'));
assert.match(speak(held), /Creativity:.*Home:/);
assert.match(speak(held), /marked actions remain on hold/);
assert.match(speak(await handler(event('AMAZON.YesIntent'))), /does not execute/);
assert.match(speak(await handler(event('GuardianDemoIntent'))), /Work/);
assert.match(speak(await handler(event('GuardianPlanIntent','  '))), /Tell me what/);
assert.equal((await handler(event('AMAZON.StopIntent'))).response.shouldEndSession,true);
await assert.rejects(handler({...event(),context:{System:{application:{applicationId:'wrong'}}}}), /INVALID_SKILL_ID/);
await assert.rejects(handler({...event(),session:{application:{applicationId:'wrong'}}}), /INVALID_SKILL_ID/);
await assert.rejects(handler({...event(),request:{...event().request,timestamp:'2000-01-01T00:00:00Z'}}), /INVALID_REQUEST_TIMESTAMP/);
await assert.rejects(handler({...event(),request:{...event().request,timestamp:'invalid'}}), /INVALID_REQUEST_TIMESTAMP/);
const visualEvent=event('GuardianPlanIntent','publish my campaign and prepare meeting notes tomorrow');
visualEvent.context.System.device={supportedInterfaces:{'Alexa.Presentation.APL':{}}};
const visual=await handler(visualEvent);
assert.match(speak(visual),/tomorrow/);
assert.equal(visual.response.directives[0].type,'Alexa.Presentation.APL.RenderDocument');
const document=visual.response.directives[0].document;
const screen=JSON.stringify(visual.response.directives);
assert.match(screen,/APPROVAL REQUIRED/);assert.match(screen,/PREPARATION ONLY/);assert.match(screen,/ScrollView/);assert.match(screen,/Agenda/);
assert.ok(!preparation.response.directives,'voice-only devices receive no unsupported visual directive');
const unclear=await handler(event('GuardianPlanIntent','prepare my meeting at 3 pm and my meeting at 5 pm'));
assert.match(speak(unclear),/Which time/);assert.doesNotMatch(speak(unclear),/I prepared/);
assert.match(speak(await handler(event('AMAZON.FallbackIntent'))),/did not catch.*plan dinner/);
assert.match(speak(await handler(event('GuardianPlanIntent','dinner'))),/Relationships/);
const escaped=event('GuardianPlanIntent','draft a message to my family saying "<b>Hi & hello</b>"');
escaped.context.System.device={supportedInterfaces:{'Alexa.Presentation.APL':{}}};
const escapedScreen=JSON.stringify((await handler(escaped)).response.directives);
assert.match(escapedScreen,/&lt;b&gt;/);assert.doesNotMatch(escapedScreen,/<b>/);
const {readFile}=await import('node:fs/promises');
const model=JSON.parse(await readFile(new URL('../alexa/interaction-model.json',import.meta.url)));
const samples=model.interactionModel.languageModel.intents[0].samples;
assert.ok(samples.includes('plan {request}'));assert.ok(samples.includes('prepare {request}'));
assert.ok(samples.every(s=>s.replace('{request}','').trim().length));
// Long supplied text must survive end-to-end and stay in an unlimited-height scroller.
const longMessage='First line. '+('Review the supplied agenda and budget. '.repeat(30))+'FINAL_MARKER';
const longEvent=event('GuardianPlanIntent','Draft an email to Maya saying "'+longMessage+'"');
longEvent.context.System.device={supportedInterfaces:{'Alexa.Presentation.APL':{}}};
const longResult=await handler(longEvent);
const directive=longResult.response.directives[0];
assert.ok(Object.values(directive.datasources.guardian.properties).some(v=>v.includes(longMessage)&&v.includes('FINAL_MARKER')));
const scroll=directive.document.mainTemplate.items[0].item;
assert.equal(scroll.type,'ScrollView');assert.equal(scroll.height,'100%');
function checkText(node){
 if(!node||typeof node!=='object')return;
 if(node.type==='Text'){assert.equal(node.maxLines,0);assert.equal(node.height,'auto');assert.equal(node.shrink,0);}
 for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(checkText);else if(value&&typeof value==='object')checkText(value);}
}
checkText(scroll);
delete process.env.ALEXA_SKILL_ID;
await assert.rejects(handler(event()), /NOT_CONFIGURED/);
console.log('Alexa adapter checks passed: planning, approval boundary, lifecycle, skill identity, timestamp. Updated model recognition and card layout require Amazon simulator verification.');
