# Second-Provider Replication Preflight

Generated at: `2026-06-19T12:36:16.734Z`

Status: `blocked_missing_independent_provider_key`

## Facts

- Primary run: `kimi-cli` / `kimi-code/kimi-for-coding`
- Fixed ToM pilot input rows: 50/50
- Prompt packets: 50/50
- Second-provider rows present: 0
- Second-provider run report present: no
- Second-provider metrics present: no
- Independent provider/model key present: no

## Key Candidates

| Env | Present | Source | Runner | Model | Independent? | Recommended? |
| --- | --- | --- | --- | --- | --- | --- |
| ZHIPU_API_KEY | no | missing | zhipu-openai-compatible | glm-5.1 | yes | no |
| OPENAI_API_KEY | no | missing | openai-compatible | gpt-4.1-mini | yes | no |
| KIMI_API_KEY | yes | env_file | kimi-cli | kimi-code/kimi-for-coding | no | no |

## Blockers

- No independent second-provider/model API key is available in the environment or configured env file. Kimi credentials do not count because the primary run already uses Kimi.

## Smoke Command

```bash
npm run research:second-provider:smoke
```

## Full Resume Command

```bash
npm run research:second-provider:run
```

## Success Criteria

- Provider run report has expectedCount=50, successCount=50, errorCount=0.
- Provider JSONL is materialized at experiments/provider-results/tom-prompted-llm-second-provider.jsonl.
- Replication metrics are materialized at experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json.
- Pilot replication report status becomes completed with completedReplicationCount > 0.
- AAMAS readiness replication-and-human-audit gate becomes pass, or reports only human-audit as remaining desirable validation.

## Required Action

Add an independent provider/model key such as ZHIPU_API_KEY or OPENAI_API_KEY to an uncommitted env file, then run the fixed replication command.
