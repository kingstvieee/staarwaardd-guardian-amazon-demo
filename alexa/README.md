# Real Alexa connection — development skill

This adapter connects the existing deterministic Guardian planner to the standard Alexa Skills Kit. It is **not** an Alexa+ MCP add-on, a browser-embedded Alexa assistant, or evidence of live activation. The separate competition MCP endpoint and approved visual assets are unchanged. The spoken skill and browser demo are separate interfaces; browser flight playback is not remotely controlled by this adapter.

## Activation

1. In the Alexa Developer Console, first check for an existing Guardian skill to reuse. Otherwise create **STAARWAARDD Guardian**, Custom model, provision your own backend, English (US) initially. Keep the skill in development; do not submit for certification.
2. Paste `alexa/interaction-model.json` into Build → Interaction Model → JSON Editor. Save and build. The invocation is **star ward guardian**. Additional locales must be built/tested separately.
3. Create a Node.js 22 AWS Lambda function in an Alexa-supported region (for example us-east-1). Upload a ZIP whose root contains `alexa/lambda.mjs` and `src/guardian-core.mjs`, retaining these paths. Set the handler to **alexa/lambda.handler**. This adapter needs no npm packages, AWS model credentials, or personal-service access. Lambda usage may incur normal AWS charges; no paid resources have been created by preparing this source.
4. Set the Lambda environment variable **ALEXA_SKILL_ID** to the exact skill ID shown in the developer console. Add the **Alexa Skills Kit** Lambda trigger with skill ID verification enabled and that same ID. Do not create a Function URL or expose a general HTTP route. The skill-ID check in source is defense in depth, not a substitute for the restricted Lambda trigger.
5. Copy the Lambda ARN into the skill's Endpoint → AWS Lambda ARN → Default Region. Save. In Test, enable **Development** and select English (US).
6. Test these in the Alexa Simulator: `open star ward guardian`; `plan for my meeting tomorrow`; `plan for publish my campaign and unlock my home door`; `yes`; `stop`. Verify the actual Skill I/O request/response and spoken output. The external-action request must remain on hold, including after yes.
7. For a physical-device test, use a supported Alexa-enabled device registered to the same developer account and configured for the skill's locale. Verify actual invocation before calling the device connection live. Availability on an Alexa+ device is a separate compatibility check.

## Proof required before claiming live Alexa

A successful Developer Console build, a real Alexa Simulator request reaching the Lambda function and returning spoken output, plus a device recording if device operation is claimed. Local fixture tests establish adapter behavior only. No Alexa or AWS account has been activated/configured by this commit.

Record the live simulator/device interaction beside the existing Guardian browser demo. Identify it as an **Alexa custom skill**. It does not establish access to Alexa+'s gated add-on tools or synchronize the two interfaces. Browser text-to-speech must never be presented as Alexa.

Run `node test/alexa.mjs` locally. To package without dependencies, from the repository root: `zip guardian-alexa-lambda.zip alexa/lambda.mjs src/guardian-core.mjs` (do not commit the ZIP).

## Official references

- https://developer.amazon.com/en-US/docs/alexa/custom-skills/host-a-custom-skill-as-an-aws-lambda-function.html
- https://developer.amazon.com/en-US/docs/alexa/devconsole/test-your-skill.html
- https://amazonappdev2026.devpost.com/details/faqs

Amazon's hackathon FAQ says the Alexa+ Category SDK, MCP Toolkit, CLI and Web Simulator are select-partner preview tools and participants cannot apply for access. It explicitly permits self-hosted MCP/Agent Skill submissions demonstrated through a participant's own front end. This custom skill is an additional real-Alexa interface; the competition entry retains its MCP implementation.

## Visual response revision (October 22)

The user's October 22, 2026 recording demonstrates the revised adapter in Amazon's Alexa Simulator. Launch returns speech and a Guardian welcome screen. The request `plan for publish my campaign and prepare meeting notes for tomorrow at three` returns matching speech and APL content: Work is PREPARATION ONLY and Creativity is APPROVAL REQUIRED. Saying yes returns the no-execution response and updates Device Display. This establishes simulator operation, not physical Echo testing or browser-tab synchronization.

Upload the revised ZIP to the existing `staarwaardd-guardian` Lambda and deploy. Keep the existing `ALEXA_SKILL_ID` and skill-restricted Alexa Skills Kit trigger. In the skill console, enable **Build → Interfaces → Alexa Presentation Language**, save/build, and retest using a screen-capable simulator. Do not create a Function URL.

Check `plan for publish my campaign and prepare meeting notes tomorrow at three`: Creativity must show approval required, Work preparation only, and both speech and screen must retain tomorrow. Voice-only devices receive speech and a card without APL. No browser-tab synchronization or gated Alexa+ add-on access is claimed.
