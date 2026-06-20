import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type MethodReproducibilityStatus = 'pass' | 'needs_revision'

export interface MethodReproducibilityReportOptions {
  researchRoot: string
  outputDir: string
}

export interface MethodModuleCheck {
  id: string
  title: string
  status: MethodReproducibilityStatus
  termsPresent: number
  termsTotal: number
  artifactsPresent: number
  artifactsTotal: number
  commandsPresent: number
  commandsTotal: number
  missingTerms: string[]
  missingArtifacts: string[]
  missingCommands: string[]
  artifactPaths: string[]
  commands: string[]
  requiredAction: string
}

export interface MethodReproducibilityReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: MethodReproducibilityStatus
  manuscriptPath: string
  checkedTextScope: string
  facts: {
    methodSectionPresent: boolean
    reproducibilitySectionPresent: boolean
    modulesPassing: number
    modulesTotal: number
    termsPresent: number
    termsTotal: number
    artifactsPresent: number
    artifactsTotal: number
    commandsPresent: number
    commandsTotal: number
  }
  modules: MethodModuleCheck[]
}

export interface MethodReproducibilityReportResult {
  jsonPath: string
  markdownPath: string
  report: MethodReproducibilityReport
}

interface ModuleSpec {
  id: string
  title: string
  termGroups: string[][]
  artifactPaths: string[]
  commands: string[]
  requiredAction: string
}

const moduleSpecs: ModuleSpec[] = [
  {
    id: 'decision-point-exporter',
    title: 'Decision-Point Exporter',
    termGroups: [
      ['Decision-Point Exporter', 'decision-point exporter'],
      ['decision point'],
      ['public history'],
      ['legal candidate actions', 'legal candidates'],
    ],
    artifactPaths: [
      'schemas/decision-point.schema.json',
      'experiments/pilot-e1/manifest.json',
      'experiments/full-e1/manifest.json',
    ],
    commands: [
      'npx tsx server/src/research/exportPilotDatasetCli.ts --out docs/research/experiments/pilot-e1 --count 50 --prefix pilot-e1',
    ],
    requiredAction: 'Describe the exported decision-point record, public-history boundary, legal candidates, and the dataset generation command.',
  },
  {
    id: 'structured-reasoning-trace',
    title: 'Structured Reasoning Trace',
    termGroups: [
      ['Structured Reasoning Trace', 'structured reasoning trace'],
      ['selected action'],
      ['team objective'],
      ['partner belief'],
      ['opponent belief'],
      ['risk assessment'],
    ],
    artifactPaths: [
      'schemas/reasoning-trace.schema.json',
      'experiments/pilot-e7-tom-prompted-prompts/packets',
    ],
    commands: [
      'npx tsx server/src/research/exportLLMPromptPacketsCli.ts --out docs/research/experiments/pilot-e7-tom-prompted-prompts --condition tom-prompted-llm',
    ],
    requiredAction: 'Expose the trace schema fields and the prompt-packet generation command needed to reproduce model inputs.',
  },
  {
    id: 'rule-grounded-verifier',
    title: 'Rule-Grounded Verifier',
    termGroups: [
      ['Rule-Grounded Verifier', 'rule-grounded verifier'],
      ['hard checks'],
      ['soft checks'],
      ['public-history consistency', 'public history consistency'],
      ['hidden-information discipline'],
    ],
    artifactPaths: [
      'server/src/research/reasoningVerifier.ts',
      'server/src/research/reasoningVerifier.test.ts',
      'experiments/pilot-verifier-attribution/verifier-attribution.json',
    ],
    commands: [
      'npx tsx server/src/research/runPilotVerifierCli.ts --decisions docs/research/experiments/pilot-e1/decisions --out docs/research/experiments/pilot-e2-heuristic-verifier',
    ],
    requiredAction: 'Keep hard and soft verifier labels, issue boundaries, source implementation, and verifier execution command visible.',
  },
  {
    id: 'verifier-grounded-revision',
    title: 'Verifier-Grounded Revision',
    termGroups: [
      ['Verifier-Grounded Revision', 'verifier-grounded revision'],
      ['verifier feedback'],
      ['same verifier labels', 'same labels'],
      ['paired decision ids', 'same decision id'],
      ['parse failures remain explicit', 'parse failures remain'],
    ],
    artifactPaths: [
      'experiments/pilot-revision-comparison/revision-comparison.json',
      'experiments/pilot-e6-verifier-revision-results/metrics.json',
    ],
    commands: [
      'npx tsx server/src/research/exportVerifierRevisionPacketsCli.ts --out docs/research/experiments/pilot-e6-verifier-revision-prompts',
      'npx tsx server/src/research/writeRevisionComparisonCli.ts --out docs/research/experiments/pilot-revision-comparison',
    ],
    requiredAction: 'State that revision uses same-id paired traces and provide both packet export and before/after comparison commands.',
  },
  {
    id: 'schema-repair-ablation',
    title: 'ToM Schema-Repair Ablation',
    termGroups: [
      ['schema-repair ablation', 'schema repair'],
      ['preserves the selected action', 'preserves selected actions', 'without changing selectedActionId'],
      ['parse yield'],
      ['hard verifier failure'],
    ],
    artifactPaths: [
      'experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json',
      'experiments/full-e5-tom-schema-repair-results/schema-repair-report.json',
    ],
    commands: [
      'npx tsx server/src/research/runLLMSchemaRepairCli.ts --out docs/research/experiments/pilot-e8-tom-schema-repair-results',
    ],
    requiredAction: 'Preserve the distinction between deterministic schema repair and semantic verifier improvement.',
  },
  {
    id: 'source-backed-artifacts',
    title: 'Source-Backed Artifacts',
    termGroups: [
      ['Reproducibility and Provenance'],
      ['local pipeline'],
      ['reproducibility manifest'],
      ['AAMAS LaTeX draft'],
    ],
    artifactPaths: [
      'submission/reproducibility-manifest.json',
      'submission/local-pipeline/local-research-pipeline-report.json',
      'submission/claim-evidence/claim-evidence-report.json',
    ],
    commands: [
      'npm run research:local-pipeline -- --report-dir docs/research/submission/local-pipeline',
    ],
    requiredAction: 'Keep the paper-facing artifacts tied to regenerated reports rather than hand-copied values.',
  },
]

