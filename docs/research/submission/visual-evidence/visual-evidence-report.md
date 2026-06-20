# Visual Evidence Report

Generated at: `2026-06-19T13:41:35.939Z`

Status: `ready_with_external_evidence_pending`

Manuscript: `submission/aamas-latex/main.tex`

## Facts

- Figures: 5 total, 4 wide
- Tables: 9
- Required figure roles: 5/5
- Required table roles: 9/9
- Generated figure source files: 11/11
- Figure caption load: avg 44.4 words, max 60, long captions 0
- Rendered page images: 9/9

## Checks

| Check | Status | Finding | Required Action |
| --- | --- | --- | --- |
| Figure Role Coverage | `pass` | 5/5 required figure roles are present: problem-teaser, method-architecture, schema-repair-flow, main-results, qualitative-case-pack. | Keep at least one visual for the problem teaser, method architecture, schema-repair flow, main results, and qualitative case pack. |
| Table Role Coverage | `pass` | 9/9 required table roles are present: related-work-positioning, trace-schema, label-taxonomy, end-to-end-accounting, revision-effect, label-ablation, provenance-boundary, full-split-evidence, full-evaluation-protocol. | Preserve compact tables for related work, schema/taxonomy, accounting, revision, ablation, provenance, full-split evidence, and protocol boundaries. |
| Source-Backed Figure Files | `pass` | 11/11 expected generated figure source files are present under docs/research/figures. | Regenerate figure artifacts before treating the manuscript visuals as reproducible. |
| Teaser First Impression | `pass` | The problem-teaser figure appears as the first figure at LaTeX line 44. | Keep the zero-communication teaser as the first figure near the end of the introduction so reviewers see the problem-method-evidence story early. |
| Figure Caption Load | `pass` | Figure captions average 44.4 words; max is 60, with 0 captions over 80 words. | Keep figure captions explanatory but scan-friendly; move protocol detail into prose or tables when captions exceed roughly 80 words. |
| Rendered Page Assets | `pass` | 9/9 rendered page images are present under submission/aamas-latex/page-renders. | Render every PDF page after visual edits so figure placement, table density, and caption legibility can be inspected from PNGs. |
| Denominator and Provenance Visibility | `pass` | Main results, accounting, and provenance visuals/tables expose parseability, paired denominators, full-split ToM evidence, and pending audit boundaries. | Keep paired denominators, parse failures, full-split evidence, and pending evidence boundaries visible in captions or tables. |
| External Validation Slot | `external_evidence_pending` | The visual package has a provenance/protocol slot for external validation, but second-provider metrics and completed human-audit agreement are still pending. | After second-provider replication or human agreement completes, add it to the main results/provenance visual rather than only leaving it in protocol text. |

## Figures

| Label | Role | Line | Caption Words | Caption |
| --- | --- | ---: | ---: | --- |
| `fig:pipeline` | problem-teaser | 44 | 50 | Verifiable multi-agent reasoning under zero communication. Unlike explicit team messages, Guandan exposes partner intent only through public actions. The framework converts an LLM action and rationale into auditable commitments, checks them with rule/evidence labels, and reports same-id revision evidence on 32 eligible paired traces while keeping schema failures visible. |
| `fig:revision-architecture` | method-architecture | 235 | 56 | Trace-contract verifier architecture. A decision point is converted into a structured trace with explicit evidence boundaries; the verifier maps the same state, trace, and selected action to labels and issue codes, then supports bounded same-state revision without choosing the action. Paired evidence uses only first-pass parseable traces, while parse failures remain explicit end-to-end reliability failures. |
| `fig:tom-schema-flow` | schema-repair-flow | 357 | 25 | ToM schema-repair flow. The repair layer preserves the selected action, recovers 13 non-conforming outputs, leaves one output unrepaired, and keeps the hard verifier failure visible. |
| `fig:main-pilot-results` | main-results | 391 | 60 | Main pilot results report three reliability layers. Parse yield rises from 26/50 for plain prompting to 36/50 under ToM prompting and 49/50 after deterministic ToM schema repair. On 32 paired candidate traces, verifier revision reduces hard failures from 35 to 10; the hard-failure-count drop is attributed to public-history consistency (80\%) and hidden-information discipline (20\%). |
| `fig:case-pack` | qualitative-case-pack | 539 | 31 | Qualitative verifier-attribution case pack. Cases are selected from the generated attribution artifact to show two repaired semantic failures, one unrepaired hard failure, and one schema failure outside the paired revision subset. |

## Tables

| Label | Role | Line | Caption Words | Caption |
| --- | --- | ---: | ---: | --- |
| `tab:related` | related-work-positioning | 139 | 22 | Related-work positioning. The closest work supplies many surrounding pieces; our focus is rule-grounded trace verification in zero-explicit-communication, mixed-motive, dynamic-action team play. |
| `tab:trace-schema` | trace-schema | 180 | 24 | Structured reasoning trace schema used by all LLM conditions. The verifier checks field-level commitments against the decision point instead of judging an unconstrained explanation. |
| `tab:label-taxonomy` | label-taxonomy | 208 | 18 | Verifier label taxonomy. Hard labels identify rule or information-boundary violations; soft labels diagnose strategic plausibility without claiming optimality. |
| `tab:accounting` | end-to-end-accounting | 337 | 20 | End-to-end accounting for the 50-decision pilot. Revision results are paired only on candidate traces that were parseable before revision. |
| `tab:revision` | revision-effect | 485 | 18 | Verifier-revision effect on the 32 eligible candidate traces. Burden is fail plus unknown; deltas are after minus before. |
| `tab:label-ablation` | label-ablation | 510 | 26 | Post-hoc verifier-label ablation on the 32 paired candidate traces. Rows remove one label group from label-burden accounting; this is not a rerun with modified feedback prompts. |
| `tab:provenance` | provenance-boundary | 604 | 36 | Current provenance boundary for the AAMAS draft. The paper reports pilot values and the completed 500-decision ToM full-split condition where artifacts are complete; full-split plain/candidate prefixes are partial baseline-strengthening evidence, and human-audit evidence remains pending. |
| `tab:full-baseline` | full-split-evidence | 629 | 26 | Full-split substrate and ToM LLM evidence. Deterministic rows validate the 500-decision substrate; ToM rows report the completed Kimi Code CLI full split and deterministic schema-repair ablation. |
| `tab:full-protocol` | full-evaluation-protocol | 652 | 21 | Protocol reserved for the full AAMAS empirical package. Rows describe required evidence before broad claims about robustness, generality, or strategic value. |
