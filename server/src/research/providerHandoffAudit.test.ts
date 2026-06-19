import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  auditProviderHandoff,
  writeProviderHandoffAudit,
} from './providerHandoffAudit'

describe('providerHandoffAudit', () => {
  it('passes a locally consistent first-pass handoff while provider results are missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-provider-handoff-ok-'))
    const mapping = join(rootDir, 'batch-input.jsonl')
    const upload = join(rootDir, 'openai-batch-input.jsonl')
    const providerResults = join(rootDir, 'provider-results.jsonl')

    try {
      writeFileSync(mapping, [
        JSON.stringify(mappingLine('d-1')),
        JSON.stringify(mappingLine('d-2')),
      ].join('\n'), 'utf8')
      writeFileSync(upload, [
        JSON.stringify(uploadLine('d-1')),
        JSON.stringify(uploadLine('d-2')),
      ].join('\n'), 'utf8')

      const report = auditProviderHandoff({
        conditions: [{
          conditionId: 'plain-llm',
          title: 'Plain',
          mappingJsonlPath: mapping,
          uploadJsonlPath: upload,
          expectedProviderResultPath: providerResults,
        }],
      })

      expect(report.status).toBe('ready')
      expect(report.conditions[0]).toMatchObject({
        status: 'waiting_for_provider_results',
        mappingRequestCount: 2,
        uploadRequestCount: 2,
        providerSuccessCount: 0,
        providerErrorCount: 0,
        providerPendingCount: 0,
        customIdMismatchCount: 0,
      })
      expect(report.issues).toEqual([{
        severity: 'info',
        conditionId: 'plain-llm',
        message: `Provider result not present yet: ${providerResults}.`,
      }])
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('marks provider result files as partial until every mapping id has a successful row', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-provider-handoff-partial-'))
    const mapping = join(rootDir, 'batch-input.jsonl')
    const upload = join(rootDir, 'openai-batch-input.jsonl')
    const providerResults = join(rootDir, 'provider-results.jsonl')

    try {
      writeFileSync(mapping, [
        JSON.stringify(mappingLine('d-1')),
        JSON.stringify(mappingLine('d-2')),
        JSON.stringify(mappingLine('d-3')),
      ].join('\n'), 'utf8')
      writeFileSync(upload, [
        JSON.stringify(uploadLine('d-1')),
        JSON.stringify(uploadLine('d-2')),
        JSON.stringify(uploadLine('d-3')),
      ].join('\n'), 'utf8')
      writeFileSync(providerResults, [
        JSON.stringify({ custom_id: 'd-1', response: { body: { choices: [{ message: { content: '{}' } }] } } }),
        JSON.stringify({ custom_id: 'd-2', error: { message: 'quota reached' } }),
      ].join('\n'), 'utf8')

      const report = auditProviderHandoff({
        conditions: [{
          conditionId: 'full-tom-prompted-llm',
          title: 'Full ToM',
          mappingJsonlPath: mapping,
          uploadJsonlPath: upload,
          expectedProviderResultPath: providerResults,
        }],
      })

      expect(report.status).toBe('ready')
      expect(report.conditions[0]).toMatchObject({
        status: 'provider_results_partial',
        providerResultLineCount: 2,
        providerSuccessCount: 1,
        providerErrorCount: 1,
        providerPendingCount: 2,
      })
      expect(report.issues).toEqual([{
        severity: 'warning',
        conditionId: 'full-tom-prompted-llm',
        message: 'Provider result is partial: 1/3 successful rows, 1 error rows, 2 rows still pending successful output.',
      }])
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('fails when upload and mapping custom ids diverge', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-provider-handoff-mismatch-'))
    const mapping = join(rootDir, 'batch-input.jsonl')
    const upload = join(rootDir, 'openai-batch-input.jsonl')

    try {
      writeFileSync(mapping, `${JSON.stringify(mappingLine('d-1'))}\n`, 'utf8')
      writeFileSync(upload, `${JSON.stringify(uploadLine('d-2'))}\n`, 'utf8')

      const report = auditProviderHandoff({
        conditions: [{
          conditionId: 'plain-llm',
          title: 'Plain',
          mappingJsonlPath: mapping,
          uploadJsonlPath: upload,
          expectedProviderResultPath: join(rootDir, 'provider-results.jsonl'),
        }],
      })

      expect(report.status).toBe('not_ready')
      expect(report.conditions[0].customIdMismatchCount).toBe(2)
      expect(report.conditions[0].missingFromUpload).toEqual(['d-1'])
      expect(report.conditions[0].missingFromMapping).toEqual(['d-2'])
      expect(report.issues.some(issue => issue.severity === 'error')).toBe(true)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('records real verifier-revision package as blocked until first-pass outputs exist', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-provider-handoff-blocked-'))

    try {
      const result = writeProviderHandoffAudit({
        outputDir: join(rootDir, 'report'),
        conditions: [{
          conditionId: 'verifier-revision-llm',
          title: 'Verifier Revision',
          mappingJsonlPath: join(rootDir, 'missing-batch-input.jsonl'),
          uploadJsonlPath: join(rootDir, 'missing-openai-batch-input.jsonl'),
          expectedProviderResultPath: join(rootDir, 'provider-results.jsonl'),
          requiresFirstPassResults: true,
        }],
      })

      expect(result.report.status).toBe('ready')
      expect(result.report.conditions[0].status).toBe('blocked_by_first_pass_results')
      expect(result.report.issues[0]).toMatchObject({
        severity: 'info',
        conditionId: 'verifier-revision-llm',
      })
      expect(JSON.parse(readFileSync(result.jsonPath, 'utf8')).status).toBe('ready')
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('blocked_by_first_pass_results')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function mappingLine(customId: string) {
  return {
    custom_id: customId,
    expected_raw_output_file: `${customId}.txt`,
  }
}

function uploadLine(customId: string) {
  return {
    custom_id: customId,
    method: 'POST',
    url: '/v1/chat/completions',
    body: { messages: [] },
  }
}
