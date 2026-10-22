# STAARWAARDD Guardian — Amazon demo source export

This is the **same existing Alexa+-style web simulation**, exported from `kingstvieee/cross-life-ai` PR #14 for reproducible judging. It is not another Devpost entry or a new implementation of the broader STAARWAARDD app.

## Run

Use Node.js 22 or newer. No cloud account or API key is needed. The runtime uses Node built-ins; npm ci installs the official MCP SDK used as an independent test client.

```sh
npm ci --ignore-scripts
npm test
npm start
```

Open http://127.0.0.1:3335/amazon-judge.html. The server binds only to localhost.

1. Press **CONNECT MCP**: observe initialize, notification acceptance, and tools/list.
2. Press **Run judge scenario**: observe tools/call and the returned plan.
2. Try a fresh request: "Publish my campaign and unlock my home door".
3. Both relevant domains must be held for approval.
4. Try "Prepare my meeting notes": its plan remains preparation-only.
5. No action sends, purchases, publishes, books or controls a device.

## Verified scope and limits

The shared planner uses structured rules, not a language-model call. It preserves literal request details and stated times, distinguishes draft-only instructions from requested external actions, and assigns approval markers to relevant steps. Unknown tasks ask for clarification. It does not claim general natural-language understanding, live calendar access, independently communicating agents, actual schedule changes, customer adoption or measured time savings.

The hosted browser performs real MCP initialization, discovery and planning through `/api/mcp`. The automatic path uses four existing narration chapters after an eight-second playback of the approved flight. The interactive path accepts a menu selection, typed request or supported browser speech input. Browser speech recognition is not the Amazon Alexa service.

The standard Alexa custom skill reuses the same planner and returns speech plus an APL visual response from that same plan on supported screens. The earlier skill version was demonstrated in Amazon's Alexa Simulator on October 22, 2026. This revision's Lambda upload, APL interface activation and end-to-end visual test must be completed before claiming the visual response is live. It does not synchronize an independent browser tab, certify an Echo device, or provide Amazon's gated Alexa+ add-on access.

No external action is ever executed, even after a yes. A marked action is a review boundary, not a working execution connector. No AI-model or AWS call is made by the web planner; the separate Alexa adapter runs in the user's configured AWS Lambda.

## Source provenance and changes

Exported from existing source at:
https://github.com/kingstvieee/cross-life-ai/commit/0ac39edc87717ec0f5af7df88d27fb55fb74e3f8

Original source paths:
- `competition/Amazon2026/src/guardian-core.mjs` → `src/guardian-core.mjs`
- `api/amazon-guardian.mjs` → `api/amazon-guardian.mjs`
- `competition/Amazon2026/judge-server.mjs` → `server.mjs`
- `competition/Amazon2026/src/aws-smoke.mjs` → `test/smoke.mjs`
- `frontend/public/amazon-judge.{html,js,css}` → `public/`

Packaging changes adjust import/asset paths, remove the optional AWS route and original-app link, clarify simulation labels, and reject malformed request bodies. The planner and existing judge interaction are retained.

The concept predates the hackathon. Competition-period additions are the judge UI, simulation API, planner approval display and test/run documentation. The original PR and commit establish provenance; extraction does not claim these were newly invented again.

## Licensing boundary

The MIT license applies only to the software and documentation included in **this repository**. No broader app source, prior git history, private account data or credentials is included. Approved Guardian footage and demo artwork are included solely for viewing this demonstration; the MIT software license does not grant character, media or trademark rights. This export grants no license to other STAARWAARDD repositories or assets and no trademark rights in STAARWAARDD, RISING STAARDFORM or DIGGITSTAAR.

The original cross-life-ai repository was publicly visible when checked; this export does not change its visibility or license. Proprietary ownership is distinct from repository visibility.

## Submission status

Use this repository for the existing Devpost project **1191047 — STAARWAARDD Guardian for Alexa+**. At the last live inspection it remained DRAFT. A public functioning-demo video under three minutes and final submission are still outstanding. This repository is not proof of submission.


## The Guardian Issue — editorial demo

The judge runner presents a futuristic Toronto cover, seven-domain world atlas plus STAARVERSE, functioning MCP request studio, human-control explanation, game portal preview, and source showcase. The generated architecture imagery illustrates product vision; it does not depict live integrations, devices, customers, or shipped services. The two original AI-generated demo illustrations in `public/assets` are included in this demo export. The broader application's proprietary assets and implementation remain excluded. Typography uses optional Google Fonts with system fallbacks. The standalone build embeds its imagery and removes that font request.


## Guided audio tour

Choose **TAKE THE GUIDED TOUR** on the cover. Ten recorded AI-narration chapters explain the eight visual portals, request input, meeting notes, approval gating, full judge scenario, coordination trace and metrics, human-control boundary, STAARVERSE in-development preview and source access. The hosted tour uses the real MCP client and tool before narrating each result. The game preview does not add a game-planning domain or imply a playable integration.

The original instrumental is kept beneath the speech. Sound starts only after a deliberate click. Pause/resume, previous/next, replay, music toggle, voice level, captions and Escape-to-close are available; backgrounding the tab pauses playback. Audio failures leave the transcript visible. Run npm run build to generate dist/guardian-demo.html. The standalone bundle embeds the same eleven MP3 assets and invokes the same planner/JSON handler locally. It clearly labels itself an offline preview and disables MCP connection; it does not claim network integration. Generated bundles are not committed, preventing stale downloadable builds.

Voice: original generated preset narration (not a human recording or celebrity imitation). Music: original generated instrumental. The audio is part of this demo-only export. No broader proprietary application assets are included.

## MCP consolidation and verification

This entry reuses the `staarwardd_plan` tool identity and integration approach from kingstvieee/staarwardd PR #3, consolidated with the existing cross-life-ai planner and magazine UI. It remains the same existing Amazon Devpost entry. No production app main branch is changed.

The basic adapter was hardened for Streamable HTTP: origin validation, Accept and protocol headers, initialized notifications returning HTTP 202, argument bounds, error responses, stateless operation, and GET/DELETE rejection when SSE/sessions are unavailable. The public tool only creates a plan; no secrets, account access or device controls are present.

npm test uses the official @modelcontextprotocol/sdk Client and StreamableHTTPClientTransport independently of the web client. It checks initialization, discovery, each of the seven domains, a combined seven-domain request, mixed approval gating, the six-domain judge scenario, and transport rejection cases. The test does not establish Alexa device certification or universal platform compatibility.

Scope: seven life-planning domains are routable. STAARVERSE remains the eighth visual portal, an in-development game preview. Fire TV, Ring, Bee, AWS runtime and live personal-service integrations are not claimed.

## Standard Alexa custom-skill adapter

See [alexa/README.md](alexa/README.md). One planner serves web MCP and Alexa. The adapter supports voice-only devices and adds an APL visual response only when the request advertises `Alexa.Presentation.APL`. Request-specific titles, timing and constraints appear in both speech and the visual response. The approved flight-derived poster maintains Guardian continuity. Tests verify supported-interface gating, speech/visual consistency, mixed-action ownership and request validation.

The current adapter must be uploaded to the existing Lambda before retesting this revision. Enable **Build → Interfaces → Alexa Presentation Language**, save/build, then use a screen-capable simulator. This does not grant access to gated Alexa+ APIs.
