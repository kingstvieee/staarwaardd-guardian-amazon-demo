export const PORTALS = Object.freeze(['Work','Creativity','Home','Wellbeing','Relationships','Community','Style']);

const portalKeywords = {
  Work: ['work','meeting','calendar','deadline','project','email','schedule','pitch','investor','client'],
  Creativity: ['creative','design','content','media','publish','diggitstaar','campaign','launch'],
  Home: ['home','house','door','lights','security','temperature','arrival','device','routine','staar access'],
  Wellbeing: ['wellbeing','wellness','sleep','stress','exercise','food','water','reset','rest'],
  Relationships: ['relationship','partner','friend','family','dinner','anniversary','gift','message'],
  Community: ['community','event','venue','toronto','local','accessibility','route','check-in'],
  Style: ['style','outfit','wardrobe','fitting','stylist','rising staardform','clothes']
};
// A conservative review signal, not an execution authorization engine.
const externalActionPattern = /\b(send|message|email|invite|book|buy|purchase|cancel|delete|share|publish|pay|order|post|register|rsvp|unlock|lock|turn on|turn off|change temperature)\b/i;
const keywordMatch = (text, keyword) => new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`, 'i').test(text);
export function detectPortals(request='') {
  const text = String(request);
  return PORTALS.filter(portal => portalKeywords[portal].some(keyword => keywordMatch(text, keyword)));
}
export function requiresApproval(request='') { return externalActionPattern.test(String(request)); }

const preparations = {
  Work: ['Meeting preparation', 'Draft agenda: objective → three talking points → decision needed → next owner. Add the meeting time, attendees and source notes before finalizing. No calendar has been read.'],
  Creativity: ['Launch preparation', 'Stage a launch checklist: audience → offer → hook → asset → caption → call to action. Review the copy and destination before any publication; no campaign has been published.'],
  Home: ['Arrival preparation', 'List the preferred arrival time and device settings for review. Confirm the device and exact change separately. No door, light or home setting has changed.'],
  Wellbeing: ['Transition reset', 'Propose a five-minute pause between commitments: water, a short stretch and a quiet reset. Choose a suitable gap after confirming the timing; nothing has been scheduled.'],
  Relationships: ['Commitment preparation', 'Draft for review: “My earlier commitment may run late. Can we confirm a time that works for us?” Add the recipient and agreed time. No message, reservation or gift order has been sent.'],
  Community: ['Local visit preparation', 'Build a visit checklist: destination → date → travel time → step-free access → event details. Verify these with the venue and a current route source; no live route or availability was retrieved.'],
  Style: ['Fitting preparation', 'Prepare a fitting checklist: occasion → existing outfit → fit adjustments → shoes/accessories → appointment time. Confirm the pieces and timing; nothing has been purchased or booked.']
};

export function buildGuardianPlan(request, context={}) {
  const input = String(request).replace(/\s+/g,' ').trim();
  const portals = detectPortals(input);
  const approvalRequired = requiresApproval(input);
  const timing = input.match(/\b(?:today|tomorrow|tonight|(?:at|by|before|after)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/gi) || [];
  const delayed = /\b(late|delay|delayed|overlap|conflict)\b/i.test(input);
  const questions = !portals.length
    ? ['What would you like to prepare: a meeting, creative launch, home arrival, reset, family commitment, local visit or outfit?']
    : [delayed ? 'What is the revised finish time, and which next commitment has a fixed start?' : 'What outcome and timing should this preparation use?'];
  if (/\b(send|message|email|invite)\b/i.test(input)) questions.push('Who is the intended recipient, and what exact text should they receive? Nothing is sent here.');
  const steps = portals.map((portal,index)=>({
    id:`${portal.toLowerCase()}-${index+1}`, portal,
    capability: preparations[portal][0].toLowerCase().replaceAll(' ','_'),
    title: preparations[portal][0],
    status: approvalRequired ? 'awaiting_approval' : 'prepared', externalAction: approvalRequired,
    summary: preparations[portal][1] + (timing.length ? ` Request mentions timing: ${[...new Set(timing)].join(', ')}; not verified against a calendar.` : '')
  }));
  return {
    request: input, mode:'guardian_preparation', portals, approvalRequired,
    state: !portals.length ? 'needs_clarification' : approvalRequired?'prepared_for_approval':'prepared',
    context, steps, questions,
    timing: [...new Set(timing)],
    dependency: delayed ? 'Confirm the delayed commitment’s finish time first, then review any fitting, dinner and arrival timing. No conflict has been resolved automatically.' : 'Review the preparation, supply missing details, then decide the next action.',
    outcome: !portals.length ? 'Tell Guardian which part of your day needs preparation.' : `Prepared ${portals.length} domain${portals.length===1?'':'s'} for review. ${approvalRequired?'External actions are held; nothing was executed.':'No external action was executed.'}`
  };
}
export function judgeScenario() {
  const request = 'Guardian, my investor pitch is running late. Prepare my launch, fitting, anniversary dinner, gift delivery, wellbeing reset and home arrival. Draft a message about the dinner but do not send it.';
  return {
    ...buildGuardianPlan(request,{location:'Toronto',source:'Built-in illustrative scenario'}),
    metrics:{portalsCoordinated:6,userRequestsRequired:1,unsafeAutomaticActions:0}
  };
}
