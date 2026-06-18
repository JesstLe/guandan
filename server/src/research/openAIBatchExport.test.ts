import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeOpenAIChatBatchFile } from './openAIBatchExport'

describe('openAIBatchExport', () => {
  it('converts generic chat batch lines into OpenAI Batch chat-completion requests', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-openai-batch-'))
    const sourcePath = join(rootDir, 'batch-input.jsonl')
    const outputDir = join(rootDir, 'openai')

    writeFileSync(sourcePath, [
      JSON.stringify(genericBatchLine('d-1')),
      JSON.stringify(genericBatchLine('d-2')),
    ].join('\n'), 'utf8')

    try {
      const result = writeOpenAIChatBatchFile({
        sourceBatchJsonlPath: sourcePath,
        outputDir,
        model: 'gpt-test',
        temperature: 0,
        maxCompletionTokens: 1200,
        responseFormat: 'json_object',
      })

      expect(result.requestCount).toBe(2)
      const lines = readFileSync(result.openAIJsonlPath, 'utf8').trim().split('\n').map(line => JSON.parse(line))
      expect(lines[0]).toMatchObject({
        custom_id: 'd-1',
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-test',
          temperature: 0,
          max_completion_tokens: 1200,
          response_format: { type: 'json_object' },
        },
      })
      expect(lines[0].body.messages).toEqual(genericBatchLine('d-1').messages)

      const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf8'))
      expect(manifest.providerFormat).toBe('openai-batch-chat-completions-jsonl')
      expect(manifest.endpoint).toBe('/v1/chat/completions')
      expect(manifest.sourceBatchJsonl).toBe(sourcePath)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('can omit optional sampling parameters for models that do not accept them', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-openai-batch-minimal-'))
    const sourcePath = join(rootDir, 'batch-input.jsonl')
    const outputDir = join(rootDir, 'openai')

    writeFileSync(sourcePath, `${JSON.stringify(genericBatchLine('d-1'))}\n`, 'utf8')

    try {
      const result = writeOpenAIChatBatchFile({
        sourceBatchJsonlPath: sourcePath,
        outputDir,
        model: 'gpt-test',
        responseFormat: 'none',
      })
      const line = JSON.parse(readFileSync(result.openAIJsonlPath, 'utf8').trim())

      expect(line.body.temperature).toBeUndefined()
      expect(line.body.max_completion_tokens).toBeUndefined()
      expect(line.body.response_format).toBeUndefined()
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function genericBatchLine(customId: string) {
  return {
    custom_id: customId,
    condition_id: 'plain-llm',
    messages: [
      { role: 'system', content: 'Return JSON only.' },
      { role: 'user', content: `Decision ${customId}` },
    ],
    response_schema_path: 'docs/research/schemas/reasoning-trace.schema.json',
    expected_raw_output_file: `${customId}.txt`,
  }
}
