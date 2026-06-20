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
        requestPath: '/v1/chat/completions',
        runner: 'openai-compatible',
        model: 'gpt-test',
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

  it('can rewrite request path, model, and completion token field for OpenAI-compatible providers', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-openai-runner-rewrite-'))
    const inputJsonlPath = join(rootDir, 'openai-batch-input.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')

    writeFileSync(inputJsonlPath, `${JSON.stringify(openAiLine('d-1'))}\n`, 'utf8')

    try {
      const seen: Array<any> = []
      const result = await runOpenAIChatCompletionJsonl({
        inputJsonlPath,
        outputJsonlPath,
        apiKey: 'test-key',
        baseUrl: 'https://openai-compatible.test/',
        requestPath: '/chat/completions',
        model: 'glm-5.1',
        runner: 'zhipu-openai-compatible',
        completionTokensField: 'max_tokens',
        request: async line => {
          seen.push(line)
          return {
            id: `chatcmpl-${line.custom_id}`,
            choices: [
              {
                message: {
                  content: JSON.stringify({ decisionId: line.custom_id }),
                },
              },
            ],
          }
        },
      })

      expect(result).toMatchObject({
        baseUrl: 'https://openai-compatible.test',
        requestPath: '/chat/completions',
        runner: 'zhipu-openai-compatible',
        model: 'glm-5.1',
        completionTokensField: 'max_tokens',
      })
      expect(seen[0].url).toBe('/chat/completions')
      expect(seen[0].body.model).toBe('glm-5.1')
      expect(seen[0].body.max_tokens).toBe(1200)
      expect(seen[0].body.max_completion_tokens).toBeUndefined()
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('resumes from existing successful rows and limits retry attempts', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-openai-runner-resume-'))
    const inputJsonlPath = join(rootDir, 'openai-batch-input.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')

    writeFileSync(inputJsonlPath, [
      JSON.stringify(openAiLine('d-1')),
      JSON.stringify(openAiLine('d-2')),
      JSON.stringify(openAiLine('d-3')),
    ].join('\n'), 'utf8')
    writeFileSync(outputJsonlPath, [
      JSON.stringify({
        custom_id: 'd-1',
        response: {
          status_code: 200,
          body: { choices: [{ message: { content: '{"decisionId":"d-1"}' } }] },
        },
      }),
      JSON.stringify({
        custom_id: 'd-2',
        error: { message: 'rate_limit' },
      }),
    ].join('\n'), 'utf8')

    try {
      const attempted: string[] = []
      const result = await runOpenAIChatCompletionJsonl({
        inputJsonlPath,
        outputJsonlPath,
        apiKey: 'test-key',
        resume: true,
        attemptLimit: 1,
        request: async line => {
          attempted.push(line.custom_id)
          return {
            id: `chatcmpl-${line.custom_id}`,
            choices: [
              {
                message: {
                  content: JSON.stringify({ decisionId: line.custom_id }),
                },
              },
            ],
          }
        },
      })

      expect(attempted).toEqual(['d-2'])
      expect(result).toMatchObject({
        expectedCount: 3,
        attemptedCount: 1,
        skippedCount: 1,
        writtenCount: 2,
        successCount: 2,
        errorCount: 0,
        pendingSuccessCount: 1,
      })
      const rows = readJsonl(outputJsonlPath)
      expect(rows.map(row => row.custom_id)).toEqual(['d-1', 'd-2'])
      expect(rows[1].response.body.choices[0].message.content).toBe('{"decisionId":"d-2"}')
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
      max_completion_tokens: 1200,
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
