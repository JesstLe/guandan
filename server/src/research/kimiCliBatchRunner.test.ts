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
  it('runs Kimi CLI stream-json output and writes OpenAI-compatible provider results', async () => {
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
      'console.log("To resume this session: kimi -r fake")',
      'console.log(JSON.stringify({role:"assistant",content:[{type:"think",think:"hidden"},{type:"text",text:`Here is JSON: {\\"decisionId\\":\\"${id}\\"}`}]}))',
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
