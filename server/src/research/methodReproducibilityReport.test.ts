import { describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { writeMethodReproducibilityReport } from './methodReproducibilityReport'

describe('methodReproducibilityReport', () => {
  it('passes when method text, artifacts, and command scripts align', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-method-repro-pass-'))

    try {
      writeFixtureArtifacts(rootDir)
      writeText(rootDir, 'submission/aamas-latex/main.tex', fullMethodText())

      const result = writeMethodReproducibilityReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'method-reproducibility'),
      })

      expect(result.report.status).toBe('pass')
      expect(result.report.facts.methodSectionPresent).toBe(true)
      expect(result.report.facts.reproducibilitySectionPresent).toBe(true)
      expect(result.report.facts.modulesPassing).toBe(result.report.facts.modulesTotal)
      expect(result.report.modules.find(module => module.id === 'rule-grounded-verifier')?.status).toBe('pass')

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# Method Reproducibility Report')
      expect(markdown).toContain('| Rule-Grounded Verifier | `pass` |')
      expect(markdown).toContain('npm run research:local-pipeline')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('fails when the paper text omits a required method module', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-method-repro-fail-'))

    try {
      writeFixtureArtifacts(rootDir)
      writeText(rootDir, 'submission/aamas-latex/main.tex', [
        '\\section{Method}',
        'The paper mentions decision points and public history, but omits the verifier details.',
        '\\subsection{Reproducibility and Provenance}',
        'The local pipeline and reproducibility manifest regenerate the AAMAS LaTeX draft.',
        '\\section{Discussion and Limitations}',
      ].join('\n'))

      const result = writeMethodReproducibilityReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'method-reproducibility'),
      })

      expect(result.report.status).toBe('needs_revision')
      expect(result.report.modules.some(module => module.status === 'needs_revision')).toBe(true)
      expect(result.report.modules.find(module => module.id === 'rule-grounded-verifier')?.missingTerms).toContain('Rule-Grounded Verifier')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function fullMethodText(): string {
  return [
    '\\section{Method}',
    '\\subsection{Problem Setup}',
    'A decision point includes public history and legal candidate actions. The acting agent returns a selected action.',
    '\\subsection{Decision-Point Exporter}',
    'The decision-point exporter records the public history, private observation boundary, hand counts, and legal candidates.',
    '\\subsection{Structured Reasoning Trace}',
    'The structured reasoning trace contains selected action, team objective, partner belief, opponent belief, action rationale, risk assessment, and confidence.',
    '\\subsection{Rule-Grounded Verifier}',
    'The rule-grounded verifier separates hard checks and soft checks. Hard labels include public-history consistency and hidden-information discipline.',
    '\\subsection{Verifier-Grounded Revision}',
    'Verifier-grounded revision uses verifier feedback under the same labels and paired decision ids. Parse failures remain explicit reliability failures.',
    '\\section{Experiments}',
    'A schema-repair ablation preserves the selected action, improves parse yield, and keeps hard verifier failure counts visible.',
    '\\subsection{Reproducibility and Provenance}',
    'The local pipeline regenerates the reproducibility manifest and AAMAS LaTeX draft.',
    '\\section{Discussion and Limitations}',
  ].join('\n')
}

function writeFixtureArtifacts(rootDir: string): void {
  const researchPaths = [
    'schemas/decision-point.schema.json',
    'schemas/reasoning-trace.schema.json',
    'experiments/pilot-e1/manifest.json',
    'experiments/full-e1/manifest.json',
    'experiments/pilot-e7-tom-prompted-prompts/packets/sample.json',
    'experiments/pilot-verifier-attribution/verifier-attribution.json',
    'experiments/pilot-revision-comparison/revision-comparison.json',
    'experiments/pilot-e6-verifier-revision-results/metrics.json',
    'experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json',
    'experiments/full-e5-tom-schema-repair-results/schema-repair-report.json',
    'submission/reproducibility-manifest.json',
    'submission/local-pipeline/local-research-pipeline-report.json',
    'submission/claim-evidence/claim-evidence-report.json',
  ]
  for (const path of researchPaths) writeText(rootDir, path, '{}\n')
}

function writeText(rootDir: string, relativePath: string, value: string): void {
  const path = join(rootDir, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, value, 'utf8')
}
