import assert from 'node:assert/strict';
import {buildGuardianPlan,requiresApproval} from '../src/guardian-core.mjs';
const mixed=buildGuardianPlan('Publish my campaign and prepare my meeting notes tomorrow at 3 pm');
assert.equal(mixed.steps.find(s=>s.portal==='Creativity').externalAction,true);
assert.equal(mixed.steps.find(s=>s.portal==='Work').externalAction,false);
assert.ok(mixed.timing.includes('tomorrow'));assert.match(mixed.steps.find(s=>s.portal==='Work').summary,/3 pm/);
assert.deepEqual(mixed.steps.find(s=>s.portal==='Creativity').timing,[],'do not assign a meeting deadline to an unrelated campaign');
const draft=buildGuardianPlan('Draft a message to my family but do not send it');
assert.deepEqual(draft.portals,['Relationships']);assert.equal(draft.approvalRequired,false);assert.match(draft.restrictions.join(),/do not send/);
assert.equal(requiresApproval('Do not send a message and publish my campaign'),true);
assert.equal(requiresApproval('Draft an email to my family'),false);
const newRequest=buildGuardianPlan('Prepare a fitting for my silver jeans tomorrow at 6 pm');
const other=buildGuardianPlan('Prepare my investor meeting notes today at 2 pm');
assert.notEqual(newRequest.steps[0].title,other.steps[0].title);assert.match(newRequest.steps[0].summary,/silver jeans/);assert.match(other.steps[0].summary,/investor/);
const unknown=buildGuardianPlan('Help me with homework');
assert.equal(unknown.approvalRequired,false);assert.ok(unknown.questions.length);assert.ok(!unknown.portals.includes('Home'));
console.log('Request specificity, mixed ownership, draft-only constraints, timing and clarification checks passed.');

// Unfamiliar clauses and conditional actions must not be hidden by a valid domain.
for(const request of ['Prepare my meeting and optimize quantum flux','Publish the campaign unless my partner objects','Send my family a message or delete it','Send my family a message not before approval']) {
 const plan=buildGuardianPlan(request);assert.equal(plan.state,'needs_clarification',request);assert.ok(plan.questions.length,request);
}
const conflict=buildGuardianPlan('Prepare my meeting at 3 pm and my meeting at 5 pm');
assert.equal(conflict.state,'needs_clarification');assert.match(conflict.questions.join(' '),/Which time/);
const spokenTime=buildGuardianPlan('Prepare my meeting tomorrow at three');
assert.ok(spokenTime.steps[0].timing.includes('at three'));
const quoted=buildGuardianPlan('Draft a message to my family saying "Hello, dinner at six and bring a gift"');
assert.equal(quoted.steps.length,1);assert.match(quoted.steps[0].output,/Hello, dinner at six and bring a gift/);
assert.equal(buildGuardianPlan('Do not publish my campaign').steps.length,0);
assert.equal(buildGuardianPlan('Plan dinner').steps[0].portal,'Relationships');
assert.ok(buildGuardianPlan('Prepare meeting notes tomorrow').steps[0].output.includes('Agenda: [add priorities]'));
console.log('Unfamiliar clauses, conditions, conflicting times, spoken times and editable draft checks passed.');
