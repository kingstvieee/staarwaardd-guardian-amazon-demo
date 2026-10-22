import {performance} from 'node:perf_hooks';
import {buildGuardianPlan} from '../src/guardian-core.mjs';
const cases=[
 ['mixed ownership','Publish my campaign and prepare meeting notes tomorrow at three',p=>p.steps.find(s=>s.portal==='Work')?.externalAction===false&&p.steps.find(s=>s.portal==='Creativity')?.externalAction===true],
 ['meeting time','Prepare meeting notes tomorrow at three',p=>p.steps[0]?.timing.includes('at three')],
 ['conflicting spoken times','Prepare my meeting at three and my meeting at five',p=>p.state==='needs_clarification'],
 ['equivalent spoken and numeric times','Prepare my meeting at three and my meeting at 3',p=>p.questions.length===0],
 ['talking points','Put together talking points for my client call tomorrow at three',p=>p.portals.includes('Work')&&p.questions.length===0],
 ['presentation','Get my presentation ready by five',p=>p.portals.includes('Work')&&p.questions.length===0],
 ['team catchup','Help me prep for a team catch-up',p=>p.portals.includes('Work')&&p.questions.length===0],
 ['compose work email','Compose an email to Maya saying "The budget is CAD 750."',p=>p.steps[0]?.externalAction===false&&p.steps[0]?.output.includes('The budget is CAD 750.')],
 ['write work email','Write an email to Maya saying "Can we review the launch at three?"',p=>p.steps[0]?.externalAction===false&&p.steps[0]?.output.includes('Can we review the launch at three?')],
 ['named recipient','Draft an email to Maya saying "Please review the deck."',p=>p.steps[0]?.output.includes('To: Maya')],
 ['exact family message','Draft a message to my family saying "Dinner at six and bring a gift"',p=>p.steps.length===1&&p.steps[0].output.includes('Dinner at six and bring a gift')],
 ['explicit brief facts','Prepare my campaign; audience: dental offices; budget: CAD 750',p=>p.questions.length===0&&p.steps.find(s=>s.portal==='Creativity')?.output.includes('Audience: dental offices')&&p.steps.find(s=>s.portal==='Creativity')?.output.includes('Budget: CAD 750')],
 ['explicit meeting agenda','Prepare meeting notes; topic: website launch; agenda: budget and timeline',p=>p.questions.length===0&&p.steps.find(s=>s.portal==='Work')?.output.includes('Agenda: budget and timeline')],
 ['prohibition','Do not publish my campaign',p=>p.steps.length===0],
 ['mixed prohibition','Do not send my family a message and publish my campaign',p=>p.steps.find(s=>s.portal==='Creativity')?.externalAction===true],
 ['unknown clause','Prepare my meeting and optimize quantum flux',p=>p.state==='needs_clarification'],
 ['conditional action','Publish the campaign unless my partner objects',p=>p.state==='needs_clarification'],
 ['simple dinner','Plan dinner',p=>p.portals.includes('Relationships')&&!p.approvalRequired],
 ['home control held','Unlock my home door',p=>p.steps.find(s=>s.portal==='Home')?.externalAction===true],
 ['style details','Prepare a fitting for my silver jeans tomorrow at 6 pm',p=>p.steps.find(s=>s.portal==='Style')?.output.includes('silver jeans')],
 ['unknown task','Help with quantum flux',p=>p.state==='needs_clarification']
];
const rows=cases.map(([name,input,check])=>{const t=performance.now();const plan=buildGuardianPlan(input);return {name,input,pass:Boolean(check(plan)),milliseconds:performance.now()-t};});
const report={scope:'Local deterministic planner fixtures; not customer testing, speech recognition, cloud latency or APL rendering.',total:rows.length,passed:rows.filter(r=>r.pass).length,rows};
console.log(process.argv.includes('--assert')?`Targeted language/draft evaluation: ${report.passed}/${report.total} passed.`:JSON.stringify(report,null,2));
if(process.argv.includes('--assert')&&rows.some(r=>!r.pass))process.exitCode=1;
