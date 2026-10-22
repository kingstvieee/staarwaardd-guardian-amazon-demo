# STAARWAARDD Guardian — developer friction log

Build, Ship, Shape: Amazon Developer Hackathon  
Recorded: October 22, 2026  
Author: Steven Crawford  
Track: Alexa+ (self-hosted MCP / simulated experience), with a separate standard Alexa custom skill on AWS Lambda.

## Evidence and scope

This log records development and review friction encountered in the Guardian project. Severity ratings are the submitter's assessment, not Amazon incident ratings. Expectations below are desired developer experiences, not claims that Amazon promised a capability. No fabricated error codes, measured time losses, or physical-device results are included.

Evidence:
- [Project and demonstration](https://devpost.com/software/staarwaardd-guardian-for-alexa)
- [Recorded browser and Alexa Simulator demonstration](https://www.youtube.com/watch?v=tZ0PqoCBFic)
- [Alexa deployment and acceptance checks](alexa/README.md)
- [Implementation scope and verification](README.md)

The simulator recordings establish the demonstrated revision only. Local tests do not establish utterance recognition, rendered layout quality, physical Echo operation, or access to gated Alexa+ tools.

## 1. Coordinating Lambda code and interaction-model revisions

**Tool / surface:** AWS Lambda and Amazon Developer Console, standard Alexa custom skill.

**Task attempted:** Deploy the preparation upgrade, including natural planning phrases and request-specific responses.

**Steps taken:** Package the Lambda handler; upload the ZIP to the existing Lambda; separately extract the interaction-model JSON; replace it in the Developer Console JSON Editor; save and build the English (CA) model; use Development testing for that locale.

**Expected:** A clearly linked release process that makes the handler revision and built interaction-model revision easy to identify and verify together.

**Actual friction:** Updating the Lambda ZIP alone does not complete the model update. The JSON had to be supplied separately for copying into the console. Code deployment, model rebuilding and simulator acceptance remain separate checkpoints. Our documentation explicitly distinguishes the previously demonstrated build from the newer revision awaiting its own verification; this is workflow friction, not an alleged AWS outage.

**Severity:** Important — mismatched revisions can undermine confidence in phrase-level testing.

**Workaround used:** Provided a separate interaction-model JSON alongside the ZIP and documented the console sequence and acceptance phrases.

**Actionable suggestion:** Offer a deployment checklist or linked revision manifest showing handler version, locale/model build status and last simulator acceptance result together. Warn when a code update adds intents or utterances absent from the currently built model.

**Status:** Packaging and instructions available; do not treat all newer utterances as verified from the older recording.

## 2. Dense preparation content in Alexa Presentation Language cards

**Tool / surface:** Alexa Presentation Language (APL), display-capable Alexa Simulator.

**Task attempted:** Present a mixed planning request as readable speech and visual preparation/approval states.

**Steps taken:** Launch Guardian in the simulator; enter a mixed campaign/meeting request; inspect speech and Guardian visual output; review longer plan text for readability.

**Expected:** Users can read the important task details, timing and approval status without losing content.

**Actual friction:** Dense APL text can truncate in the demonstrated layout. Correct planner output and successful response generation do not establish that all content is legible on screen.

**Severity:** Important — missing visible details can obscure the distinction between preparation and a held action.

**Workaround used:** Keep spoken responses and the recorded simulator evidence; implement separate scrollable task cards in the preparation upgrade. Treat the new layout as requiring deployment and simulator verification rather than claiming the code change alone fixes the rendered result.

**Actionable suggestion:** Add design-time overflow warnings and a readily available screen-size test matrix for long dynamic text. Provide a sample for multi-task plans with persistent status labels and scrollable details.

**Status:** Observed limitation documented; proposed layout improvement needs rendered verification.

## 3. Distinguishing standard Alexa skill testing from Alexa+ MCP verification

**Tool / surface:** Alexa Skills Kit / Developer Console Simulator and the separate web MCP client.

**Task attempted:** Establish exactly which parts of the combined voice-and-browser demonstration are working.

**Steps taken:** Test launch, planning and visual output through the standard custom skill; exercise initialization, tool discovery and planning through the browser's MCP client; review what each evidence source proves.

**Expected:** A clear testing map explaining which simulator or client verifies each integration path.

**Actual friction:** A working standard Alexa custom skill and a working browser MCP connection are separate results. They do not establish that Alexa controls the browser, that the skill is an Alexa+ preview integration, or that a physical Echo was tested. Keeping these boundaries clear required explicit documentation and separate evidence.

**Severity:** Important — confusing these paths can produce misleading integration claims.

**Workaround used:** Label the standard skill, web simulation and real MCP transport separately. Provide no-account browser testing and an inspectable MCP trace. State that browser and skill share planning logic but are independent clients.

**Actionable suggestion:** Publish a concise capability/testing matrix linking standard custom skills, Alexa+ Agent Skills, self-hosted MCP and simulated experiences to their available test tools, access requirements and the evidence each tool can establish.

**Status:** Scope clarified in the project write-up and repository. Physical Echo behavior, gated Alexa+ preview access and cross-client synchronization are not claimed.

## Submission note

This document is supplied for review under the optional friction-log provision. Any judging bonus is discretionary; adding this log does not guarantee a bonus or submit the competition entry.