export function writeMethodReproducibilityReport(options: MethodReproducibilityReportOptions): MethodReproducibilityReportResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildMethodReproducibilityReport(options.researchRoot)
  const jsonPath = join(options.outputDir, 'method-reproducibility-report.json')
  const markdownPath = join(options.outputDir, 'method-reproducibility-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderMethodReproducibilityReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildMethodReproducibilityReport(researchRoot: string): MethodReproducibilityReport {
  const manuscriptPath = 'submission/aamas-latex/main.tex'
  const manuscript = readTextOptional(researchRoot, manuscriptPath) ?? ''
  const checkedText = extractCheckedText(manuscript)
  const normalizedText = normalizeText(checkedText)
  const modules = moduleSpecs.map(spec => evaluateModule(researchRoot, normalizedText, spec))
  const termsPresent = modules.reduce((sum, module) => sum + module.termsPresent, 0)
  const termsTotal = modules.reduce((sum, module) => sum + module.termsTotal, 0)
  const artifactsPresent = modules.reduce((sum, module) => sum + module.artifactsPresent, 0)
  const artifactsTotal = modules.reduce((sum, module) => sum + module.artifactsTotal, 0)
  const commandsPresent = modules.reduce((sum, module) => sum + module.commandsPresent, 0)
  const commandsTotal = modules.reduce((sum, module) => sum + module.commandsTotal, 0)
  const modulesPassing = modules.filter(module => module.status === 'pass').length
  const methodSectionPresent = /\\section\{Method\}/.test(manuscript)
  const reproducibilitySectionPresent = /\\subsection\{Reproducibility and Provenance\}/.test(manuscript)

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status: methodSectionPresent
      && reproducibilitySectionPresent
      && modulesPassing === modules.length
      ? 'pass'
      : 'needs_revision',
    manuscriptPath,
    checkedTextScope: 'Method through Full-Evaluation Protocol, plus Reproducibility and Provenance when present',
    facts: {
      methodSectionPresent,
      reproducibilitySectionPresent,
      modulesPassing,
      modulesTotal: modules.length,
      termsPresent,
      termsTotal,
      artifactsPresent,
      artifactsTotal,
      commandsPresent,
      commandsTotal,
    },
    modules,
  }
}

