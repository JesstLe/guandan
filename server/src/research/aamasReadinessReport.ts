import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

export type AAMASReadinessStatus = 'pass' | 'needs_experiment' | 'needs_revision'

export interface AAMASReadinessOptions {
  researchRoot: string
  outputDir: string
}

export interface AAMASReadinessGate {
  id: string
  title: string
  status: AAMASReadinessStatus
  evidence: string[]
  finding: string
  requiredAction: string
}

export interface AAMASReadinessReport {
  schemaVersion: '0.1.0'
  generatedAt: string
  paper: string
  localSubmissionHygiene: 'ready' | 'not_ready'
  aamasFullPaperReadiness: 'not_ready' | 'borderline' | 'ready'
  headline: string
  facts: {
    gateStatus: string
    manifestEntries: number
    manifestMissing: number
    localPipelineStatus: string
    localPipelineSteps: number
    aamasPageCount: number | null
    aamasBodyPages: number | null
    pilot: {
      plainParsed: string
      candidateParsed: string
      tomParsed: string
      tomRepairParsed: string
      verifierRevisionParsed: string
      verifierRevisionHardFailures: string
    }
    fullSplit: {
      decisionPoints: number | null
      deterministicBaselinesHardFailures: number | null
      plainRawPresent: string
      candidateRawPresent: string
      tomRawPresent: string
      tomParsed: string
      tomRepairParsed: string
      tomProviderRun: string
      tomIntegratedInPaper: boolean
    }
  }
  gates: AAMASReadinessGate[]
  nextActions: string[]
}

export interface AAMASReadinessResult {
  jsonPath: string
  markdownPath: string
  report: AAMASReadinessReport
}

interface Metrics {
  totalDecisionPoints?: number
  totalParsedTraces?: number
  totalParsedOutputs?: number
  hardFailureCount?: number
  parseFailureCount?: number
  resultFiles?: string[]
  traceFiles?: string[]
  repairStatusCounts?: {
    passThrough: number
    repaired: number
    notRepairable: number
  }
}

interface GateReport {
  overallStatus?: string
  immediateBlockers?: unknown[]
}

interface Manifest {
  entries?: Array<{ status?: string }>
}

interface PipelineReport {
  status?: string
  steps?: unknown[]
}

interface RawAudit {
  expectedCount?: number
  presentCount?: number
  missingCount?: number
  readyForIngest?: boolean
}

interface ProviderRunReport {
  expectedCount?: number
  attemptedCount?: number
  skippedCount?: number
  writtenCount?: number
  successCount?: number
  errorCount?: number
  pendingSuccessCount?: number
  stoppedAfterError?: boolean
  runner?: string
  model?: string
}

interface HumanAuditManifest {
  sampleCount?: number
  status?: string
  files?: Record<string, string>
}

interface HumanAuditAgreement {
  status?: 'pending' | 'partial' | 'completed'
  sampleCount?: number
  completedRows?: number
  fullyCompletedRows?: number
  completedLabels?: number
  totalLabels?: number
  macroAgreement?: number | null
}

interface HumanAuditInterAnnotatorAgreement {
  status?: 'awaiting_returns' | 'needs_attention' | 'completed'
  sampleCount?: number
  pairedLabels?: number
  totalLabels?: number
  disagreementCount?: number
  macroAgreement?: number | null
  requiresAdjudication?: boolean
  readyForAdjudication?: boolean
}

interface HumanAuditAdjudicationTemplate {
  status?: 'awaiting_returns' | 'needs_attention' | 'ready_for_adjudication' | 'no_adjudication_needed'
  disagreementCount?: number
  templateRows?: number
  readyForAdjudication?: boolean
  checks?: Array<{ status?: string }>
}

interface HumanAuditAdjudicatedAnnotations {
  status?: 'awaiting_returns' | 'needs_adjudication' | 'ready'
  sampleCount?: number
  outputRows?: number
  completedLabels?: number
  totalLabels?: number
  unresolvedDisagreements?: number
  adjudicatedCsvWritten?: boolean
  readyForAgreement?: boolean
  checks?: Array<{ status?: string }>
}

interface HumanAuditPacketQuality {
  status?: 'packet_ready' | 'needs_attention'
  sampleCount?: number
  readyForAnnotation?: boolean
  readyForPaperEvidence?: boolean
  checks?: Array<{ status?: string }>
  warnings?: string[]
}

interface HumanAuditAnnotatorPackage {
  status?: 'package_ready' | 'needs_attention'
  sampleCount?: number
  instructions?: {
    referenceFileIncluded?: boolean
    referenceLabelsIncluded?: boolean
  }
  checks?: Array<{ status?: string }>
}

interface HumanAuditIntake {
  status?: 'awaiting_return' | 'ready_for_agreement' | 'needs_attention'
  returnedCsvPresent?: boolean
  completedLabels?: number
  totalLabels?: number
  readyForAgreement?: boolean
  checks?: Array<{ status?: string }>
}

interface HumanAuditAnnotatorPackageArchive {
  status?: 'archive_ready' | 'needs_attention'
  bytes?: number
  sha256?: string | null
  sampleCount?: number | null
  checks?: Array<{ status?: string }>
}

interface HumanAuditLaunchChecklist {
  status?: 'ready_to_send' | 'needs_attention' | 'evidence_ready'
  facts?: {
    readyForAnnotation?: boolean
    readyForPaperEvidence?: boolean
    sampleCount?: number | null
    completedLabels?: number | null
    totalLabels?: number | null
    archiveSha256?: string | null
  }
  checks?: Array<{ status?: string }>
}

interface HumanAuditEvidenceGate {
  status?: 'needs_attention' | 'awaiting_returns' | 'ready_for_adjudication' | 'needs_adjudication' | 'ready_for_agreement' | 'paper_evidence_ready'
  facts?: {
    sampleCount?: number | null
    totalLabels?: number | null
    completedLabels?: number | null
    annotatorAPresent?: boolean
    annotatorBPresent?: boolean
    pairedLabels?: number | null
    agreementMacroAgreement?: number | null
    readyForPaperEvidence?: boolean
  }
  checks?: Array<{ status?: string }>
  nextActions?: string[]
}

