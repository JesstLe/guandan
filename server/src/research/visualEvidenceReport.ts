import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type VisualEvidenceCheckStatus = 'pass' | 'needs_revision' | 'external_evidence_pending'
export type VisualEvidenceReportStatus = 'ready' | 'needs_revision' | 'ready_with_external_evidence_pending'

export interface VisualEvidenceReportOptions {
  researchRoot: string
  outputDir: string
}

export interface VisualEvidenceItem {
  kind: 'figure' | 'table'
  label: string
  caption: string
  line: number
  role: string
  captionWords: number
}

export interface VisualEvidenceCheck {
  id: string
  title: string
  status: VisualEvidenceCheckStatus
  finding: string
  requiredAction: string
}

export interface VisualEvidenceReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: VisualEvidenceReportStatus
  manuscriptPath: string
  facts: {
    figureCount: number
    tableCount: number
    wideFigureCount: number
    requiredFigureRolesPresent: number
    requiredFigureRolesTotal: number
    requiredTableRolesPresent: number
    requiredTableRolesTotal: number
    figureSourceFilesPresent: number
    figureSourceFilesTotal: number
    maxFigureCaptionWords: number
    averageFigureCaptionWords: number
    longFigureCaptionCount: number
    renderedPageImagesPresent: number
    renderedPageImagesTotal: number
  }
  figures: VisualEvidenceItem[]
  tables: VisualEvidenceItem[]
  checks: VisualEvidenceCheck[]
}

export interface VisualEvidenceReportResult {
  jsonPath: string
  markdownPath: string
  report: VisualEvidenceReport
}

interface ParsedFloat {
  kind: 'figure' | 'table'
  wide: boolean
  line: number
  label: string | null
  caption: string | null
}

const requiredFigureRoles = [
  'problem-teaser',
  'method-architecture',
  'schema-repair-flow',
  'main-results',
  'qualitative-case-pack',
]

const requiredTableRoles = [
  'related-work-positioning',
  'trace-schema',
  'label-taxonomy',
  'end-to-end-accounting',
  'revision-effect',
  'label-ablation',
  'provenance-boundary',
  'full-split-evidence',
  'full-evaluation-protocol',
]

const figureSourceFiles = [
  'figures/figure-1-verifier-pipeline.svg',
  'figures/figure-1-verifier-pipeline.png',
  'figures/figure-1-verifier-pipeline.md',
  'figures/figure-2-revision-architecture.svg',
  'figures/figure-2-revision-architecture.md',
  'figures/figure-3-tom-schema-repair-flow.svg',
  'figures/figure-3-tom-schema-repair-flow.md',
  'figures/figure-4-main-pilot-results.svg',
  'figures/figure-4-main-pilot-results.md',
  'figures/figure-5-qualitative-case-pack.svg',
  'figures/figure-5-qualitative-case-pack.md',
]

