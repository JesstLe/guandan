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
    { id: 'plain-prompt-packets', title: 'Plain LLM Prompt Packets', path: 'experiments/pilot-e4-plain-llm-prompts/packets' },
    { id: 'candidate-prompt-packets', title: 'Candidate-Constrained Prompt Packets', path: 'experiments/pilot-e5-candidate-constrained-prompts/packets' },
    { id: 'revision-fixture-packets', title: 'Fixture Revision Prompt Packets', path: 'experiments/pilot-e6-verifier-revision-fixture-prompts/packets' },
    { id: 'plain-openai-batch', title: 'Plain OpenAI Batch Input', path: 'experiments/pilot-e4-plain-llm-batch/openai/openai-batch-input.jsonl' },
    { id: 'candidate-openai-batch', title: 'Candidate OpenAI Batch Input', path: 'experiments/pilot-e5-candidate-constrained-batch/openai/openai-batch-input.jsonl' },
    { id: 'revision-fixture-openai-batch', title: 'Fixture Revision OpenAI Batch Input', path: 'experiments/pilot-e6-verifier-revision-fixture-batch/openai/openai-batch-input.jsonl' },
    { id: 'provider-run-handoff', title: 'Provider Run Handoff', path: 'submission/provider-run-handoff.md' },
    { id: 'provider-handoff-audit', title: 'Provider Handoff Audit', path: 'submission/provider-handoff-audit/provider-handoff-audit.json' },
    { id: 'plain-raw-audit', title: 'Plain Raw Output Audit', path: 'experiments/pilot-e4-plain-llm-batch/raw-output-audit.json' },
    { id: 'candidate-raw-audit', title: 'Candidate Raw Output Audit', path: 'experiments/pilot-e5-candidate-constrained-batch/raw-output-audit.json' },
    { id: 'revision-raw-audit', title: 'Revision Raw Output Audit', path: 'experiments/pilot-e6-verifier-revision-fixture-batch/raw-output-audit.json' },
    { id: 'plain-provider-results', title: 'Plain Provider Results', path: 'experiments/provider-results/plain-llm.jsonl' },
    { id: 'candidate-provider-results', title: 'Candidate Provider Results', path: 'experiments/provider-results/candidate-constrained-llm.jsonl' },
    { id: 'revision-provider-results', title: 'Verifier Revision Provider Results', path: 'experiments/provider-results/verifier-revision-llm.jsonl' },
    { id: 'metrics-summary', title: 'Pilot Metrics Summary', path: 'experiments/pilot-metrics-summary/pilot-metrics-summary.json' },
    { id: 'revision-comparison', title: 'Revision Comparison', path: 'experiments/pilot-revision-comparison/revision-comparison.json' },
    { id: 'ablation-summary', title: 'Verifier Ablation Summary', path: 'experiments/pilot-ablation-summary/ablation-summary.json' },
    { id: 'paper-tables', title: 'Paper Table Sources', path: 'tables' },
    { id: 'figures', title: 'Figure Sources', path: 'figures' },
    { id: 'references-bib', title: 'Normalized Bibliography', path: 'submission/references.bib' },
    { id: 'bibliography-integrity', title: 'Bibliography Integrity Report', path: 'submission/citation-integrity/bibliography-integrity-report.json' },
    { id: 'manuscript', title: 'Assembled Manuscript', path: 'submission/manuscript/manuscript-draft.md' },
    { id: 'manuscript-status', title: 'Manuscript Status', path: 'submission/manuscript/manuscript-status.json' },
    { id: 'submission-gate', title: 'Submission Gate Report', path: 'submission/gate-report/submission-gate-report.json' },
    { id: 'submission-marker-inventory', title: 'Submission Marker Inventory', path: 'submission/marker-inventory/submission-marker-inventory.json' },
    { id: 'experiment-resolution-ledger', title: 'Experiment Resolution Ledger', path: 'submission/experiment-resolution-ledger/experiment-resolution-ledger.json' },
    { id: 'preflight-report', title: 'Research Preflight Report', path: 'submission/preflight/research-preflight-report.json' },
    { id: 'local-pipeline-report', title: 'Local Research Pipeline Report', path: 'submission/local-pipeline/local-research-pipeline-report.json' },
    { id: 'submission-checklist', title: 'Submission Checklist', path: 'submission/submission_checklist.md' },
    { id: 'submission-profile', title: 'Working Submission Profile', path: 'submission/submission-profile.md' },
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
