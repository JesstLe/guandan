# Table Sources

These table sources are generated from current experiment artifacts.

| Table | Source | Status |
|---|---|---|
| Table 0: Related-Work Positioning | `table-0-related-work-positioning.md` | Paper-ready compact positioning table; evidence lives in `notes/related_work_comparison.md` and `notes/knowledge_base.md`. |
| Table 1: Reasoning Reliability | `table-1-reasoning-reliability.md` | Contains deterministic harness-validation rows and LLM readiness rows. |
| Table 2: Verifier-Revision Effect | `table-2-verifier-revision-effect.md` | Contains paired pilot verifier-revision failure-burden deltas. |
| Table 3: Verifier Label Ablation | `table-3-verifier-ablation.md` | Post-hoc paired label-burden ablation over existing before/after traces; not a prompt-level component-removal rerun. |
| Table 4: Human Soft-Label Audit Readiness | `table-4-human-audit-agreement.md` | Auto-generated from the packet-quality and agreement reports; packet readiness is not reportable as human-audit evidence until agreement status is `completed`. |

Regenerate:

```bash
npx tsx server/src/research/writePaperTableArtifactsCli.ts \
  --out docs/research/tables
```

Do not copy `[NEED_EXPERIMENT]` rows into a submission as empirical results.
