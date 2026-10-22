## Readability and draft upgrade — October 22

The current source adds one full-viewport scroll container, auto-height cards and unlimited text lines. Named recipients and supplied message content are retained. Long-message tests preserve the final marker, and voice-only behavior still receives no APL directive. These are source/response-structure checks, not rendered-device proof.

The AWS Console was unavailable to the editing browser. This revision therefore requires a Lambda ZIP upload and a new display-capable Simulator check before it can be called deployed or visually verified. The interaction model is unchanged for this revision; no new model build is required solely for the readability update. Existing undistributed revisions remain subject to the checks below.

# Guardian Alexa custom skill

The existing development skill's launch, request-specific speech, Guardian APL display and no-execution response to “yes” were verified in the user's October 22 Amazon Simulator recording. This update adds natural phrasing, clarification, drafts and separate scrollable task cards. **This revision still needs upload, model rebuild and a simulator check.** A physical Echo and gated Alexa+ add-on are unverified.

The browser MCP client and standard Alexa skill share the same rules-based planner. They are independent interfaces. Alexa does not control browser flight playback or synchronize its state.

## Update the existing skill

1. Run `python3 scripts/package-alexa.py /absolute/path/Guardian_Lambda_Upgrade.zip`. The ZIP has `index.mjs` at its root; no npm dependencies or model credentials are needed.
2. In **AWS → Lambda → staarwaardd-guardian → Code → Upload from → ZIP**, upload the ZIP and save/deploy. Handler: **index.handler**. Keep the current **ALEXA_SKILL_ID** and skill-restricted **Alexa Skills Kit** trigger. Do not add a Function URL.
3. Extract `interaction-model.json` from the ZIP. In **Amazon Developer Console → Build → Interaction Model → JSON Editor**, replace the model with its contents. Save and build the model for **English (CA)**. Other locales require their own build and test.
4. Keep **Build → Interfaces → Alexa Presentation Language** enabled. In **Test**, choose Development, English (CA), and a display-capable device.

## Acceptance checks

- `open star ward guardian`: speaks help and displays Guardian.
- `plan dinner`: returns a Relationships preparation card instead of fallback help.
- `plan my meeting tomorrow at three`: preserves the spoken time.
- `plan publish my campaign and prepare meeting notes tomorrow`: Creativity requires approval; Work is preparation only.
- `plan draft a message to my family saying hello`: provides a suggested draft, never sends it.
- `plan my meeting at three and my meeting at five`: asks which time, without claiming the plan is complete.
- `yes`: explicitly executes nothing and updates the display.
- An unrelated phrase: gives examples and requests the complete task again.
- Voice-only device fixture: speech and Simple card, no unsupported APL directive.

For a real Echo test, use a device on the same developer account and skill locale. Record invocation, a plan, and “yes.” Do not call physical-device operation verified until that recording exists.

## Scope and verification

`npm test` covers the shared planner, official MCP SDK transport, Alexa response lifecycle, skill ID and timestamp checks, display gating, escaped text, fallback and clarification. Local checks do not verify Amazon utterance recognition or the rendered APL layout. The pre-update video remains evidence of the previous simulator build only.

The skill prepares editable checklists and message drafts. It does not read private accounts, publish, send, book, buy, or control devices. “Approval required” identifies a requested action for human review; “yes” never executes it. Complex language remains a limitation of the rules-based planner; unfamiliar clauses and several ambiguity patterns now request clarification.

## Official references

- https://developer.amazon.com/en-US/docs/alexa/custom-skills/host-a-custom-skill-as-an-aws-lambda-function.html
- https://developer.amazon.com/en-US/docs/alexa/custom-skills/slot-type-reference.html
- https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-scrollview.html
- https://developer.amazon.com/en-US/docs/alexa/devconsole/test-your-skill.html
