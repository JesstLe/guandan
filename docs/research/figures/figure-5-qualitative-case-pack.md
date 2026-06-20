# Figure 5: Qualitative Verifier-Attribution Case Pack

Source inputs:

- Verifier attribution: `docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json`

| Case | Decision id | Action changed | Primary reason changed | Before issues | After issues | Label transition |
| --- | --- | --- | --- | --- | --- | --- |
| A. Public-history repair | `pilot-e1-002-turn-1-player-0` | false | false | UNKNOWN_PUBLIC_EVIDENCE, PARTNER_BELIEF_OMITS_PUBLIC_TAG | none | public history: fail -> pass; partner: fail -> pass |
| B. Hidden-information repair | `pilot-e1-013-turn-1-player-0` | false | true | UNKNOWN_PUBLIC_EVIDENCE, HIDDEN_INFO_ASSERTED_AS_FACT | none | public history: fail -> pass; hidden info: fail -> pass |
| C. Remaining hard failure | `pilot-e1-004-turn-1-player-0` | false | false | UNKNOWN_PUBLIC_EVIDENCE | UNKNOWN_PUBLIC_EVIDENCE | public history: fail -> fail |
| D. Parse failure outside paired subset | `pilot-e1-000-turn-1-player-0` | n/a | n/a | none | none | schema: not parseable; paired revision: excluded |

Caption draft:

> Qualitative verifier-attribution case pack. Cases are selected from the generated attribution artifact to show two repaired semantic failures, one unrepaired hard failure, and one schema failure outside the paired revision subset.
