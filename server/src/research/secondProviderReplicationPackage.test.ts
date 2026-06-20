import { describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeSecondProviderReplicationPackage } from './secondProviderReplicationPackage'

describe('secondProviderReplicationPackage', () => {
  it('packages fixed ToM pilot replication inputs with checksums', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-second-provider-package-'))
    try {
      writeFixedInputs(rootDir, 50, 50)

      const result = writeSecondProviderReplicationPackage({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'experiments', 'pilot-replication'),
      })

      expect(result.report.status).toBe('package_ready')
      expect(result.report.readyForExternalRun).toBe(true)
      expect(result.report.readyForPaperEvidence).toBe(false)
      expect(result.report.inputRows).toBe(50)
      expect(result.report.promptPacketCount).toBe(50)
      expect(result.report.checks.every(check => check.status === 'pass')).toBe(true)
      expect(existsSync(join(result.report.packageDir, 'openai-batch-input.jsonl'))).toBe(true)
      expect(existsSync(join(result.report.packageDir, 'prompt-packets', 'packet-049.json'))).toBe(true)
      expect(result.report.files.some(file => file.path === 'openai-batch-input.jsonl' && file.sha256.length === 64)).toBe(true)

      const manifest = JSON.parse(readFileSync(result.report.manifestPath, 'utf8'))
      expect(manifest.files.length).toBe(result.report.files.length)
      const readme = readFileSync(result.report.readmePath, 'utf8')
      expect(readme).toContain('contains no API keys')
      expect(readme).toContain('npm run research:second-provider:run')
      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('Ready for external run | yes')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('reports needs_attention when fixed inputs are incomplete', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-second-provider-package-missing-'))
    try {
      writeFixedInputs(rootDir, 49, 2)

      const result = writeSecondProviderReplicationPackage({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'experiments', 'pilot-replication'),
      })

      expect(result.report.status).toBe('needs_attention')
      expect(result.report.readyForExternalRun).toBe(false)
      expect(result.report.inputRows).toBe(49)
      expect(result.report.promptPacketCount).toBe(2)
      expect(result.report.checks.find(check => check.id === 'fixed-input-row-count')?.status).toBe('fail')
      expect(result.report.checks.find(check => check.id === 'prompt-packet-count')?.status).toBe('fail')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeFixedInputs(rootDir: string, rows: number, packetCount: number): void {
  const batchDir = join(rootDir, 'experiments', 'pilot-e7-tom-prompted-batch', 'openai')
  const packetDir = join(rootDir, 'experiments', 'pilot-e7-tom-prompted-prompts', 'packets')
  mkdirSync(batchDir, { recursive: true })
  mkdirSync(packetDir, { recursive: true })
  const jsonl = Array.from({ length: rows }, (_, index) => JSON.stringify({
    custom_id: `pilot-e1-${String(index).padStart(3, '0')}`,
    method: 'POST',
    url: '/v1/chat/completions',
    body: { model: 'gpt-4.1-mini', messages: [] },
  })).join('\n')
  writeFileSync(join(batchDir, 'openai-batch-input.jsonl'), `${jsonl}\n`, 'utf8')
  for (let index = 0; index < packetCount; index++) {
    writeFileSync(join(packetDir, `packet-${String(index).padStart(3, '0')}.json`), JSON.stringify({
      decisionId: `pilot-e1-${String(index).padStart(3, '0')}`,
    }), 'utf8')
  }
}
