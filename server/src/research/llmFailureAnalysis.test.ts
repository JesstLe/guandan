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
import { writeLLMFailureAnalysis } from './llmFailureAnalysis'

describe('llmFailureAnalysis', () => {
  it('classifies parse failures and verifier hard failures', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-llm-failure-analysis-'))
    const rawDir = join(rootDir, 'raw')
    const resultDir = join(rootDir, 'results')
    const outDir = join(rootDir, 'out')
    mkdirSync(rawDir, { recursive: true })
    mkdirSync(resultDir, { recursive: true })

    try {
      writeJson(join(rootDir, 'metrics.json'), {
        conditionId: 'tom-prompted-llm',
        totalDecisionPoints: 3,
        totalParsedTraces: 1,
        parseFailureCount: 2,
        hardFailureCount: 1,
        failures: [
          {
            decisionId: 'd-1',
            rawOutputFile: join(rawDir, 'd-1.txt'),
            message: 'Parsed JSON does not match the required reasoning trace shape.',
          },
          {
            decisionId: 'd-2',
            rawOutputFile: join(rawDir, 'd-2.txt'),
            message: 'Parsed JSON does not match the required reasoning trace shape.',
          },
        ],
      })
      writeFileSync(join(rawDir, 'd-1.txt'), JSON.stringify({
        schemaVersion: '0.1.0',
        decisionId: 'd-1',
        agentId: 'tom-prompted-llm',
        selectedActionId: 'a-1',
        reasoning: { partnerIntent: 'help partner' },
        confidence: 0.7,
      }), 'utf8')
      writeFileSync(join(rawDir, 'd-2.txt'), JSON.stringify({
        action: 'search_files',
        path: '/tmp/project',
        pattern: 'schema',
      }), 'utf8')
      writeJson(join(resultDir, 'd-3.json'), {
        decisionId: 'd-3',
        hardFailures: [
          { code: 'HIDDEN_INFO_ASSERTED_AS_FACT', message: 'Hidden cards asserted.' },
        ],
      })

      const result = writeLLMFailureAnalysis({
        metricsPath: join(rootDir, 'metrics.json'),
        rawOutputDir: rawDir,
        resultDir,
        outputDir: outDir,
        basename: 'analysis',
      })

      expect(result.analysis.parseFailureCategoryCounts.nested_reasoning_wrong_schema).toBe(1)
      expect(result.analysis.parseFailureCategoryCounts.tool_call_like_output).toBe(1)
      expect(result.analysis.verifierHardFailureCodeCounts.HIDDEN_INFO_ASSERTED_AS_FACT).toBe(1)
      expect(readFileSync(result.markdownPath, 'utf8')).toContain('Parse-Failure Taxonomy')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
