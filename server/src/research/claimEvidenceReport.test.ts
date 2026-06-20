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
import { writeClaimEvidenceReport } from './claimEvidenceReport'

describe('claimEvidenceReport', () => {
  it('passes when all Abstract/Introduction claims have required evidence artifacts', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-claim-evidence-'))

    try {
      writeRequiredArtifacts(rootDir)
      const result = writeClaimEvidenceReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'claim-evidence'),
      })

      expect(result.report.status).toBe('pass')
      expect(result.report.facts.needsEvidenceCount).toBe(0)
      expect(result.report.facts.claimCount).toBeGreaterThan(5)
      expect(result.report.claims.some(claim => claim.status === 'scope_limited')).toBe(true)

      const markdown = readFileSync(result.markdownPath, 'utf8')
      expect(markdown).toContain('# Claim-Evidence Report')
      expect(markdown).toContain('pilot-parse-and-revision-numbers')
      expect(markdown).toContain('Always report the 32-trace denominator')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it('requires evidence before allowing a major claim to pass', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'guandan-claim-evidence-missing-'))

    try {
      writeRequiredArtifacts(rootDir)
      rmSync(join(rootDir, 'experiments', 'pilot-e7-tom-prompted-results', 'metrics.json'), { force: true })

      const result = writeClaimEvidenceReport({
        researchRoot: rootDir,
        outputDir: join(rootDir, 'submission', 'claim-evidence'),
      })

      expect(result.report.status).toBe('needs_revision')
      expect(result.report.facts.needsEvidenceCount).toBeGreaterThan(0)
      const pilotClaim = result.report.claims.find(claim => claim.id === 'pilot-parse-and-revision-numbers')
      expect(pilotClaim?.status).toBe('needs_evidence')
      expect(pilotClaim?.scopeBoundary).toContain('experiments/pilot-e7-tom-prompted-results/metrics.json')
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })
})

function writeRequiredArtifacts(rootDir: string): void {
  for (const file of [
    'experiments/pilot-metrics-summary/pilot-metrics-summary.json',
    'experiments/pilot-verifier-attribution/verifier-attribution.json',
    'submission/aamas-latex/main.tex',
    'schemas/decision-point.schema.json',
    'schemas/reasoning-trace.schema.json',
    'experiments/pilot-e1/manifest.json',
    'experiments/full-e1/manifest.json',
    'server/src/research/reasoningVerifier.ts',
    'server/src/research/reasoningVerifier.test.ts',
    'experiments/pilot-e2-heuristic-verifier/metrics.json',
    'experiments/pilot-e3-strategic-heuristic/metrics.json',
    'notes/knowledge_base.md',
    'notes/literature_matrix.csv',
    'submission/references.bib',
    'experiments/pilot-e4-plain-llm-results/metrics.json',
    'experiments/pilot-e5-candidate-constrained-results/metrics.json',
    'experiments/pilot-e7-tom-prompted-results/metrics.json',
    'experiments/pilot-e6-verifier-revision-results/metrics.json',
    'experiments/pilot-revision-comparison/revision-comparison.json',
    'experiments/pilot-ablation-summary/ablation-summary.json',
    'tables/table-3-verifier-ablation.md',
    'experiments/full-e4-tom-prompted-results/metrics.json',
    'experiments/full-e5-tom-schema-repair-results/metrics.json',
    'experiments/full-llm-summary/full-llm-summary.json',
  ]) {
    writeText(rootDir, file, file.endsWith('.tex') ? manuscriptText() : '{}\n')
  }
}

function manuscriptText(): string {
  return [
    'The current evidence is a decision-point reasoning pilot rather than a full-game outcome evaluation.',
    'Future work should add full-game outcome evaluation.',
    'The contribution is diagnostic evidence rather than proof of strategic optimality.',
  ].join('\n')
}

function writeText(rootDir: string, relativePath: string, value: string): void {
  const path = join(rootDir, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, value, 'utf8')
}
