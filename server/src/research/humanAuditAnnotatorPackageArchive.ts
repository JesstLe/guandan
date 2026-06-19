import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'

const FORBIDDEN_ARCHIVE_ENTRY_PATTERNS = [
  /answer[-_]?key/i,
  /verifier/i,
]

interface PackageManifest {
  status?: string
  sampleCount?: number
  instructions?: {
    referenceFileIncluded?: boolean
    referenceLabelsIncluded?: boolean
  }
}

export interface HumanAuditAnnotatorPackageArchiveReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: 'archive_ready' | 'needs_attention'
  packageDir: string
  packageManifestPath: string
  archivePath: string
  bytes: number
  sha256: string | null
  sampleCount: number | null
  archiveEntries: string[]
  checks: Array<{ id: string; status: 'pass' | 'fail'; detail: string }>
}

export interface HumanAuditAnnotatorPackageArchiveOptions {
  packageDir: string
  packageManifestPath: string
  archivePath: string
  outputDir: string
}

export interface HumanAuditAnnotatorPackageArchiveResult {
  jsonPath: string
  markdownPath: string
  report: HumanAuditAnnotatorPackageArchiveReport
}

export function writeHumanAuditAnnotatorPackageArchive(options: HumanAuditAnnotatorPackageArchiveOptions): HumanAuditAnnotatorPackageArchiveResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildHumanAuditAnnotatorPackageArchiveReport(options)
  const jsonPath = join(options.outputDir, 'human-audit-annotator-package-archive-report.json')
  const markdownPath = join(options.outputDir, 'human-audit-annotator-package-archive-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderHumanAuditAnnotatorPackageArchiveReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildHumanAuditAnnotatorPackageArchiveReport(options: HumanAuditAnnotatorPackageArchiveOptions): HumanAuditAnnotatorPackageArchiveReport {
  const packageManifest = readJson<PackageManifest>(options.packageManifestPath)
  const packageName = basename(options.packageDir)
  mkdirSync(dirname(options.archivePath), { recursive: true })

  const archiveResult = spawnSync('tar', [
    '-czf',
    options.archivePath,
    '-C',
    dirname(options.packageDir),
    packageName,
  ], { encoding: 'utf8' })

  const archiveExists = existsSync(options.archivePath)
  const archiveEntries = archiveExists ? listArchiveEntries(options.archivePath) : []
  const forbiddenEntries = archiveEntries.filter(entry => FORBIDDEN_ARCHIVE_ENTRY_PATTERNS.some(pattern => pattern.test(entry)))
  const bytes = archiveExists ? statSync(options.archivePath).size : 0
  const digest = archiveExists ? sha256(readFileSync(options.archivePath)) : null
  const checks = [
    check('package-manifest-ready', packageManifest.status === 'package_ready', `package manifest status is ${packageManifest.status ?? 'missing'}`),
    check('package-excludes-reference-file', packageManifest.instructions?.referenceFileIncluded === false, 'package manifest excludes private reference files'),
    check('package-excludes-reference-labels', packageManifest.instructions?.referenceLabelsIncluded === false, 'package manifest excludes reference labels'),
    check('tar-create-exit-code', archiveResult.status === 0, archiveResult.status === 0 ? 'tar archive command succeeded' : `tar failed: ${archiveResult.stderr || archiveResult.stdout || 'unknown error'}`),
    check('archive-present', archiveExists, archiveExists ? 'archive file exists' : 'archive file missing'),
    check('archive-nonempty', bytes > 0, `${bytes} bytes`),
    check('archive-entries-present', archiveEntries.length > 0, `${archiveEntries.length} archive entries`),
    check('archive-no-forbidden-entry-names', forbiddenEntries.length === 0, forbiddenEntries.length === 0 ? 'no private reference names in archive entries' : `forbidden entries: ${forbiddenEntries.join(', ')}`),
    check('archive-has-readme', archiveEntries.some(entry => entry.endsWith('/README.md')), 'archive contains README.md'),
    check('archive-has-blind-samples', archiveEntries.some(entry => entry.endsWith('/human-audit-blind-sample.jsonl')), 'archive contains blind sample JSONL'),
    check('archive-has-annotation-sheet', archiveEntries.some(entry => entry.endsWith('/human-audit-annotation-sheet.csv')), 'archive contains annotation sheet CSV'),
    check('archive-has-annotator-html', archiveEntries.some(entry => entry.endsWith('/human-audit-annotator.html')), 'archive contains annotator HTML'),
  ]
  const status = checks.every(row => row.status === 'pass') ? 'archive_ready' : 'needs_attention'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    packageDir: options.packageDir,
    packageManifestPath: options.packageManifestPath,
    archivePath: options.archivePath,
    bytes,
    sha256: digest,
    sampleCount: packageManifest.sampleCount ?? null,
    archiveEntries,
    checks,
  }
}

function renderHumanAuditAnnotatorPackageArchiveReport(report: HumanAuditAnnotatorPackageArchiveReport): string {
  return [
    '# Human Audit Annotator Package Archive Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    '| Item | Value |',
    '| --- | ---: |',
    `| Archive | \`${basename(report.archivePath)}\` |`,
    `| Bytes | ${report.bytes} |`,
    `| SHA-256 | \`${report.sha256 ?? 'missing'}\` |`,
    `| Samples | ${report.sampleCount ?? 'unknown'} |`,
    `| Archive entries | ${report.archiveEntries.length} |`,
    '',
    '## Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map(row => `| ${row.id} | \`${row.status}\` | ${escapeMarkdownCell(row.detail)} |`),
    '',
    report.status === 'archive_ready'
      ? 'The blind annotator package archive is ready to send to external annotators.'
      : 'Resolve failed archive checks before sending the annotator package.',
    '',
  ].join('\n')
}

function listArchiveEntries(archivePath: string): string[] {
  const result = spawnSync('tar', ['-tzf', archivePath], { encoding: 'utf8' })
  if (result.status !== 0) return []
  return result.stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .sort()
}

function check(id: string, passed: boolean, detail: string): HumanAuditAnnotatorPackageArchiveReport['checks'][number] {
  return {
    id,
    status: passed ? 'pass' : 'fail',
    detail,
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
