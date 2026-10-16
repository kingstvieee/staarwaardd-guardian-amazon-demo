# STAARWAARDD Guardian — Amazon demo source export

This is the **same existing Alexa+-style web simulation**, exported from `kingstvieee/cross-life-ai` PR #14 for reproducible judging. It is not another Devpost entry or a new implementation of the broader STAARWAARDD app.

## Run

Use Node.js 22 or newer. No dependency installation, cloud account, build or API key is needed.

```sh
npm test
npm start
```

Open http://127.0.0.1:3335/amazon-judge.html. The server binds only to localhost.

1. Press **Run judge scenario**.
2. Try a fresh request: "Publish my campaign and unlock my home door".
3. Both relevant domains must be held for approval.
4. Try "Prepare my meeting notes": its plan remains preparation-only.
5. No action sends, purchases, publishes, books or controls a device.

## Honest scope

The planner selects domains using keywords and produces generic preparation guidance. External-action keywords conservatively hold all domains in the request. It cannot reliably interpret negation or assign each action to its owning domain. Inter-domain exchanges and counters are illustrative. They do not prove independent agents, actual scheduling conflict resolution, customer adoption or time saved.

This is an Alexa+-style **simulation**, with an HTTPS-style JSON API served locally over HTTP for judging. It has no live Alexa connection, MCP transport, AI-model invocation or AWS integration. The export intentionally omits the optional unverified Bedrock adapter and rejects Bedrock requests. AWS Builder is not claimed.

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

The MIT license applies only to the software and documentation included in **this repository**. No broader app source, prior git history, Guardian footage, character likeness, brand artwork, private account data or credentials is included. This export grants no license to other STAARWAARDD repositories or assets and no trademark rights in STAARWAARDD, RISING STAARDFORM or DIGGITSTAAR.

The original cross-life-ai repository was publicly visible when checked; this export does not change its visibility or license. Proprietary ownership is distinct from repository visibility.

## Submission status

Use this repository for the existing Devpost project **1191047 — STAARWAARDD Guardian for Alexa+**. At the last live inspection it remained DRAFT. A public functioning-demo video under three minutes and final submission are still outstanding. This repository is not proof of submission.


## The Guardian Issue — editorial demo

The judge runner now presents five magazine spreads: a futuristic Toronto cover, seven-domain world atlas, functioning request studio, human-control explanation, and source showcase. The generated architecture imagery illustrates product vision; it does not depict live integrations, devices, customers, or shipped services. The two original AI-generated demo illustrations in `public/assets` are included in this demo export. The broader application's proprietary assets and implementation remain excluded. Typography uses optional Google Fonts with system fallbacks. The standalone build embeds its imagery and removes that font request.
