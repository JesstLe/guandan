# Method Reproducibility Report

Generated at: `2026-06-19T12:36:20.696Z`

Status: `pass`

Manuscript: `submission/aamas-latex/main.tex`

Checked text scope: Method through Full-Evaluation Protocol, plus Reproducibility and Provenance when present

## Facts

- Method section present: yes
- Reproducibility section present: yes
- Modules passing: 6/6
- Method terms present: 28/28
- Artifacts present: 15/15
- Commands present: 7/7

## Modules

| Module | Status | Terms | Artifacts | Commands | Missing | Required Action |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Decision-Point Exporter | `pass` | 4/4 | 3/3 | 1/1 | none | No action required; paper text, artifacts, and command path are aligned. |
| Structured Reasoning Trace | `pass` | 6/6 | 2/2 | 1/1 | none | No action required; paper text, artifacts, and command path are aligned. |
| Rule-Grounded Verifier | `pass` | 5/5 | 3/3 | 1/1 | none | No action required; paper text, artifacts, and command path are aligned. |
| Verifier-Grounded Revision | `pass` | 5/5 | 2/2 | 2/2 | none | No action required; paper text, artifacts, and command path are aligned. |
| ToM Schema-Repair Ablation | `pass` | 4/4 | 2/2 | 1/1 | none | No action required; paper text, artifacts, and command path are aligned. |
| Source-Backed Artifacts | `pass` | 4/4 | 3/3 | 1/1 | none | No action required; paper text, artifacts, and command path are aligned. |

## Reproduction Commands

### Decision-Point Exporter

- `npx tsx server/src/research/exportPilotDatasetCli.ts --out docs/research/experiments/pilot-e1 --count 50 --prefix pilot-e1`

### Structured Reasoning Trace

- `npx tsx server/src/research/exportLLMPromptPacketsCli.ts --out docs/research/experiments/pilot-e7-tom-prompted-prompts --condition tom-prompted-llm`

### Rule-Grounded Verifier

- `npx tsx server/src/research/runPilotVerifierCli.ts --decisions docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e2-heuristic-verifier`

### Verifier-Grounded Revision

- `npx tsx server/src/research/exportVerifierRevisionPacketsCli.ts --out docs/research/experiments/pilot-e6-verifier-revision-prompts`
- `npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison`

### ToM Schema-Repair Ablation

- `npx tsx server/src/research/runLLMSchemaRepairCli.ts --out docs/research/experiments/pilot-e8-tom-schema-repair-results`

### Source-Backed Artifacts

- `npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline`
