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
import { writeResearchPreflightReport } from './researchPreflightReport'

describe('researchPreflightReport', () => {
  it('summarizes local readiness separately from provider-result blockers', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-preflight-'))
    const outputDir = join(rootDir, 'submission', 'preflight')

    mkdirSync(join(rootDir, 'submission', 'gate-report'), { recursive: true })
    mkdirSync(join(rootDir, 'submission', 'manuscript'), { recursive: true })
    mkdirSync(join(rootDir, 'experiments', 'pilot-e4-plain-llm-batch'), { recursive: true })

    writeFileSync(join(rootDir, 'submission', 'gate-report', 'submission-gate-report.json'), JSON.stringify({
      schemaVersion: '0.1.0',
      overallStatus: 'not_ready',
      markerCounts: {
        NEED_SOURCE: 0,
        UNCERTAIN: 0,
        NEED_EXPERIMENT: 3,
        DO_NOT_SUBMIT: 1,
        AUTHOR_DECISION: 0,
      },
      immediateBlockers: [
        'LLM condition plain-llm has status missing_raw_outputs.',
        'Missing experiments/pilot-e4-plain-llm-batch/provenance.json.',
        'Draft/research tree still has 3 NEED_EXPERIMENT markers.',
      ],
    }), 'utf8')
    writeFileSync(join(rootDir, 'submission', 'manuscript', 'manuscript-status.json'), JSON.stringify({
      schemaVersion: '0.1.0',
      wordCount: 1800,
      readyForSubmission: false,
      markerCounts: {
        NEED_SOURCE: 0,
        UNCERTAIN: 0,
        NEED_EXPERIMENT: 2,
        DO_NOT_SUBMIT: 1,
        AUTHOR_DECISION: 0,
      },
    }), 'utf8')
    writeFileSync(join(rootDir, 'experiments', 'pilot-e4-plain-llm-batch', 'raw-output-audit.json'), JSON.stringify({
      expectedCount: 50,
      presentCount: 0,
      missingCount: 50,
      readyForIngest: false,
    }), 'utf8')

    try {
      const result = writeResearchPreflightReport({
        researchRoot: rootDir,
        outputDir,
        rawAudits: [
          {
            id: 'plain-llm',
            title: 'Plain LLM',
            path: 'experiments/pilot-e4-plain-llm-batch/raw-output-audit.json',
          },
        ],
      })

      expect(result.jsonPath).toBe(join(outputDir, 'research-preflight-report.json'))
      expect(result.markdownPath).toBe(join(outputDir, 'research-preflight-report.md'))
      expect(result.report.status).toBe('waiting_for_provider_results')
      expect(result.report.localReady).toBe(false)
      expect(result.report.externalBlockers).toEqual([
        'LLM condition plain-llm has status missing_raw_outputs.',
      ])
      expect(result.report.localBlockers).toContain('Missing experiments/pilot-e4-plain-llm-batch/provenance.json.')
      expect(result.report.localBlockers).toContain('Draft/research tree still has 3 NEED_EXPERIMENT markers.')
      expect(result.report.rawOutputAudits[0]).toMatchObject({
        id: 'plain-llm',
        presentCount: 0,
        missingCount: 50,
        readyForIngest: false,
      })

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Status: `waiting_for_provider_results`')
      expect(markdown).toContain('| Plain LLM | 0 | 50 | false |')
      expect(markdown).toContain('## External Blockers')
      expect(markdown).toContain('## Local Blockers')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('blocks preflight when local hygiene is ready but AAMAS full-paper evidence is not ready', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-preflight-aamas-blocked-'))
    const outputDir = join(rootDir, 'submission', 'preflight')

    mkdirSync(join(rootDir, 'submission', 'gate-report'), { recursive: true })
    mkdirSync(join(rootDir, 'submission', 'manuscript'), { recursive: true })
    mkdirSync(join(rootDir, 'submission', 'aamas-readiness'), { recursive: true })

    writeFileSync(join(rootDir, 'submission', 'gate-report', 'submission-gate-report.json'), JSON.stringify({
      schemaVersion: '0.1.0',
      overallStatus: 'ready',
      markerCounts: {
        NEED_SOURCE: 0,
        UNCERTAIN: 0,
        NEED_EXPERIMENT: 0,
        DO_NOT_SUBMIT: 0,
        AUTHOR_DECISION: 0,
      },
      immediateBlockers: [],
    }), 'utf8')
    writeFileSync(join(rootDir, 'submission', 'manuscript', 'manuscript-status.json'), JSON.stringify({
      schemaVersion: '0.1.0',
      wordCount: 3176,
      readyForSubmission: true,
    }), 'utf8')
    writeFileSync(join(rootDir, 'submission', 'aamas-readiness', 'aamas-readiness-report.json'), JSON.stringify({
      schemaVersion: '0.1.0',
      aamasFullPaperReadiness: 'not_ready',
      gates: [
        {
          id: 'full-split-llm-evidence',
          title: '500-Decision LLM Evidence',
          status: 'needs_experiment',
          finding: 'ToM full-split metrics are missing.',
          requiredAction: 'Complete the 500-decision ToM provider metrics.',
        },
        {
          id: 'page-budget',
          title: 'AAMAS Page Budget',
          status: 'pass',
          finding: 'Body is within 8 pages.',
          requiredAction: 'Keep it within budget.',
        },
      ],
      nextActions: [
        'Complete the 500-decision ToM full-split provider batch.',
      ],
    }), 'utf8')

    try {
      const result = writeResearchPreflightReport({
        researchRoot: rootDir,
        outputDir,
        rawAudits: [],
      })

      expect(result.report.status).toBe('research_not_ready')
      expect(result.report.localReady).toBe(true)
      expect(result.report.aamasFullPaperReadiness).toBe('not_ready')
      expect(result.report.readinessBlockers).toEqual([
        {
          id: 'full-split-llm-evidence',
          title: '500-Decision LLM Evidence',
          status: 'needs_experiment',
          finding: 'ToM full-split metrics are missing.',
          requiredAction: 'Complete the 500-decision ToM provider metrics.',
        },
      ])
      expect(result.report.nextActions[0]).toBe('Complete the 500-decision ToM full-split provider batch.')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Status: `research_not_ready`')
      expect(markdown).toContain('AAMAS full-paper readiness: `not_ready`')
      expect(markdown).toContain('## AAMAS Readiness Blockers')
      expect(markdown).toContain('| 500-Decision LLM Evidence | `needs_experiment` |')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('reports ready only when both local hygiene and AAMAS readiness are ready', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-preflight-aamas-ready-'))
    const outputDir = join(rootDir, 'submission', 'preflight')

    mkdirSync(join(rootDir, 'submission', 'gate-report'), { recursive: true })
    mkdirSync(join(rootDir, 'submission', 'aamas-readiness'), { recursive: true })

    writeFileSync(join(rootDir, 'submission', 'gate-report', 'submission-gate-report.json'), JSON.stringify({
      schemaVersion: '0.1.0',
      overallStatus: 'ready',
      markerCounts: {},
      immediateBlockers: [],
    }), 'utf8')
    writeFileSync(join(rootDir, 'submission', 'aamas-readiness', 'aamas-readiness-report.json'), JSON.stringify({
      schemaVersion: '0.1.0',
      aamasFullPaperReadiness: 'ready',
      gates: [
        {
          id: 'local-artifact-hygiene',
          title: 'Local Artifact Hygiene',
          status: 'pass',
        },
      ],
      nextActions: [],
    }), 'utf8')

    try {
      const result = writeResearchPreflightReport({
        researchRoot: rootDir,
        outputDir,
        rawAudits: [],
      })

      expect(result.report.status).toBe('ready_for_submission')
      expect(result.report.aamasFullPaperReadiness).toBe('ready')
      expect(result.report.readinessBlockers).toEqual([])
      expect(result.report.nextActions).toEqual(['Run final submission formatting and venue-specific policy checks.'])
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})
