import {
  ReproducibilityManifestEntryInput,
  writeReproducibilityManifest,
} from './reproducibilityManifest'

interface Args {
  root: string
  out: string
}

const args = parseArgs(process.argv.slice(2))
const result = writeReproducibilityManifest({
  rootDir: args.root,
  outputDir: args.out,
  entries: defaultEntries(),
})

console.log(JSON.stringify({
  jsonPath: result.jsonPath,
  markdownPath: result.markdownPath,
  entries: result.manifest.entries.length,
  missing: result.manifest.entries.filter(entry => entry.status === 'missing').length,
}, null, 2))

function defaultEntries(): ReproducibilityManifestEntryInput[] {
  return [
    { id: 'project', title: 'Project Record', path: 'PROJECT.md' },
    { id: 'material-passport', title: 'Material Passport', path: 'material_passport.md' },
    { id: 'literature-matrix', title: 'Literature Matrix', path: 'notes/literature_matrix.csv' },
    { id: 'schemas', title: 'Evaluation Schemas', path: 'schemas' },
    { id: 'prompt-templates', title: 'Prompt Templates', path: 'prompts' },
    { id: 'pilot-dataset-manifest', title: 'Pilot Dataset Manifest', path: 'experiments/pilot-e1/manifest.json' },
    { id: 'pilot-decision-points', title: 'Pilot Decision Points', path: 'experiments/pilot-e1/decisions' },
    { id: 'full-dataset-manifest', title: 'Full Evaluation Dataset Manifest', path: 'experiments/full-e1/manifest.json' },
    { id: 'full-decision-points', title: 'Full Evaluation Decision Points', path: 'experiments/full-e1/decisions' },
    { id: 'legal-first-metrics', title: 'Legal-First Baseline Metrics', path: 'experiments/pilot-e2-heuristic-verifier/metrics.json' },
    { id: 'strategic-heuristic-metrics', title: 'Strategic Baseline Metrics', path: 'experiments/pilot-e3-strategic-heuristic/metrics.json' },
    { id: 'full-legal-first-metrics', title: 'Full Split Legal-First Baseline Metrics', path: 'experiments/full-e2-heuristic-verifier/metrics.json' },
    { id: 'full-strategic-heuristic-metrics', title: 'Full Split Strategic Baseline Metrics', path: 'experiments/full-e3-strategic-heuristic/metrics.json' },
    { id: 'full-baseline-summary', title: 'Full Split Baseline Summary', path: 'experiments/full-baseline-summary/full-baseline-summary.json' },
    { id: 'plain-prompt-packets', title: 'Plain LLM Prompt Packets', path: 'experiments/pilot-e4-plain-llm-prompts/packets' },
    { id: 'candidate-prompt-packets', title: 'Candidate-Constrained Prompt Packets', path: 'experiments/pilot-e5-candidate-constrained-prompts/packets' },
    { id: 'tom-pilot-prompt-packets', title: 'ToM-Prompted Pilot Prompt Packets', path: 'experiments/pilot-e7-tom-prompted-prompts/packets' },
    { id: 'full-plain-prompt-packets', title: 'Full Split Plain Prompt Packets', path: 'experiments/full-e2-plain-llm-prompts/packets' },
    { id: 'full-candidate-prompt-packets', title: 'Full Split Candidate-Constrained Prompt Packets', path: 'experiments/full-e3-candidate-constrained-prompts/packets' },
    { id: 'tom-full-prompt-packets', title: 'ToM-Prompted Full Prompt Packets', path: 'experiments/full-e4-tom-prompted-prompts/packets' },
    { id: 'revision-fixture-packets', title: 'Fixture Revision Prompt Packets', path: 'experiments/pilot-e6-verifier-revision-fixture-prompts/packets' },
    { id: 'plain-openai-batch', title: 'Plain OpenAI Batch Input', path: 'experiments/pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl' },
    { id: 'candidate-openai-batch', title: 'Candidate OpenAI Batch Input', path: 'experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl' },
    { id: 'tom-pilot-openai-batch', title: 'ToM-Prompted Pilot OpenAI Batch Input', path: 'experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl' },
    { id: 'full-plain-openai-batch', title: 'Full Split Plain OpenAI Batch Input', path: 'experiments/full-e2-plain-llm-batch/openai/openai-batch-input.jsonl' },
    { id: 'full-candidate-openai-batch', title: 'Full Split Candidate-Constrained OpenAI Batch Input', path: 'experiments/full-e3-candidate-constrained-batch/openai/openai-batch-input.jsonl' },
    { id: 'tom-full-openai-batch', title: 'ToM-Prompted Full OpenAI Batch Input', path: 'experiments/full-e4-tom-prompted-batch/openai/openai-batch-input.jsonl' },
    { id: 'revision-fixture-openai-batch', title: 'Fixture Revision OpenAI Batch Input', path: 'experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-input.jsonl' },
    { id: 'provider-run-handoff', title: 'Provider Run Handoff', path: 'submission/provider-run-handoff.md' },
    { id: 'provider-handoff-audit', title: 'Provider Handoff Audit', path: 'submission/provider-handoff-audit/provider-handoff-audit.json' },
    { id: 'plain-raw-audit', title: 'Plain Raw Output Audit', path: 'experiments/pilot-e4-plain-llm-batch/raw-output-audit.json' },
    { id: 'candidate-raw-audit', title: 'Candidate Raw Output Audit', path: 'experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json' },
    { id: 'tom-pilot-raw-audit', title: 'ToM-Prompted Pilot Raw Output Audit', path: 'experiments/pilot-e7-tom-prompted-batch/raw-output-audit.json' },
    { id: 'full-plain-raw-audit', title: 'Full Split Plain Raw Output Audit', path: 'experiments/full-e2-plain-llm-batch/raw-output-audit.json' },
    { id: 'full-candidate-raw-audit', title: 'Full Split Candidate-Constrained Raw Output Audit', path: 'experiments/full-e3-candidate-constrained-batch/raw-output-audit.json' },
    { id: 'tom-full-raw-audit', title: 'ToM-Prompted Full Raw Output Audit', path: 'experiments/full-e4-tom-prompted-batch/raw-output-audit.json' },
    { id: 'revision-raw-audit', title: 'Revision Raw Output Audit', path: 'experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json' },
    { id: 'plain-provider-results', title: 'Plain Provider Results', path: 'experiments/provider-results/plain-llm.jsonl' },
    { id: 'candidate-provider-results', title: 'Candidate Provider Results', path: 'experiments/provider-results/candidate-constrained-llm.jsonl' },
    { id: 'tom-provider-results', title: 'ToM-Prompted Provider Results', path: 'experiments/provider-results/tom-prompted-llm.jsonl' },
    { id: 'tom-provider-merge-report', title: 'ToM-Prompted Provider Merge Report', path: 'experiments/provider-results/tom-prompted-llm-kimi-merge-report.json' },
    { id: 'full-tom-provider-results', title: 'Full Split ToM-Prompted Provider Results', path: 'experiments/provider-results/full-tom-prompted-llm.jsonl' },
    { id: 'full-tom-provider-run-report', title: 'Full Split ToM-Prompted Provider Run Report', path: 'experiments/provider-results/full-tom-prompted-llm-kimi-cli-run-report.json' },
    { id: 'revision-provider-results', title: 'Verifier Revision Provider Results', path: 'experiments/provider-results/verifier-revision-llm.jsonl' },
    { id: 'tom-prompted-metrics', title: 'ToM-Prompted Pilot Metrics', path: 'experiments/pilot-e7-tom-prompted-results/metrics.json' },
    { id: 'tom-prompted-provenance', title: 'ToM-Prompted Run Provenance', path: 'experiments/pilot-e7-tom-prompted-results/provenance.json' },
    { id: 'tom-prompted-post-provider-report', title: 'ToM-Prompted Post-Provider Report', path: 'experiments/pilot-e7-tom-prompted-results/post-provider-report.json' },
    { id: 'tom-failure-analysis', title: 'ToM-Prompted Failure Analysis', path: 'experiments/pilot-e7-tom-failure-analysis/tom-failure-analysis.json' },
    { id: 'tom-schema-repair-metrics', title: 'ToM Schema Repair Metrics', path: 'experiments/pilot-e8-tom-schema-repair-results/metrics.json' },
    { id: 'tom-schema-repair-report', title: 'ToM Schema Repair Report', path: 'experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json' },
    {
      id: 'full-tom-prompted-metrics',
      title: 'Full Split ToM-Prompted Metrics',
      path: 'experiments/full-e4-tom-prompted-results/metrics.json',
      statusOverride: 'pending',
      reason: 'Pending until full-split ToM provider outputs reach 500/500 and post-provider ingest materializes metrics.',
    },
    { id: 'full-tom-prompted-post-provider-report', title: 'Full Split ToM-Prompted Post-Provider Report', path: 'experiments/full-e4-tom-prompted-results/post-provider-report.json' },
    { id: 'full-tom-schema-repair-metrics', title: 'Full Split ToM Schema Repair Metrics', path: 'experiments/full-e5-tom-schema-repair-results/metrics.json' },
    { id: 'full-tom-schema-repair-report', title: 'Full Split ToM Schema Repair Report', path: 'experiments/full-e5-tom-schema-repair-results/schema-repair-report.json' },
    { id: 'full-llm-summary', title: 'Full Split LLM Summary', path: 'experiments/full-llm-summary/full-llm-summary.json' },
    { id: 'human-audit-manifest', title: 'Human Soft-Label Audit Manifest', path: 'experiments/human-soft-label-audit/human-audit-manifest.json' },
    { id: 'human-audit-blind-sample', title: 'Human Soft-Label Audit Blind Sample', path: 'experiments/human-soft-label-audit/human-audit-blind-sample.jsonl' },
    { id: 'human-audit-annotation-sheet', title: 'Human Soft-Label Audit Annotation Sheet', path: 'experiments/human-soft-label-audit/human-audit-annotation-sheet.csv' },
    { id: 'human-audit-annotator', title: 'Human Soft-Label Audit Annotator HTML', path: 'experiments/human-soft-label-audit/human-audit-annotator.html' },
    { id: 'human-audit-answer-key', title: 'Human Soft-Label Audit Answer Key', path: 'experiments/human-soft-label-audit/human-audit-answer-key.jsonl' },
    { id: 'human-audit-protocol', title: 'Human Soft-Label Audit Protocol', path: 'experiments/human-soft-label-audit/human-audit-protocol.md' },
    { id: 'human-audit-packet-quality-report', title: 'Human Soft-Label Audit Packet Quality Report', path: 'experiments/human-soft-label-audit/human-audit-packet-quality-report.json' },
    { id: 'human-audit-packet-quality-report-md', title: 'Human Soft-Label Audit Packet Quality Report Markdown', path: 'experiments/human-soft-label-audit/human-audit-packet-quality-report.md' },
    { id: 'human-audit-annotator-package-manifest', title: 'Human Soft-Label Audit Blind Annotator Package Manifest', path: 'experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json' },
    { id: 'human-audit-annotator-package-readme', title: 'Human Soft-Label Audit Blind Annotator Package README', path: 'experiments/human-soft-label-audit/annotator-package/README.md' },
    { id: 'human-audit-annotator-package-html', title: 'Human Soft-Label Audit Blind Annotator Package HTML', path: 'experiments/human-soft-label-audit/annotator-package/human-audit-annotator.html' },
    { id: 'human-audit-annotator-package-sheet', title: 'Human Soft-Label Audit Blind Annotator Package Sheet', path: 'experiments/human-soft-label-audit/annotator-package/human-audit-annotation-sheet.csv' },
    { id: 'human-audit-annotator-package-blind', title: 'Human Soft-Label Audit Blind Annotator Package Samples', path: 'experiments/human-soft-label-audit/annotator-package/human-audit-blind-sample.jsonl' },
    { id: 'human-audit-annotator-package-archive', title: 'Human Soft-Label Audit Blind Annotator Package Archive', path: 'experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz' },
    { id: 'human-audit-annotator-package-archive-report', title: 'Human Soft-Label Audit Blind Annotator Package Archive Report', path: 'experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.json' },
    { id: 'human-audit-annotator-package-archive-report-md', title: 'Human Soft-Label Audit Blind Annotator Package Archive Report Markdown', path: 'experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.md' },
    {
      id: 'human-audit-completed-annotations',
      title: 'Human Soft-Label Audit Returned Completed Annotations',
      path: 'experiments/human-soft-label-audit/human-audit-completed-annotations.csv',
      statusOverride: 'pending',
      reason: 'Pending until external annotators return the completed blind annotation CSV.',
    },
    { id: 'human-audit-intake-report', title: 'Human Soft-Label Audit Returned-Annotation Intake Report', path: 'experiments/human-soft-label-audit/human-audit-intake-report.json' },
    { id: 'human-audit-intake-report-md', title: 'Human Soft-Label Audit Returned-Annotation Intake Report Markdown', path: 'experiments/human-soft-label-audit/human-audit-intake-report.md' },
    { id: 'human-audit-agreement-report', title: 'Human Soft-Label Audit Agreement Report', path: 'experiments/human-soft-label-audit/human-audit-agreement-report.json' },
    { id: 'human-audit-agreement-report-md', title: 'Human Soft-Label Audit Agreement Report Markdown', path: 'experiments/human-soft-label-audit/human-audit-agreement-report.md' },
    { id: 'metrics-summary', title: 'Pilot Metrics Summary', path: 'experiments/pilot-metrics-summary/pilot-metrics-summary.json' },
    { id: 'revision-comparison', title: 'Revision Comparison', path: 'experiments/pilot-revision-comparison/revision-comparison.json' },
    { id: 'verifier-attribution', title: 'Paired Verifier Attribution', path: 'experiments/pilot-verifier-attribution/verifier-attribution.json' },
    { id: 'ablation-summary', title: 'Verifier Ablation Summary', path: 'experiments/pilot-ablation-summary/ablation-summary.json' },
    { id: 'paper-tables', title: 'Paper Table Sources', path: 'tables' },
    { id: 'figures', title: 'Figure Sources', path: 'figures' },
    { id: 'verifier-pipeline-figure', title: 'Verifier Pipeline Figure', path: 'figures/figure-1-verifier-pipeline.svg' },
    { id: 'verifier-pipeline-figure-notes', title: 'Verifier Pipeline Figure Notes', path: 'figures/figure-1-verifier-pipeline.md' },
    { id: 'revision-architecture-figure', title: 'Verifier-Grounded Revision Architecture Figure', path: 'figures/figure-2-revision-architecture.svg' },
    { id: 'revision-architecture-figure-notes', title: 'Verifier-Grounded Revision Architecture Figure Notes', path: 'figures/figure-2-revision-architecture.md' },
    { id: 'tom-schema-repair-flow-figure', title: 'ToM Schema Repair Flow Figure', path: 'figures/figure-3-tom-schema-repair-flow.svg' },
    { id: 'tom-schema-repair-flow-figure-notes', title: 'ToM Schema Repair Flow Figure Notes', path: 'figures/figure-3-tom-schema-repair-flow.md' },
    { id: 'main-pilot-results-figure', title: 'Main Pilot Results Figure', path: 'figures/figure-4-main-pilot-results.svg' },
    { id: 'main-pilot-results-figure-notes', title: 'Main Pilot Results Figure Notes', path: 'figures/figure-4-main-pilot-results.md' },
    { id: 'references-bib', title: 'Normalized Bibliography', path: 'submission/references.bib' },
    { id: 'bibliography-integrity', title: 'Bibliography Integrity Report', path: 'submission/citation-integrity/bibliography-integrity-report.json' },
    { id: 'manuscript', title: 'Assembled Manuscript', path: 'submission/manuscript/manuscript-draft.md' },
    { id: 'manuscript-status', title: 'Manuscript Status', path: 'submission/manuscript/manuscript-status.json' },
    { id: 'aamas-latex-draft', title: 'AAMAS LaTeX Draft', path: 'submission/aamas-latex' },
    { id: 'submission-gate', title: 'Submission Gate Report', path: 'submission/gate-report/submission-gate-report.json' },
    { id: 'submission-marker-inventory', title: 'Submission Marker Inventory', path: 'submission/marker-inventory/submission-marker-inventory.json' },
    { id: 'experiment-resolution-ledger', title: 'Experiment Resolution Ledger', path: 'submission/experiment-resolution-ledger/experiment-resolution-ledger.json' },
    { id: 'preflight-report', title: 'Research Preflight Report', path: 'submission/preflight/research-preflight-report.json' },
    { id: 'aamas-readiness-report', title: 'AAMAS Full-Paper Readiness Report', path: 'submission/aamas-readiness/aamas-readiness-report.json' },
    { id: 'aamas-readiness-report-md', title: 'AAMAS Full-Paper Readiness Report Markdown', path: 'submission/aamas-readiness/aamas-readiness-report.md' },
    { id: 'local-pipeline-report', title: 'Local Research Pipeline Report', path: 'submission/local-pipeline/local-research-pipeline-report.json' },
    { id: 'submission-checklist', title: 'Submission Checklist', path: 'submission/submission_checklist.md' },
    { id: 'submission-profile', title: 'Working Submission Profile', path: 'submission/submission-profile.md' },
    { id: 'page-budget', title: 'Page Budget Snapshot', path: 'submission/page-budget.md' },
    { id: 'author-decision-brief', title: 'Author Decision Brief', path: 'submission/author-decision-brief.md' },
    { id: 'ai-disclosure', title: 'AI-Use Disclosure', path: 'submission/ai-use-disclosure.md' },
  ]
}

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    root: 'docs/research',
    out: 'docs/research/submission',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--root') {
      parsed.root = value
      i++
    } else if (arg === '--out') {
      parsed.out = value
      i++
    }
  }

  return parsed
}
