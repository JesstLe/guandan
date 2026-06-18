import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export const defaultBibliographyKeys = [
  'agashe2023llmcoordination',
  'ramesh2026hanabi',
  'yim2024tomguandan',
  'lu2022danzero',
  'xie2026m3bench',
  'openguandan2026',
  'aaai2025mixedexplain',
  'ramesh2025activationcomm',
  'yang2025codeagents',
  'li2025gametheorysurvey',
  'ma2025saydo',
  'he2026stratreasoner',
  'lin2026toolpoker',
  'slampai2026gamereasoningarena',
] as const

export interface BibliographyEntry {
  type: string
  key: string
  fields: Record<string, string>
}

export interface BibliographyIssue {
  severity: 'error' | 'warning'
  key?: string
  message: string
}

export interface BibliographyIntegrityReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  bibPath: string
  entryCount: number
  expectedKeyCount: number
  missingKeys: string[]
  duplicateKeys: string[]
  issues: BibliographyIssue[]
  ready: boolean
}

export interface BibliographyIntegrityOptions {
  bibPath: string
  expectedKeys?: readonly string[]
}

export interface BibliographyIntegrityWriteOptions extends BibliographyIntegrityOptions {
  outputDir: string
}

export interface BibliographyIntegrityWriteResult {
  jsonPath: string
  markdownPath: string
  report: BibliographyIntegrityReport
}

const placeholderPatterns = [
  /TODO/i,
  /\[NEED_SOURCE\]/,
  /\[UNCERTAIN\]/,
  /\[AUTHOR_DECISION\]/,
  /\[DO_NOT_SUBMIT\]/,
  /<[^>\n]+>/,
]

export function checkBibliographyIntegrity(options: BibliographyIntegrityOptions): BibliographyIntegrityReport {
  const content = readFileSync(options.bibPath, 'utf8')
  const entries = parseBibEntries(content)
  const expectedKeys = [...(options.expectedKeys ?? defaultBibliographyKeys)]
  const keyCounts = countKeys(entries)
  const presentKeys = new Set(entries.map(entry => entry.key))
  const missingKeys = expectedKeys.filter(key => !presentKeys.has(key))
  const duplicateKeys = [...keyCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key)
  const issues: BibliographyIssue[] = []

  for (const key of missingKeys) {
    issues.push({
      severity: 'error',
      key,
      message: `Missing expected bibliography key ${key}.`,
    })
  }

  for (const key of duplicateKeys) {
    issues.push({
      severity: 'error',
      key,
      message: `Duplicate bibliography key ${key}.`,
    })
  }

  for (const entry of entries) {
    issues.push(...validateEntry(entry))
  }

  const report: BibliographyIntegrityReport = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    bibPath: options.bibPath,
    entryCount: entries.length,
    expectedKeyCount: expectedKeys.length,
    missingKeys,
    duplicateKeys,
    issues,
    ready: issues.filter(issue => issue.severity === 'error').length === 0,
  }

  return report
}

export function writeBibliographyIntegrityReport(options: BibliographyIntegrityWriteOptions): BibliographyIntegrityWriteResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = checkBibliographyIntegrity(options)
  const jsonPath = join(options.outputDir, 'bibliography-integrity-report.json')
  const markdownPath = join(options.outputDir, 'bibliography-integrity-report.md')

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderBibliographyIntegrityReport(report), 'utf8')

  return {
    jsonPath,
    markdownPath,
    report,
  }
}

export function parseBibEntries(content: string): BibliographyEntry[] {
  const entries: BibliographyEntry[] = []
  const entryPattern = /@([A-Za-z]+)\s*\{\s*([^,\s]+)\s*,([\s\S]*?)(?=\n@|$)/g
  let match: RegExpExecArray | null

  while ((match = entryPattern.exec(content)) !== null) {
    const [, type, key, body] = match
    entries.push({
      type: type.toLowerCase(),
      key,
      fields: parseFields(body),
    })
  }

  return entries
}

export function renderBibliographyIntegrityReport(report: BibliographyIntegrityReport): string {
  const lines = [
    '# Bibliography Integrity Report',
    '',
    `Status: \`${report.ready ? 'ready' : 'not_ready'}\``,
    `Generated at: \`${report.generatedAt}\``,
    `BibTeX path: \`${report.bibPath}\``,
    `Entries: ${report.entryCount} / expected keys: ${report.expectedKeyCount}`,
    '',
  ]

  if (report.issues.length === 0) {
    lines.push('No blocking bibliography integrity issues found.', '')
    return lines.join('\n')
  }

  lines.push('| Severity | Key | Issue |')
  lines.push('| --- | --- | --- |')
  for (const issue of report.issues) {
    lines.push(`| \`${issue.severity}\` | ${issue.key ? `\`${issue.key}\`` : ''} | ${escapeMarkdownCell(issue.message)} |`)
  }
  lines.push('')

  return lines.join('\n')
}

function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const fieldPattern = /([A-Za-z][A-Za-z0-9_-]*)\s*=\s*(\{([^{}]*)\}|"([^"]*)")\s*,?/g
  let match: RegExpExecArray | null

  while ((match = fieldPattern.exec(body)) !== null) {
    const [, rawName, , braceValue, quotedValue] = match
    fields[rawName.toLowerCase()] = (braceValue ?? quotedValue ?? '').trim()
  }

  return fields
}

function validateEntry(entry: BibliographyEntry): BibliographyIssue[] {
  const issues: BibliographyIssue[] = []
  const requiredFields = entry.type === 'software'
    ? ['title', 'author', 'year', 'url', 'note']
    : ['title', 'author', 'year', 'url']

  for (const field of requiredFields) {
    if (!entry.fields[field]) {
      issues.push({
        severity: 'error',
        key: entry.key,
        message: `Missing required field ${field}.`,
      })
    }
  }

  for (const [field, value] of Object.entries(entry.fields)) {
    if (placeholderPatterns.some(pattern => pattern.test(value))) {
      issues.push({
        severity: 'error',
        key: entry.key,
        message: `Field ${field} contains an unresolved placeholder.`,
      })
    }
  }

  if (entry.fields.eprint) {
    requireExactField(entry, 'archiveprefix', 'arXiv', issues)
    requireField(entry, 'doi', issues)
    requireField(entry, 'url', issues)
  }

  if (entry.type === 'software' && !entry.fields.url?.startsWith('https://github.com/')) {
    issues.push({
      severity: 'warning',
      key: entry.key,
      message: 'Software entry URL is not a GitHub repository URL.',
    })
  }

  return issues
}

function requireField(entry: BibliographyEntry, field: string, issues: BibliographyIssue[]): void {
  if (entry.fields[field]) return
  issues.push({
    severity: 'error',
    key: entry.key,
    message: `arXiv entry is missing ${field}.`,
  })
}

function requireExactField(
  entry: BibliographyEntry,
  field: string,
  expectedValue: string,
  issues: BibliographyIssue[],
): void {
  if (entry.fields[field] === expectedValue) return
  issues.push({
    severity: 'error',
    key: entry.key,
    message: `arXiv entry must set ${field} = {${expectedValue}}.`,
  })
}

function countKeys(entries: BibliographyEntry[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1)
  }

  return counts
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
