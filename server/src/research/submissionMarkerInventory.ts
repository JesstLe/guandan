import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, relative } from 'node:path'

export type SubmissionMarker =
  | 'NEED_SOURCE'
  | 'UNCERTAIN'
  | 'NEED_EXPERIMENT'
  | 'DO_NOT_SUBMIT'
  | 'AUTHOR_DECISION'

export type SubmissionMarkerCategory =
  | 'source'
  | 'uncertainty'
  | 'experiment_result'
  | 'submission_blocker'
  | 'author_decision'

export type SubmissionMarkerResolutionScope = 'blocking' | 'workbench'

export interface SubmissionMarkerInventoryItem {
  marker: SubmissionMarker
  category: SubmissionMarkerCategory
  resolutionScope: SubmissionMarkerResolutionScope
  relativePath: string
  line: number
  excerpt: string
}

export type SubmissionMarkerCounts = Record<SubmissionMarker, number>

export interface SubmissionMarkerInventory {
  schemaVersion: '0.1.0'
  generatedAt: string
  markerScope: 'submission_relevant_files'
  counts: SubmissionMarkerCounts
  blockingCounts: SubmissionMarkerCounts
  workbenchCounts: SubmissionMarkerCounts
  items: SubmissionMarkerInventoryItem[]
}

export interface SubmissionMarkerInventoryOptions {
  researchRoot: string
  outputDir: string
}

export interface SubmissionMarkerInventoryResult {
  jsonPath: string
  markdownPath: string
  inventory: SubmissionMarkerInventory
}

const markers: SubmissionMarker[] = [
  'NEED_SOURCE',
  'UNCERTAIN',
  'NEED_EXPERIMENT',
  'DO_NOT_SUBMIT',
  'AUTHOR_DECISION',
]

export function writeSubmissionMarkerInventory(options: SubmissionMarkerInventoryOptions): SubmissionMarkerInventoryResult {
  mkdirSync(options.outputDir, { recursive: true })
  const inventory = buildSubmissionMarkerInventory(options.researchRoot)
  const jsonPath = join(options.outputDir, 'submission-marker-inventory.json')
  const markdownPath = join(options.outputDir, 'submission-marker-inventory.md')

  writeFileSync(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderSubmissionMarkerInventory(inventory), 'utf8')

  return { jsonPath, markdownPath, inventory }
}

export function buildSubmissionMarkerInventory(researchRoot: string): SubmissionMarkerInventory {
  const items = listSubmissionRelevantTextFiles(researchRoot)
    .flatMap(file => collectMarkerItems(researchRoot, file))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.line - b.line || a.marker.localeCompare(b.marker))

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    markerScope: 'submission_relevant_files',
    counts: countItems(items),
    blockingCounts: countItems(items.filter(item => item.resolutionScope === 'blocking')),
    workbenchCounts: countItems(items.filter(item => item.resolutionScope === 'workbench')),
    items,
  }
}

export function renderSubmissionMarkerInventory(inventory: SubmissionMarkerInventory): string {
  const lines = [
    '# Submission Marker Inventory',
    '',
    `Generated at: \`${inventory.generatedAt}\``,
    '',
    'Scope: `submission_relevant_files`.',
    '',
    '## Counts',
    '',
    '### Blocking',
    '',
    '| Marker | Count |',
    '| --- | ---: |',
    ...markers.map(marker => `| ${marker} | ${inventory.blockingCounts[marker]} |`),
    '',
    '### Workbench',
    '',
    '| Marker | Count |',
    '| --- | ---: |',
    ...markers.map(marker => `| ${marker} | ${inventory.workbenchCounts[marker]} |`),
    '',
    '### Total',
    '',
    '| Marker | Count |',
    '| --- | ---: |',
    ...markers.map(marker => `| ${marker} | ${inventory.counts[marker]} |`),
    '',
    '## Items',
    '',
    '| Marker | Category | Scope | File | Line | Excerpt |',
    '| --- | --- | --- | --- | ---: | --- |',
    ...inventory.items.map(item => [
      item.marker,
      item.category,
      item.resolutionScope,
      `\`${item.relativePath}\``,
      String(item.line),
      item.excerpt,
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
  ]

  return lines.join('\n')
}

function collectMarkerItems(researchRoot: string, file: string): SubmissionMarkerInventoryItem[] {
  const relativePath = normalizePath(relative(researchRoot, file))
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  const items: SubmissionMarkerInventoryItem[] = []

  lines.forEach((line, index) => {
    for (const marker of markers) {
      for (let occurrence = 0; occurrence < countOccurrences(line, `[${marker}]`); occurrence++) {
        items.push({
          marker,
          category: categoryForMarker(marker),
          resolutionScope: resolutionScopeForPath(relativePath),
          relativePath,
          line: index + 1,
          excerpt: compactExcerpt(line),
        })
      }
    }
  })

  return items
}

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1
}

function countItems(items: SubmissionMarkerInventoryItem[]): SubmissionMarkerCounts {
  const counts = Object.fromEntries(markers.map(marker => [marker, 0])) as SubmissionMarkerCounts
  for (const item of items) counts[item.marker]++
  return counts
}

function listSubmissionRelevantTextFiles(root: string): string[] {
  const files: string[] = []
  addIfTextFile(files, root, 'PROJECT.md')
  collectDirectoryTextFiles(files, join(root, 'drafts', 'paper-as-code'))
  addIfTextFile(files, root, 'submission/ai-use-disclosure.md')
  addIfTextFile(files, root, 'submission/manuscript/manuscript-draft.md')
  return Array.from(new Set(files))
}

function collectDirectoryTextFiles(result: string[], root: string): void {
  if (!existsSync(root)) return
  const stack = [root]

  while (stack.length > 0) {
    const current = stack.pop()!
    for (const entry of readdirSync(current)) {
      const path = join(current, entry)
      const stat = statSync(path)
      if (stat.isDirectory()) {
        stack.push(path)
      } else if (isReadableTextFile(path)) {
        result.push(path)
      }
    }
  }
}

function addIfTextFile(result: string[], root: string, relativePath: string): void {
  const path = join(root, relativePath)
  if (existsSync(path) && isReadableTextFile(path)) result.push(path)
}

function isReadableTextFile(path: string): boolean {
  return /\.(md|txt|csv|json)$/i.test(path)
}

function categoryForMarker(marker: SubmissionMarker): SubmissionMarkerCategory {
  if (marker === 'NEED_SOURCE') return 'source'
  if (marker === 'UNCERTAIN') return 'uncertainty'
  if (marker === 'NEED_EXPERIMENT') return 'experiment_result'
  if (marker === 'DO_NOT_SUBMIT') return 'submission_blocker'
  return 'author_decision'
}

function resolutionScopeForPath(path: string): SubmissionMarkerResolutionScope {
  return path.startsWith('drafts/paper-as-code/') ? 'workbench' : 'blocking'
}

function compactExcerpt(line: string): string {
  const trimmed = line.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= 180) return trimmed
  return `${trimmed.slice(0, 177)}...`
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