export function writeVisualEvidenceReport(options: VisualEvidenceReportOptions): VisualEvidenceReportResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildVisualEvidenceReport(options.researchRoot)
  const jsonPath = join(options.outputDir, 'visual-evidence-report.json')
  const markdownPath = join(options.outputDir, 'visual-evidence-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderVisualEvidenceReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildVisualEvidenceReport(researchRoot: string): VisualEvidenceReport {
  const manuscriptPath = 'submission/aamas-latex/main.tex'
  const manuscript = readFileSync(join(researchRoot, manuscriptPath), 'utf8')
  const floats = parseLatexFloats(manuscript)
  const figures = floats
    .filter(float => float.kind === 'figure')
    .map(float => toVisualEvidenceItem(float))
  const tables = floats
    .filter(float => float.kind === 'table')
    .map(float => toVisualEvidenceItem(float))

  const presentFigureRoles = new Set(figures.map(figure => figure.role))
  const presentTableRoles = new Set(tables.map(table => table.role))
  const sourceFilesPresent = figureSourceFiles.filter(path => existsSync(join(researchRoot, path))).length
  const renderedPages = countRenderedPageImages(researchRoot)
  const secondProviderMetricsPresent = existsSync(join(researchRoot, 'experiments/pilot-replication/second-provider-tom-prompted-results/metrics.json'))
  const humanAgreement = readJsonOptional<{ status?: string }>(researchRoot, 'experiments/human-soft-label-audit/human-audit-agreement-report.json')
  const maxFigureCaptionWords = Math.max(0, ...figures.map(figure => figure.captionWords))
  const averageFigureCaptionWords = figures.length === 0
    ? 0
    : figures.reduce((sum, figure) => sum + figure.captionWords, 0) / figures.length
  const longFigureCaptionCount = figures.filter(figure => figure.captionWords > 80).length
  const teaser = figures.find(figure => figure.role === 'problem-teaser')
  const checks: VisualEvidenceCheck[] = [
    {
      id: 'figure-role-coverage',
      title: 'Figure Role Coverage',
      status: requiredFigureRoles.every(role => presentFigureRoles.has(role)) ? 'pass' : 'needs_revision',
      finding: `${countPresent(requiredFigureRoles, presentFigureRoles)}/${requiredFigureRoles.length} required figure roles are present: ${requiredFigureRoles.join(', ')}.`,
      requiredAction: 'Keep at least one visual for the problem teaser, method architecture, schema-repair flow, main results, and qualitative case pack.',
    },
    {
      id: 'table-role-coverage',
      title: 'Table Role Coverage',
      status: requiredTableRoles.every(role => presentTableRoles.has(role)) ? 'pass' : 'needs_revision',
      finding: `${countPresent(requiredTableRoles, presentTableRoles)}/${requiredTableRoles.length} required table roles are present: ${requiredTableRoles.join(', ')}.`,
      requiredAction: 'Preserve compact tables for related work, schema/taxonomy, accounting, revision, ablation, provenance, full-split evidence, and protocol boundaries.',
    },
    {
      id: 'source-backed-figure-files',
      title: 'Source-Backed Figure Files',
      status: sourceFilesPresent === figureSourceFiles.length ? 'pass' : 'needs_revision',
      finding: `${sourceFilesPresent}/${figureSourceFiles.length} expected generated figure source files are present under docs/research/figures.`,
      requiredAction: 'Regenerate figure artifacts before treating the manuscript visuals as reproducible.',
    },
    {
      id: 'teaser-first-impression',
      title: 'Teaser First Impression',
      status: teaser && figures[0]?.role === 'problem-teaser' && teaser.line <= 160 ? 'pass' : 'needs_revision',
      finding: teaser
        ? `The problem-teaser figure appears as the first figure at LaTeX line ${teaser.line}.`
        : 'No problem-teaser figure is detected.',
      requiredAction: 'Keep the zero-communication teaser as the first figure near the end of the introduction so reviewers see the problem-method-evidence story early.',
    },
    {
      id: 'figure-caption-load',
      title: 'Figure Caption Load',
      status: longFigureCaptionCount === 0 && averageFigureCaptionWords <= 60 ? 'pass' : 'needs_revision',
      finding: `Figure captions average ${formatOneDecimal(averageFigureCaptionWords)} words; max is ${maxFigureCaptionWords}, with ${longFigureCaptionCount} captions over 80 words.`,
      requiredAction: 'Keep figure captions explanatory but scan-friendly; move protocol detail into prose or tables when captions exceed roughly 80 words.',
    },
    {
      id: 'rendered-page-assets',
      title: 'Rendered Page Assets',
      status: renderedPages.expected === 0 || renderedPages.present === renderedPages.expected ? 'pass' : 'needs_revision',
      finding: renderedPages.expected === 0
        ? 'No page-count expectation was found in the LaTeX build status; rendered page coverage was not evaluated.'
        : `${renderedPages.present}/${renderedPages.expected} rendered page images are present under submission/aamas-latex/page-renders.`,
      requiredAction: 'Render every PDF page after visual edits so figure placement, table density, and caption legibility can be inspected from PNGs.',
    },
    {
      id: 'denominator-and-provenance-visibility',
      title: 'Denominator and Provenance Visibility',
      status: hasDenominatorAndProvenance(figures, tables) ? 'pass' : 'needs_revision',
      finding: hasDenominatorAndProvenance(figures, tables)
        ? 'Main results, accounting, and provenance visuals/tables expose parseability, paired denominators, full-split ToM evidence, and pending audit boundaries.'
        : 'The manuscript does not yet make denominator or provenance boundaries visible enough for reviewer-facing evidence.',
      requiredAction: 'Keep paired denominators, parse failures, full-split evidence, and pending evidence boundaries visible in captions or tables.',
    },
    {
      id: 'external-validation-slot',
      title: 'External Validation Slot',
      status: secondProviderMetricsPresent || humanAgreement?.status === 'completed' ? 'pass' : 'external_evidence_pending',
      finding: secondProviderMetricsPresent
        ? 'Second-provider pilot replication metrics are present and can be reflected in the main visual evidence package.'
        : humanAgreement?.status === 'completed'
          ? 'Human soft-label agreement is completed and can be reflected in the main evidence package.'
          : 'The visual package has a provenance/protocol slot for external validation, but second-provider metrics and completed human-audit agreement are still pending.',
      requiredAction: 'After second-provider replication or human agreement completes, add it to the main results/provenance visual rather than only leaving it in protocol text.',
    },
  ]

  const status: VisualEvidenceReportStatus = checks.some(check => check.status === 'needs_revision')
    ? 'needs_revision'
    : checks.some(check => check.status === 'external_evidence_pending')
      ? 'ready_with_external_evidence_pending'
      : 'ready'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    manuscriptPath,
    facts: {
      figureCount: figures.length,
      tableCount: tables.length,
      wideFigureCount: floats.filter(float => float.kind === 'figure' && float.wide).length,
      requiredFigureRolesPresent: countPresent(requiredFigureRoles, presentFigureRoles),
      requiredFigureRolesTotal: requiredFigureRoles.length,
      requiredTableRolesPresent: countPresent(requiredTableRoles, presentTableRoles),
      requiredTableRolesTotal: requiredTableRoles.length,
      figureSourceFilesPresent: sourceFilesPresent,
      figureSourceFilesTotal: figureSourceFiles.length,
      maxFigureCaptionWords,
      averageFigureCaptionWords,
      longFigureCaptionCount,
      renderedPageImagesPresent: renderedPages.present,
      renderedPageImagesTotal: renderedPages.expected,
    },
    figures,
    tables,
    checks,
  }
}

