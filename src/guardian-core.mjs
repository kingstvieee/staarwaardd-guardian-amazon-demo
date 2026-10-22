export const PORTALS = Object.freeze(['Work','Creativity','Home','Wellbeing','Relationships','Community','Style']);
const patterns = {
 Work:/\b(work|meeting|notes|calendar|deadline|project|email|schedule|pitch|investor|agenda|presentation|talking points|client call|team|catch-up|catch up|deck)\b/i,
 Creativity:/\b(creativ\w*|design|content|media|publish\w*|diggitstaar|campaign|launch)\b/i,
 Home:/\b(home|door|lights?|security|temperature|arrival|devices?|routine|staar access)\b/i,
 Wellbeing:/\b(wellbeing|wellness|sleep|stress|exercise|food|water|reset|break|rest)\b/i,
 Relationships:/\b(relationship\w*|partner|friend|family|dinner|anniversary|gift|message|text|mom|dad)\b/i,
 Community:/\b(community|event|venue|toronto|local|accessibility|route|check-in)\b/i,
 Style:/\b(style|outfit|wardrobe|fitting|stylist|rising staardform|clothes|jeans|shoes)\b/i
};
const external=/\b(send|email|text|invite|book|buy|purchase|cancel|delete|share|publish|pay|order|post|register|rsvp|unlock|lock|turn on|turn off|change temperature)\b/i;
const preparation=/\b(draft|prepare|prep|outline|plan|review|preview|stage|suggest|list|research|write|compose|put together|organize|get .{0,60} ready)\b/i;
const negative=/\b(do not|don't|never|without|must not|cannot|can't|not to)\b/i;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim().slice(0,2000);
function domainsFor(text) {
 text=text.replace(/[“\"]([^”\"]*)[”\"]/g,'');
 const domains=PORTALS.filter(p=>patterns[p].test(text));
 // Email/text about family are a relationship draft, not a second invented work task.
 if(domains.includes('Relationships')&&/\b(email|text|message)\b/i.test(text)&&! /\b(work|meeting|pitch|investor|project|deadline)\b/i.test(text)) return domains.filter(p=>p!=='Work');
 return domains;
}
function clausesFor(request) {
 const quotes=[];
 let masked=request.replace(/[“"]([^”"]*)[”"]/g,value=>{quotes.push(value);return 'QUOTED'+(quotes.length-1)+'TOKEN';});
 // Preserve explicit field values and message bodies as content, not extra commands.
 masked=masked.replace(/(^|[;,])\s*((?:topic|agenda|audience|budget|location|venue|people|recipient|owner|assets|duration|size|alterations)\s*:[^;]+)/ig,(_,sep,value)=>{quotes.push(value.trim());return sep+'QUOTED'+(quotes.length-1)+'TOKEN';});
 return masked.replace(/\bGuardian[, :]*/ig,'').replace(/\b([ap])\.m\./ig,'$1m').replace(/([a-z])’([a-z])/ig,"$1'$2").split(/\s*(?:[.;,]|\bbut\b|\bthen\b|\band\b|\balso\b)\s*/i).map(part=>clean(part.replace(/QUOTED(\d+)TOKEN/g,(_,i)=>quotes[Number(i)]))).filter(Boolean);
}
function intentFor(text) {
 text=text.replace(/[“\"]([^”\"]*)[”\"]/g,'');
 const match=external.exec(text), prep=preparation.exec(text), neg=negative.exec(text);
 const action=match?.[1]?.toLowerCase();
 // Only the span preceding the external verb determines whether it is prohibited or a draft.
 const prohibited=Boolean(match&&neg&&neg.index<match.index);
 const uncertain=Boolean(match&&(/\b(if|unless|except|maybe|whether|or|not until|not before|only after|only if)\b/i.test(text) || (neg&&neg.index>match.index) || [...text.matchAll(new RegExp(external.source,'ig'))].length>1));
 const drafting=Boolean(match&&prep&&prep.index<match.index);
 return {action,prohibited,uncertain,externalAction:Boolean(match&&!prohibited&&!drafting)};
}
export function detectPortals(request='') { const found=domainsFor(clean(request));return found.length?found:['Work']; }
export function requiresApproval(request='') { return clausesFor(clean(request)).some(c=>intentFor(c).externalAction); }
function titleFor(portal,clause,intent) {
 if(intent.externalAction)return `Review before ${intent.action}: ${clause.replace(/^(please\s+)?/i,'').slice(0,72)}`;
 if(/\b(message|email|text)\b/i.test(clause))return 'Draft the message without sending';
 if(portal==='Work')return /\b(notes|meeting|agenda|pitch)\b/i.test(clause)?'Prepare meeting notes and decisions':'Prepare the work priorities';
 if(portal==='Creativity')return /\b(campaign|launch|content|publish)\b/i.test(clause)?'Stage the campaign for review':'Prepare the creative brief';
 if(portal==='Home')return /\b(arriv|door)/i.test(clause)?'Prepare the arrival checklist':'Prepare the home routine';
 if(portal==='Wellbeing')return 'Prepare a practical reset';
 if(portal==='Relationships')return /\b(message|email|text)\b/i.test(clause)?'Draft the message without sending':'Prepare the commitment details';
 if(portal==='Community')return 'Prepare venue and route checks';
 return 'Prepare the fitting and outfit checklist';
}
function detailFor(portal,clause,intent,timing) {
 const subject=`Request: “${clause}”.`;
 const guide={
 Work:'Outline the agenda, decisions needed and follow-up questions. Keep any stated deadline visible; no calendar or email was read.',
 Creativity:'List the audience, deliverables, approval checks and release order. Keep the assets staged; nothing is published.',
 Home:'List the arrival steps and device changes to review. No lock, light or other device is controlled.',
 Wellbeing:'Prepare a short reset with water, a pause and a realistic transition. This is a planning suggestion, not health advice.',
 Relationships:/\b(message|email|text)\b/i.test(clause)?'Review the editable message draft, recipient and timing below; nothing is sent.':'List the people, timing, location and gift details to confirm. No booking, purchase or message is made.',
 Community:'List the venue, access needs and route to verify. Live traffic, availability and opening hours have not been checked.',
 Style:'List the fitting time, garments, sizes and alterations to confirm. No fitting is booked and no item is purchased.'
 }[portal];
 return `${subject} ${guide}${timing.length?' Stated timing: '+timing.join('; ')+'.':''}${intent.prohibited?' Your do-not-execute instruction is preserved.':''}${intent.externalAction?' Approval required for the requested '+intent.action+' action; this demo cannot execute it.':''}`;
}
function suppliedField(clause,name) {
 const match=clause.match(new RegExp('(?:^|;)\\s*'+name+'\\s*:\\s*([^;]+)','i'));
 return match?.[1]?.trim();
}
function preparedOutput(portal,clause,intent) {
 if(intent.uncertain)return 'Clarify the action and condition before using this draft.';
 const timing=extractTiming(clause).map(t=>t.trim()).join('; ')||'Not supplied — confirm before use';
 const field=name=>suppliedField(clause,name);
 const topic=field('topic')||clause.split(';')[0];
 const budget=field('budget'),location=field('location')||field('venue'),people=field('people');
 const facts=[...(people?['People: '+people]:[]),...(location?['Location: '+location]:[]),...(budget?['Budget: '+budget]:[])];
 if(/\b(message|email|text)\b/i.test(clause)) {
  const recipient=field('recipient')||clause.match(/\bto\s+(?:my\s+)?(.+?)(?=\s+(?:saying|that|about|regarding|at|tomorrow|today|tonight)\b|;|$)/i)?.[1]?.trim()||'Recipient not supplied';
  const quoted=clause.match(/[“"]([^”"]+)[”"]/);
  const body=quoted?.[1]||clause.match(/\bsaying\s+([^;]+)/i)?.[1]?.trim();
  const suggestion=body||(/\blate\b/i.test(clause)?'I am running late. Could we confirm a new time?':'Could we confirm '+(/\bdinner\b/i.test(clause)?'our dinner plans':'the details')+(extractTiming(clause).length?' for '+timing:'')+'?');
  return ['To: '+recipient,'Draft: '+suggestion,...facts,'Timing: '+timing,body?'Message wording: supplied by you':'Message wording: suggested — edit before use','Review before sending. Nothing was sent.'].join('\n');
 }
 const items={
 Work:['Goal / topic: '+topic,'Agenda: '+(field('agenda')||'Review '+topic.replace(/^(?:please\s+)?(?:prepare|plan|prep|outline|put together)\s+(?:my\s+)?/i,'')),'Decision prompts: What outcome is needed? What is blocked? What is the next action?','Owner / follow-up: '+(field('owner')||'Confirm an owner and due time for each agreed action'),'Meeting notes: capture decisions and open questions during the meeting; no prior notes or calendar were read.'],
 Creativity:['Brief: '+topic,'Audience: '+(field('audience')||'Not supplied — choose who this campaign must reach'),'Assets / copy: '+(field('assets')||'Collect the approved visual, message and call to action for this brief'),'Release checklist: check audience, copy, asset rights, destination and timing before approval.','Release approval: '+(intent.externalAction?'Held for your review; publication is unavailable in this demo':'Preparation only; confirm the release decision separately')],
 Home:['Routine: '+topic,'Arrival checks: confirm access, expected arrival time and the current device state.','Device changes: review manually; no live device state was read.'],
 Wellbeing:['Reset brief: '+topic,'Suggested sequence: pause, get water, take a short break, then choose one next step.','Duration: '+(field('duration')||'Not supplied — choose a realistic break'),'Planning suggestion only; no health assessment is made.'],
 Relationships:['Commitment: '+topic,'Confirm together: people, location, availability and spending limit.','Next step: review the details before contacting anyone or booking.'],
 Community:['Event / route: '+topic,'Access checklist: confirm venue, opening hours, accessibility and route before leaving.','Live traffic and availability: not checked.'],
 Style:['Fitting / outfit: '+topic,'Size: '+(field('size')||'Not supplied — confirm fit measurements'),'Alterations: '+(field('alterations')||'Check fit, length, footwear and any adjustment needed'),'Appointment / purchase: review availability and budget before booking or buying.']
 }[portal];
 return [...items,...facts,'Timing: '+timing,'Status: preparation only; nothing executed.'].join('\n');
}
function clockKey(value) {
 const words=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
 return value.toLowerCase().trim().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g,w=>String(words.indexOf(w))).replace(/:00\b/g,'').replace(/\s+/g,' ');
}
function extractTiming(request){return [...request.matchAll(/\b(?:tomorrow|today|tonight|next\s+\w+|(?:at|before|after|by)\s+(?:\d{1,2}(?::\d{2})?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|noon|midnight)\s*(?:a\.?m\.?|p\.?m\.?)?|\d+\s*(?:minutes?|hours?)\s+late)\b/ig)].map(m=>m[0]);}
export function buildGuardianPlan(request,context={}) {
 request=clean(request); const clauses=clausesFor(request);
 const timing=extractTiming(request);
 const restrictions=clauses.filter(c=>negative.test(c));
 const entries=[];const unresolved=[];let inheritedPreparation=false;let inheritedAction;let lastDomains=[];
 for(const clause of clauses){
  const fieldClause=/^(?:topic|agenda|audience|budget|location|venue|people|recipient|owner|assets|duration|size|alterations)\s*:/i.test(clause);
  let intent=fieldClause?{externalAction:false,prohibited:false}:intentFor(clause);
  if(preparation.test(clause)&&!intent.externalAction){inheritedPreparation=true;inheritedAction=undefined;}
  if(intent.externalAction){inheritedAction=intent.action;inheritedPreparation=false;}
  const directVerb=preparation.test(clause)||Boolean(intent.action);
  if(!fieldClause&&!directVerb&&inheritedAction&&!inheritedPreparation)intent={action:inheritedAction,externalAction:true,prohibited:false};
  let domains=fieldClause?[...lastDomains]:domainsFor(clause);
  if (!domains.length && intent.externalAction && !intent.prohibited) { domains=lastDomains.length?[lastDomains[lastDomains.length-1]]:['Work']; unresolved.push('Confirm the target and recipient for “'+clause+'” before reviewing this action.'); }
  if(domains.length)lastDomains=domains;
  // A prohibition such as “do not send it” adds a constraint, never a new invented domain.
  if(intent.uncertain)unresolved.push('Please separate or clarify the action and condition in “'+clause+'”.');
  if(!domains.length&&!intent.prohibited&&!intent.externalAction)unresolved.push('What task should I prepare for “'+clause+'”?');
  if(intent.prohibited)continue;
  for(const portal of domains){
   // Temporal references are context, not a request to execute against the referenced domain.
   const specific={...intent};
   if(intent.externalAction&&domains.length>1){
    if(/\b(unlock|lock|turn on|turn off|change temperature)\b/i.test(intent.action??''))specific.externalAction=portal==='Home';
    else if(/\b(publish|post)\b/i.test(intent.action??''))specific.externalAction=portal==='Creativity';
    else if(/\b(buy|purchase|order)\b/i.test(intent.action??''))specific.externalAction=portal==='Style'||(portal==='Relationships'&&/gift/i.test(clause));
    else if(/\b(email|text|send|invite)\b/i.test(intent.action??''))specific.externalAction=portal===(domains.includes('Relationships')?'Relationships':'Work');
   }
   entries.push({portal,clause,intent:specific});
  }
 }
 const byPortal=new Map();
 for(const e of entries){const old=byPortal.get(e.portal);if(!old)byPortal.set(e.portal,e);else byPortal.set(e.portal,{portal:e.portal,clause:old.clause+'; '+e.clause,intent:e.intent.externalAction?e.intent:old.intent});}
 const portals=PORTALS.filter(p=>byPortal.has(p));
 const questions=[...unresolved];
 if(!portals.length&&!questions.length)questions.push('What specific task, people and deadline should I prepare for?');
 const steps=portals.map((portal,i)=>{const {clause,intent}=byPortal.get(portal);return{id:`${portal.toLowerCase()}-${i+1}`,portal,capability:portal.toLowerCase()+'_preparation',title:titleFor(portal,clause,intent),status:intent.uncertain?'needs_clarification':intent.externalAction?'awaiting_approval':'prepared',externalAction:Boolean(intent.externalAction),source:clause,timing:extractTiming(clause),summary:detailFor(portal,clause,intent,extractTiming(clause)),output:preparedOutput(portal,clause,intent)};});
 const held=steps.filter(s=>s.externalAction).length;
 for(const step of steps){const clocks=step.timing.filter(t=>/^at /i.test(t)).map(t=>t.toLowerCase().trim());if(new Set(clocks.map(clockKey)).size>1)questions.push('Which time should '+step.portal+' use: '+clocks.join(' or ')+'?');}
 if(questions.length)for(const step of steps)step.status='needs_clarification';
 // Dependencies are proposed scheduling constraints, never claimed messages between agents.
 const dependencies=/\b(late|before|after|delay\w*)\b/i.test(request)&&portals.includes('Work')?portals.filter(p=>p!=='Work').map(p=>({from:'Work',to:p,signal:`Review ${p} timing against the stated work constraint: ${timing.join('; ')||clauses.find(c=>/late|before|after|delay/i.test(c))}. No schedule has been changed.`})):[];
 return {request,mode:'guardian_orchestration',portals,approvalRequired:held>0,state:questions.length?'needs_clarification':held?'prepared_for_approval':'prepared',context,steps,timing,restrictions,questions,dependencies,planner:'structured rules; no language-model call',outcome:questions.length?'Guardian needs one clarification before preparing a useful plan.':`Prepared ${steps.length} request-specific step${steps.length===1?'':'s'} across ${portals.join(', ')}. ${held?held+' requested action'+(held===1?' is':'s are')+' held for review.':'All steps remain preparation only.'} Nothing was executed.`};
}
export function judgeScenario(){
 const request='Guardian, my investor pitch is running 30 minutes late. Prepare my launch, fitting, anniversary dinner, gift delivery, wellbeing reset and home arrival. Draft a message about dinner but do not send it.';
 const plan=buildGuardianPlan(request,{location:'Toronto'});
 return {...plan,metrics:{portalsCoordinated:plan.portals.length,userRequestsRequired:1,unsafeAutomaticActions:0},narration:['One late pitch affects the evening. Guardian keeps the stated delay and proposes the dependent checks.','A dinner message is a draft. Your instruction not to send is preserved.','No calendar was read, no booking was changed, no purchase or device action was executed.']};
}