interface PilotReplicationReportFile {
  status?: 'pending_missing_replication' | 'partial' | 'completed'
  completedReplicationCount?: number
  replications?: Array<{
    id?: string
    status?: string
    provider?: string
    model?: string
    successCount?: number | null
    expectedCount?: number | null
    parsedCount?: number | null
    hardFailureCount?: number | null
  }>
  requiredAction?: string
}

interface SecondProviderReplicationPreflight {
  status?: string
  facts?: {
    inputJsonlRows?: number
    promptPacketCount?: number
    independentKeyPresent?: boolean
    secondProviderRows?: number
  }
  blockers?: string[]
}

interface SecondProviderReplicationPackage {
  status?: 'package_ready' | 'needs_attention'
  inputRows?: number
  promptPacketCount?: number
  files?: unknown[]
  readyForExternalRun?: boolean
  readyForPaperEvidence?: boolean
  checks?: Array<{ status?: string }>
}

interface VisualEvidenceReportFile {
  status?: 'ready' | 'needs_revision' | 'ready_with_external_evidence_pending'
  facts?: {
    figureCount?: number
    tableCount?: number
    requiredFigureRolesPresent?: number
    requiredFigureRolesTotal?: number
    requiredTableRolesPresent?: number
    requiredTableRolesTotal?: number
    maxFigureCaptionWords?: number
    averageFigureCaptionWords?: number
    longFigureCaptionCount?: number
    renderedPageImagesPresent?: number
    renderedPageImagesTotal?: number
  }
  checks?: Array<{
    id?: string
    title?: string
    status?: string
    finding?: string
  }>
}

interface PageBudget {
  totalPages: number | null
  bodyPages: number | null
}

