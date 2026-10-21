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

## Honest scope

The deterministic planner uses bounded domain keywords, domain-specific preparation templates and timing cues. It displays missing information and a proposed dependency order, without inventing calendar facts. Unknown requests ask for clarification. External-action keywords conservatively hold all domains in the request. It cannot reliably interpret negation or assign each action to its owning domain. Inter-domain exchanges and counters are illustrative. They do not prove independent agents, actual scheduling conflict resolution, customer adoption or time saved.

This is an Alexa+ track **web demonstration with a working MCP transport**. The browser sends initialize, notifications/initialized, tools/list, and tools/call to `/api/mcp` over MCP 2025-11-25 Streamable HTTP, using JSON response mode. The `staarwardd_plan` tool calls the existing deterministic Guardian planner. Amazon’s gated Alexa+ device/console tools are unavailable to ordinary hackathon participants; direct device invocation is not demonstrated. The default MCP path makes no AI-model or AWS runtime invocation. An optional server-side Bedrock adapter is present but is not part of the MCP judge path. No successful Bedrock runtime call is claimed; missing configuration fails closed. Bedrock is separate from Alexa connectivity. AWS Builder is not claimed.

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

The MIT license applies only to the software and documentation included in **this repository**. No broader app source, prior git history, private account data or credentials is included. The approved Guardian footage and likeness are displayed in this demo; they remain proprietary brand assets outside the software license, alongside STAARWAARDD trademarks. This export grants no license to other STAARWAARDD repositories or assets and no trademark rights in STAARWAARDD, RISING STAARDFORM or DIGGITSTAAR.

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

## October 21 judge-experience repair

The current repair continues this isolated demo; cross-life-ai PR #14 and staarwardd PR #3 remain provenance, and their production main branches are unchanged. Existing Devpost project 1191047 is not submitted by this work.

- The arrival waits for a deliberate automatic/interactive choice and replays the exact approved flight from frame zero. Resume/pause and skip remain available. No new media was generated. Flight SHA-256: `20c7be3b2186fa4d5fd5d99692817ae35b320644b046057e29b66956d862a89e`.
- Interactive offers typing first, then optional browser speech or scenarios. Speech uses browser recognition, not Alexa. Microphone permission is optional; deny it and continue by typing.
- Automatic preserves the existing recorded tour and real MCP calls. Narration has captions, pause and manual navigation; unavailable audio leaves the transcript and NEXT control available.
- Results include the actual request, domain-specific preparation, timing cues, missing details and the review boundary. A conservative keyword hold is not semantic authorization. No approve button can execute anything because no external execution adapter exists.
- Keyboard focus is contained in dialogs; Escape exits; results receive focus; request length and concurrent requests are bounded. Mobile companion controls flow with the page rather than covering results; reduced motion and a companion pause control are provided.
- `npm ci --ignore-scripts`, `npm test`, and `npm run test:media` reproduce the transport/planning and local media checks. The local server now serves the approved footage and welcome audio; the standalone bundle embeds them.

Alexa connectivity limitation verified October 21 from the organizer FAQ: https://amazonappdev2026.devpost.com/details/faqs . Gated Alexa+ toolkit, console simulator and device access are not available to ordinary hackathon participants. This is the permitted web MCP demonstration path, not a live Alexa connection. Independent MCP SDK success verifies this transport only.
