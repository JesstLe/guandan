import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, relative } from 'node:path'

export interface ReproducibilityManifestEntryInput {
  id: string
  title: string
  path: string
}

export type ReproducibilityManifestEntry =
  | ReproducibilityFileEntry
  | ReproducibilityDirectoryEntry
  | ReproducibilityMissingEntry

export interface ReproducibilityFileEntry extends ReproducibilityManifestEntryInput {
  kind: 'file'
  status: 'present'
  bytes: number
  sha256: string
}

export interface ReproducibilityDirectoryEntry extends ReproducibilityManifestEntryInput {
  kind: 'directory'
  status: 'present'
  bytes: number
  fileCount: number
  treeSha256: string
}

export interface ReproducibilityMissingEntry extends ReproducibilityManifestEntryInput {
  kind: 'missing'
  status: 'missing'
  bytes: 0
}

export interface ReproducibilityManifest {
  schemaVersion: '0.1.0'
  generatedAt: string
  rootDir: string
  entries: ReproducibilityManifestEntry[]
}

export interface ReproducibilityManifestOptions {
  rootDir: string
  outputDir: string
  entries: ReproducibilityManifestEntryInput[]
}

export interface ReproducibilityManifestResult {
  jsonPath: string
  markdownPath: string
  manifest: ReproducibilityManifest
}

interface DirectoryFileRecord {
  relativePath: string
  bytes: number
  sha256: string
}

export function writeReproducibilityManifest(options: ReproducibilityManifestOptions): ReproducibilityManifestResult {
  mkdirSync(options.outputDir, { recursive: true })

  const manifest: ReproducibilityManifest = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    rootDir: options.rootDir,
    entries: options.entries.map(entry => inspectEntry(options.rootDir, entry)),
  }

  const jsonPath = join(options.outputDir, 'reproducibility-manifest.json')
  const markdownPath = join(options.outputDir, 'reproducibility-manifest.md')
  writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderReproducibilityManifest(manifest), 'utf8')

  return { jsonPath, markdownPath, manifest }
}

export function renderReproducibilityManifest(manifest: ReproducibilityManifest): string {
  const lines = [
    '# Reproducibility Manifest',
    '',
    `Generated at: \`${manifest.generatedAt}\``,
    '',
    'Missing entries are audit findings, not experimental results.',
    '',
    '| Artifact | Status | Kind | Path | Files | Bytes | Digest |',
    '| --- | --- | --- | --- | ---: | ---: | --- |',
    ...manifest.entries.map(entry => [
      entry.title,
      `\`${entry.status}\``,
      entry.kind,
      `\`${entry.path}\``,
      String(entry.kind === 'directory' ? entry.fileCount : ''),
      String(entry.bytes),
      formatDigest(entry),
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
  ]

  return lines.join('\n')
}

function inspectEntry(rootDir: string, entry: ReproducibilityManifestEntryInput): ReproducibilityManifestEntry {
  const absolutePath = join(rootDir, entry.path)
  if (!existsSync(absolutePath)) {
    return {
      ...entry,
      kind: 'missing',
      status: 'missing',
      bytes: 0,
    }
  }

  const stats = statSync(absolutePath)
  if (stats.isFile()) {
    return {
      ...entry,
      kind: 'file',
      status: 'present',
      bytes: stats.size,
      sha256: sha256(readFileSync(absolutePath)),
    }
  }

  if (stats.isDirectory()) {
    const files = listDirectoryFiles(absolutePath, absolutePath)
    const bytes = files.reduce((sum, file) => sum + file.bytes, 0)
    return {
      ...entry,
      kind: 'directory',
      status: 'present',
      bytes,
      fileCount: files.length,
      treeSha256: sha256(files.map(file => `${file.relativePath}\t${file.bytes}\t${file.sha256}`).join('\n')),
    }
  }

  return {
    ...entry,
    kind: 'missing',
    status: 'missing',
    bytes: 0,
  }
}

function listDirectoryFiles(rootDir: string, dir: string): DirectoryFileRecord[] {
  const files: DirectoryFileRecord[] = []

  for (const name of readdirSync(dir).sort()) {
    const absolutePath = join(dir, name)
    const stats = statSync(absolutePath)
    if (stats.isDirectory()) {
      files.push(...listDirectoryFiles(rootDir, absolutePath))
    } else if (stats.isFile()) {
      files.push({
        relativePath: normalizePath(relative(rootDir, absolutePath)),
        bytes: stats.size,
        sha256: sha256(readFileSync(absolutePath)),
      })
    }
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

function formatDigest(entry: ReproducibilityManifestEntry): string {
  if (entry.kind === 'file') return `\`${entry.sha256}\``
  if (entry.kind === 'directory') return `tree:\`${entry.treeSha256}\``
  return ''
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
