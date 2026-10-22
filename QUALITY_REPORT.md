# Targeted technical quality evaluation — October 22, 2026

## Results

| Same local 21-case fixture set | Passed |
|---|---:|
| Before these changes | 12/21 |
| After these changes | 21/21 |

These cases were authored during this repair to cover known gaps. They are a targeted regression set, not a random sample, held-out benchmark, general-language accuracy estimate or customer-impact study. Both runs used the same requests and checks. The baseline used the pre-change planner; the suite remains reproducible as `node test/quality-evaluation.mjs --assert`. No cloud latency or customer time saving is asserted.

## Per-case checks

| Request behavior | Before | After |
|---|---|---|
| mixed ownership | Pass | Pass |
| meeting time | Pass | Pass |
| conflicting spoken times | Pass | Pass |
| equivalent spoken and numeric times | Fail | Pass |
| talking points | Fail | Pass |
| presentation | Fail | Pass |
| team catchup | Fail | Pass |
| compose work email | Fail | Pass |
| write work email | Fail | Pass |
| named recipient | Fail | Pass |
| exact family message | Pass | Pass |
| explicit brief facts | Fail | Pass |
| explicit meeting agenda | Fail | Pass |
| prohibition | Pass | Pass |
| mixed prohibition | Pass | Pass |
| unknown clause | Pass | Pass |
| conditional action | Pass | Pass |
| simple dinner | Pass | Pass |
| home control held | Pass | Pass |
| style details | Pass | Pass |
| unknown task | Pass | Pass |

## Draft behavior

Named recipients, exact supplied quoted messages and labelled topic/agenda/audience/budget/location facts populate the draft. Unknown details remain explicitly unconfirmed. Work notes include decision prompts and follow-up checks; campaign drafts include asset and release checks. These remain deterministic preparation suggestions, not account-aware advice or a runtime language-model service.

## Alexa layout checks

A long supplied message survives through the planner and APL response data to a final marker. Text components have unlimited lines, auto height and no shrinking, inside one full-viewport ScrollView. Voice-only behavior and markup escaping remain covered. The old fixed-height side-by-side poster/scroll layout has been replaced.

These are automated structure/content checks. They do not render APL. AWS Console access was unavailable, so the updated Lambda still requires deployment and a rendered Simulator check. Physical Echo operation remains unverified.

## Human feedback

See [USABILITY_NOTES.md](USABILITY_NOTES.md) for one phone tester’s feedback relayed through the founder, including the navigation issue and the separately published mobile repair. No customer success rate or controlled-user outcome is derived from that report.
