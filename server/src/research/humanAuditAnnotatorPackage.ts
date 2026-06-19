import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, join } from 'node:path'

const PACKAGE_FILES = [
  'README.md',
  'human-audit-annotator.html',
  'human-audit-annotation-sheet.csv',
  'human-audit-blind-sample.jsonl',
] as const

const FORBIDDEN_FILENAME_PATTERNS = [
  /answer[-_]?key/i,
  /verifier/i,
]

const FORBIDDEN_CONTENT_PATTERNS = [
  /\bverifier[A-Za-z0-9_]*\b/,
  /answer[-_]?key/i,
  /human-audit-answer-key/i,
]

interface AuditSample {
  sampleId: string
  scenarioTags?: string
  phase?: string
  [key: string]: unknown
}

export interface HumanAuditAnnotatorPackageOptions {
  blindJsonlPath: string
  annotationCsvPath: string
  annotatorHtmlPath: string
  outputDir: string
}

export interface HumanAuditAnnotatorPackageManifest {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: 'package_ready' | 'needs_attention'
  sampleCount: number
  stratumCounts: Record<string, number>
  files: Record<typeof PACKAGE_FILES[number], string>
  checks: Array<{ id: string; status: 'pass' | 'fail'; detail: string }>
  instructions: {
    completedCsvName: 'human-audit-completed-annotations.csv'
    referenceFileIncluded: false
    referenceLabelsIncluded: false
  }
}

export interface HumanAuditAnnotatorPackageResult {
  packageDir: string
  manifestPath: string
  manifest: HumanAuditAnnotatorPackageManifest
}

export function writeHumanAuditAnnotatorPackage(options: HumanAuditAnnotatorPackageOptions): HumanAuditAnnotatorPackageResult {
  rmSync(options.outputDir, { recursive: true, force: true })
  mkdirSync(options.outputDir, { recursive: true })

  const sampleRows = readJsonl<AuditSample>(options.blindJsonlPath)
  const readme = renderAnnotatorReadme(sampleRows.length)
  const fileContents: Record<typeof PACKAGE_FILES[number], string> = {
    'README.md': readme,
    'human-audit-annotator.html': readFileSync(options.annotatorHtmlPath, 'utf8'),
    'human-audit-annotation-sheet.csv': readFileSync(options.annotationCsvPath, 'utf8'),
    'human-audit-blind-sample.jsonl': readFileSync(options.blindJsonlPath, 'utf8'),
  }

  writeFileSync(join(options.outputDir, 'README.md'), readme, 'utf8')
  copyFileSync(options.annotatorHtmlPath, join(options.outputDir, 'human-audit-annotator.html'))
  copyFileSync(options.annotationCsvPath, join(options.outputDir, 'human-audit-annotation-sheet.csv'))
  copyFileSync(options.blindJsonlPath, join(options.outputDir, 'human-audit-blind-sample.jsonl'))

  const checks = buildChecks(fileContents, sampleRows)
  const status = checks.every(check => check.status === 'pass') ? 'package_ready' : 'needs_attention'
  const manifest: HumanAuditAnnotatorPackageManifest = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    sampleCount: sampleRows.length,
    stratumCounts: countBy(sampleRows.map(row => String(row.scenarioTags || row.phase || 'unknown'))),
    files: Object.fromEntries(PACKAGE_FILES.map(filename => [filename, join(options.outputDir, filename)])) as HumanAuditAnnotatorPackageManifest['files'],
    checks,
    instructions: {
      completedCsvName: 'human-audit-completed-annotations.csv',
      referenceFileIncluded: false,
      referenceLabelsIncluded: false,
    },
  }
  const manifestPath = join(options.outputDir, 'human-audit-annotator-package-manifest.json')
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  return {
    packageDir: options.outputDir,
    manifestPath,
    manifest,
  }
}

function buildChecks(
  fileContents: Record<typeof PACKAGE_FILES[number], string>,
  sampleRows: AuditSample[],
): HumanAuditAnnotatorPackageManifest['checks'] {
  const packageFilenames = Object.keys(fileContents)
  const filenameLeaks = packageFilenames.filter(filename => FORBIDDEN_FILENAME_PATTERNS.some(pattern => pattern.test(filename)))
  const contentLeaks = Object.entries(fileContents)
    .filter(([, content]) => FORBIDDEN_CONTENT_PATTERNS.some(pattern => pattern.test(content)))
    .map(([filename]) => filename)
  const sampleIds = sampleRows.map(row => row.sampleId)
  const uniqueSampleIds = new Set(sampleIds)
  const blindFieldLeaks = sampleRows
    .flatMap(row => Object.keys(row))
    .filter(field => /^verifier/i.test(field))

  return [
    check('required-files', packageFilenames.length === PACKAGE_FILES.length && PACKAGE_FILES.every(filename => packageFilenames.includes(filename)), `${packageFilenames.length}/${PACKAGE_FILES.length} files present`),
    check('private-reference-excluded', !packageFilenames.some(filename => /answer[-_]?key/i.test(filename)), 'package file list contains no private reference file'),
    check('no-forbidden-filenames', filenameLeaks.length === 0, filenameLeaks.length === 0 ? 'no forbidden filenames' : `forbidden filenames: ${filenameLeaks.join(', ')}`),
    check('no-forbidden-content', contentLeaks.length === 0, contentLeaks.length === 0 ? 'no private reference terms in package files' : `forbidden terms in: ${contentLeaks.join(', ')}`),
    check('nonempty-samples', sampleRows.length > 0, `${sampleRows.length} blind samples`),
    check('unique-sample-ids', uniqueSampleIds.size === sampleIds.length, `${uniqueSampleIds.size}/${sampleIds.length} unique sample ids`),
    check('blind-hides-reference-fields', blindFieldLeaks.length === 0, blindFieldLeaks.length === 0 ? 'blind sample fields contain no reference labels' : `leaked fields: ${[...new Set(blindFieldLeaks)].join(', ')}`),
  ]
}

function check(id: string, passed: boolean, detail: string): HumanAuditAnnotatorPackageManifest['checks'][number] {
  return {
    id,
    status: passed ? 'pass' : 'fail',
    detail,
  }
}

function renderAnnotatorReadme(sampleCount: number): string {
  return [
    '# Human Soft-Label Audit Annotator Package',
    '',
    `This package contains ${sampleCount} blind samples for a human soft-label audit.`,
    '',
    '## Files',
    '',
    '- `human-audit-annotator.html`: local browser UI for labeling.',
    '- `human-audit-annotation-sheet.csv`: spreadsheet-compatible backup annotation sheet.',
    '- `human-audit-blind-sample.jsonl`: public-state rows embedded in the annotator UI.',
    '',
    '## Instructions',
    '',
    'Open `human-audit-annotator.html` in a browser, label every sample field as `pass`, `fail`, or `uncertain`, then export `human-audit-completed-annotations.csv`.',
    '',
    'Use only the visible public-state fields in the row. Do not infer private cards, hidden intentions, or exact holdings beyond the shown evidence.',
    '',
    'Do not add, delete, reorder, or edit `sampleId` values. The completed CSV must preserve every row so the researcher can compute agreement.',
    '',
    'Return only `human-audit-completed-annotations.csv` after labeling.',
    '',
  ].join('\n')
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as T)
}
