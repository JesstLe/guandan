# Second-Provider Replication Package

This package contains the fixed 50-decision ToM-prompted pilot replication inputs for an independent provider/model run. It contains no API keys, provider outputs, manuscript drafts, or human-audit answer keys.

## Contents

- `openai-batch-input.jsonl`: OpenAI-compatible request JSONL with 50 fixed prompt rows.
- `prompt-packets/`: Source prompt packets used to generate the JSONL.
- `manifest.json`: Checksums and readiness metadata for this package.

## Expected Run Boundary

Use an independent provider/model from the primary Kimi run, such as Zhipu GLM or OpenAI. A same-provider Kimi rerun must not be reported as independent replication evidence.

Recommended smoke command from the repository root:

```bash
npm run research:second-provider:smoke
```

Recommended full resume command from the repository root:

```bash
npm run research:second-provider:run
```

## Success Criteria

- Provider run report has `expectedCount=50`, `successCount=50`, and `errorCount=0`.
- Provider JSONL is materialized at `docs/research/experiments/provider-results/tom-prompted-llm-second-provider.jsonl`.
- Metrics are materialized at `docs/research/experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json`.
- `npm run research:local-pipeline` and `npm run research:aamas-finalize` are rerun after outputs return.

## Current Package Facts

- Fixed input rows: 50/50
- Prompt packets: 50/50
- Ready for external run: yes
- Ready for paper evidence: no, not until independent provider outputs are returned and materialized.
