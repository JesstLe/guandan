import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'

export interface ManuscriptAssemblerOptions {
  sectionsDir: string
  outputDir: string
  title: string
  tablesDir?: string
}

export interface ManuscriptMarkerCounts {
  NEED_SOURCE: number
  UNCERTAIN: number
  NEED_EXPERIMENT: number
  DO_NOT_SUBMIT: number
  AUTHOR_DECISION: number
}

export interface ManuscriptStatus {
  schemaVersion: '0.1.0'
  title: string
  sectionCount: number
  wordCount: number
  markerCounts: ManuscriptMarkerCounts
  readyForSubmission: boolean
  sectionSources: string[]
  artifactSources: string[]
}

export interface ManuscriptAssemblerResult {
  manuscriptPath: string
  statusPath: string
  status: ManuscriptStatus
}

const sectionPlan = [
  { filename: '06_abstract.md', title: 'Abstract', extract: 'abstract' },
  { filename: '01_introduction.md', title: 'Introduction', extract: 'draft' },
  { filename: '02_related_work.md', title: 'Related Work', extract: 'draft' },
  { filename: '03_method.md', title: 'Method', extract: 'draft' },
  { filename: '04_experiments.md', title: 'Experiments', extract: 'draft' },
  { filename: '05_discussion_limitations.md', title: 'Discussion and Limitations', extract: 'draft' },
] as const

export function assembleManuscript(options: ManuscriptAssemblerOptions): ManuscriptAssemblerResult {
  mkdirSync(options.outputDir, { recursive: true })
  const sections = sectionPlan.map(section => readSection(options.sectionsDir, section))
  const includedArtifacts = readIncludedArtifacts(options)
  const sectionBody = sections.flatMap(section => renderSectionWithArtifacts(section, includedArtifacts))
  const sectionMarkerCounts = countMarkers(sectionBody.join('\n'))
  const warning = Object.values(sectionMarkerCounts).some(count => count > 0)
    ? [
        'Draft note: assembled from paper-as-code sections. Resolve all markers and replace planned-result text before submission.',
        '',
      ]
    : []
  const body = [
    `# ${options.title}`,
    '',
    ...warning,
    ...sectionBody,
  ].join('\n')

  const manuscriptPath = join(options.outputDir, 'manuscript-draft.md')
  const statusPath = join(options.outputDir, 'manuscript-status.json')
  writeFileSync(manuscriptPath, body, 'utf8')

  const markerCounts = countMarkers(body)
  const status: ManuscriptStatus = {
    schemaVersion: '0.1.0',
    title: options.title,
    sectionCount: sections.length,
    wordCount: countWords(body),
    markerCounts,
    readyForSubmission: Object.values(markerCounts).every(count => count === 0),
    sectionSources: sectionPlan.map(section => join(options.sectionsDir, section.filename)),
    artifactSources: includedArtifacts.map(artifact => artifact.path),
  }
  writeJson(statusPath, status)

  return { manuscriptPath, statusPath, status }
}

function renderSectionWithArtifacts(
  section: { title: string; content: string },
  artifacts: IncludedArtifact[],
): string[] {
  return [
    `## ${section.title}`,
    '',
    section.content,
    '',
    ...artifacts
      .filter(artifact => artifact.afterSectionTitle === section.title)
      .flatMap(artifact => [artifact.content, '']),
  ]
}

interface IncludedArtifact {
  afterSectionTitle: string
  path: string
  content: string
}

function readIncludedArtifacts(options: ManuscriptAssemblerOptions): IncludedArtifact[] {
  if (!options.tablesDir) return []

  return [
    {
      afterSectionTitle: 'Related Work',
      path: join(options.tablesDir, 'table-0-related-work-positioning.md'),
    },
  ]
    .flatMap(artifact => {
      try {
        return [{
          ...artifact,
          content: demoteTopLevelHeading(readFileSync(artifact.path, 'utf8').trim()),
        }]
      } catch {
        return []
      }
    })
}

function demoteTopLevelHeading(content: string): string {
  return content.replace(/^# /, '### ')
}

function readSection(
  sectionsDir: string,
  section: typeof sectionPlan[number],
): { title: string; content: string } {
  const source = readFileSync(join(sectionsDir, section.filename), 'utf8')
  return {
    title: section.title,
    content: section.extract === 'abstract'
      ? extractAbstractAndKeywords(source)
      : extractDraftSection(source),
  }
}

function extractAbstractAndKeywords(source: string): string {
  const abstract = extractBetweenHeadings(source, '## Draft Abstract')
  const keywords = extractBetweenHeadings(source, '## Keywords')
  return [
    abstract,
    '',
    '## Keywords',
    '',
    keywords,
  ].filter(Boolean).join('\n')
}

function extractDraftSection(source: string): string {
  return extractBetweenHeadings(source, '## Draft')
}

function extractBetweenHeadings(source: string, heading: string): string {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex(line => line.trim() === heading)
  if (start === -1) return stripTopHeading(source)

  const collected: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ') && collected.some(line => line.trim() !== '')) break
    collected.push(lines[i])
  }
  return collected.join('\n').trim()
}

function stripTopHeading(source: string): string {
  return source
    .split(/\r?\n/)
    .filter((line, index) => !(index === 0 && line.startsWith('# ')))
    .join('\n')
    .trim()
}

function countMarkers(text: string): ManuscriptMarkerCounts {
  return {
    NEED_SOURCE: countOccurrences(text, '[NEED_SOURCE]'),
    UNCERTAIN: countOccurrences(text, '[UNCERTAIN]'),
    NEED_EXPERIMENT: countOccurrences(text, '[NEED_EXPERIMENT]'),
    DO_NOT_SUBMIT: countOccurrences(text, '[DO_NOT_SUBMIT]'),
    AUTHOR_DECISION: countOccurrences(text, '[AUTHOR_DECISION]'),
  }
}

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
