import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { materializeProviderResults } from './llmProviderResults'

describe('llmProviderResults', () => {
  it('materializes provider JSONL results into raw output files with provenance', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-provider-results-'))
    const batchJsonlPath = join(rootDir, 'batch-input.jsonl')
    const providerJsonlPath = join(rootDir, 'provider-results.jsonl')
    const rawDir = join(rootDir, 'raw')
    const reportPath = join(rootDir, 'reports', 'provider-materialization-report.json')
    const provenancePath = join(rootDir, 'reports', 'provenance.json')

    writeFileSync(batchJsonlPath, [
      JSON.stringify(batchLine('d-1', 'd-1.txt')),
      JSON.stringify(batchLine('d-2', 'd-2.txt')),
      JSON.stringify(batchLine('d-3', 'd-3.txt')),
    ].join('\n'), 'utf8')
    writeFileSync(providerJsonlPath, [
      JSON.stringify(openAiBatchResult('d-1', '{"decisionId":"d-1"}')),
      JSON.stringify({ custom_id: 'd-2', content: '{"decisionId":"d-2"}' }),
      JSON.stringify(openAiBatchError('d-extra', 'rate_limit')),
    ].join('\n'), 'utf8')

    try {
      const result = materializeProviderResults({
        batchJsonlPath,
        providerResultJsonlPath: providerJsonlPath,
        rawOutputDir: rawDir,
        reportPath,
        provenancePath,
        provenance: {
          modelProvider: 'openai',
          modelName: 'gpt-test',
          runId: 'pilot-run-001',
          temperature: 0,
          samplingParameters: { top_p: 1 },
          notes: 'unit test',
        },
      })

      expect(result.expectedCount).toBe(3)
      expect(result.writtenCount).toBe(2)
      expect(result.missingResultCount).toBe(1)
      expect(result.failedResultCount).toBe(0)
      expect(result.unexpectedResultCount).toBe(1)
      expect(readFileSync(join(rawDir, 'd-1.txt'), 'utf8')).toBe('{"decisionId":"d-1"}')
      expect(readFileSync(join(rawDir, 'd-2.txt'), 'utf8')).toBe('{"decisionId":"d-2"}')

      const report = JSON.parse(readFileSync(reportPath, 'utf8'))
      expect(report.readyForAudit).toBe(false)
      expect(report.missingCustomIds).toEqual(['d-3'])
      expect(report.unexpectedCustomIds).toEqual(['d-extra'])

      const provenance = JSON.parse(readFileSync(provenancePath, 'utf8'))
      expect(provenance.modelProvider).toBe('openai')
      expect(provenance.sourceBatchJsonl).toBe(batchJsonlPath)
      expect(provenance.providerResultJsonl).toBe(providerJsonlPath)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('records failed expected results instead of writing empty raw outputs', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-provider-results-failure-'))
    const batchJsonlPath = join(rootDir, 'batch-input.jsonl')
    const providerJsonlPath = join(rootDir, 'provider-results.jsonl')
    const rawDir = join(rootDir, 'raw')
    const reportPath = join(rootDir, 'report.json')

    writeFileSync(batchJsonlPath, `${JSON.stringify(batchLine('d-1', 'd-1.txt'))}\n`, 'utf8')
    writeFileSync(providerJsonlPath, `${JSON.stringify(openAiBatchError('d-1', 'content_filter'))}\n`, 'utf8')

    try {
      const result = materializeProviderResults({
        batchJsonlPath,
        providerResultJsonlPath: providerJsonlPath,
        rawOutputDir: rawDir,
        reportPath,
        provenance: {
          modelProvider: 'openai',
          modelName: 'gpt-test',
        },
      })

      expect(result.writtenCount).toBe(0)
      expect(result.failedResultCount).toBe(1)
      expect(result.readyForAudit).toBe(false)
      expect(result.failures[0]).toMatchObject({
        customId: 'd-1',
        message: 'content_filter',
      })
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('rejects OpenAI upload JSONL because it lacks raw-output file mapping', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-provider-results-openai-input-'))
    const batchJsonlPath = join(rootDir, 'openai-batch-input.jsonl')
    const providerJsonlPath = join(rootDir, 'provider-results.jsonl')
    const rawDir = join(rootDir, 'raw')
    const reportPath = join(rootDir, 'report.json')

    writeFileSync(batchJsonlPath, `${JSON.stringify({
      custom_id: 'd-1',
      method: 'POST',
      url: '/v1/chat/completions',
      body: { messages: [] },
    })}\n`, 'utf8')
    writeFileSync(providerJsonlPath, `${JSON.stringify(openAiBatchResult('d-1', '{"decisionId":"d-1"}'))}\n`, 'utf8')

    try {
      expect(() => materializeProviderResults({
        batchJsonlPath,
        providerResultJsonlPath: providerJsonlPath,
        rawOutputDir: rawDir,
        reportPath,
        provenance: {
          modelProvider: 'openai',
          modelName: 'gpt-test',
        },
      })).toThrow(/provider-neutral batch-input\.jsonl/)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function batchLine(customId: string, expectedRawOutputFile: string) {
  return {
    custom_id: customId,
    condition_id: 'plain-llm',
    messages: [],
    response_schema_path: 'schema.json',
    expected_raw_output_file: expectedRawOutputFile,
  }
}

function openAiBatchResult(customId: string, content: string) {
  return {
    custom_id: customId,
    response: {
      body: {
        choices: [
          {
            message: { content },
          },
        ],
      },
    },
  }
}

function openAiBatchError(customId: string, message: string) {
  return {
    custom_id: customId,
    error: {
      message,
    },
  }
}