export function renderMethodReproducibilityReport(report: MethodReproducibilityReport): string {
  return [
    '# Method Reproducibility Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    '',
    `Manuscript: \`${report.manuscriptPath}\``,
    '',
    `Checked text scope: ${report.checkedTextScope}`,
    '',
    '## Facts',
    '',
    `- Method section present: ${report.facts.methodSectionPresent ? 'yes' : 'no'}`,
    `- Reproducibility section present: ${report.facts.reproducibilitySectionPresent ? 'yes' : 'no'}`,
    `- Modules passing: ${report.facts.modulesPassing}/${report.facts.modulesTotal}`,
    `- Method terms present: ${report.facts.termsPresent}/${report.facts.termsTotal}`,
    `- Artifacts present: ${report.facts.artifactsPresent}/${report.facts.artifactsTotal}`,
    `- Commands present: ${report.facts.commandsPresent}/${report.facts.commandsTotal}`,
    '',
    '## Modules',
    '',
    '| Module | Status | Terms | Artifacts | Commands | Missing | Required Action |',
    '| --- | --- | ---: | ---: | ---: | --- | --- |',
    ...report.modules.map(module => [
      module.title,
      `\`${module.status}\``,
      `${module.termsPresent}/${module.termsTotal}`,
      `${module.artifactsPresent}/${module.artifactsTotal}`,
      `${module.commandsPresent}/${module.commandsTotal}`,
      formatMissing(module),
      module.requiredAction,
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Reproduction Commands',
    '',
    ...report.modules.flatMap(module => [
      `### ${module.title}`,
      '',
      ...module.commands.map(command => `- \`${command}\``),
      '',
    ]),
  ].join('\n')
}

function evaluateModule(researchRoot: string, normalizedText: string, spec: ModuleSpec): MethodModuleCheck {
  const missingTerms = spec.termGroups
    .filter(group => !group.some(term => normalizedText.includes(normalizeText(term))))
    .map(group => group[0])
  const missingArtifacts = spec.artifactPaths.filter(path => !evidenceExists(researchRoot, path))
  const missingCommands = spec.commands.filter(command => !commandExists(command))
  const status: MethodReproducibilityStatus = missingTerms.length === 0
    && missingArtifacts.length === 0
    && missingCommands.length === 0
    ? 'pass'
    : 'needs_revision'

  return {
    id: spec.id,
    title: spec.title,
    status,
    termsPresent: spec.termGroups.length - missingTerms.length,
    termsTotal: spec.termGroups.length,
    artifactsPresent: spec.artifactPaths.length - missingArtifacts.length,
    artifactsTotal: spec.artifactPaths.length,
    commandsPresent: spec.commands.length - missingCommands.length,
    commandsTotal: spec.commands.length,
    missingTerms,
    missingArtifacts,
    missingCommands,
    artifactPaths: spec.artifactPaths,
    commands: spec.commands,
    requiredAction: status === 'pass'
      ? 'No action required; paper text, artifacts, and command path are aligned.'
      : spec.requiredAction,
  }
}

function extractCheckedText(manuscript: string): string {
  const methodStart = manuscript.indexOf('\\section{Method}')
  if (methodStart === -1) return ''
  const discussionStart = manuscript.indexOf('\\section{Discussion and Limitations}', methodStart)
  return manuscript.slice(methodStart, discussionStart === -1 ? undefined : discussionStart)
}

function evidenceExists(researchRoot: string, relativePath: string): boolean {
  return existsSync(join(researchRoot, relativePath)) || existsSync(relativePath)
}

function commandExists(command: string): boolean {
  const script = command.match(/server\/src\/research\/[A-Za-z0-9]+Cli\.ts/)?.[0]
  if (!script) return command.startsWith('npm run research:local-pipeline')
  return existsSync(script)
}

function readTextOptional(rootDir: string, relativePath: string): string | null {
  const path = join(rootDir, relativePath)
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

function normalizeText(text: string): string {
  return text
    .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?\{([^{}]*)\}/g, ' $1 ')
    .replace(/\\[a-zA-Z]+\*?/g, ' ')
    .replace(/[_{}$^]/g, ' ')
    .replace(/[-]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
}

function formatMissing(module: MethodModuleCheck): string {
  const parts: string[] = []
  if (module.missingTerms.length > 0) parts.push(`terms: ${module.missingTerms.map(term => `\`${term}\``).join(', ')}`)
  if (module.missingArtifacts.length > 0) parts.push(`artifacts: ${module.missingArtifacts.map(path => `\`${path}\``).join(', ')}`)
  if (module.missingCommands.length > 0) parts.push(`commands: ${module.missingCommands.map(command => `\`${command}\``).join(', ')}`)
  return parts.length === 0 ? 'none' : parts.join('<br>')
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}