export function renderVisualEvidenceReport(report: VisualEvidenceReport): string {
  return [
    '# Visual Evidence Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    `Manuscript: \`${report.manuscriptPath}\``,
    '',
    '## Facts',
    '',
    `- Figures: ${report.facts.figureCount} total, ${report.facts.wideFigureCount} wide`,
    `- Tables: ${report.facts.tableCount}`,
    `- Required figure roles: ${report.facts.requiredFigureRolesPresent}/${report.facts.requiredFigureRolesTotal}`,
    `- Required table roles: ${report.facts.requiredTableRolesPresent}/${report.facts.requiredTableRolesTotal}`,
    `- Generated figure source files: ${report.facts.figureSourceFilesPresent}/${report.facts.figureSourceFilesTotal}`,
    `- Figure caption load: avg ${formatOneDecimal(report.facts.averageFigureCaptionWords)} words, max ${report.facts.maxFigureCaptionWords}, long captions ${report.facts.longFigureCaptionCount}`,
    `- Rendered page images: ${report.facts.renderedPageImagesPresent}/${report.facts.renderedPageImagesTotal}`,
    '',
    '## Checks',
    '',
    '| Check | Status | Finding | Required Action |',
    '| --- | --- | --- | --- |',
    ...report.checks.map(check => `| ${escapeMarkdownCell(check.title)} | \`${check.status}\` | ${escapeMarkdownCell(check.finding)} | ${escapeMarkdownCell(check.requiredAction)} |`),
    '',
    '## Figures',
    '',
    '| Label | Role | Line | Caption Words | Caption |',
    '| --- | --- | ---: | ---: | --- |',
    ...report.figures.map(figure => `| \`${figure.label}\` | ${figure.role} | ${figure.line} | ${figure.captionWords} | ${escapeMarkdownCell(figure.caption)} |`),
    '',
    '## Tables',
    '',
    '| Label | Role | Line | Caption Words | Caption |',
    '| --- | --- | ---: | ---: | --- |',
    ...report.tables.map(table => `| \`${table.label}\` | ${table.role} | ${table.line} | ${table.captionWords} | ${escapeMarkdownCell(table.caption)} |`),
    '',
  ].join('\n')
}