export function writeAAMASReadinessReport(options: AAMASReadinessOptions): AAMASReadinessResult {
  mkdirSync(options.outputDir, { recursive: true })
  const report = buildAAMASReadinessReport(options.researchRoot)
  const jsonPath = join(options.outputDir, 'aamas-readiness-report.json')
  const markdownPath = join(options.outputDir, 'aamas-readiness-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  writeFileSync(markdownPath, renderAAMASReadinessReport(report), 'utf8')
  return { jsonPath, markdownPath, report }
}

export function buildAAMASReadinessReport(researchRoot: string): AAMASReadinessReport {
  const gate = readJsonOptional<GateReport>(researchRoot, 'submission/gate-report/submission-gate-report.json')
  const manifest = readJsonOptional<Manifest>(researchRoot, 'submission/reproducibility-manifest.json')
  const pipeline = readJsonOptional<PipelineReport>(researchRoot, 'submission/local-pipeline/local-research-pipeline-report.json')
  const plain = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e4-plain-llm-results/metrics.json')
  const candidate = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e5-candidate-constrained-results/metrics.json')
  const tom = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e7-tom-prompted-results/metrics.json')
  const tomRepair = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e8-tom-schema-repair-results/metrics.json')
  const revision = readJsonOptional<Metrics>(researchRoot, 'experiments/pilot-e6-verifier-revision-results/metrics.json')
  const fullLegal = readJsonOptional<Metrics>(researchRoot, 'experiments/full-e2-heuristic-verifier/metrics.json')
  const fullStrategic = readJsonOptional<Metrics>(researchRoot, 'experiments/full-e3-strategic-heuristic/metrics.json')
  const fullPlainAudit = readJsonOptional<RawAudit>(researchRoot, 'experiments/full-e2-plain-llm-batch/raw-output-audit.json')
  const fullCandidateAudit = readJsonOptional<RawAudit>(researchRoot, 'experiments/full-e3-candidate-constrained-batch/raw-output-audit.json')
  const fullTomAudit = readJsonOptional<RawAudit>(researchRoot, 'experiments/full-e4-tom-prompted-batch/raw-output-audit.json')
  const fullTom = readJsonOptional<Metrics>(researchRoot, 'experiments/full-e4-tom-prompted-results/metrics.json')
  const fullTomRepair = readJsonOptional<Metrics>(researchRoot, 'experiments/full-e5-tom-schema-repair-results/metrics.json')
  const fullTomProviderRun = readJsonOptional<ProviderRunReport>(researchRoot, 'experiments/provider-results/full-tom-prompted-llm-kimi-cli-run-report.json')
  const humanAudit = readJsonOptional<HumanAuditManifest>(researchRoot, 'experiments/human-soft-label-audit/human-audit-manifest.json')
  const humanAuditQuality = readJsonOptional<HumanAuditPacketQuality>(researchRoot, 'experiments/human-soft-label-audit/human-audit-packet-quality-report.json')
  const humanAnnotatorPackage = readJsonOptional<HumanAuditAnnotatorPackage>(researchRoot, 'experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json')
  const humanAnnotatorPackageArchive = readJsonOptional<HumanAuditAnnotatorPackageArchive>(researchRoot, 'experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.json')
  const humanAuditLaunchChecklist = readJsonOptional<HumanAuditLaunchChecklist>(researchRoot, 'submission/human-audit-launch/human-audit-launch-checklist.json')
  const humanAuditEvidenceGate = readJsonOptional<HumanAuditEvidenceGate>(researchRoot, 'submission/human-audit-evidence-gate/human-audit-evidence-gate.json')
  const humanAuditIntake = readJsonOptional<HumanAuditIntake>(researchRoot, 'experiments/human-soft-label-audit/human-audit-intake-report.json')
  const humanInterAnnotatorAgreement = readJsonOptional<HumanAuditInterAnnotatorAgreement>(researchRoot, 'experiments/human-soft-label-audit/human-audit-inter-annotator-agreement-report.json')
  const humanAdjudicationTemplate = readJsonOptional<HumanAuditAdjudicationTemplate>(researchRoot, 'experiments/human-soft-label-audit/human-audit-adjudication-template-report.json')
  const humanAdjudicatedAnnotations = readJsonOptional<HumanAuditAdjudicatedAnnotations>(researchRoot, 'experiments/human-soft-label-audit/human-audit-adjudicated-annotations-report.json')
  const humanAgreement = readJsonOptional<HumanAuditAgreement>(researchRoot, 'experiments/human-soft-label-audit/human-audit-agreement-report.json')
  const pilotReplication = readJsonOptional<PilotReplicationReportFile>(researchRoot, 'experiments/pilot-replication/pilot-replication-report.json')
  const secondProviderPackage = readJsonOptional<SecondProviderReplicationPackage>(researchRoot, 'experiments/pilot-replication/second-provider-replication-package-report.json')
  const secondProviderPreflight = readJsonOptional<SecondProviderReplicationPreflight>(researchRoot, 'experiments/pilot-replication/second-provider-replication-preflight.json')
  const visualEvidence = readJsonOptional<VisualEvidenceReportFile>(researchRoot, 'submission/visual-evidence/visual-evidence-report.json')
  const humanAnnotatorPresent = existsSync(join(researchRoot, 'experiments/human-soft-label-audit/human-audit-annotator.html'))
  const completedHumanAuditFiles = countCompletedHumanAuditFiles(researchRoot)
  const completedHumanAuditEvidence = completedHumanAuditFiles > 0 && humanAgreement?.status === 'completed'
  const completedPilotReplicationEvidence = (pilotReplication?.completedReplicationCount ?? 0) > 0 && pilotReplication?.status === 'completed'
  const replicationOrHumanEvidence = completedHumanAuditEvidence || completedPilotReplicationEvidence
  const pageBudget = readPageBudgetFromBuildStatus(researchRoot)
  const manifestEntries = manifest?.entries?.length ?? 0
  const manifestMissing = manifest?.entries?.filter(entry => entry.status === 'missing').length ?? 0
  const localSubmissionHygiene = gate?.overallStatus === 'ready'
    && manifestMissing === 0
    && pipeline?.status === 'completed'
    ? 'ready'
    : 'not_ready'
  const fullBaselineHardFailures = sumNullable(fullLegal?.hardFailureCount, fullStrategic?.hardFailureCount)
  const fullTomRawAuditReady = hasCompleteRawAudit(fullTomAudit)
  const fullTomMetricsReady = hasCompleteFullSplitMetrics(fullTom)
  const fullTomRepairMetricsReady = hasCompleteFullSplitMetrics(fullTomRepair)
  const fullTomReady = fullTomRawAuditReady && fullTomMetricsReady && fullTomRepairMetricsReady
  const fullTomIntegratedInPaper = hasIntegratedFullTomEvidence(researchRoot)
  const gates: AAMASReadinessGate[] = [
    {
      id: 'local-artifact-hygiene',
      title: 'Local Artifact Hygiene',
      status: localSubmissionHygiene === 'ready' ? 'pass' : 'needs_revision',
      evidence: [
        'submission/gate-report/submission-gate-report.json',
        'submission/reproducibility-manifest.json',
        'submission/local-pipeline/local-research-pipeline-report.json',
      ],
      finding: localSubmissionHygiene === 'ready'
        ? `Local gate is ${gate?.overallStatus ?? 'unknown'}, manifest has ${manifestEntries} entries with ${manifestMissing} missing, and the local pipeline status is ${pipeline?.status ?? 'unknown'}.`
        : 'Local artifact hygiene is not clean enough to support a submission package.',
      requiredAction: localSubmissionHygiene === 'ready'
        ? 'Keep regenerating this report after every experiment or manuscript edit.'
        : 'Fix local blockers before interpreting research readiness.',
    },
    {
      id: 'pilot-evidence',
      title: 'Pilot Evidence and Denominator Accounting',
      status: hasPilotEvidence(plain, candidate, tom, tomRepair, revision) ? 'pass' : 'needs_experiment',
      evidence: [
        'experiments/pilot-metrics-summary/pilot-metrics-summary.json',
        'experiments/pilot-e8-tom-schema-repair-results/metrics.json',
        'figures/figure-3-tom-schema-repair-flow.md',
      ],
      finding: `The pilot now separates provider completion, raw parse yield, schema repair, and verifier failures: ToM raw parse is ${formatParsed(tom)}, schema repair yields ${formatParsed(tomRepair)}, and verifier revision reports ${formatParsed(revision)}.`,
      requiredAction: 'Keep the paper wording scoped to a 50-decision diagnostic pilot unless larger LLM evidence is added.',
    },
    {
      id: 'schema-vs-reasoning-attribution',
      title: 'Schema vs. Reasoning Attribution',
      status: tomRepair?.repairStatusCounts ? 'pass' : 'needs_experiment',
      evidence: [
        'experiments/pilot-e7-tom-failure-analysis/tom-failure-analysis.json',
        'experiments/pilot-e8-tom-schema-repair-results/schema-repair-report.json',
        'experiments/pilot-verifier-attribution/verifier-attribution.json',
      ],
      finding: tomRepair?.repairStatusCounts
        ? `Schema repair passes through ${tomRepair.repairStatusCounts.passThrough}, repairs ${tomRepair.repairStatusCounts.repaired}, leaves ${tomRepair.repairStatusCounts.notRepairable} unrepaired, and preserves the remaining hard verifier failure count at ${tomRepair.hardFailureCount ?? 'unknown'}.`
        : 'The report cannot yet separate schema-interface failures from verifier-visible reasoning failures.',
      requiredAction: 'Use this as a reviewer-facing defense against the claim that all gains are formatting gains.',
    },
    {
      id: 'full-split-substrate',
      title: '500-Decision Substrate',
      status: fullLegal?.totalDecisionPoints === 500 && fullStrategic?.totalDecisionPoints === 500 && fullBaselineHardFailures === 0
        ? 'pass'
        : 'needs_revision',
      evidence: [
        'experiments/full-e1/manifest.json',
        'experiments/full-e2-heuristic-verifier/metrics.json',
        'experiments/full-e3-strategic-heuristic/metrics.json',
      ],
      finding: `The 500-decision substrate is locally executable for deterministic baselines: legal-first hard failures ${fullLegal?.hardFailureCount ?? 'unknown'}, strategic hard failures ${fullStrategic?.hardFailureCount ?? 'unknown'}.`,
      requiredAction: 'Treat these rows as infrastructure validation only; do not use them as LLM evidence.',
    },
    {
      id: 'full-split-llm-evidence',
      title: '500-Decision LLM Evidence',
      status: fullTomReady ? 'pass' : 'needs_experiment',
      evidence: [
        'experiments/full-e4-tom-prompted-results/metrics.json',
        'experiments/full-e4-tom-prompted-results/post-provider-report.json',
        'experiments/provider-results/full-tom-prompted-llm.jsonl',
        'experiments/provider-results/full-tom-prompted-llm-kimi-cli-run-report.json',
        'experiments/full-e2-plain-llm-batch/raw-output-audit.json',
        'experiments/full-e3-candidate-constrained-batch/raw-output-audit.json',
        'experiments/full-e4-tom-prompted-batch/raw-output-audit.json',
      ],
      finding: fullTomReady
        ? `The primary 500-decision ToM full-split condition is present with raw parse ${formatParsed(fullTom)} and schema repair ${formatParsed(fullTomRepair)}. Secondary full-split raw audits are plain ${formatRawAudit(fullPlainAudit)} and candidate ${formatRawAudit(fullCandidateAudit)}. ${formatProviderRunSentence(fullTomProviderRun)}`
        : `Full-split raw output audits show plain ${formatRawAudit(fullPlainAudit)}, candidate ${formatRawAudit(fullCandidateAudit)}, and ToM ${formatRawAudit(fullTomAudit)}; ToM metrics are ${formatParsed(fullTom)} and deterministic full-ToM schema repair currently yields ${formatParsed(fullTomRepair)}. ${formatProviderRunSentence(fullTomProviderRun)}`,
      requiredAction: fullTomReady
        ? 'Use the ToM full split as the primary larger-scale result, then decide whether plain/candidate full baselines are needed for a stronger final submission.'
        : fullTomProviderRun?.stoppedAfterError && (fullTomProviderRun.errorCount ?? 0) > 0
          ? 'Resume the 500-decision ToM provider run after the provider quota or rate-limit window refreshes, then materialize raw metrics and schema-repair metrics.'
          : 'Complete and materialize both the 500-decision ToM provider metrics and the matching schema-repair metrics before broad AAMAS full-paper claims.',
    },
    {
      id: 'replication-and-human-audit',
      title: 'Replication and Human Audit',
      status: replicationOrHumanEvidence ? 'pass' : 'needs_experiment',
      evidence: [
        'experiments/pilot-replication/pilot-replication-report.json',
        'experiments/pilot-replication/pilot-replication-report.md',
        'experiments/pilot-replication/second-provider-replication-package-report.json',
        'experiments/pilot-replication/second-provider-replication-package/manifest.json',
        'experiments/pilot-replication/second-provider-replication-package/openai-batch-input.jsonl',
        'experiments/human-soft-label-audit/human-audit-manifest.json',
        'experiments/human-soft-label-audit/human-audit-annotation-sheet.csv',
        'experiments/human-soft-label-audit/human-audit-annotator.html',
        'experiments/human-soft-label-audit/annotator-package/human-audit-annotator-package-manifest.json',
        'experiments/human-soft-label-audit/human-audit-annotator-package.tar.gz',
        'experiments/human-soft-label-audit/human-audit-annotator-package-archive-report.json',
        'experiments/human-soft-label-audit/human-audit-packet-quality-report.json',
        'submission/human-audit-launch/human-audit-launch-checklist.json',
        'submission/human-audit-evidence-gate/human-audit-evidence-gate.json',
        'experiments/human-soft-label-audit/human-audit-intake-report.json',
        'experiments/human-soft-label-audit/human-audit-inter-annotator-agreement-report.json',
        'experiments/human-soft-label-audit/human-audit-adjudication-template-report.json',
        'experiments/human-soft-label-audit/human-audit-adjudicated-annotations-report.json',
        'experiments/human-soft-label-audit/human-audit-adjudicated-annotations.csv',
        'experiments/human-soft-label-audit/human-audit-agreement-report.json',
        'experiments/human-soft-label-audit/human-audit-protocol.md',
        'experiments/pilot-replication/second-provider-replication-preflight.json',
        'experiments/pilot-replication/second-provider-replication-preflight.md',
        'submission/aamas-latex/main.tex',
      ],
      finding: completedHumanAuditEvidence
        ? `Human soft-label audit has ${completedHumanAuditFiles} completed annotation file(s), and the agreement evaluator is completed with ${humanAgreement.completedLabels ?? 'unknown'}/${humanAgreement.totalLabels ?? 'unknown'} labels.`
        : completedPilotReplicationEvidence
          ? `${formatPilotReplication(pilotReplication)} ${formatSecondProviderPackage(secondProviderPackage)} Human soft-label audit remains desirable but is no longer the only replication safeguard.`
        : humanAgreement
          ? `${formatPilotReplication(pilotReplication)} ${formatSecondProviderPackage(secondProviderPackage)} ${formatSecondProviderPreflight(secondProviderPreflight)} A human soft-label audit packet is prepared with ${humanAudit?.sampleCount ?? humanAgreement.sampleCount ?? 'unknown'} blind samples${humanAnnotatorPresent ? ', including a local annotator HTML' : ''}; ${formatHumanAuditQuality(humanAuditQuality)} ${formatHumanAnnotatorPackage(humanAnnotatorPackage)} ${formatHumanAnnotatorPackageArchive(humanAnnotatorPackageArchive)} ${formatHumanAuditLaunchChecklist(humanAuditLaunchChecklist)} ${formatHumanAuditEvidenceGate(humanAuditEvidenceGate)} ${formatHumanAuditIntake(humanAuditIntake)} ${formatHumanInterAnnotatorAgreement(humanInterAnnotatorAgreement)} ${formatHumanAdjudicationTemplate(humanAdjudicationTemplate)} ${formatHumanAdjudicatedAnnotations(humanAdjudicatedAnnotations)} The agreement evaluator is ${humanAgreement.status ?? 'unknown'} with ${humanAgreement.completedLabels ?? 0}/${humanAgreement.totalLabels ?? 'unknown'} labels completed.`
        : humanAudit
          ? `${formatPilotReplication(pilotReplication)} ${formatSecondProviderPackage(secondProviderPackage)} ${formatSecondProviderPreflight(secondProviderPreflight)} A human soft-label audit packet is prepared with ${humanAudit.sampleCount ?? 'unknown'} blind samples. ${formatHumanAuditQuality(humanAuditQuality)} ${formatHumanAnnotatorPackage(humanAnnotatorPackage)} ${formatHumanAnnotatorPackageArchive(humanAnnotatorPackageArchive)} ${formatHumanAuditLaunchChecklist(humanAuditLaunchChecklist)} ${formatHumanAuditEvidenceGate(humanAuditEvidenceGate)} ${formatHumanAuditIntake(humanAuditIntake)} ${formatHumanInterAnnotatorAgreement(humanInterAnnotatorAgreement)} ${formatHumanAdjudicationTemplate(humanAdjudicationTemplate)} ${formatHumanAdjudicatedAnnotations(humanAdjudicatedAnnotations)}`
          : `${formatPilotReplication(pilotReplication)} ${formatSecondProviderPackage(secondProviderPackage)} ${formatSecondProviderPreflight(secondProviderPreflight)} The current package has no human audit packet or completed human audit artifact for soft strategic labels.`,
      requiredAction: replicationOrHumanEvidence
        ? completedHumanAuditEvidence
          ? 'Report agreement with verifier soft labels and keep the completed annotator file under the human audit directory.'
          : 'Report the completed second-provider/model pilot replication as robustness evidence, and keep the prepared human audit as follow-up or additional validation.'
        : 'Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior.',
    },
    {
      id: 'visual-evidence-package',
      title: 'Figure and Table Evidence Package',
      status: visualEvidence?.status && visualEvidence.status !== 'needs_revision' ? 'pass' : 'needs_revision',
      evidence: [
        'submission/visual-evidence/visual-evidence-report.json',
        'submission/visual-evidence/visual-evidence-report.md',
        'submission/aamas-latex/main.tex',
        'figures/README.md',
      ],
      finding: visualEvidence
        ? `Visual evidence report is ${visualEvidence.status}; figures ${visualEvidence.facts?.figureCount ?? 'unknown'}, tables ${visualEvidence.facts?.tableCount ?? 'unknown'}, required figure roles ${visualEvidence.facts?.requiredFigureRolesPresent ?? 'unknown'}/${visualEvidence.facts?.requiredFigureRolesTotal ?? 'unknown'}, required table roles ${visualEvidence.facts?.requiredTableRolesPresent ?? 'unknown'}/${visualEvidence.facts?.requiredTableRolesTotal ?? 'unknown'}, figure caption load avg ${formatOptionalOneDecimal(visualEvidence.facts?.averageFigureCaptionWords)} words / max ${visualEvidence.facts?.maxFigureCaptionWords ?? 'unknown'} with ${visualEvidence.facts?.longFigureCaptionCount ?? 'unknown'} long captions, rendered pages ${visualEvidence.facts?.renderedPageImagesPresent ?? 'unknown'}/${visualEvidence.facts?.renderedPageImagesTotal ?? 'unknown'}.`
        : 'The AAMAS package has no generated visual-evidence report for figure/table role coverage.',
      requiredAction: visualEvidence?.status && visualEvidence.status !== 'needs_revision'
        ? 'After second-provider or human-audit evidence completes, reflect it in the main results/provenance visual package.'
        : 'Regenerate or repair the visual evidence package so the paper has a teaser, method architecture, results visual, case pack, and provenance/result tables.',
    },
    {
      id: 'page-budget',
      title: 'AAMAS Page Budget',
      status: pageBudget.bodyPages !== null && pageBudget.bodyPages <= 8 ? 'pass' : 'needs_revision',
      evidence: [
        'submission/aamas-latex/main.pdf',
        'submission/aamas-latex/build-status.md',
      ],
      finding: pageBudget.totalPages === null
        ? 'Could not read a page-count line from the LaTeX build status.'
        : pageBudget.bodyPages === null
          ? `AAMAS-style PDF has ${pageBudget.totalPages} total pages, but the report cannot identify the body/reference boundary.`
          : `AAMAS-style PDF has ${pageBudget.totalPages} total pages, with the main body ending on page ${pageBudget.bodyPages} and references allowed on additional pages.`,
      requiredAction: pageBudget.bodyPages !== null && pageBudget.bodyPages <= 8
        ? 'Preserve the 8-page body budget by replacing protocol/scaffolding material when adding full-split results.'
        : 'Compress or restructure the manuscript before adding more results.',
    },
  ]

  return {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    paper: 'Verifiable Multi-Agent Reasoning for LLM Agents in Zero-Communication Mixed-Motive Games',
    localSubmissionHygiene,
    aamasFullPaperReadiness: gates.some(gate => gate.status === 'needs_revision')
      ? 'not_ready'
      : gates.some(gate => gate.id === 'full-split-llm-evidence' && gate.status !== 'pass')
      ? 'not_ready'
      : gates.some(gate => gate.status === 'needs_experiment')
        ? 'borderline'
        : 'ready',
    headline: fullTomReady
      ? 'The package now has a primary 500-decision ToM full-split LLM path; remaining AAMAS risks are replication, human soft-label audit, and optional stronger full-split baselines.'
      : 'The package is pilot-complete and within the AAMAS body-page budget, but it is not yet an AAMAS full-paper empirical package because full-split LLM evidence and completed replication or human-audit evidence remain missing.',
    facts: {
      gateStatus: gate?.overallStatus ?? 'unknown',
      manifestEntries,
      manifestMissing,
      localPipelineStatus: pipeline?.status ?? 'unknown',
      localPipelineSteps: pipeline?.steps?.length ?? 0,
      aamasPageCount: pageBudget.totalPages,
      aamasBodyPages: pageBudget.bodyPages,
      pilot: {
        plainParsed: formatParsed(plain),
        candidateParsed: formatParsed(candidate),
        tomParsed: formatParsed(tom),
        tomRepairParsed: formatParsed(tomRepair),
        verifierRevisionParsed: formatParsed(revision),
        verifierRevisionHardFailures: String(revision?.hardFailureCount ?? 'unknown'),
      },
      fullSplit: {
        decisionPoints: fullLegal?.totalDecisionPoints ?? fullStrategic?.totalDecisionPoints ?? null,
        deterministicBaselinesHardFailures: fullBaselineHardFailures,
        plainRawPresent: formatRawAudit(fullPlainAudit),
        candidateRawPresent: formatRawAudit(fullCandidateAudit),
        tomRawPresent: formatRawAudit(fullTomAudit),
        tomParsed: formatParsed(fullTom),
        tomRepairParsed: formatParsed(fullTomRepair),
        tomProviderRun: formatProviderRun(fullTomProviderRun),
        tomIntegratedInPaper: fullTomIntegratedInPaper,
      },
    },
    gates,
    nextActions: fullTomReady
      ? fullTomIntegratedInPaper
        ? [
          completedHumanAuditEvidence
            ? 'Report completed human-audit agreement and keep the completed annotator file under the human audit directory.'
            : completedPilotReplicationEvidence
              ? 'Report the completed second-provider/model pilot replication as robustness evidence, while keeping human soft-label agreement as a remaining validation opportunity.'
              : 'Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior.',
          'Decide whether to add full-split plain/candidate LLM baselines or keep them as optional strengthening evidence.',
          'Preserve the 8-page body budget by replacing protocol/scaffolding material if more evidence moves into the main paper.',
        ]
        : [
          'Integrate the completed 500-decision ToM full-split metrics into the main AAMAS result table and update claims from pilot-only to pilot-plus-full-ToM evidence.',
          'Report schema repair as a deterministic reliability ablation while keeping raw parse failures visible beside repaired traces.',
          completedHumanAuditEvidence
          ? 'Report completed human-audit agreement and keep the completed annotator file under the human audit directory.'
          : completedPilotReplicationEvidence
            ? 'Report the completed second-provider/model pilot replication as robustness evidence, while keeping human soft-label agreement as a remaining validation opportunity.'
            : 'Complete the prepared human soft-label audit, or add a second model/provider pilot replication; ideally do both before claiming robust multi-agent reasoning behavior.',
          'Preserve the 8-page body budget by replacing protocol/scaffolding material as full-split results move into the main paper.',
        ]
      : [
        fullTomProviderRun?.stoppedAfterError && (fullTomProviderRun.errorCount ?? 0) > 0
          ? 'Resume the 500-decision ToM full-split provider batch after the Kimi quota or rate-limit window refreshes, then materialize raw ToM metrics and schema-repair metrics.'
          : 'Complete the 500-decision ToM full-split provider batch and materialize both raw ToM metrics and schema-repair metrics before upgrading claims beyond the pilot.',
        'Run schema repair and verifier analysis on the full-split ToM outputs, preserving selectedActionId exactly as in the pilot ablation.',
        'Add a second provider/model pilot replication or a small human audit of soft labels to reduce single-provider and verifier-subjectivity attacks.',
        'Update the AAMAS draft only after the new evidence exists; keep current broad claims scoped to the 50-decision diagnostic pilot.',
      ],
  }
}

export function renderAAMASReadinessReport(report: AAMASReadinessReport): string {
  const lines = [
    '# AAMAS Full-Paper Readiness Report',
    '',
    `Generated at: \`${report.generatedAt}\``,
    '',
    `Paper: **${report.paper}**`,
    '',
    `Local submission hygiene: \`${report.localSubmissionHygiene}\``,
    `AAMAS full-paper readiness: \`${report.aamasFullPaperReadiness}\``,
    '',
    report.headline,
    '',
    '## Key Facts',
    '',
    '| Item | Value |',
    '| --- | --- |',
    `| Submission gate | \`${report.facts.gateStatus}\` |`,
    `| Manifest | ${report.facts.manifestEntries} entries, ${report.facts.manifestMissing} missing |`,
    `| Local pipeline | \`${report.facts.localPipelineStatus}\`, ${report.facts.localPipelineSteps} steps |`,
    `| AAMAS page count | ${report.facts.aamasPageCount ?? 'unknown'} total, ${report.facts.aamasBodyPages ?? 'unknown'} body |`,
    `| Plain pilot parse | ${report.facts.pilot.plainParsed} |`,
    `| Candidate pilot parse | ${report.facts.pilot.candidateParsed} |`,
    `| ToM pilot parse | ${report.facts.pilot.tomParsed} |`,
    `| ToM after schema repair | ${report.facts.pilot.tomRepairParsed} |`,
    `| Verifier revision parse | ${report.facts.pilot.verifierRevisionParsed} |`,
    `| Full split deterministic hard failures | ${report.facts.fullSplit.deterministicBaselinesHardFailures ?? 'unknown'} |`,
    `| Full split plain raw outputs | ${report.facts.fullSplit.plainRawPresent} |`,
    `| Full split candidate raw outputs | ${report.facts.fullSplit.candidateRawPresent} |`,
    `| Full split ToM raw outputs | ${report.facts.fullSplit.tomRawPresent} |`,
    `| Full split ToM provider run | ${report.facts.fullSplit.tomProviderRun} |`,
    `| Full split ToM parse | ${report.facts.fullSplit.tomParsed} |`,
    `| Full split ToM after schema repair | ${report.facts.fullSplit.tomRepairParsed} |`,
    `| Full split ToM integrated in paper | ${report.facts.fullSplit.tomIntegratedInPaper ? 'yes' : 'no'} |`,
    '',
    '## Gate Audit',
    '',
    '| Gate | Status | Finding | Required action |',
    '| --- | --- | --- | --- |',
    ...report.gates.map(gate => [
      gate.title,
      `\`${gate.status}\``,
      gate.finding,
      gate.requiredAction,
    ].map(escapeMarkdownCell).join(' | ')).map(row => `| ${row} |`),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.map((action, index) => `${index + 1}. ${action}`),
    '',
  ]

  return lines.join('\n')
}

function hasPilotEvidence(...metrics: Array<Metrics | null>): boolean {
  return metrics.every(metric => Boolean(metric?.totalDecisionPoints ?? metric?.resultFiles?.length))
}

function hasCompleteFullSplitMetrics(metrics: Metrics | null): boolean {
  return metrics?.totalDecisionPoints === 500
}

function hasCompleteRawAudit(audit: RawAudit | null): boolean {
  return Boolean(
    audit?.readyForIngest
    && audit.expectedCount === 500
    && audit.presentCount === 500
    && (audit.missingCount ?? 0) === 0,
  )
}

function hasIntegratedFullTomEvidence(researchRoot: string): boolean {
  const path = join(researchRoot, 'submission/aamas-latex/main.tex')
  if (!existsSync(path)) return false
  const text = readFileSync(path, 'utf8')
  return [
    'ToM LLM raw',
    'ToM schema repair',
    'pilot-plus-full-ToM evidence',
  ].every(marker => text.includes(marker))
}

function formatParsed(metrics: Metrics | null): string {
  if (!metrics) return 'missing'
  const parsed = metrics.totalParsedTraces
    ?? metrics.totalParsedOutputs
    ?? metrics.traceFiles?.length
    ?? metrics.resultFiles?.length
    ?? 'unknown'
  const total = metrics.totalDecisionPoints ?? 'unknown'
  return `${parsed}/${total}`
}

function formatRawAudit(audit: RawAudit | null): string {
  if (!audit) return 'missing'
  return `${audit.presentCount ?? 'unknown'}/${audit.expectedCount ?? 'unknown'} present`
}

function formatProviderRun(report: ProviderRunReport | null): string {
  if (!report) return 'missing'
  const stopReason = report.stoppedAfterError ? ', stopped after provider error' : ''
  return `${report.successCount ?? 'unknown'}/${report.expectedCount ?? 'unknown'} successful, ${report.errorCount ?? 0} errors, ${report.pendingSuccessCount ?? 'unknown'} pending${stopReason}`
}

function formatProviderRunSentence(report: ProviderRunReport | null): string {
  if (!report) return 'No full-split ToM provider-run report is present.'
  const runner = report.runner ?? 'provider runner'
  const model = report.model ? ` using ${report.model}` : ''
  return `The latest ${runner}${model} run reports ${formatProviderRun(report)}.`
}

function formatHumanAuditQuality(report: HumanAuditPacketQuality | null): string {
  if (!report) return 'no packet-quality report is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const status = report.status ?? 'unknown'
  const ready = report.readyForAnnotation ? 'ready for annotation' : 'not ready for annotation'
  return `the packet-quality report is ${status} with ${failedChecks} failed checks and is ${ready}; it is not paper evidence until human labels are completed.`
}

function formatPilotReplication(report: PilotReplicationReportFile | null): string {
  if (!report) return 'No second-provider/model pilot replication report is present.'
  if (report.status === 'completed' && (report.completedReplicationCount ?? 0) > 0) {
    const completed = report.replications?.find(replication => replication.status === 'completed')
    if (completed) {
      return `Second-provider/model pilot replication is completed via ${completed.provider ?? 'unknown provider'} using ${completed.model ?? 'unknown model'}: ${completed.successCount ?? 'unknown'}/${completed.expectedCount ?? 'unknown'} provider outputs, ${completed.parsedCount ?? 'unknown'}/50 parsed traces, and ${completed.hardFailureCount ?? 'unknown'} hard verifier failures.`
    }
    return `Second-provider/model pilot replication is completed with ${report.completedReplicationCount} completed replication row(s).`
  }
  const partial = report.replications?.find(replication => replication.status === 'partial')
  if (partial) {
    return `Second-provider/model pilot replication is partial via ${partial.provider ?? 'unknown provider'} using ${partial.model ?? 'unknown model'}: ${partial.successCount ?? 'unknown'}/${partial.expectedCount ?? 'unknown'} provider outputs and ${partial.parsedCount ?? 'unknown'}/50 parsed traces.`
  }
  return `Second-provider/model pilot replication is ${report.status ?? 'missing'} with ${report.completedReplicationCount ?? 0} completed replication row(s).`
}

function formatSecondProviderPreflight(report: SecondProviderReplicationPreflight | null): string {
  if (!report) return 'No second-provider replication preflight report is present.'
  const inputRows = report.facts?.inputJsonlRows ?? 'unknown'
  const packets = report.facts?.promptPacketCount ?? 'unknown'
  const key = report.facts?.independentKeyPresent ? 'independent provider/model key present' : 'no independent provider/model key present'
  const rows = report.facts?.secondProviderRows ?? 0
  const blockerText = report.blockers && report.blockers.length > 0
    ? ` blockers: ${report.blockers.join(' ')}`
    : ''
  return `Second-provider preflight is ${report.status ?? 'unknown'} with fixed inputs ${inputRows}/50 rows and ${packets}/50 prompt packets, ${rows} second-provider output row(s), and ${key}.${blockerText}`
}

function formatSecondProviderPackage(report: SecondProviderReplicationPackage | null): string {
  if (!report) return 'No second-provider replication package report is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const ready = report.readyForExternalRun ? 'ready for an external run' : 'not ready for an external run'
  const evidence = report.readyForPaperEvidence ? 'paper evidence' : 'not paper evidence until provider outputs return'
  return `Second-provider replication package is ${report.status ?? 'unknown'} with ${failedChecks} failed checks, fixed input rows ${report.inputRows ?? 0}/50, prompt packets ${report.promptPacketCount ?? 0}/50, ${report.files?.length ?? 0} packaged file(s), and is ${ready}; it is ${evidence}.`
}

function formatHumanAnnotatorPackage(report: HumanAuditAnnotatorPackage | null): string {
  if (!report) return 'No blind annotator package manifest is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const status = report.status ?? 'unknown'
  const referenceFileIncluded = report.instructions?.referenceFileIncluded ? 'includes a private reference file' : 'excludes private reference files'
  const referenceIncluded = report.instructions?.referenceLabelsIncluded ? 'includes reference labels' : 'excludes reference labels'
  return `The blind annotator package is ${status} with ${failedChecks} failed checks, ${referenceFileIncluded}, and ${referenceIncluded}.`
}

function formatHumanAuditIntake(report: HumanAuditIntake | null): string {
  if (!report) return 'No returned-annotation intake report is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const status = report.status ?? 'unknown'
  const returned = report.returnedCsvPresent ? 'a returned CSV is present' : 'no returned CSV is present yet'
  const ready = report.readyForAgreement ? 'ready for agreement evaluation' : 'not ready for agreement evaluation'
  return `The returned-annotation intake is ${status} with ${failedChecks} failed checks; ${returned}, ${report.completedLabels ?? 0}/${report.totalLabels ?? 'unknown'} labels are filled, and it is ${ready}.`
}

function formatHumanInterAnnotatorAgreement(report: HumanAuditInterAnnotatorAgreement | null): string {
  if (!report) return 'No inter-annotator agreement report is present.'
  const status = report.status ?? 'unknown'
  const paired = `${report.pairedLabels ?? 0}/${report.totalLabels ?? 'unknown'}`
  const agreement = typeof report.macroAgreement === 'number' ? `${Math.round(report.macroAgreement * 1000) / 10}%` : 'n/a'
  const adjudication = report.requiresAdjudication
    ? 'requires adjudication'
    : report.readyForAdjudication
      ? 'ready without disagreements'
      : 'not ready for adjudication'
  return `The inter-annotator agreement report is ${status}, with ${paired} paired labels, macro agreement ${agreement}, ${report.disagreementCount ?? 0} disagreements, and ${adjudication}.`
}

function formatHumanAdjudicationTemplate(report: HumanAuditAdjudicationTemplate | null): string {
  if (!report) return 'No adjudication-template report is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const ready = report.readyForAdjudication ? 'ready for adjudication' : 'not ready for adjudication'
  return `The adjudication template is ${report.status ?? 'unknown'} with ${failedChecks} failed checks, ${report.templateRows ?? 0}/${report.disagreementCount ?? 'unknown'} disagreement rows materialized, and is ${ready}.`
}

function formatHumanAdjudicatedAnnotations(report: HumanAuditAdjudicatedAnnotations | null): string {
  if (!report) return 'No adjudicated-annotation build report is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const ready = report.readyForAgreement ? 'ready for agreement evaluation' : 'not ready for agreement evaluation'
  const written = report.adjudicatedCsvWritten ? 'the adjudicated CSV is written' : 'the adjudicated CSV is not written'
  return `The adjudicated-annotation builder is ${report.status ?? 'unknown'} with ${failedChecks} failed checks, ${report.outputRows ?? 0}/${report.sampleCount ?? 'unknown'} output rows, ${report.completedLabels ?? 0}/${report.totalLabels ?? 'unknown'} labels completed, ${report.unresolvedDisagreements ?? 0} unresolved disagreement(s); ${written}, and it is ${ready}.`
}

function formatHumanAnnotatorPackageArchive(report: HumanAuditAnnotatorPackageArchive | null): string {
  if (!report) return 'No blind annotator package archive report is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const status = report.status ?? 'unknown'
  const bytes = typeof report.bytes === 'number' ? `${report.bytes} bytes` : 'unknown size'
  const digest = report.sha256 ? 'with SHA-256 recorded' : 'without SHA-256'
  return `The blind annotator archive is ${status} with ${failedChecks} failed checks, ${bytes}, ${digest}.`
}

function formatHumanAuditLaunchChecklist(report: HumanAuditLaunchChecklist | null): string {
  if (!report) return 'No human-audit launch checklist is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const status = report.status ?? 'unknown'
  const annotation = report.facts?.readyForAnnotation ? 'ready to send to annotators' : 'not ready to send to annotators'
  const evidence = report.facts?.readyForPaperEvidence ? 'paper evidence' : 'not paper evidence until returned labels are completed'
  const labels = `${report.facts?.completedLabels ?? 0}/${report.facts?.totalLabels ?? 'unknown'} labels completed`
  const digest = report.facts?.archiveSha256 ? 'archive SHA-256 recorded' : 'archive SHA-256 missing'
  return `The human-audit launch checklist is ${status} with ${failedChecks} failed checks, ${annotation}, ${labels}, ${digest}, and is ${evidence}.`
}

function formatHumanAuditEvidenceGate(report: HumanAuditEvidenceGate | null): string {
  if (!report) return 'No human-audit evidence gate is present.'
  const failedChecks = report.checks?.filter(check => check.status === 'fail').length ?? 0
  const pendingChecks = report.checks?.filter(check => check.status === 'pending').length ?? 0
  const labels = `${report.facts?.completedLabels ?? 0}/${report.facts?.totalLabels ?? 'unknown'} labels completed`
  const returns = report.facts?.annotatorAPresent && report.facts?.annotatorBPresent
    ? 'both annotator returns present'
    : 'annotator returns not both present'
  const paired = `${report.facts?.pairedLabels ?? 0}/${report.facts?.totalLabels ?? 'unknown'} paired labels`
  const agreement = typeof report.facts?.agreementMacroAgreement === 'number'
    ? `human-verifier macro agreement ${Math.round(report.facts.agreementMacroAgreement * 1000) / 10}%`
    : 'human-verifier macro agreement n/a'
  const evidence = report.facts?.readyForPaperEvidence ? 'paper evidence ready' : 'not paper evidence yet'
  return `The human-audit evidence gate is ${report.status ?? 'unknown'} with ${failedChecks} failed checks and ${pendingChecks} pending checks, ${labels}, ${returns}, ${paired}, ${agreement}, and is ${evidence}.`
}

function sumNullable(...values: Array<number | undefined>): number | null {
  if (values.some(value => typeof value !== 'number')) return null
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
}

function readPageBudgetFromBuildStatus(researchRoot: string): PageBudget {
  const path = join(researchRoot, 'submission/aamas-latex/build-status.md')
  if (!existsSync(path)) return { totalPages: null, bodyPages: null }
  const text = readFileSync(path, 'utf8')
  const match = text.match(/Page count:\s*(\d+)\s+pages/i)
  const bodyMatch = text.match(/(?:main body and conclusion end|body\/reference boundary:[^\n]*end)s? on page\s+(\d+)/i)
    ?? text.match(/body reaches page\s+(\d+)/i)
  return {
    totalPages: match ? Number(match[1]) : null,
    bodyPages: bodyMatch ? Number(bodyMatch[1]) : null,
  }
}

function countCompletedHumanAuditFiles(researchRoot: string): number {
  const dir = join(researchRoot, 'experiments/human-soft-label-audit')
  if (!existsSync(dir)) return 0
  return readdirSync(dir)
    .filter(filename => /^human-audit-completed-annotations.*\.csv$/i.test(filename) || /^human-audit-adjudicated-annotations\.csv$/i.test(filename))
    .length
}

function readJsonOptional<T>(researchRoot: string, relativePath: string): T | null {
  const path = join(researchRoot, relativePath)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function formatOptionalOneDecimal(value: number | undefined): string {
  return typeof value === 'number' ? String(Math.round(value * 10) / 10) : 'unknown'
}
