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
})
