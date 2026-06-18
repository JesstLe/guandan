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
import { writeSubmissionGateReport } from './submissionGate'

describe('submissionGate', () => {
  it('blocks submission when LLM outputs and revision metrics are missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-submission-gate-block-'))

    try {
      writeMinimalResearchProject(rootDir, {
        markerText: '[NEED_EXPERIMENT]\n[DO_NOT_SUBMIT] Missing empirical result.',
        metricsRows: [
          metricsRow('heuristic-legal-first', 'metrics_available'),
          metricsRow('plain-llm', 'missing_raw_outputs'),
          metricsRow('candidate-constrained-llm', 'missing_raw_outputs'),
          metricsRow('verifier-revision-llm', 'missing_raw_outputs'),
        ],
        revisionStatus: 'missing_raw_outputs',
      })

      const result = writeSubmissionGateReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'gate-report'),
      })

      expect(result.report.overallStatus).toBe('not_ready')
      expect(result.report.gates.find(gate => gate.id === 'experiment_sufficiency')?.status).toBe('fail')
      expect(result.report.gates.find(gate => gate.id === 'submission_readiness')?.status).toBe('fail')
      expect(result.report.markerCounts.NEED_EXPERIMENT).toBeGreaterThan(0)
      expect(result.report.immediateBlockers).toContain('LLM condition plain-llm has status missing_raw_outputs.')
      expect(result.report.immediateBlockers).not.toContain('Missing experiments/pilot-e4-plain-llm-batch/provenance.json.')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Overall status: `not_ready`')
      expect(markdown).toContain('LLM condition plain-llm has status missing_raw_outputs.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('requires first-pass LLM provenance after first-pass metrics are available', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-submission-gate-provenance-'))

    try {
      writeMinimalResearchProject(rootDir, {
        markerText: 'All claims are supported by current artifacts.',
        metricsRows: [
          metricsRow('heuristic-legal-first', 'metrics_available'),
          metricsRow('strategic-heuristic', 'metrics_available'),
          metricsRow('plain-llm', 'metrics_available'),
          metricsRow('candidate-constrained-llm', 'metrics_available'),
          metricsRow('verifier-revision-llm', 'metrics_available'),
        ],
        revisionStatus: 'metrics_available',
        includeDisclosure: true,
      })

      const result = writeSubmissionGateReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'gate-report'),
      })

      expect(result.report.overallStatus).toBe('not_ready')
      expect(result.report.immediateBlockers).toContain('Missing experiments/pilot-e4-plain-llm-batch/provenance.json.')
      expect(result.report.immediateBlockers).toContain('Missing experiments/pilot-e5-candidate-constrained-batch/provenance.json.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('passes when required metrics, provenance, drafts, and marker checks are clean', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-submission-gate-pass-'))

    try {
      writeMinimalResearchProject(rootDir, {
        markerText: 'All claims are supported by current artifacts.',
        metricsRows: [
          metricsRow('heuristic-legal-first', 'metrics_available'),
          metricsRow('strategic-heuristic', 'metrics_available'),
          metricsRow('plain-llm', 'metrics_available'),
          metricsRow('candidate-constrained-llm', 'metrics_available'),
          metricsRow('verifier-revision-llm', 'metrics_available'),
        ],
        revisionStatus: 'metrics_available',
        includeProvenance: true,
        includeDisclosure: true,
      })

      const result = writeSubmissionGateReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'gate-report'),
      })

      expect(result.report.overallStatus).toBe('ready')
      expect(result.report.immediateBlockers).toHaveLength(0)
      expect(result.report.gates.every(gate => gate.status === 'pass')).toBe(true)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not count generated readiness artifacts as submission manuscript markers', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-submission-gate-generated-markers-'))

    try {
      writeMinimalResearchProject(rootDir, {
        markerText: 'All submission claims are supported.',
        metricsRows: [
          metricsRow('heuristic-legal-first', 'metrics_available'),
          metricsRow('strategic-heuristic', 'metrics_available'),
          metricsRow('plain-llm', 'metrics_available'),
          metricsRow('candidate-constrained-llm', 'metrics_available'),
          metricsRow('verifier-revision-llm', 'metrics_available'),
        ],
        revisionStatus: 'metrics_available',
        includeProvenance: true,
        includeDisclosure: true,
      })
      mkdirSync(join(rootDir, 'submission', 'gate-report'), { recursive: true })
      mkdirSync(join(rootDir, 'tables'), { recursive: true })
      writeFileSync(join(rootDir, 'submission', 'gate-report', 'submission-gate-report.md'), '[NEED_EXPERIMENT]\n[DO_NOT_SUBMIT]\n', 'utf8')
      writeFileSync(join(rootDir, 'tables', 'table-2.md'), '[NEED_EXPERIMENT]\n', 'utf8')

      const result = writeSubmissionGateReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'gate-report'),
      })

      expect(result.report.overallStatus).toBe('ready')
      expect(result.report.markerCounts.NEED_EXPERIMENT).toBe(0)
      expect(result.report.markerCounts.DO_NOT_SUBMIT).toBe(0)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('uses the assembled manuscript as the blocking marker source when it exists', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-submission-gate-manuscript-scope-'))

    try {
      writeMinimalResearchProject(rootDir, {
        markerText: '[NEED_EXPERIMENT] source workbench marker.',
        metricsRows: [
          metricsRow('heuristic-legal-first', 'metrics_available'),
          metricsRow('strategic-heuristic', 'metrics_available'),
          metricsRow('plain-llm', 'metrics_available'),
          metricsRow('candidate-constrained-llm', 'metrics_available'),
          metricsRow('verifier-revision-llm', 'metrics_available'),
        ],
        revisionStatus: 'metrics_available',
        includeProvenance: true,
        includeDisclosure: true,
      })
      writeFileSync(join(rootDir, 'PROJECT.md'), '# Project\nNo blocking project markers.\n', 'utf8')
      mkdirSync(join(rootDir, 'submission', 'manuscript'), { recursive: true })
      writeFileSync(join(rootDir, 'submission', 'manuscript', 'manuscript-draft.md'), 'Final draft. [NEED_EXPERIMENT]\n', 'utf8')

      const result = writeSubmissionGateReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'gate-report'),
      })

      expect(result.report.markerCounts.NEED_EXPERIMENT).toBe(1)
      expect(result.report.immediateBlockers).toContain('Submission-relevant files still have 1 NEED_EXPERIMENT markers.')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeMinimalResearchProject(rootDir: string, options: {
  markerText: string
  metricsRows: Array<{ agentId: string; status: string }>
  revisionStatus: string
  includeProvenance?: boolean
  includeDisclosure?: boolean
}) {
  mkdirSync(join(rootDir, 'idea'), { recursive: true })
  mkdirSync(join(rootDir, 'notes'), { recursive: true })
  mkdirSync(join(rootDir, 'drafts', 'paper-as-code'), { recursive: true })
  mkdirSync(join(rootDir, 'experiments', 'pilot-metrics-summary'), { recursive: true })
  mkdirSync(join(rootDir, 'experiments', 'pilot-revision-comparison'), { recursive: true })
  mkdirSync(join(rootDir, 'experiments', 'pilot-e4-plain-llm-batch'), { recursive: true })
  mkdirSync(join(rootDir, 'experiments', 'pilot-e5-candidate-constrained-batch'), { recursive: true })
  mkdirSync(join(rootDir, 'reviews'), { recursive: true })
  mkdirSync(join(rootDir, 'submission'), { recursive: true })

  writeFileSync(join(rootDir, 'PROJECT.md'), `# Project\n${options.markerText}\n`, 'utf8')
  writeFileSync(join(rootDir, 'idea', 'research_plan.md'), 'plan', 'utf8')
  writeFileSync(join(rootDir, 'notes', 'literature_matrix.csv'), [
    'bib_key,title,year,venue,source_url,doi,read_status,problem,method,dataset_or_env,metrics,main_result,limitation,relation_to_us,confidence,notes_path',
    'x,Title,2026,Venue,https://example.com,10.0000/example,pdf_read,p,m,d,m,r,l,rel,high,notes.md',
  ].join('\n'), 'utf8')
  writeFileSync(join(rootDir, 'notes', 'gap_map.md'), 'recommended gap', 'utf8')
  writeFileSync(join(rootDir, 'reviews', 'reviewer_report.md'), 'No critical blocker.', 'utf8')

  for (const file of [
    '00_claims.md',
    '01_introduction.md',
    '02_related_work.md',
    '03_method.md',
    '04_experiments.md',
    '05_discussion_limitations.md',
    '06_abstract.md',
  ]) {
    writeFileSync(join(rootDir, 'drafts', 'paper-as-code', file), `# ${file}\n${options.markerText}\n`, 'utf8')
  }

  writeFileSync(join(rootDir, 'experiments', 'pilot-metrics-summary', 'pilot-metrics-summary.json'), JSON.stringify({
    schemaVersion: '0.1.0',
    rows: options.metricsRows,
  }, null, 2), 'utf8')
  writeFileSync(join(rootDir, 'experiments', 'pilot-revision-comparison', 'revision-comparison.json'), JSON.stringify({
    schemaVersion: '0.1.0',
    status: options.revisionStatus,
  }, null, 2), 'utf8')

  if (options.includeProvenance) {
    writeFileSync(join(rootDir, 'experiments', 'pilot-e4-plain-llm-batch', 'provenance.json'), '{}', 'utf8')
    writeFileSync(join(rootDir, 'experiments', 'pilot-e5-candidate-constrained-batch', 'provenance.json'), '{}', 'utf8')
  }
  if (options.includeDisclosure) {
    writeFileSync(join(rootDir, 'submission', 'ai-use-disclosure.md'), 'AI-use disclosure draft.', 'utf8')
  }
}

function metricsRow(agentId: string, status: string) {
  return { agentId, status }
}
