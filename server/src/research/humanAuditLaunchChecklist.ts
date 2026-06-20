import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type HumanAuditLaunchStatus = 'ready_to_send' | 'needs_attention' | 'evidence_ready'

export interface HumanAuditLaunchChecklistOptions {
  researchRoot: string
  outputDir: string
}

export interface HumanAuditLaunchChecklistReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  status: HumanAuditLaunchStatus
  facts: {
    packetQualityStatus: string
    annotatorPackageStatus: string
    archiveStatus: string
    intakeStatus: string
    interAnnotatorStatus: string
    agreementStatus: string
    readyForAnnotation: boolean
    readyForPaperEvidence: boolean
    sampleCount: number | null
    totalLabels: number | null
    completedLabels: number | null
    archivePath: string | null
    archiveSha256: string | null
    archiveBytes: number | null
  }
  checks: Array<{
    id: string
    status: 'pass' | 'fail'
    finding: string
  }>
  sendPackage: {
    preferredPath: string | null
    requiredReturnFiles: string[]
    forbiddenFiles: string[]
  }
  nextActions: string[]
}

export interface HumanAuditLaunchChecklistResult {
  jsonPath: string
  markdownPath: string
  report: HumanAuditLaunchChecklistReport
}

interface PacketQualityReport {
  status?: string
  readyForAnnotation?: boolean
  readyForPaperEvidence?: boolean
  sampleCount?: number
  checks?: Array<{ status?: string }>
}

interface PackageManifest {
  status?: string
  sampleCount?: number
  instructions?: {
    referenceFileIncluded?: boolean
    referenceLabelsIncluded?: boolean
    completedCsvName?: string
  }
  checks?: Array<{ status?: string }>
}

interface ArchiveReport {
  status?: string
  archivePath?: string
  bytes?: number
  sha256?: string
  sampleCount?: number
  checks?: Array<{ status?: string }>
}

interface IntakeReport {
  status?: string
  completedLabels?: number
  totalLabels?: number
  returnedCsvPresent?: boolean
  readyForAgreement?: boolean
}

interface InterAnnotatorReport {
  status?: string
  pairedLabels?: number
  totalLabels?: number
}

interface AgreementReport {
  status?: string
  readyForPaperEvidence?: boolean
  completedLabels?: number
  totalLabels?: number
}

export function writeHumanAuditLaunchChecklist(
  options: HumanAuditLaunchChecklistOptions,
): HumanAuditLaunchChecklistResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildHumanAuditLaunchChecklist(options.researchRoot)
  const jsonPath = join(options.outputDir, 'human-audit-launch-checklist.json')
  const markdownPath = join(options.outputDir, 'human-audit-launch-checklist.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderHumanAuditLaunchChecklist(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildHumanAuditLaunchChecklist(researchRoot: string): HumanAuditLaunchChecklistReport {
  const quality = readJsonOptional<PacketQualityReport>(researchRoot, 'experiments/human-soft-label-audit/human-audit-packet-quality-report.json')
  const packageManifest = readJsonOptional<PackageManifest>(researchRoot, 'experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json')
  const archive = readJsonOptional<ArchiveReport>(researchRoot, 'experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.json')
  const intake = readJsonOptional<IntakeReport>(researchRoot, 'experiments/human-soft-label-audit/human-audit-intake-report.json')
  const interAnnotator = readJsonOptional<InterAnnotatorReport>(researchRoot, 'experiments/human-soft-label-audit/human-audit-inter-annotator-agreement-report.json')
  const agreement = readJsonOptional<AgreementReport>(researchRoot, 'experiments/human-soft-label-audit/human-audit-agreement-report.json')

  const sampleCount = quality?.sampleCount ?? packageManifest?.sampleCount ?? archive?.sampleCount ?? null
  const readyForPaperEvidence = agreement?.readyForPaperEvidence === true && agreement.status === 'completed'
  const checks = [
    check('packet-quality-ready', quality?.status === 'packet_ready' && quality.readyForAnnotation === true, `packet-quality status=${quality?.status ?? 'missing'}, readyForAnnotation=${String(quality?.readyForAnnotation ?? false)}`),
    check('blind-package-ready', packageManifest?.status === 'package_ready', `annotator package status=${packageManifest?.status ?? 'missing'}`),
    check('package-excludes-reference', packageManifest?.instructions?.referenceFileIncluded !== true && packageManifest?.instructions?.referenceLabelsIncluded !== true, 'blind package excludes answer key and verifier labels'),
    check('archive-ready', archive?.status === 'archive_ready', `archive status=${archive?.status ?? 'missing'}`),
    check('archive-digest-present', typeof archive?.sha256 === 'string' && /^[a-f0-9]{64}$/.test(archive.sha256), `archive sha256=${archive?.sha256 ?? 'missing'}`),
    check('sample-count-ready', typeof sampleCount === 'number' && sampleCount > 0, `sampleCount=${sampleCount ?? 'missing'}`),
    check('paper-evidence-not-claimed-before-return', readyForPaperEvidence || agreement?.status !== 'completed', `agreement status=${agreement?.status ?? 'missing'}, readyForPaperEvidence=${String(agreement?.readyForPaperEvidence ?? false)}`),
  ]
  const sendReady = checks.every(row => row.status === 'pass')
    && quality?.status === 'packet_ready'
    && packageManifest?.status === 'package_ready'
    && archive?.status === 'archive_ready'
  const status: HumanAuditLaunchStatus = readyForPaperEvidence
    ? 'evidence_ready'
    : sendReady
      ? 'ready_to_send'
      : 'needs_attention'

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    status,
    facts: {
      packetQualityStatus: quality?.status ?? 'missing',
      annotatorPackageStatus: packageManifest?.status ?? 'missing',
      archiveStatus: archive?.status ?? 'missing',
      intakeStatus: intake?.status ?? 'missing',
      interAnnotatorStatus: interAnnotator?.status ?? 'missing',
      agreementStatus: agreement?.status ?? 'missing',
      readyForAnnotation: sendReady,
      readyForPaperEvidence,
      sampleCount,
      totalLabels: agreement?.totalLabels ?? intake?.totalLabels ?? interAnnotator?.totalLabels ?? null,
      completedLabels: agreement?.completedLabels ?? intake?.completedLabels ?? interAnnotator?.pairedLabels ?? null,
      archivePath: archive?.archivePath ?? null,
      archiveSha256: archive?.sha256 ?? null,
      archiveBytes: archive?.bytes ?? null,
    },
    checks,
    sendPackage: {
      preferredPath: archive?.archivePath ?? null,
      requiredReturnFiles: [
        'human-audit-completed-annotations-annotator-a.csv',
        'human-audit-completed-annotations-annotator-b.csv',
        'human-audit-adjudicated-annotations.csv',
      ],
      forbiddenFiles: [
        'human-audit-answer-key.jsonl',
        'human-audit-manifest.json',
        'human-audit-agreement-report.json',
        'human-audit-agreement-report.md',
      ],
    },
    nextActions: deriveNextActions(status, intake, interAnnotator, agreement),
  }
}

