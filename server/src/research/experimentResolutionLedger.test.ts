import { describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  buildExperimentResolutionLedger,
  writeExperimentResolutionLedger,
} from './experimentResolutionLedger'

describe('experimentResolutionLedger', () => {
  it('maps blocking manuscript experiment markers to required evidence families', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-experiment-ledger-'))

    try {
      mkdirSync(join(rootDir, 'drafts', 'paper-as-code'), { recursive: true })
      mkdirSync(join(rootDir, 'submission', 'manuscript'), { recursive: true })
      writeFileSync(join(rootDir, 'drafts', 'paper-as-code', '04_experiments.md'), [
        '# Experiments',
        'Workbench marker only. [NEED_EXPERIMENT]',
      ].join('\n'), 'utf8')
      writeFileSync(join(rootDir, 'submission', 'manuscript', 'manuscript-draft.md'), [
        '# Draft',
        'The main comparison tests whether the verifier-in-the-loop condition reduces failures relative to plain and candidate prompting. [NEED_EXPERIMENT]',
        'Ablations remove verifier components one at a time. [NEED_EXPERIMENT]',
        'Qualitative case studies will show failures that outcome metrics miss. [NEED_EXPERIMENT]',
        'Generalization beyond Guandan needs additional environments. [NEED_EXPERIMENT]',
      ].join('\n'), 'utf8')

      const ledger = buildExperimentResolutionLedger(rootDir)

      expect(ledger.counts.totalItems).toBe(4)
      expect(ledger.counts.byStatus.missing_evidence).toBe(4)
      expect(ledger.counts.byEvidenceFamily.first_pass_llm).toBe(2)
      expect(ledger.counts.byEvidenceFamily.verifier_revision).toBe(1)
      expect(ledger.counts.byEvidenceFamily.ablation).toBe(1)
      expect(ledger.counts.byEvidenceFamily.case_study).toBe(1)
      expect(ledger.counts.byEvidenceFamily.generalization).toBe(1)
      expect(ledger.items.map(item => item.ledgerId)).toEqual([
        'need-exp-001',
        'need-exp-002',
        'need-exp-003',
        'need-exp-004',
      ])
      expect(ledger.items.every(item => item.relativePath === 'submission/manuscript/manuscript-draft.md')).toBe(true)
      expect(ledger.items[0].blockingArtifacts).toContain('experiments/provider-results/plain-llm.jsonl')
      expect(ledger.items[1].blockingArtifacts).toContain('experiments/pilot-ablation-summary/ablation-summary.json')
      expect(ledger.items[2].blockingArtifacts).toContain('experiments/pilot-case-studies/case-studies.json')
      expect(ledger.items[3].blockingArtifacts).toContain('experiments/transfer-eval/manifest.json')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('requires ready evidence artifacts before a marker can be removed', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-experiment-ledger-ready-'))
    const outputDir = join(rootDir, 'submission', 'experiment-resolution-ledger')

    try {
      mkdirSync(join(rootDir, 'submission', 'manuscript'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'provider-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'pilot-e4-plain-llm-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'pilot-e5-candidate-constrained-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'pilot-metrics-summary'), { recursive: true })
      writeFileSync(join(rootDir, 'submission', 'manuscript', 'manuscript-draft.md'), [
        '# Draft',
        'We aggregate verifier labels into reasoning reliability metrics and compare them with team-decision metrics. [NEED_EXPERIMENT]',
      ].join('\n'), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'plain-llm.jsonl'), '{"ok":true}\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'candidate-constrained-llm.jsonl'), '{"ok":true}\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'pilot-e4-plain-llm-results', 'metrics.json'), '{"status":"metrics_available"}\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'pilot-e5-candidate-constrained-results', 'metrics.json'), '{"status":"metrics_available"}\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'pilot-metrics-summary', 'pilot-metrics-summary.json'), '{"status":"missing_raw_outputs"}\n', 'utf8')

      const missing = buildExperimentResolutionLedger(rootDir)
      expect(missing.items[0].status).toBe('missing_evidence')
      expect(missing.items[0].blockingArtifacts).toEqual(['experiments/pilot-metrics-summary/pilot-metrics-summary.json'])

      writeFileSync(join(rootDir, 'experiments', 'pilot-metrics-summary', 'pilot-metrics-summary.json'), '{"status":"metrics_available"}\n', 'utf8')
      const result = writeExperimentResolutionLedger({
        researchRoot: rootDir,
        outputDir,
      })

      expect(result.ledger.items[0].status).toBe('evidence_available_marker_still_present')
      expect(result.ledger.items[0].blockingArtifacts).toEqual([])
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('# Experiment Resolution Ledger')
      expect(JSON.parse(readFileSync(result.jsonPath, 'utf8')).counts.totalItems).toBe(1)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
