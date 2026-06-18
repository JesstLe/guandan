# Table Sources

These table sources are generated from current experiment artifacts.

| Table | Source | Status |
|---|---|---|
| Table 0: Related-Work Positioning | `table-0-related-work-positioning.md` | Paper-ready compact positioning table; evidence lives in `notes/related_work_comparison.md` and `notes/knowledge_base.md`. |
| Table 1: Reasoning Reliability | `table-1-reasoning-reliability.md` | Contains deterministic harness-validation rows and LLM readiness rows. |
| Table 2: Verifier-Revision Effect | `table-2-verifier-revision-effect.md` | Shape is ready, but all cells remain `[NEED_EXPERIMENT]` until real revision outputs exist. |

Regenerate:

```bash
npx tsx server/src/research/writePaperTableArtifactsCli.ts \
  --out docs/research/tables
```

Do not copy `[NEED_EXPERIMENT]` rows into a submission as empirical results.
