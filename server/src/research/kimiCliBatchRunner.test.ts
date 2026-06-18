import { describe, expect, it } from 'vitest'
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runKimiCliBatchJsonl } from './kimiCliBatchRunner'

describe('kimiCliBatchRunner', () => {
  it('runs Kimi CLI quiet output and writes OpenAI-compatible provider results', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-kimi-cli-runner-'))
    const inputJsonlPath = join(rootDir, 'batch.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')
    const kimiBin = join(rootDir, 'fake-kimi')

    writeFileSync(inputJsonlPath, [
      JSON.stringify(batchLine('d-1')),
      JSON.stringify(batchLine('d-2')),
    ].join('\n'), 'utf8')
    writeFileSync(kimiBin, [
      '#!/usr/bin/env node',
      'const prompt = process.argv[process.argv.indexOf("--prompt") + 1]',
      'const id = prompt.includes("d-2") ? "d-2" : "d-1"',
      'if (!process.argv.includes("--quiet")) process.exit(2)',
      'console.log(`Here is JSON: {\\"decisionId\\":\\"${id}\\"}`)',
      'console.log("To resume this session: kimi -r fake")',
    ].join('\n'), 'utf8')
    chmodSync(kimiBin, 0o755)

    try {
      const result = await runKimiCliBatchJsonl({
        inputJsonlPath,
        outputJsonlPath,
        kimiBin,
        model: 'kimi-code/kimi-for-coding',
      })

      expect(result).toMatchObject({
        expectedCount: 2,
        writtenCount: 2,
        successCount: 2,
        errorCount: 0,
      })

      const rows = readJsonl(outputJsonlPath)
      expect(rows.map(row => row.custom_id)).toEqual(['d-1', 'd-2'])
      expect(rows[0].response.body.choices[0].message.content).toBe('{"decisionId":"d-1"}')
      expect(rows[1].response.body.choices[0].message.content).toBe('{"decisionId":"d-2"}')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('resumes from existing successful rows and retries prior errors', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-kimi-cli-runner-resume-'))
    const inputJsonlPath = join(rootDir, 'batch.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')
    const kimiBin = join(rootDir, 'fake-kimi')
    const callsPath = join(rootDir, 'calls.txt')

    writeFileSync(inputJsonlPath, [
      JSON.stringify(batchLine('d-1')),
      JSON.stringify(batchLine('d-2')),
      JSON.stringify(batchLine('d-3')),
    ].join('\n'), 'utf8')
    writeFileSync(outputJsonlPath, [
      JSON.stringify({
        custom_id: 'd-1',
        response: { body: { choices: [{ message: { content: '{"decisionId":"d-1"}' } }] } },
      }),
      JSON.stringify({
        custom_id: 'd-2',
        error: { message: 'previous timeout' },
      }),
    ].join('\n'), 'utf8')
    writeFileSync(kimiBin, [
      '#!/usr/bin/env node',
      'const fs = require("fs")',
      'const prompt = process.argv[process.argv.indexOf("--prompt") + 1]',
      'const id = prompt.includes("d-3") ? "d-3" : "d-2"',
      `fs.appendFileSync(${JSON.stringify(callsPath)}, id + "\\n")`,
      'console.log(`{\\"decisionId\\":\\"${id}\\"}`)',
    ].join('\n'), 'utf8')
    chmodSync(kimiBin, 0o755)

    try {
      const result = await runKimiCliBatchJsonl({
        inputJsonlPath,
        outputJsonlPath,
        kimiBin,
        resume: true,
      })

      expect(result).toMatchObject({
        expectedCount: 3,
        attemptedCount: 2,
        skippedCount: 1,
        writtenCount: 3,
        successCount: 3,
        errorCount: 0,
      })
      expect(readFileSync(callsPath, 'utf8').trim().split(/\r?\n/)).toEqual(['d-2', 'd-3'])

      const rows = readJsonl(outputJsonlPath)
      expect(rows.map(row => row.custom_id)).toEqual(['d-1', 'd-2', 'd-3'])
      expect(rows.some(row => 'error' in row)).toBe(false)
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('can bound resume attempts after skipping existing successful rows', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-kimi-cli-runner-attempt-limit-'))
    const inputJsonlPath = join(rootDir, 'batch.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')
    const kimiBin = join(rootDir, 'fake-kimi')
    const callsPath = join(rootDir, 'calls.txt')

    writeFileSync(inputJsonlPath, [
      JSON.stringify(batchLine('d-1')),
      JSON.stringify(batchLine('d-2')),
      JSON.stringify(batchLine('d-3')),
    ].join('\n'), 'utf8')
    writeFileSync(outputJsonlPath, JSON.stringify({
      custom_id: 'd-1',
      response: { body: { choices: [{ message: { content: '{"decisionId":"d-1"}' } }] } },
    }), 'utf8')
    writeFileSync(kimiBin, [
      '#!/usr/bin/env node',
      'const fs = require("fs")',
      'const prompt = process.argv[process.argv.indexOf("--prompt") + 1]',
      'const id = prompt.includes("d-3") ? "d-3" : "d-2"',
      `fs.appendFileSync(${JSON.stringify(callsPath)}, id + "\\n")`,
      'console.log(`{\\"decisionId\\":\\"${id}\\"}`)',
    ].join('\n'), 'utf8')
    chmodSync(kimiBin, 0o755)

    try {
      const result = await runKimiCliBatchJsonl({
        inputJsonlPath,
        outputJsonlPath,
        kimiBin,
        resume: true,
        attemptLimit: 1,
      })

      expect(result).toMatchObject({
        expectedCount: 3,
        attemptedCount: 1,
        skippedCount: 1,
        writtenCount: 2,
        successCount: 2,
        errorCount: 0,
      })
      expect(readFileSync(callsPath, 'utf8').trim()).toBe('d-2')
      expect(readJsonl(outputJsonlPath).map(row => row.custom_id)).toEqual(['d-1', 'd-2'])
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('treats provider error JSON printed by the CLI as a failed row', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-kimi-cli-runner-provider-error-'))
    const inputJsonlPath = join(rootDir, 'batch.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')
    const kimiBin = join(rootDir, 'fake-kimi')

    writeFileSync(inputJsonlPath, JSON.stringify(batchLine('d-1')), 'utf8')
    writeFileSync(kimiBin, [
      '#!/usr/bin/env node',
      'console.log(JSON.stringify({ error: { message: "quota reached", type: "rate_limit" } }))',
    ].join('\n'), 'utf8')
    chmodSync(kimiBin, 0o755)

    try {
      const result = await runKimiCliBatchJsonl({
        inputJsonlPath,
        outputJsonlPath,
        kimiBin,
      })

      expect(result).toMatchObject({
        expectedCount: 1,
        successCount: 0,
        errorCount: 1,
      })
      const rows = readJsonl(outputJsonlPath)
      expect(rows[0].error.message).toBe('quota reached')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('treats Python-style Kimi quota error text as a failed row', async () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-kimi-cli-runner-quota-error-'))
    const inputJsonlPath = join(rootDir, 'batch.jsonl')
    const outputJsonlPath = join(rootDir, 'provider-results.jsonl')
    const kimiBin = join(rootDir, 'fake-kimi')

    writeFileSync(inputJsonlPath, JSON.stringify(batchLine('d-1')), 'utf8')
    writeFileSync(kimiBin, [
      '#!/usr/bin/env node',
      `console.log("{'error': {'message': \\"You have reached your usage limit and quota\\", 'type': 'rate_limit'}}")`,
    ].join('\n'), 'utf8')
    chmodSync(kimiBin, 0o755)

    try {
      const result = await runKimiCliBatchJsonl({
        inputJsonlPath,
        outputJsonlPath,
        kimiBin,
      })

      expect(result).toMatchObject({
        expectedCount: 1,
        successCount: 0,
        errorCount: 1,
      })
      const rows = readJsonl(outputJsonlPath)
      expect(rows[0].error.message).toContain('usage limit')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function batchLine(customId: string) {
  return {
    custom_id: customId,
    body: {
      messages: [
        { role: 'system', content: 'Return JSON.' },
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
