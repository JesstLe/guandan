import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'

export type SecondProviderReplicationPackageStatus = 'package_ready' | 'needs_attention'

export interface SecondProviderReplicationPackageOptions {
  researchRoot: string
  outputDir: string
}

export interface SecondProviderReplicationPackageCheck {
  id: string
  status: 'pass' | 'fail'
  detail: string
}

export interface SecondProviderReplicationPackageReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: SecondProviderReplicationPackageStatus
  packageDir: string
  manifestPath: string
  readmePath: string
  fixedInputSourcePath: string
  promptPacketsSourceDir: string
  packagedInputPath: string
  packagedPromptPacketsDir: string
  inputRows: number
  promptPacketCount: number
  checks: SecondProviderReplicationPackageCheck[]
  files: Array<{
    path: string
    bytes: number
    sha256: string
  }>
  readyForExternalRun: boolean
  readyForPaperEvidence: false
}

export interface SecondProviderReplicationPackageResult {
  jsonPath: string
  markdownPath: string
  report: SecondProviderReplicationPackageReport
}

const fixedPaths = {
  inputJsonl: 'experiments/pilot-e7-tom-prompted-batch/openai/openai-batch-input.jsonl',
  promptPackets: 'experiments/pilot-e7-tom-prompted-prompts/packets',
}

export function writeSecondProviderReplicationPackage(
  options: SecondProviderReplicationPackageOptions,
): SecondProviderReplicationPackageResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildSecondProviderReplicationPackage(options)
  const jsonPath = join(options.outputDir, 'second-provider-replication-package-report.json')
  const markdownPath = join(options.outputDir, 'second-provider-replication-package-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderSecondProviderReplicationPackageReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildSecondProviderReplicationPackage(
  options: SecondProviderReplicationPackageOptions,
): SecondProviderReplicationPackageReport {
  const packageDir = join(options.outputDir, 'second-provider-replication-package')
  const packagedInputPath = join(packageDir, 'openai-batch-input.jsonl')
  const packagedPromptPacketsDir = join(packageDir, 'prompt-packets')
  const manifestPath = join(packageDir, 'manifest.json')
  const readmePath = join(packageDir, 'README.md')
  const fixedInputSourcePath = join(options.researchRoot, fixedPaths.inputJsonl)
  const promptPacketsSourceDir = join(options.researchRoot, fixedPaths.promptPackets)
  const inputPresent = existsSync(fixedInputSourcePath)
  const packetDirPresent = existsSync(promptPacketsSourceDir)
  const inputRows = inputPresent ? countJsonlRows(fixedInputSourcePath) : 0
  const promptPacketCount = packetDirPresent ? countJsonFiles(promptPacketsSourceDir) : 0

  rmSync(packageDir, { recursive: true, force: true })
  mkdirSync(packagedPromptPacketsDir, { recursive: true })

  if (inputPresent) {
    cpSync(fixedInputSourcePath, packagedInputPath)
  }
  if (packetDirPresent) {
    for (const filename of readdirSync(promptPacketsSourceDir).filter(name => name.endsWith('.json')).sort()) {
      cpSync(join(promptPacketsSourceDir, filename), join(packagedPromptPacketsDir, filename))
    }
  }

  const checks = [
    check('fixed-input-present', inputPresent, inputPresent ? 'fixed OpenAI-compatible JSONL is present' : 'fixed OpenAI-compatible JSONL is missing'),
    check('fixed-input-row-count', inputRows === 50, `${inputRows}/50 fixed input rows`),
    check('prompt-packet-dir-present', packetDirPresent, packetDirPresent ? 'prompt packet directory is present' : 'prompt packet directory is missing'),
    check('prompt-packet-count', promptPacketCount === 50, `${promptPacketCount}/50 prompt packet JSON files`),
  ]
  const readyForExternalRun = checks.every(row => row.status === 'pass')
  const reportWithoutFiles: Omit<SecondProviderReplicationPackageReport, 'files'> = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status: readyForExternalRun ? 'package_ready' : 'needs_attention',
    packageDir,
    manifestPath,
    readmePath,
    fixedInputSourcePath,
    promptPacketsSourceDir,
    packagedInputPath,
    packagedPromptPacketsDir,
    inputRows,
    promptPacketCount,
    checks,
    readyForExternalRun,
    readyForPaperEvidence: false,
  }
  writeFileSync(manifestPath, `${JSON.stringify({ ...reportWithoutFiles, files: [] }, null, 2)}\n`, 'utf8')
  writeFileSync(readmePath, renderPackageReadme(reportWithoutFiles), 'utf8')
  const files = readyForExternalRun ? collectPackageFiles(packageDir) : collectPackageFiles(packageDir)
  const report = { ...reportWithoutFiles, files }
  writeFileSync(manifestPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return report
}

