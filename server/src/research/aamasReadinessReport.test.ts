import { describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeAAMASReadinessReport } from './aamasReadinessReport'

describe('aamasReadinessReport', () => {
  it('treats references-only pages as allowed beyond the 8-page AAMAS body budget', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-readiness-'))

    try {
      mkdirSync(join(rootDir, 'submission', 'aamas-latex'), { recursive: true })
      writeFileSync(join(rootDir, 'submission', 'aamas-latex', 'build-status.md'), [
        '# AAMAS LaTeX Build Status',
        '',
        '- Page count: 9 pages total in `sigconf,anonymous,review` ACM/AAMAS-style layout',
        '- Body/reference boundary: the main body and conclusion end on page 8; references begin on page 9.',
        '',
      ].join('\n'), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const pageGate = result.report.gates.find(gate => gate.id === 'page-budget')

      expect(result.report.facts.aamasPageCount).toBe(9)
      expect(result.report.facts.aamasBodyPages).toBe(8)
      expect(pageGate?.status).toBe('pass')
      expect(pageGate?.finding).toContain('references allowed on additional pages')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('requires completed agreement, not just a completed CSV filename, for the human-audit gate', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-human-audit-pending-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'human-soft-label-audit'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-completed-annotations.csv'), 'sampleId,humanPartnerConsistent\ns1,pass\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-agreement-report.json'), JSON.stringify({
        status: 'partial',
        sampleCount: 1,
        completedLabels: 1,
        totalLabels: 5,
      }), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const auditGate = result.report.gates.find(gate => gate.id === 'replication-and-human-audit')

      expect(auditGate?.status).toBe('needs_experiment')
      expect(auditGate?.finding).toContain('partial')
      expect(auditGate?.finding).toContain('1/5')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not count adjudicated build reports as completed human annotation files', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-human-audit-report-only-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'human-soft-label-audit'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-manifest.json'), JSON.stringify({
        status: 'annotation_packet_prepared_not_human_completed',
        sampleCount: 40,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-adjudicated-annotations-report.json'), JSON.stringify({
        status: 'ready',
        sampleCount: 40,
        outputRows: 40,
        completedLabels: 200,
        totalLabels: 200,
        unresolvedDisagreements: 0,
        adjudicatedCsvWritten: false,
        readyForAgreement: false,
        checks: [
          { id: 'all-labels-resolved', status: 'pass' },
        ],
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-agreement-report.json'), JSON.stringify({
        status: 'completed',
        sampleCount: 40,
        completedLabels: 200,
        totalLabels: 200,
      }), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const auditGate = result.report.gates.find(gate => gate.id === 'replication-and-human-audit')

      expect(auditGate?.status).toBe('needs_experiment')
      expect(auditGate?.finding).toContain('adjudicated-annotation builder is ready')
      expect(auditGate?.finding).toContain('adjudicated CSV is not written')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('surfaces packet-quality readiness without passing the human-audit gate', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-human-audit-quality-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'human-soft-label-audit'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-manifest.json'), JSON.stringify({
        status: 'annotation_packet_prepared_not_human_completed',
        sampleCount: 40,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-annotator.html'), '<html></html>', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-packet-quality-report.json'), JSON.stringify({
        status: 'packet_ready',
        sampleCount: 40,
        readyForAnnotation: true,
        readyForPaperEvidence: false,
        checks: [
          { id: 'blind-hides-verifier-labels', status: 'pass' },
          { id: 'answer-key-id-match', status: 'pass' },
        ],
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-annotator-package-archive-report.json'), JSON.stringify({
        status: 'archive_ready',
        bytes: 4096,
        sha256: 'a'.repeat(64),
        sampleCount: 40,
        checks: [
          { id: 'archive-present', status: 'pass' },
        ],
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-agreement-report.json'), JSON.stringify({
        status: 'pending',
        sampleCount: 40,
        completedLabels: 0,
        totalLabels: 200,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-intake-report.json'), JSON.stringify({
        status: 'awaiting_return',
        returnedCsvPresent: false,
        completedLabels: 0,
        totalLabels: 200,
        readyForAgreement: false,
        checks: [
          { id: 'returned-file-present', status: 'fail' },
        ],
      }), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const auditGate = result.report.gates.find(gate => gate.id === 'replication-and-human-audit')

      expect(auditGate?.status).toBe('needs_experiment')
      expect(auditGate?.finding).toContain('packet-quality report is packet_ready')
      expect(auditGate?.finding).toContain('0 failed checks')
      expect(auditGate?.finding).toContain('not paper evidence until human labels are completed')
      expect(auditGate?.finding).toContain('blind annotator archive is archive_ready')
      expect(auditGate?.finding).toContain('with SHA-256 recorded')
      expect(auditGate?.finding).toContain('returned-annotation intake is awaiting_return')
      expect(auditGate?.finding).toContain('no returned CSV is present yet')
      expect(auditGate?.finding).toContain('0/200')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not pass full-split LLM evidence when raw outputs are ready but metrics are missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-full-raw-only-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch', 'raw-output-audit.json'), JSON.stringify({
        expectedCount: 500,
        presentCount: 500,
        missingCount: 0,
        readyForIngest: true,
      }), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const fullGate = result.report.gates.find(gate => gate.id === 'full-split-llm-evidence')

      expect(fullGate?.status).toBe('needs_experiment')
      expect(fullGate?.finding).toContain('ToM 500/500 present')
      expect(fullGate?.finding).toContain('ToM metrics are missing')
      expect(fullGate?.requiredAction).toContain('provider metrics')
      expect(result.report.aamasFullPaperReadiness).toBe('not_ready')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not pass full-split LLM evidence when full metrics exist only for partial raw outputs', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-full-partial-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'full-e5-tom-schema-repair-results'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch', 'raw-output-audit.json'), JSON.stringify({
        expectedCount: 500,
        presentCount: 268,
        missingCount: 232,
        readyForIngest: false,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 500,
        totalParsedTraces: 268,
        hardFailureCount: 1,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'full-e5-tom-schema-repair-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 500,
        totalParsedTraces: 268,
        hardFailureCount: 1,
      }), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const fullGate = result.report.gates.find(gate => gate.id === 'full-split-llm-evidence')

      expect(fullGate?.status).toBe('needs_experiment')
      expect(fullGate?.finding).toContain('ToM 268/500 present')
      expect(fullGate?.finding).toContain('ToM metrics are 268/500')
      expect(fullGate?.finding).toContain('schema repair currently yields 268/500')
      expect(result.report.nextActions[0]).toContain('Complete the 500-decision ToM full-split provider batch')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('updates next actions after full-split LLM metrics and schema repair are complete', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-full-complete-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'full-e5-tom-schema-repair-results'), { recursive: true })
      mkdirSync(join(rootDir, 'submission', 'aamas-latex'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch', 'raw-output-audit.json'), JSON.stringify({
        expectedCount: 500,
        presentCount: 500,
        missingCount: 0,
        readyForIngest: true,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 500,
        totalParsedTraces: 404,
        parseFailureCount: 96,
        hardFailureCount: 48,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'full-e5-tom-schema-repair-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 500,
        totalParsedTraces: 500,
        parseFailureCount: 0,
        hardFailureCount: 52,
      }), 'utf8')
      writeFileSync(join(rootDir, 'submission', 'aamas-latex', 'build-status.md'), [
        '# AAMAS LaTeX Build Status',
        '',
        '- Page count: 9 pages total in `sigconf,anonymous,review` ACM/AAMAS-style layout',
        '- Body/reference boundary: the main body and conclusion end on page 8; references begin on page 9.',
        '',
      ].join('\n'), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const fullGate = result.report.gates.find(gate => gate.id === 'full-split-llm-evidence')

      expect(fullGate?.status).toBe('pass')
      expect(result.report.nextActions[0]).toContain('Integrate the completed 500-decision ToM full-split metrics')
      expect(result.report.nextActions.join('\n')).not.toContain('Run schema repair and verifier analysis')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('does not ask to integrate full-split ToM metrics after the paper already contains them', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-full-integrated-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-results'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'full-e5-tom-schema-repair-results'), { recursive: true })
      mkdirSync(join(rootDir, 'submission', 'aamas-latex'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch', 'raw-output-audit.json'), JSON.stringify({
        expectedCount: 500,
        presentCount: 500,
        missingCount: 0,
        readyForIngest: true,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 500,
        totalParsedTraces: 404,
        parseFailureCount: 96,
        hardFailureCount: 48,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'full-e5-tom-schema-repair-results', 'metrics.json'), JSON.stringify({
        totalDecisionPoints: 500,
        totalParsedTraces: 500,
        parseFailureCount: 0,
        hardFailureCount: 52,
      }), 'utf8')
      writeFileSync(join(rootDir, 'submission', 'aamas-latex', 'main.tex'), [
        'ToM LLM raw & 404/500 & 48 & 357/47/0 \\\\',
        'ToM schema repair & 500/500 & 52 & 449/51/0 \\\\',
        'This upgrades the draft from pilot-only evidence to pilot-plus-full-ToM evidence.',
      ].join('\n'), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })

      expect(result.report.facts.fullSplit.tomIntegratedInPaper).toBe(true)
      expect(result.report.nextActions[0]).toContain('Complete the prepared human soft-label audit')
      expect(result.report.nextActions.join('\n')).not.toContain('Integrate the completed 500-decision ToM full-split metrics')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('surfaces provider quota or rate-limit stop state in the full-split LLM gate', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-full-provider-stop-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch'), { recursive: true })
      mkdirSync(join(rootDir, 'experiments', 'provider-results'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'full-e4-tom-prompted-batch', 'raw-output-audit.json'), JSON.stringify({
        expectedCount: 500,
        presentCount: 268,
        missingCount: 232,
        readyForIngest: false,
      }), 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'provider-results', 'full-tom-prompted-llm-kimi-cli-run-report.json'), JSON.stringify({
        expectedCount: 500,
        attemptedCount: 1,
        skippedCount: 268,
        writtenCount: 269,
        successCount: 268,
        errorCount: 1,
        pendingSuccessCount: 232,
        stoppedAfterError: true,
        runner: 'kimi-cli',
        model: 'kimi-code/kimi-for-coding',
      }), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const fullGate = result.report.gates.find(gate => gate.id === 'full-split-llm-evidence')

      expect(result.report.facts.fullSplit.tomProviderRun).toBe('268/500 successful, 1 errors, 232 pending, stopped after provider error')
      expect(fullGate?.finding).toContain('latest kimi-cli using kimi-code/kimi-for-coding run reports 268/500 successful')
      expect(fullGate?.finding).toContain('232 pending')
      expect(fullGate?.requiredAction).toContain('quota or rate-limit window refreshes')
      expect(result.report.nextActions[0]).toContain('Kimi quota or rate-limit window refreshes')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('passes the human-audit gate only when a completed annotation file has a completed agreement report', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-human-audit-completed-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'human-soft-label-audit'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-completed-annotations.csv'), 'sampleId,humanPartnerConsistent\ns1,pass\n', 'utf8')
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-agreement-report.json'), JSON.stringify({
        status: 'completed',
        sampleCount: 1,
        completedLabels: 5,
        totalLabels: 5,
      }), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const auditGate = result.report.gates.find(gate => gate.id === 'replication-and-human-audit')

      expect(auditGate?.status).toBe('pass')
      expect(auditGate?.finding).toContain('agreement evaluator is completed')
      expect(auditGate?.finding).toContain('5/5')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('passes the replication-and-human-audit gate when a second-provider pilot replication is complete', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-aamas-replication-completed-'))

    try {
      mkdirSync(join(rootDir, 'experiments', 'pilot-replication'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'pilot-replication', 'pilot-replication-report.json'), JSON.stringify({
        status: 'completed',
        completedReplicationCount: 1,
        replications: [
          {
            id: 'second-provider-tom-pilot',
            status: 'completed',
            provider: 'openai-compatible',
            model: 'replication-model',
            expectedCount: 50,
            successCount: 50,
            parsedCount: 37,
            hardFailureCount: 4,
          },
        ],
      }), 'utf8')
      mkdirSync(join(rootDir, 'experiments', 'human-soft-label-audit'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-agreement-report.json'), JSON.stringify({
        status: 'pending',
        sampleCount: 40,
        completedLabels: 0,
        totalLabels: 200,
      }), 'utf8')

      const result = writeAAMASReadinessReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'aamas-readiness'),
      })
      const auditGate = result.report.gates.find(gate => gate.id === 'replication-and-human-audit')

      expect(auditGate?.status).toBe('pass')
      expect(auditGate?.finding).toContain('Second-provider/model pilot replication is completed')
      expect(auditGate?.finding).toContain('37/50 parsed traces')
      expect(auditGate?.requiredAction).toContain('second-provider/model pilot replication')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
