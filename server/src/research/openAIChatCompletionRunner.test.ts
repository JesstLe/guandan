import { describe, expect, it } from 'vitest'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOpenAIChatCompletionJsonl } from './openAIChatCompletionRunner'

describe('openAIChatCompletionRunner', () => {
  it('runs OpenAI chat-completion JSONL rows and writes provider-result JSONL in input order', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-openai-runner-'))
    const inputJsonlPath = join(rootDir, 'openai-batch-input.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')

    writeFileSync(inputJsonlPath, [
      JSON.stringify(openAiLine('d-1')),
      JSON.stringify(openAiLine('d-2')),
    ].join('\n'), 'utf8')

    try {
      const result = await runOpenAIChatCompletionJsonl({
        inputJsonlPath,
        outputJsonlPath,
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.test/',
        concurrency: 2,
        request: async line => ({
          id: `chatcmpl-${line.custom_id}`,
          choices: [
            {
              message: {
                content: JSON.stringify({ decisionId: line.custom_id }),
              },
            },
          ],
        }),
      })

      expect(result).toMatchObject({
        expectedCount: 2,
        writtenCount: 2,
        successCount: 2,
        errorCount: 0,
        baseUrl: 'https://api.openai.test',
      })

      const rows = readJsonl(outputJsonlPath)
      expect(rows.map(row => row.custom_id)).toEqual(['d-1', 'd-2'])
      expect(rows[0].response.body.choices[0].message.content).toBe('{"decisionId":"d-1"}')
      expect(rows[1].response.body.choices[0].message.content).toBe('{"decisionId":"d-2"}')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('records request errors as provider-result failures', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-openai-runner-error-'))
    const inputJsonlPath = join(rootDir, 'openai-batch-input.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')

    writeFileSync(inputJsonlPath, `${JSON.stringify(openAiLine('d-1'))}\n`, 'utf8')

    try {
      const result = await runOpenAIChatCompletionJsonl({
        inputJsonlPath,
        outputJsonlPath,
        apiKey: 'test-key',
        request: async () => {
          throw new Error('rate_limit')
        },
      })

      expect(result).toMatchObject({
        expectedCount: 1,
        writtenCount: 1,
        successCount: 0,
        errorCount: 1,
      })

      const rows = readJsonl(outputJsonlPath)
      expect(rows[0]).toMatchObject({
        custom_id: 'd-1',
        error: {
          message: 'rate_limit',
        },
      })
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function openAiLine(customId: string) {
  return {
    custom_id: customId,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model: 'gpt-test',
      messages: [
        { role: 'user', content: `Decision ${customId}` },
      ],
    },
  }
}

function readJsonl(path: string): Array<any> {
  return readFileSync(path, 'utf8')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => JSON.parse(line))
}