function renderSecondProviderReplicationPackageReport(report: SecondProviderReplicationPackageReport): string {
  return [
    '# Second-Provider Replication Package Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Package directory | \`${relative(process.cwd(), report.packageDir)}\` |`,
    `| Fixed input rows | ${report.inputRows}/50 |`,
    `| Prompt packets | ${report.promptPacketCount}/50 |`,
    `| Files | ${report.files.length} |`,
    `| Ready for external run | ${report.readyForExternalRun ? 'yes' : 'no'} |`,
    `| Ready for paper evidence | ${report.readyForPaperEvidence ? 'yes' : 'no'} |`,
    '',
    '## Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map(row => `| ${row.id} | \`${row.status}\` | ${escapeMarkdownCell(row.detail)} |`),
    '',
    '## Packaged Files',
    '',
    '| File | Bytes | SHA-256 |',
    '| --- | ---: | --- |',
    ...report.files.map(file => `| \`${escapeMarkdownCell(file.path)}\` | ${file.bytes} | \`${file.sha256}\` |`),
    '',
    '## Interpretation',
    '',
    report.readyForExternalRun
      ? 'The package fixes the second-provider pilot replication inputs and can be used once an independent provider/model key is available. It is not paper evidence until provider outputs and metrics are returned.'
      : 'Resolve failed package checks before using this package for external replication.',
    '',
  ].join('\n')
}

function renderPackageReadme(report: Omit<SecondProviderReplicationPackageReport, 'files'>): string {
  return [
    '# Second-Provider Replication Package',
    '',
    'This package contains the fixed 50-decision ToM-prompted pilot replication inputs for an independent provider/model run. It contains no API keys, provider outputs, manuscript drafts, or human-audit answer keys.',
    '',
    '## Contents',
    '',
    '- `openai-batch-input.jsonl`: OpenAI-compatible request JSONL with 50 fixed prompt rows.',
    '- `prompt-packets/`: Source prompt packets used to generate the JSONL.',
    '- `manifest.json`: Checksums and readiness metadata for this package.',
    '',
    '## Expected Run Boundary',
    '',
    'Use an independent provider/model from the primary Kimi run, such as Zhipu GLM or OpenAI. A same-provider Kimi rerun must not be reported as independent replication evidence.',
    '',
    'Recommended smoke command from the repository root:',
    '',
    '```bash',
    'npm run research:second-provider:smoke',
    '```',
    '',
    'Recommended full resume command from the repository root:',
    '',
    '```bash',
    'npm run research:second-provider:run',
    '```',
    '',
    '## Success Criteria',
    '',
    '- Provider run report has `expectedCount=50`, `successCount=50`, and `errorCount=0`.',
    '- Provider JSONL is materialized at `docs/research/experiments/provider-results/tom-prompted-llm-second-provider.jsonl`.',
    '- Metrics are materialized at `docs/research/experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json`.',
    '- `npm run research:local-pipeline` and `npm run research:aamas-finalize` are rerun after outputs return.',
    '',
    '## Current Package Facts',
    '',
    `- Fixed input rows: ${report.inputRows}/50`,
    `- Prompt packets: ${report.promptPacketCount}/50`,
    `- Ready for external run: ${report.readyForExternalRun ? 'yes' : 'no'}`,
    '- Ready for paper evidence: no, not until independent provider outputs are returned and materialized.',
    '',
  ].join('\n')
}

function collectPackageFiles(packageDir: string): SecondProviderReplicationPackageReport['files'] {
  const paths: string[] = []
  collectFiles(packageDir, paths)
  return paths.sort().map(path => {
    const data = readFileSync(path)
    return {
      path: relative(packageDir, path),
      bytes: data.byteLength,
      sha256: createHash('sha256').update(data).digest('hex'),
    }
  })
}

function collectFiles(dir: string, output: string[]): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      collectFiles(path, output)
    } else if (name !== 'manifest.json') {
      output.push(path)
    }
  }
}

function countJsonlRows(path: string): number {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .length
}

function countJsonFiles(path: string): number {
  return readdirSync(path).filter(name => name.endsWith('.json')).length
}

function check(id: string, passed: boolean, detail: string): SecondProviderReplicationPackageCheck {
  return { id, status: passed ? 'pass' : 'fail', detail }
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
