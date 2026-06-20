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
import { writeVisualEvidenceReport } from './visualEvidenceReport'

describe('visualEvidenceReport', () => {
  it('marks visual structure ready while external validation evidence is still pending', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-visual-evidence-'))

    try {
      writeManuscript(rootDir, fullManuscript())
      writeFigureSources(rootDir)
      mkdirSync(join(rootDir, 'experiments', 'human-soft-label-audit'), { recursive: true })
      writeFileSync(join(rootDir, 'experiments', 'human-soft-label-audit', 'human-audit-agreement-report.json'), JSON.stringify({
        status: 'pending',
        completedLabels: 0,
        totalLabels: 200,
      }), 'utf8')

      const result = writeVisualEvidenceReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'visual-evidence'),
      })

      expect(result.report.status).toBe('ready_with_external_evidence_pending')
      expect(result.report.facts.figureCount).toBe(5)
      expect(result.report.facts.tableCount).toBe(9)
      expect(result.report.facts.requiredFigureRolesPresent).toBe(5)
      expect(result.report.facts.requiredTableRolesPresent).toBe(9)
      expect(result.report.facts.longFigureCaptionCount).toBe(0)
      expect(result.report.facts.maxFigureCaptionWords).toBeGreaterThan(0)
      expect(result.report.checks.find(check => check.id === 'external-validation-slot')?.status).toBe('external_evidence_pending')
      expect(result.report.checks.find(check => check.id === 'teaser-first-impression')?.status).toBe('pass')
      expect(result.report.checks.find(check => check.id === 'figure-caption-load')?.status).toBe('pass')
      expect(result.report.checks.find(check => check.id === 'rendered-page-assets')?.status).toBe('pass')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('| Figure Role Coverage | `pass` |')
      expect(markdown).toContain('Figure Caption Load')
      expect(markdown).toContain('problem-teaser')
      expect(markdown).toContain('External Validation Slot')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('requires core figure roles before considering visual evidence ready', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-visual-evidence-missing-'))

    try {
      writeManuscript(rootDir, [
        String.raw`\begin{figure}[t]`,
        String.raw`\caption{Only a small auxiliary flow.}`,
        String.raw`\label{fig:aux}`,
        String.raw`\end{figure}`,
        String.raw`\begin{table}[t]`,
        String.raw`\caption{Related-work positioning.}`,
        String.raw`\label{tab:related}`,
        String.raw`\end{table}`,
      ].join('\n'))

      const result = writeVisualEvidenceReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'visual-evidence'),
      })

      expect(result.report.status).toBe('needs_revision')
      expect(result.report.checks.find(check => check.id === 'figure-role-coverage')?.status).toBe('needs_revision')
      expect(result.report.checks.find(check => check.id === 'source-backed-figure-files')?.status).toBe('needs_revision')
      expect(result.report.checks.find(check => check.id === 'teaser-first-impression')?.status).toBe('needs_revision')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('checks rendered page assets against the LaTeX build page count', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-visual-evidence-rendered-pages-'))

    try {
      writeManuscript(rootDir, fullManuscript())
      writeFigureSources(rootDir)
      const latexDir = join(rootDir, 'submission', 'aamas-latex')
      writeFileSync(join(latexDir, 'build-status.md'), '- Page count: 3 pages total in review layout\n', 'utf8')
      const renderDir = join(latexDir, 'page-renders')
      mkdirSync(renderDir, { recursive: true })
      writeFileSync(join(renderDir, 'page-1.png'), 'png\n', 'utf8')
      writeFileSync(join(renderDir, 'page-3.png'), 'png\n', 'utf8')

      const result = writeVisualEvidenceReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'visual-evidence'),
      })

      expect(result.report.status).toBe('needs_revision')
      expect(result.report.facts.renderedPageImagesPresent).toBe(2)
      expect(result.report.facts.renderedPageImagesTotal).toBe(3)
      expect(result.report.checks.find(check => check.id === 'rendered-page-assets')?.status).toBe('needs_revision')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeManuscript(rootDir: string, content: string): void {
  const dir = join(rootDir, 'submission', 'aamas-latex')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'main.tex'), content, 'utf8')
}

function writeFigureSources(rootDir: string): void {
  const dir = join(rootDir, 'figures')
  mkdirSync(dir, { recursive: true })
  for (const file of [
    'figure-1-verifier-pipeline.svg',
    'figure-1-verifier-pipeline.png',
    'figure-1-verifier-pipeline.md',
    'figure-2-revision-architecture.svg',
    'figure-2-revision-architecture.md',
    'figure-3-tom-schema-repair-flow.svg',
    'figure-3-tom-schema-repair-flow.md',
    'figure-4-main-pilot-results.svg',
    'figure-4-main-pilot-results.md',
    'figure-5-qualitative-case-pack.svg',
    'figure-5-qualitative-case-pack.md',
  ]) {
    writeFileSync(join(dir, file), 'figure source\n', 'utf8')
  }
}

function fullManuscript(): string {
  return [
    figure('fig:pipeline', 'Verifiable multi-agent reasoning under zero communication with parse evidence.'),
    table('tab:related', 'Related-work positioning.'),
    table('tab:trace-schema', 'Structured reasoning trace schema.'),
    table('tab:label-taxonomy', 'Verifier label taxonomy.'),
    figure('fig:revision-architecture', 'Verifier-grounded revision architecture with paired denominator.'),
    table('tab:accounting', 'End-to-end accounting with parse failures and 32 eligible traces.'),
    figure('fig:tom-schema-flow', 'ToM schema-repair flow preserves hard verifier failure visibility.'),
    figure('fig:main-pilot-results', 'Main pilot results separate parse yield, 32 eligible paired revision, and hard failures.'),
    table('tab:revision', 'Verifier-revision effect on the 32 eligible candidate traces.'),
    table('tab:label-ablation', 'Post-hoc verifier-label ablation.'),
    figure('fig:case-pack', 'Qualitative verifier-attribution case pack.'),
    table('tab:provenance', 'Current provenance boundary with pending human-audit evidence.'),
    table('tab:full-baseline', 'Full-split substrate and 500-decision ToM LLM evidence.'),
    table('tab:full-protocol', 'Protocol reserved for the full AAMAS empirical package.'),
  ].join('\n')
}

function figure(label: string, caption: string): string {
  return [
    String.raw`\begin{figure*}[t]`,
    String.raw`\caption{${caption}}`,
    String.raw`\label{${label}}`,
    String.raw`\end{figure*}`,
  ].join('\n')
}

function table(label: string, caption: string): string {
  return [
    String.raw`\begin{table}[t]`,
    String.raw`\caption{${caption}}`,
    String.raw`\label{${label}}`,
    String.raw`\end{table}`,
  ].join('\n')
}