export function renderHumanAuditLaunchChecklist(report: HumanAuditLaunchChecklistReport): string {
  return [
    '# Human Audit Launch Checklist',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Status: \`${report.status}\``,
    `Ready for annotation: \`${report.facts.readyForAnnotation}\``,
    `Ready for paper evidence: \`${report.facts.readyForPaperEvidence}\``,
    `Sample count: \`${report.facts.sampleCount ?? 'unknown'}\``,
    `Completed labels: \`${report.facts.completedLabels ?? 0}/${report.facts.totalLabels ?? 'unknown'}\``,
    '',
    '## Package To Send',
    '',
    report.sendPackage.preferredPath ? `Send: \`${report.sendPackage.preferredPath}\`` : 'Send: `missing archive`',
    report.facts.archiveSha256 ? `SHA-256: \`${report.facts.archiveSha256}\`` : 'SHA-256: `missing`',
    '',
    'Do not send:',
    '',
    ...report.sendPackage.forbiddenFiles.map(file => `- \`${file}\``),
    '',
    'Expected return/adjudication files:',
    '',
    ...report.sendPackage.requiredReturnFiles.map(file => `- \`${file}\``),
    '',
    '## Checks',
    '',
    '| Check | Status | Finding |',
    '| --- | --- | --- |',
    ...report.checks.map(row => `| ${row.id} | \`${row.status}\` | ${escapeMarkdownCell(row.finding)} |`),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.map((action, index) => `${index + 1}. ${action}`),
    '',
  ].join('\n')
}

function deriveNextActions(
  status: HumanAuditLaunchStatus,
  intake: IntakeReport | null,
  interAnnotator: InterAnnotatorReport | null,
  agreement: AgreementReport | null,
): string[] {
  if (status === 'needs_attention') {
    return ['Regenerate the packet quality report, blind annotator package, and archive before sending anything to annotators.']
  }
  if (status === 'evidence_ready') {
    return ['Refresh AAMAS readiness, reviewer-response matrix, preflight, and finalizer reports so the completed human audit can be reflected in submission readiness.']
  }
  if (intake?.readyForAgreement) {
    return ['Run the human-audit agreement evaluator and then refresh AAMAS readiness reports.']
  }
  if (interAnnotator?.status && interAnnotator.status !== 'awaiting_returns') {
    return [
      'Resolve any inter-annotator disagreements without using the verifier answer key.',
      'Build the adjudicated annotation CSV and run the agreement evaluator.',
    ]
  }
  if (agreement?.status === 'pending') {
    return [
      'Send the blind archive to two independent annotators.',
      'Save returned files as human-audit-completed-annotations-annotator-a.csv and human-audit-completed-annotations-annotator-b.csv.',
      'Run inter-annotator, adjudication-template, build-adjudicated, intake, and agreement commands after returns arrive.',
    ]
  }
  return ['Send the blind archive to annotators and collect completed CSV returns.']
}

function check(id: string, condition: boolean, finding: string): HumanAuditLaunchChecklistReport['checks'][number] {
  return {
    id,
    status: condition ? 'pass' : 'fail',
    finding,
  }
}

function readJsonOptional<T>(researchRoot: string, relativePath: string): T | null {
  const path = join(researchRoot, relativePath)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