function parseLatexFloats(source: string): ParsedFloat[] {
  const lines = source.split(/\r?\n/)
  const floats: ParsedFloat[] = []
  let current: ParsedFloat | null = null

  lines.forEach((line, index) => {
    const begin = /\\begin\{(figure|table)\*?\}/.exec(line)
    if (begin) {
      current = {
        kind: begin[1] as 'figure' | 'table',
        wide: line.includes('*}'),
        line: index + 1,
        label: null,
        caption: null,
      }
    }
    if (!current) return

    const caption = /\\caption\{(.+)\}/.exec(line)
    if (caption) current.caption = caption[1]
    const label = /\\label\{([^}]+)\}/.exec(line)
    if (label) current.label = label[1]
    if (line.includes(`\\end{${current.kind}}`) || line.includes(`\\end{${current.kind}*}`)) {
      floats.push(current)
      current = null
    }
  })

  return floats
}

function toVisualEvidenceItem(float: ParsedFloat): VisualEvidenceItem {
  const label = float.label ?? 'missing-label'
  const caption = float.caption ?? 'missing caption'
  return {
    kind: float.kind,
    label,
    caption,
    line: float.line,
    role: float.kind === 'figure' ? classifyFigure(label, caption) : classifyTable(label, caption),
    captionWords: countCaptionWords(caption),
  }
}

function classifyFigure(label: string, caption: string): string {
  const text = `${label} ${caption}`.toLowerCase()
  if (text.includes('fig:pipeline')) return 'problem-teaser'
  if (text.includes('revision-architecture')) return 'method-architecture'
  if (text.includes('schema-flow') || text.includes('schema-repair')) return 'schema-repair-flow'
  if (text.includes('main-pilot-results') || text.includes('main pilot results')) return 'main-results'
  if (text.includes('case-pack') || text.includes('qualitative')) return 'qualitative-case-pack'
  return 'other'
}

function classifyTable(label: string, caption: string): string {
  const text = `${label} ${caption}`.toLowerCase()
  if (text.includes('tab:related')) return 'related-work-positioning'
  if (text.includes('trace-schema')) return 'trace-schema'
  if (text.includes('label-taxonomy')) return 'label-taxonomy'
  if (text.includes('label-ablation')) return 'label-ablation'
  if (text.includes('accounting')) return 'end-to-end-accounting'
  if (text.includes('tab:revision') || text.includes('revision effect')) return 'revision-effect'
  if (text.includes('provenance')) return 'provenance-boundary'
  if (text.includes('full-baseline') || text.includes('full-split')) return 'full-split-evidence'
  if (text.includes('full-protocol') || text.includes('protocol')) return 'full-evaluation-protocol'
  return 'other'
}

function hasDenominatorAndProvenance(figures: VisualEvidenceItem[], tables: VisualEvidenceItem[]): boolean {
  const text = [...figures, ...tables].map(item => `${item.label} ${item.caption}`).join('\n').toLowerCase()
  return text.includes('32 eligible')
    && text.includes('parse')
    && text.includes('provenance')
    && text.includes('pending')
    && text.includes('500-decision')
}

function countPresent(required: string[], present: Set<string>): number {
  return required.filter(role => present.has(role)).length
}

function countCaptionWords(caption: string): number {
  return caption.match(/[A-Za-z0-9%]+(?:[-'][A-Za-z0-9%]+)?/g)?.length ?? 0
}

function countRenderedPageImages(researchRoot: string): { expected: number; present: number } {
  const expected = readPageCountFromBuildStatus(researchRoot)
  if (expected === 0) return { expected: 0, present: 0 }
  let present = 0
  for (let page = 1; page <= expected; page++) {
    if (existsSync(join(researchRoot, 'submission/aamas-latex/page-renders', `page-${page}.png`))) {
      present += 1
    }
  }
  return { expected, present }
}

function readPageCountFromBuildStatus(researchRoot: string): number {
  const path = join(researchRoot, 'submission/aamas-latex/build-status.md')
  if (!existsSync(path)) return 0
  const text = readFileSync(path, 'utf8')
  const match = text.match(/Page count:\s*(\d+)\s+pages/i)
  return match ? Number(match[1]) : 0
}

function readJsonOptional<T>(researchRoot: string, relativePath: string): T | null {
  const path = join(researchRoot, relativePath)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function formatOneDecimal(value: number): string {
  return String(Math.round(value * 10) / 10)
}
