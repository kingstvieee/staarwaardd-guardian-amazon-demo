import assert from 'node:assert/strict';
import { handler } from '../alexa/lambda.mjs';
const id = 'amzn1.ask.skill.local-test';
process.env.ALEXA_SKILL_ID = id;
function event(name, value) {
  return {version:'1.0',context:{System:{application:{applicationId:id}}},request:{type:'IntentRequest',timestamp:new Date().toISOString(),intent:{name,slots:{request:{value}}}}};
}
const speak = result => result.response.outputSpeech.text;
assert.match(speak(await handler({...event(),request:{type:'LaunchRequest',timestamp:new Date().toISOString()}})), /plan for/);
const preparation = await handler(event('GuardianPlanIntent','prepare my meeting notes'));
assert.match(speak(preparation), /Work/);
assert.match(speak(preparation), /preparation only/);
assert.equal(preparation.response.shouldEndSession,false);
const held = await handler(event('GuardianPlanIntent','publish my campaign and unlock my home door'));
assert.match(speak(held), /Creativity, Home/);
assert.match(speak(held), /Everything remains on hold/);
assert.match(speak(await handler(event('AMAZON.YesIntent'))), /does not execute/);
assert.match(speak(await handler(event('GuardianDemoIntent'))), /Work/);
assert.match(speak(await handler(event('GuardianPlanIntent','  '))), /Tell me what/);
assert.equal((await handler(event('AMAZON.StopIntent'))).response.shouldEndSession,true);
await assert.rejects(handler({...event(),context:{System:{application:{applicationId:'wrong'}}}}), /INVALID_SKILL_ID/);
await assert.rejects(handler({...event(),session:{application:{applicationId:'wrong'}}}), /INVALID_SKILL_ID/);
await assert.rejects(handler({...event(),request:{...event().request,timestamp:'2000-01-01T00:00:00Z'}}), /INVALID_REQUEST_TIMESTAMP/);
await assert.rejects(handler({...event(),request:{...event().request,timestamp:'invalid'}}), /INVALID_REQUEST_TIMESTAMP/);
delete process.env.ALEXA_SKILL_ID;
await assert.rejects(handler(event()), /NOT_CONFIGURED/);
console.log('Alexa adapter checks passed: planning, approval boundary, lifecycle, skill identity, timestamp. Live Amazon activation still required.');
