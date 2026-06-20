import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

interface Args {
  out: string
  tomMetrics: string
  repairMetrics: string
  pilotSummary: string
  attribution: string
}

interface ToMMetrics {
  totalDecisionPoints: number
  totalParsedTraces: number
  parseFailureCount: number
  hardFailureCount: number
}

interface RepairMetrics extends ToMMetrics {
  repairStatusCounts: {
    passThrough: number
    repaired: number
    notRepairable: number
  }
}

interface PilotSummary {
  rows: Array<{
    agentId: string
    status: string
    totalDecisionPoints: number
    parsedTraces: number
    parseFailures: number
    hardFailures: number
    notes: string
  }>
}

interface VerifierAttribution {
  pairedDecisionCount: number
  excludedParseFailureCount: number
  hardFailureAttribution: {
    beforeHardFailureCount: number
    afterHardFailureCount: number
    hardFailureDelta: number
    hardFailureDeltaBootstrap95Ci: [number, number]
    decisionLevelMcnemar: {
      beforeOnly: number
      afterOnly: number
      exactPValue: number | null
    }
  }
  hardComponentRows: Array<{
    label: string
    beforeFail: number
    afterFail: number
    failDelta: number
    shareOfHardFailureDrop: number | null
  }>
  qualitativeCases: QualitativeCase[]
}

interface QualitativeCase {
  caseType: string
  decisionId: string
  beforeSelectedActionId: string | null
  afterSelectedActionId: string | null
  actionChanged: boolean | null
  primaryReasonChanged: boolean | null
  labelStatuses: Record<string, {
    before: string
    after: string
  }>
  beforeIssues: string[]
  afterIssues: string[]
  parseFailureMessage?: string
  rawOutputFile?: string
}

const args = parseArgs(process.argv.slice(2))
const tomMetrics = readJson<ToMMetrics>(args.tomMetrics)
const repairMetrics = readJson<RepairMetrics>(args.repairMetrics)
const pilotSummary = readJson<PilotSummary>(args.pilotSummary)
const attribution = readJson<VerifierAttribution>(args.attribution)
mkdirSync(args.out, { recursive: true })

const pipelineSvgPath = join(args.out, 'figure-1-verifier-pipeline.svg')
const pipelineMarkdownPath = join(args.out, 'figure-1-verifier-pipeline.md')
const revisionArchitectureSvgPath = join(args.out, 'figure-2-revision-architecture.svg')
const revisionArchitectureMarkdownPath = join(args.out, 'figure-2-revision-architecture.md')
const tomSchemaRepairSvgPath = join(args.out, 'figure-3-tom-schema-repair-flow.svg')
const tomSchemaRepairMarkdownPath = join(args.out, 'figure-3-tom-schema-repair-flow.md')
const mainResultsSvgPath = join(args.out, 'figure-4-main-pilot-results.svg')
const mainResultsMarkdownPath = join(args.out, 'figure-4-main-pilot-results.md')
const qualitativeCasePackSvgPath = join(args.out, 'figure-5-qualitative-case-pack.svg')
const qualitativeCasePackMarkdownPath = join(args.out, 'figure-5-qualitative-case-pack.md')
const staleFigurePaths = [
  join(args.out, 'figure-2-tom-schema-repair-flow.svg'),
  join(args.out, 'figure-2-tom-schema-repair-flow.md'),
  join(args.out, 'figure-3-main-pilot-results.svg'),
  join(args.out, 'figure-3-main-pilot-results.md'),
]
const removedStaleFigurePaths = removeStaleFigureArtifacts(staleFigurePaths)

writeFileSync(pipelineSvgPath, renderVerifierPipelineSvg(attribution), 'utf8')
writeFileSync(pipelineMarkdownPath, renderVerifierPipelineMarkdown(attribution), 'utf8')
writeFileSync(revisionArchitectureSvgPath, renderRevisionArchitectureSvg(attribution), 'utf8')
writeFileSync(revisionArchitectureMarkdownPath, renderRevisionArchitectureMarkdown(attribution), 'utf8')
writeFileSync(tomSchemaRepairSvgPath, renderToMSchemaRepairFlowSvg(tomMetrics, repairMetrics), 'utf8')
writeFileSync(tomSchemaRepairMarkdownPath, renderToMSchemaRepairFlowMarkdown(tomMetrics, repairMetrics), 'utf8')
writeFileSync(mainResultsSvgPath, renderMainPilotResultsSvg(pilotSummary, repairMetrics, attribution), 'utf8')
writeFileSync(mainResultsMarkdownPath, renderMainPilotResultsMarkdown(pilotSummary, repairMetrics, attribution), 'utf8')
writeFileSync(qualitativeCasePackSvgPath, renderQualitativeCasePackSvg(attribution), 'utf8')
writeFileSync(qualitativeCasePackMarkdownPath, renderQualitativeCasePackMarkdown(attribution), 'utf8')

console.log(JSON.stringify({
  pipelineSvgPath,
  pipelineMarkdownPath,
  revisionArchitectureSvgPath,
  revisionArchitectureMarkdownPath,
  tomSchemaRepairSvgPath,
  tomSchemaRepairMarkdownPath,
  mainResultsSvgPath,
  mainResultsMarkdownPath,
  qualitativeCasePackSvgPath,
  qualitativeCasePackMarkdownPath,
  totalOutputs: tomMetrics.totalDecisionPoints,
  rawParsed: tomMetrics.totalParsedTraces,
  repaired: repairMetrics.repairStatusCounts.repaired,
  finalParsed: repairMetrics.totalParsedTraces,
  hardFailures: repairMetrics.hardFailureCount,
  pairedDecisionCount: attribution.pairedDecisionCount,
  removedStaleFigurePaths,
}, null, 2))

function parseArgs(argv: string[]): Args {
  const parsed: Args = {
    out: 'docs/research/figures',
    tomMetrics: 'docs/research/experiments/pilot-e7-tom-prompted-results/metrics.json',
    repairMetrics: 'docs/research/experiments/pilot-e8-tom-schema-repair-results/metrics.json',
    pilotSummary: 'docs/research/experiments/pilot-metrics-summary/pilot-metrics-summary.json',
    attribution: 'docs/research/experiments/pilot-verifier-attribution/verifier-attribution.json',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = argv[i + 1]
    if (value === undefined) continue

    if (arg === '--out') {
      parsed.out = value
      i++
    } else if (arg === '--tom-metrics') {
      parsed.tomMetrics = value
      i++
    } else if (arg === '--repair-metrics') {
      parsed.repairMetrics = value
      i++
    } else if (arg === '--pilot-summary') {
      parsed.pilotSummary = value
      i++
    } else if (arg === '--attribution') {
      parsed.attribution = value
      i++
    }
  }

  return parsed
}

function removeStaleFigureArtifacts(paths: string[]): string[] {
  const removed: string[] = []
  for (const path of paths) {
    if (!existsSync(path)) continue
    rmSync(path, { force: true })
    removed.push(path)
  }
  return removed
}

function renderToMSchemaRepairFlowMarkdown(tom: ToMMetrics, repair: RepairMetrics): string {
  return [
    '# Figure 3: ToM Schema-Repair Flow',
    '',
    'Source metrics:',
    '',
    `- Raw ToM metrics: \`${args.tomMetrics}\``,
    `- Schema-repair metrics: \`${args.repairMetrics}\``,
    '',
    '| Stage | Count |',
    '| --- | ---: |',
    `| Provider outputs | ${tom.totalDecisionPoints} |`,
    `| Raw schema-valid traces | ${tom.totalParsedTraces} |`,
    `| Raw schema failures | ${tom.parseFailureCount} |`,
    `| Pass-through traces | ${repair.repairStatusCounts.passThrough} |`,
    `| Schema-repaired traces | ${repair.repairStatusCounts.repaired} |`,
    `| Not repairable | ${repair.repairStatusCounts.notRepairable} |`,
    `| Final verifier-eligible traces | ${repair.totalParsedTraces} |`,
    `| Hard verifier failures after repair | ${repair.hardFailureCount} |`,
    '',
    'Caption draft:',
    '',
    '> Schema-repair flow for the ToM-prompted pilot. The deterministic repair layer preserves the model-selected action, passes through 36 already valid traces, repairs 13 non-conforming outputs, leaves one tool-call-like output unrepaired, and keeps the true hard verifier failure visible.',
    '',
  ].join('\n')
}

function renderMainPilotResultsMarkdown(summary: PilotSummary, repair: RepairMetrics, attribution: VerifierAttribution): string {
  const rows = getMainResultRows(summary, repair)
  const publicHistory = getHardComponent(attribution, 'publicHistoryConsistent')
  const hiddenInfo = getHardComponent(attribution, 'hiddenInfoDisciplined')
  return [
    '# Figure 4: Main Pilot Results',
    '',
    'Source metrics:',
    '',
    `- Pilot metrics summary: \`${args.pilotSummary}\``,
    `- Verifier attribution: \`${args.attribution}\``,
    '',
    '| Condition | Parsed | Total | Parse yield | Hard failures |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...rows.map((row) => `| ${row.label} | ${row.parsed} | ${row.total} | ${formatPercent(row.parseYield)} | ${row.hardFailures} |`),
    '',
    '| Paired revision attribution | Before | After | Delta | Share of hard-failure drop |',
    '| --- | ---: | ---: | ---: | ---: |',
    `| publicHistoryConsistent | ${publicHistory.beforeFail} | ${publicHistory.afterFail} | ${publicHistory.failDelta} | ${formatPercent(publicHistory.shareOfHardFailureDrop ?? 0)} |`,
    `| hiddenInfoDisciplined | ${hiddenInfo.beforeFail} | ${hiddenInfo.afterFail} | ${hiddenInfo.failDelta} | ${formatPercent(hiddenInfo.shareOfHardFailureDrop ?? 0)} |`,
    '',
    'Caption draft:',
    '',
    `> Main pilot results report three reliability layers. Parse yield rises from 26/50 for plain prompting to 36/50 under ToM prompting and 49/50 after deterministic ToM schema repair. On ${attribution.pairedDecisionCount} paired candidate traces, verifier revision reduces hard failures from ${attribution.hardFailureAttribution.beforeHardFailureCount} to ${attribution.hardFailureAttribution.afterHardFailureCount}; the hard-failure-count drop is attributed to public-history consistency (${Math.round((publicHistory.shareOfHardFailureDrop ?? 0) * 100)}%) and hidden-information discipline (${Math.round((hiddenInfo.shareOfHardFailureDrop ?? 0) * 100)}%).`,
    '',
  ].join('\n')
}

function renderQualitativeCasePackMarkdown(attribution: VerifierAttribution): string {
  const cases = getQualitativeCases(attribution)
  return [
    '# Figure 5: Qualitative Verifier-Attribution Case Pack',
    '',
    'Source inputs:',
    '',
    `- Verifier attribution: \`${args.attribution}\``,
    '',
    '| Case | Decision id | Action changed | Primary reason changed | Before issues | After issues | Label transition |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...cases.map((entry) => {
      const transition = summarizeCaseTransition(entry.case)
      const beforeIssues = entry.case.beforeIssues.length > 0 ? entry.case.beforeIssues.join(', ') : 'none'
      const afterIssues = entry.case.afterIssues.length > 0 ? entry.case.afterIssues.join(', ') : 'none'
      return `| ${entry.title} | \`${entry.case.decisionId}\` | ${entry.case.actionChanged ?? 'n/a'} | ${entry.case.primaryReasonChanged ?? 'n/a'} | ${beforeIssues} | ${afterIssues} | ${transition.join('; ')} |`
    }),
    '',
    'Caption draft:',
    '',
    '> Qualitative verifier-attribution case pack. Cases are selected from the generated attribution artifact to show two repaired semantic failures, one unrepaired hard failure, and one schema failure outside the paired revision subset.',
    '',
  ].join('\n')
}

function renderVerifierPipelineMarkdown(attribution: VerifierAttribution): string {
  return [
    '# Figure 1: Verifier-Grounded Multi-Agent Reasoning Teaser',
    '',
    'Source inputs:',
    '',
    `- Verifier attribution: \`${args.attribution}\``,
    '',
    'Panel roles:',
    '',
    '| Panel | Role | Reviewer-facing claim |',
    '| --- | --- | --- |',
    '| A | Cooperation contrast | The figure first contrasts explicit communication with zero-communication team play so reviewers see why intent inference is the core object rather than card strength. |',
    '| B | Hidden team play | Guandan turns teammate intent into a latent variable: only public actions, legal candidates, roles, and hand-count signals are observable. |',
    '| C | Trace contract and verifier | The LLM must expose field-level commitments, and the verifier map `V(d_t,r_t,a_t)` separates hard rule/evidence failures from diagnostic soft labels. |',
    '| D | Paired evidence accounting | Verifier feedback is evaluated on the same parseable decision ids, while schema failures and end-to-end reliability stay visible. |',
    '',
    'Caption draft:',
    '',
    `> Verifiable multi-agent reasoning under zero communication. Unlike explicit team messages, Guandan exposes partner intent only through public actions. The framework converts an LLM action and rationale into auditable commitments, checks them with rule/evidence labels, and reports same-id revision evidence on ${attribution.pairedDecisionCount} eligible paired traces while keeping schema failures visible.`,
    '',
  ].join('\n')
}

function renderRevisionArchitectureMarkdown(attribution: VerifierAttribution): string {
  return [
    '# Figure 2: Trace-Contract Verifier Architecture',
    '',
    'Source inputs:',
    '',
    `- Verifier attribution: \`${args.attribution}\``,
    '',
    'Panel roles:',
    '',
    '| Panel | Role | Reviewer-facing boundary |',
    '| --- | --- | --- |',
    '| A. Decision point | Defines the acting player, public history, private observation, legal candidates, and scenario tags. | Hidden cards are allowed input but cannot be cited as public evidence. |',
    '| B. Trace contract | Converts an LLM action into auditable fields: action, objective, beliefs, evidence ids, rationale, risk, and confidence. | Provider-complete output is not counted as reliable unless it parses. |',
    '| C. Rule-grounded verifier | Maps the same state, trace, and action to hard labels, soft labels, and issue codes. | The verifier diagnoses commitments but is not an action oracle. |',
    '| D. Same-id revision | Lets the model repair the trace under the same decision state and compares paired labels. | Paired analysis uses only parseable first-pass traces and keeps schema failures visible. |',
    '',
    'Caption draft:',
    '',
    `> Trace-contract verifier architecture. A decision point is converted into a structured trace with explicit evidence boundaries. The verifier maps the same state, trace, and selected action to hard rule/evidence labels, soft strategic labels, and issue codes; feedback then supports bounded same-state revision without letting the verifier choose the action. In the pilot, ${attribution.pairedDecisionCount} eligible paired traces reduce hard verifier failures from ${attribution.hardFailureAttribution.beforeHardFailureCount} to ${attribution.hardFailureAttribution.afterHardFailureCount}.`,
    '',
  ].join('\n')
}

function renderQualitativeCasePackSvg(attribution: VerifierAttribution): string {
  const cases = getQualitativeCases(attribution)
  const cards = cases.map((entry, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = 72 + col * 676
    const y = 124 + row * 270
    return renderCaseCard(entry.case, entry.title, x, y)
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="760" viewBox="0 0 1500 760" role="img" aria-labelledby="title desc">
  <title id="title">Qualitative verifier-attribution case pack</title>
  <desc id="desc">A four-case visual summary showing two repaired verifier failures, one remaining hard failure, and one parse failure outside the paired revision subset.</desc>
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#334155" />
    </marker>
    <style>
      .title { font: 700 34px Arial, Helvetica, sans-serif; fill: #111827; }
      .subtitle { font: 400 18px Arial, Helvetica, sans-serif; fill: #475569; }
      .panel-title { font: 700 20px Arial, Helvetica, sans-serif; fill: #111827; }
      .id { font: 400 13px Arial, Helvetica, sans-serif; fill: #64748b; }
      .label { font: 700 15px Arial, Helvetica, sans-serif; fill: #334155; }
      .text { font: 400 14px Arial, Helvetica, sans-serif; fill: #475569; }
      .tiny { font: 400 12px Arial, Helvetica, sans-serif; fill: #64748b; }
      .panel { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 2; }
      .before { fill: #fef2f2; stroke: #dc2626; stroke-width: 2; }
      .after { fill: #ecfdf5; stroke: #059669; stroke-width: 2; }
      .feedback { fill: #fff7ed; stroke: #ea580c; stroke-width: 2; }
      .neutral { fill: #ffffff; stroke: #94a3b8; stroke-width: 1.8; }
      .arrow { stroke: #334155; stroke-width: 2.5; fill: none; marker-end: url(#arrow); }
      .bad { stroke: #c2410c; stroke-width: 2.5; fill: none; stroke-dasharray: 7 5; marker-end: url(#arrow); }
      .source { font: 400 12px Arial, Helvetica, sans-serif; fill: #64748b; }
    </style>
  </defs>
  <rect width="1500" height="760" fill="#ffffff" />
  <text x="750" y="46" text-anchor="middle" class="title">Qualitative Case Pack: What the Verifier Repairs and What It Does Not</text>
  <text x="750" y="78" text-anchor="middle" class="subtitle">Selected cases come from the paired attribution artifact; action changes are separated from reasoning-trace repairs</text>
  ${cards}
  <text x="750" y="732" text-anchor="middle" class="source">Source: ${escapeXml(args.attribution)}</text>
</svg>
`
}

function renderRevisionArchitectureSvg(attribution: VerifierAttribution): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="590" viewBox="0 0 1500 590" role="img" aria-labelledby="title desc">
  <title id="title">Trace-contract verifier architecture</title>
  <desc id="desc">A four-panel method diagram showing decision-point evidence, structured trace fields, rule-grounded verifier labels, and same-id revision accounting.</desc>
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#334155" />
    </marker>
    <marker id="arrow-red" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#dc2626" />
    </marker>
    <marker id="arrow-orange" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#c2410c" />
    </marker>
    <style>
      .title { font: 700 32px Arial, Helvetica, sans-serif; fill: #111827; }
      .subtitle { font: 400 17px Arial, Helvetica, sans-serif; fill: #475569; }
      .panel-title { font: 700 21px Arial, Helvetica, sans-serif; fill: #111827; }
      .box-title { font: 700 18px Arial, Helvetica, sans-serif; fill: #111827; }
      .text { font: 400 15px Arial, Helvetica, sans-serif; fill: #334155; }
      .small { font: 400 13px Arial, Helvetica, sans-serif; fill: #64748b; }
      .tiny { font: 400 12px Arial, Helvetica, sans-serif; fill: #64748b; }
      .panel { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 2; }
      .decision { fill: #f8fafc; stroke: #94a3b8; stroke-width: 2; }
      .model { fill: #eff6ff; stroke: #2563eb; stroke-width: 2.3; }
      .verifier { fill: #ecfdf5; stroke: #059669; stroke-width: 2.3; }
      .artifact { fill: #fff7ed; stroke: #ea580c; stroke-width: 2; }
      .fail { fill: #fef2f2; stroke: #dc2626; stroke-width: 2.3; }
      .metric { fill: #ecfeff; stroke: #0891b2; stroke-width: 2.3; }
      .line { stroke: #334155; stroke-width: 2.7; fill: none; marker-end: url(#arrow); }
      .thin { stroke: #334155; stroke-width: 2; fill: none; marker-end: url(#arrow); }
      .redline { stroke: #dc2626; stroke-width: 2.4; fill: none; marker-end: url(#arrow-red); }
      .feedback { stroke: #c2410c; stroke-width: 2.4; fill: none; stroke-dasharray: 8 6; marker-end: url(#arrow-orange); }
    </style>
  </defs>
  <rect width="1500" height="590" fill="#ffffff" />
  <text x="750" y="42" text-anchor="middle" class="title">Trace-Contract Verifier Architecture</text>
  <text x="750" y="72" text-anchor="middle" class="subtitle">Structured commitments make zero-communication reasoning checkable without using the verifier as an action oracle</text>

  <rect x="34" y="108" width="340" height="365" rx="17" class="panel" />
  <rect x="402" y="108" width="340" height="365" rx="17" class="panel" />
  <rect x="770" y="108" width="340" height="365" rx="17" class="panel" />
  <rect x="1138" y="108" width="328" height="365" rx="17" class="panel" />

  <text x="58" y="148" class="panel-title">A. Decision point</text>
  <text x="426" y="148" class="panel-title">B. Trace contract</text>
  <text x="794" y="148" class="panel-title">C. Rule-grounded verifier</text>
  <text x="1162" y="148" class="panel-title">D. Same-id revision</text>

  <g transform="translate(70,182)">
    <rect width="270" height="62" rx="12" class="model" />
    <text x="135" y="25" text-anchor="middle" class="box-title">State packet</text>
    <text x="135" y="48" text-anchor="middle" class="text">d_t=(p_t,h_t,o_t,A_t,z_t)</text>
    <rect y="80" width="270" height="76" rx="12" class="decision" />
    <text x="135" y="106" text-anchor="middle" class="box-title">Observable evidence</text>
    <text x="135" y="128" text-anchor="middle" class="small">public history h_t</text>
    <text x="135" y="146" text-anchor="middle" class="small">hand counts, table context</text>
    <rect y="174" width="270" height="64" rx="12" class="fail" />
    <text x="135" y="199" text-anchor="middle" class="box-title">Evidence boundary</text>
    <text x="135" y="220" text-anchor="middle" class="small">hidden cards cannot be cited</text>
    <text x="135" y="238" text-anchor="middle" class="small">as public facts</text>
    <rect y="256" width="270" height="52" rx="12" class="metric" />
    <text x="135" y="288" text-anchor="middle" class="text">dynamic legal candidates A_t</text>
  </g>

  <g transform="translate(438,182)">
    <rect width="270" height="76" rx="12" class="model" />
    <text x="135" y="28" text-anchor="middle" class="box-title">LLM actor</text>
    <text x="135" y="53" text-anchor="middle" class="text">selects a_t in A_t; emits trace r0</text>
    <rect y="94" width="270" height="138" rx="12" class="artifact" />
    <text x="135" y="122" text-anchor="middle" class="box-title">Structured trace fields</text>
    <text x="135" y="150" text-anchor="middle" class="small">action, objective, partner belief</text>
    <text x="135" y="174" text-anchor="middle" class="small">opponent belief + evidence ids</text>
    <text x="135" y="198" text-anchor="middle" class="small">rationale, risk, confidence</text>
    <rect y="254" width="270" height="54" rx="12" class="metric" />
    <text x="135" y="279" text-anchor="middle" class="small">schema gate:</text>
    <text x="135" y="297" text-anchor="middle" class="small">parseable traces enter audit</text>
  </g>

  <g transform="translate(806,182)">
    <rect width="270" height="68" rx="12" class="verifier" />
    <text x="135" y="27" text-anchor="middle" class="box-title">Verifier map</text>
    <text x="135" y="50" text-anchor="middle" class="text">V(d_t,r_t,a_t) -> (y_t,e_t)</text>
    <rect y="86" width="270" height="74" rx="12" class="artifact" />
    <text x="135" y="112" text-anchor="middle" class="box-title">Hard labels</text>
    <text x="135" y="132" text-anchor="middle" class="small">legal action, beats table</text>
    <text x="135" y="150" text-anchor="middle" class="small">public history, hidden-info</text>
    <rect y="178" width="270" height="74" rx="12" class="metric" />
    <text x="135" y="204" text-anchor="middle" class="box-title">Soft labels</text>
    <text x="135" y="224" text-anchor="middle" class="small">partner/opponent consistency</text>
    <text x="135" y="242" text-anchor="middle" class="small">objective, reason-action</text>
    <rect y="270" width="270" height="50" rx="11" class="decision" />
    <text x="135" y="292" text-anchor="middle" class="small">diagnoses commitments;</text>
    <text x="135" y="310" text-anchor="middle" class="small">never chooses the move</text>
  </g>

  <g transform="translate(1174,182)">
    <rect width="256" height="58" rx="12" class="artifact" />
    <text x="128" y="25" text-anchor="middle" class="box-title">Feedback vector</text>
    <text x="128" y="45" text-anchor="middle" class="small">labels y_t + issue codes e_t</text>
    <rect y="76" width="256" height="58" rx="12" class="model" />
    <text x="128" y="100" text-anchor="middle" class="box-title">Bounded revision</text>
    <text x="128" y="121" text-anchor="middle" class="small">same state; repaired trace</text>
    <rect y="152" width="256" height="58" rx="12" class="verifier" />
    <text x="128" y="176" text-anchor="middle" class="box-title">Recheck</text>
    <text x="128" y="197" text-anchor="middle" class="small">same labels, same decision id</text>
    <rect y="228" width="256" height="80" rx="12" class="metric" />
    <text x="128" y="256" text-anchor="middle" class="box-title">Paired evidence</text>
    <text x="128" y="276" text-anchor="middle" class="text">${attribution.pairedDecisionCount} paired traces</text>
    <text x="128" y="300" text-anchor="middle" class="text">hard failures ${attribution.hardFailureAttribution.beforeHardFailureCount} to ${attribution.hardFailureAttribution.afterHardFailureCount}</text>
  </g>

  <path d="M374,285 H398" class="line" />
  <path d="M742,285 H766" class="line" />
  <path d="M1110,285 H1134" class="feedback" />
  <path d="M573,490 C650,535 840,535 955,490" class="redline" />
  <text x="765" y="552" text-anchor="middle" class="small">Schema failures remain end-to-end failures; paired before/after evidence uses only first-pass parseable traces.</text>
</svg>
`
}

function renderVerifierPipelineSvg(attribution: VerifierAttribution): string {
  const publicHistory = getHardComponent(attribution, 'publicHistoryConsistent')
  const hiddenInfo = getHardComponent(attribution, 'hiddenInfoDisciplined')
  const removedHardFailures = attribution.hardFailureAttribution.beforeHardFailureCount
    - attribution.hardFailureAttribution.afterHardFailureCount
  const publicShare = Math.round((publicHistory.shareOfHardFailureDrop ?? 0) * 100)
  const hiddenShare = Math.round((hiddenInfo.shareOfHardFailureDrop ?? 0) * 100)
  const totalShare = Math.max(publicShare + hiddenShare, 1)
  const attributionWidth = 250
  const publicWidth = Math.round(attributionWidth * (publicShare / totalShare))
  const hiddenWidth = attributionWidth - publicWidth
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="700" viewBox="0 0 1500 700" role="img" aria-labelledby="title desc">
  <title id="title">Verifier-grounded multi-agent reasoning teaser</title>
  <desc id="desc">A paper teaser contrasting explicit communication with zero-communication team play, then showing the trace contract, verifier map, and same-id paired evidence after verifier feedback.</desc>
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#334155" />
    </marker>
    <marker id="arrow-orange" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#c2410c" />
    </marker>
    <style>
      .title { font: 700 34px Arial, Helvetica, sans-serif; fill: #111827; }
      .subtitle { font: 400 18px Arial, Helvetica, sans-serif; fill: #475569; }
      .kicker { font: 700 13px Arial, Helvetica, sans-serif; fill: #2563eb; letter-spacing: 0; }
      .panel-title { font: 700 21px Arial, Helvetica, sans-serif; fill: #111827; }
      .box-title { font: 700 16px Arial, Helvetica, sans-serif; fill: #111827; }
      .label { font: 700 14px Arial, Helvetica, sans-serif; fill: #334155; }
      .text { font: 400 14px Arial, Helvetica, sans-serif; fill: #475569; }
      .small { font: 400 12px Arial, Helvetica, sans-serif; fill: #64748b; }
      .tiny { font: 400 10px Arial, Helvetica, sans-serif; fill: #64748b; }
      .formula { font: 700 20px Arial, Helvetica, sans-serif; fill: #111827; }
      .bigMetric { font: 700 42px Arial, Helvetica, sans-serif; fill: #111827; }
      .panel { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 2; }
      .subpanel { fill: #ffffff; stroke: #cbd5e1; stroke-width: 1.5; }
      .blue { fill: #eff6ff; stroke: #2563eb; stroke-width: 2; }
      .red { fill: #fef2f2; stroke: #dc2626; stroke-width: 2; }
      .orange { fill: #fff7ed; stroke: #ea580c; stroke-width: 2; }
      .green { fill: #ecfdf5; stroke: #059669; stroke-width: 2; }
      .cyan { fill: #ecfeff; stroke: #0891b2; stroke-width: 2; }
      .gray { fill: #f8fafc; stroke: #64748b; stroke-width: 1.6; }
      .line { stroke: #334155; stroke-width: 2.8; fill: none; marker-end: url(#arrow); }
      .feedback { stroke: #c2410c; stroke-width: 2.4; fill: none; stroke-dasharray: 7 5; marker-end: url(#arrow-orange); }
      .thin { stroke: #94a3b8; stroke-width: 1.6; fill: none; }
      .dashed { stroke: #dc2626; stroke-width: 2; fill: none; stroke-dasharray: 7 5; }
      .cardText { font: 700 13px Arial, Helvetica, sans-serif; fill: #1e40af; }
      .bubble { fill: #ffffff; stroke: #64748b; stroke-width: 1.7; }
      .mutedBand { fill: #f1f5f9; stroke: #cbd5e1; stroke-width: 1.4; }
      .stageLabel { font: 700 15px Arial, Helvetica, sans-serif; fill: #0f172a; }
    </style>
  </defs>
  <rect width="1500" height="700" fill="#ffffff" />
  <text x="750" y="42" text-anchor="middle" class="title">Verifiable Reasoning When Teammates Cannot Talk</text>
  <text x="750" y="72" text-anchor="middle" class="subtitle">Guandan compresses mixed-motive cooperation into public actions; our verifier turns hidden intent claims into auditable evidence.</text>

  <rect x="70" y="106" width="615" height="215" rx="18" class="panel" />
  <text x="96" y="136" class="kicker">REFERENCE SETTING</text>
  <text x="96" y="163" class="panel-title">A. Explicit communication</text>
  <rect x="107" y="187" width="115" height="58" rx="16" class="bubble" />
  <text x="164" y="211" text-anchor="middle" class="small">I will</text>
  <text x="164" y="229" text-anchor="middle" class="small">support you</text>
  <path d="M196,244 L226,263" stroke="#64748b" stroke-width="1.7" fill="none" />
  <circle cx="270" cy="245" r="25" class="blue" />
  <text x="270" y="250" text-anchor="middle" class="label">ally</text>
  <circle cx="390" cy="245" r="25" class="blue" />
  <text x="390" y="250" text-anchor="middle" class="label">LLM</text>
  <rect x="432" y="194" width="214" height="74" rx="14" class="green" />
  <text x="539" y="221" text-anchor="middle" class="box-title">Intent is stated</text>
  <text x="539" y="244" text-anchor="middle" class="small">can cite messages</text>
  <path d="M295,245 H358" class="line" />
  <path d="M415,245 H435" class="line" />

  <rect x="815" y="106" width="615" height="215" rx="18" class="panel" />
  <text x="841" y="136" class="kicker">OUR SETTING</text>
  <text x="841" y="163" class="panel-title">B. Zero-communication play</text>
  <ellipse cx="1025" cy="250" rx="76" ry="32" class="mutedBand" />
  <text x="1025" y="246" text-anchor="middle" class="label">public table</text>
  <text x="1025" y="264" text-anchor="middle" class="tiny">lead / pass / beat</text>
  <circle cx="1025" cy="195" r="24" class="blue" />
  <text x="1025" y="200" text-anchor="middle" class="label">ally</text>
  <circle cx="1025" cy="305" r="24" class="blue" />
  <text x="1025" y="310" text-anchor="middle" class="label">LLM</text>
  <circle cx="919" cy="250" r="22" class="red" />
  <text x="919" y="255" text-anchor="middle" class="small">opp.</text>
  <circle cx="1131" cy="250" r="22" class="red" />
  <text x="1131" y="255" text-anchor="middle" class="small">opp.</text>
  <path d="M1025,219 V281" class="thin" />
  <path d="M941,250 H979" class="thin" />
  <path d="M1071,250 H1109" class="thin" />
  <rect x="1152" y="158" width="112" height="38" rx="12" class="red" />
  <circle cx="1172" cy="177" r="10" fill="none" stroke="#dc2626" stroke-width="2.3" />
  <path d="M1165,170 L1179,184" stroke="#dc2626" stroke-width="2.3" />
  <text x="1223" y="182" text-anchor="middle" style="font: 700 14px Arial, Helvetica, sans-serif; fill: #991b1b;">no chat</text>
  <rect x="1232" y="209" width="178" height="74" rx="14" class="orange" />
  <text x="1321" y="235" text-anchor="middle" class="box-title">Intent is latent</text>
  <text x="1321" y="259" text-anchor="middle" class="small">actions signal intent</text>
  <path d="M1153,250 H1234" class="line" />

  <text x="750" y="352" text-anchor="middle" class="stageLabel">Evaluation pipeline: from one decision packet to same-id verifier evidence</text>
  <path d="M750,322 V364" class="line" />

  <rect x="60" y="382" width="285" height="220" rx="18" class="panel" />
  <text x="84" y="414" class="kicker">STATE</text>
  <text x="84" y="442" class="panel-title">C. Decision packet</text>
  <rect x="90" y="466" width="225" height="72" rx="14" class="subpanel" />
  <text x="112" y="492" class="box-title">Observable evidence</text>
  <text x="112" y="515" class="text">history, roles, counts</text>
  <text x="112" y="534" class="text">legal candidates A_t</text>
  <rect x="90" y="554" width="225" height="34" rx="10" class="red" />
  <text x="202" y="576" text-anchor="middle" class="small">private cards stay private</text>

  <rect x="392" y="382" width="285" height="220" rx="18" class="panel" />
  <text x="416" y="414" class="kicker">CONTRACT</text>
  <text x="416" y="442" class="panel-title">D. Structured trace</text>
  <rect x="420" y="466" width="228" height="106" rx="14" class="orange" />
  <text x="534" y="491" text-anchor="middle" class="box-title">LLM trace r_t</text>
  <text x="454" y="516" class="label">action</text>
  <text x="548" y="516" class="text">a_t</text>
  <text x="454" y="541" class="label">beliefs</text>
  <text x="548" y="541" class="text">agents</text>
  <text x="454" y="566" class="label">evidence</text>
  <text x="548" y="566" class="text">public ids</text>
  <text x="534" y="594" text-anchor="middle" class="small">rationale becomes commitments</text>

  <rect x="724" y="382" width="285" height="220" rx="18" class="panel" />
  <text x="748" y="414" class="kicker">VERIFIER</text>
  <text x="748" y="442" class="panel-title">E. Rule-grounded checks</text>
  <rect x="756" y="466" width="220" height="62" rx="14" fill="#ffffff" stroke="#334155" stroke-width="2" />
  <text x="866" y="492" text-anchor="middle" class="formula">V(d_t, r_t, a_t)</text>
  <text x="866" y="514" text-anchor="middle" class="text">-> labels y_t + issues e_t</text>
  <rect x="746" y="548" width="118" height="42" rx="12" class="green" />
  <text x="805" y="566" text-anchor="middle" class="box-title">Hard</text>
  <text x="805" y="584" text-anchor="middle" class="tiny">rule checks</text>
  <rect x="878" y="548" width="98" height="42" rx="12" class="cyan" />
  <text x="927" y="566" text-anchor="middle" class="box-title">Soft</text>
  <text x="927" y="584" text-anchor="middle" class="tiny">strategic fit</text>

  <rect x="1056" y="382" width="384" height="220" rx="18" class="panel" />
  <text x="1080" y="414" class="kicker">EVIDENCE</text>
  <text x="1080" y="442" class="panel-title">F. Same-id paired revision</text>
  <rect x="1086" y="460" width="102" height="84" rx="14" class="red" />
  <text x="1137" y="482" text-anchor="middle" class="small">before</text>
  <text x="1137" y="522" text-anchor="middle" class="bigMetric">${attribution.hardFailureAttribution.beforeHardFailureCount}</text>
  <text x="1137" y="541" text-anchor="middle" class="tiny">hard fail.</text>
  <path d="M1201,503 H1248" class="line" />
  <text x="1225" y="484" text-anchor="middle" class="label">-${removedHardFailures}</text>
  <rect x="1260" y="460" width="106" height="84" rx="14" class="green" />
  <text x="1313" y="482" text-anchor="middle" class="small">after</text>
  <text x="1313" y="522" text-anchor="middle" class="bigMetric">${attribution.hardFailureAttribution.afterHardFailureCount}</text>
  <text x="1313" y="541" text-anchor="middle" class="tiny">hard fail.</text>
  <rect x="1088" y="558" width="274" height="34" rx="10" class="cyan" />
  <text x="1225" y="580" text-anchor="middle" class="box-title">${attribution.pairedDecisionCount} same-id paired traces</text>
  <text x="1088" y="622" class="box-title">Repaired hard-failure sources</text>
  <rect x="1088" y="638" width="${publicWidth}" height="18" rx="6" fill="#86efac" stroke="#16a34a" />
  <rect x="${1088 + publicWidth}" y="638" width="${hiddenWidth}" height="18" rx="6" fill="#67e8f9" stroke="#0891b2" />
  <text x="1088" y="672" class="tiny">${publicShare}% public-history consistency</text>
  <text x="1262" y="672" class="tiny">${hiddenShare}% hidden-info discipline</text>
  <text x="1088" y="688" class="tiny">${attribution.excludedParseFailureCount} schema failures remain end-to-end failures</text>

  <path d="M345,498 H380" class="line" />
  <path d="M677,498 H712" class="line" />
  <path d="M1009,498 H1044" class="line" />
  <path d="M1318,638 C1040,668 744,670 536,613" class="feedback" />
</svg>
`
}

function renderMainPilotResultsSvg(summary: PilotSummary, repair: RepairMetrics, attribution: VerifierAttribution): string {
  const rows = getMainResultRows(summary, repair)
  const publicHistory = getHardComponent(attribution, 'publicHistoryConsistent')
  const hiddenInfo = getHardComponent(attribution, 'hiddenInfoDisciplined')
  const beforeHard = attribution.hardFailureAttribution.beforeHardFailureCount
  const afterHard = attribution.hardFailureAttribution.afterHardFailureCount
  const removedHard = beforeHard - afterHard
  const publicDrop = Math.abs(publicHistory.failDelta)
  const hiddenDrop = Math.abs(hiddenInfo.failDelta)
  const chartX = 105
  const chartY = 168
  const chartHeight = 250
  const barWidth = 58
  const gap = 32

  const parseBars = rows.map((row, index) => {
    const x = chartX + index * (barWidth + gap)
    const parsedHeight = Math.round(chartHeight * row.parseYield)
    const failureHeight = chartHeight - parsedHeight
    const y = chartY + chartHeight - parsedHeight
    const percent = formatPercent(row.parseYield)
    const schemaFailures = row.total - row.parsed
    const schemaFailureLabel = schemaFailures > 0 ? `fail ${schemaFailures}` : 'fail 0'
    return `<g>
      <rect x="${x}" y="${chartY}" width="${barWidth}" height="${Math.max(failureHeight, 0)}" rx="8" fill="#fde68a" stroke="#f59e0b" opacity="0.80" />
      <rect x="${x}" y="${y}" width="${barWidth}" height="${parsedHeight}" rx="8" fill="#2563eb" opacity="0.88" />
      <rect x="${x}" y="${chartY}" width="${barWidth}" height="${chartHeight}" rx="8" fill="none" stroke="#64748b" opacity="0.35" />
      <text x="${x + barWidth / 2}" y="${y - 12}" text-anchor="middle" class="value">${row.parsed}/${row.total}</text>
      <text x="${x + barWidth / 2}" y="${chartY + 17}" text-anchor="middle" class="tiny">${schemaFailureLabel}</text>
      <text x="${x + barWidth / 2}" y="${chartY + chartHeight + 28}" text-anchor="middle" class="axis-label">${escapeXml(row.shortLabel)}</text>
      <rect x="${x - 2}" y="${chartY + chartHeight + 44}" width="${barWidth + 4}" height="28" rx="8" fill="#fff1f2" stroke="#ef4444" />
      <text x="${x + barWidth / 2}" y="${chartY + chartHeight + 63}" text-anchor="middle" class="mini">H=${row.hardFailures}</text>
      <text x="${x + barWidth / 2}" y="${chartY + chartHeight + 92}" text-anchor="middle" class="tick">${percent}</text>
    </g>`
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="650" viewBox="0 0 1500 650" role="img" aria-labelledby="title desc">
  <title id="title">Main pilot results</title>
  <desc id="desc">Source-backed pilot results shown as three panels: parse yield, paired verifier revision, and hard-failure attribution.</desc>
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#334155" />
    </marker>
    <style>
      .title { font: 700 34px Arial, Helvetica, sans-serif; fill: #111827; }
      .subtitle { font: 400 18px Arial, Helvetica, sans-serif; fill: #475569; }
      .panel-title { font: 700 22px Arial, Helvetica, sans-serif; fill: #111827; }
      .axis-label { font: 700 14px Arial, Helvetica, sans-serif; fill: #334155; }
      .tick { font: 400 13px Arial, Helvetica, sans-serif; fill: #64748b; }
      .value { font: 700 15px Arial, Helvetica, sans-serif; fill: #111827; }
      .mini { font: 700 13px Arial, Helvetica, sans-serif; fill: #991b1b; }
      .tiny { font: 400 11px Arial, Helvetica, sans-serif; fill: #92400e; }
      .note { font: 400 15px Arial, Helvetica, sans-serif; fill: #475569; }
      .big { font: 700 46px Arial, Helvetica, sans-serif; fill: #111827; }
      .huge { font: 700 64px Arial, Helvetica, sans-serif; fill: #111827; }
      .box { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 2; rx: 14; }
      .line { stroke: #334155; stroke-width: 2.5; fill: none; marker-end: url(#arrow); }
      .softline { stroke: #94a3b8; stroke-width: 1.5; fill: none; }
    </style>
  </defs>
  <rect width="1500" height="650" fill="#ffffff" />
  <text x="750" y="46" text-anchor="middle" class="title">Main Pilot Results: Three Reliability Layers</text>
  <text x="750" y="76" text-anchor="middle" class="subtitle">Parseability, paired revision, and attribution are reported with separate denominators</text>

  <rect x="55" y="112" width="510" height="455" class="box" />
  <text x="84" y="148" class="panel-title">A. End-to-end parse yield</text>
  <text x="84" y="176" class="note">Bars separate parseable traces from schema failures.</text>
  <line x1="${chartX}" y1="${chartY + chartHeight}" x2="${chartX + 425}" y2="${chartY + chartHeight}" stroke="#334155" stroke-width="2" />
  <line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + chartHeight}" stroke="#334155" stroke-width="2" />
  <text x="${chartX - 12}" y="${chartY + 4}" text-anchor="end" class="tick">100%</text>
  <text x="${chartX - 12}" y="${chartY + chartHeight / 2 + 4}" text-anchor="end" class="tick">50%</text>
  <text x="${chartX - 12}" y="${chartY + chartHeight + 4}" text-anchor="end" class="tick">0%</text>
  <line x1="${chartX}" y1="${chartY + chartHeight / 2}" x2="${chartX + 425}" y2="${chartY + chartHeight / 2}" stroke="#e2e8f0" stroke-width="1.5" />
  ${parseBars}

  <rect x="595" y="112" width="395" height="455" class="box" />
  <text x="624" y="148" class="panel-title">B. Paired verifier revision</text>
  <text x="624" y="176" class="note">Same 32 candidate traces, before vs. after feedback.</text>
  <g transform="translate(628,230)">
    <rect x="0" y="0" width="128" height="126" rx="16" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
    <text x="64" y="34" text-anchor="middle" class="note">before</text>
    <text x="64" y="88" text-anchor="middle" class="huge">${beforeHard}</text>
    <text x="64" y="112" text-anchor="middle" class="mini">hard failures</text>
  </g>
  <path d="M770,294 C800,264 828,264 858,294" class="line" />
  <text x="814" y="258" text-anchor="middle" class="value">-${removedHard}</text>
  <g transform="translate(872,230)">
    <rect x="0" y="0" width="128" height="126" rx="16" fill="#ecfdf5" stroke="#059669" stroke-width="2" />
    <text x="64" y="34" text-anchor="middle" class="note">after</text>
    <text x="64" y="88" text-anchor="middle" class="huge">${afterHard}</text>
    <text x="64" y="112" text-anchor="middle" class="mini">hard failures</text>
  </g>
  <text x="793" y="400" text-anchor="middle" class="value">McNemar: before-only ${attribution.hardFailureAttribution.decisionLevelMcnemar.beforeOnly}, after-only ${attribution.hardFailureAttribution.decisionLevelMcnemar.afterOnly}, p &lt; 0.001</text>
  <text x="793" y="430" text-anchor="middle" class="note">Bootstrap 95% CI for hard-failure delta: ${attribution.hardFailureAttribution.hardFailureDeltaBootstrap95Ci[0]} to ${attribution.hardFailureAttribution.hardFailureDeltaBootstrap95Ci[1]}.</text>

  <rect x="1020" y="112" width="425" height="455" class="box" />
  <text x="1049" y="148" class="panel-title">C. What failures disappear?</text>
  <text x="1049" y="176" class="note">Waterfall attribution decomposes the drop.</text>
  <text x="1049" y="242" class="big">${removedHard}</text>
  <text x="1125" y="235" class="value">removed hard failures</text>
  <text x="1125" y="262" class="note">from ${beforeHard} before to ${afterHard} after</text>
  <g transform="translate(1052,304)">
    <line x1="0" y1="150" x2="344" y2="150" stroke="#cbd5e1" stroke-width="2" />
    <rect x="0" y="0" width="58" height="150" rx="8" fill="#fee2e2" stroke="#dc2626" />
    <text x="29" y="30" text-anchor="middle" class="value">${beforeHard}</text>
    <text x="29" y="174" text-anchor="middle" class="tick">before</text>
    <rect x="92" y="${Math.round(150 * afterHard / beforeHard)}" width="72" height="${Math.round(150 * publicDrop / beforeHard)}" rx="8" fill="#22c55e" opacity="0.84" stroke="#15803d" />
    <text x="128" y="${Math.round(150 * afterHard / beforeHard) + 26}" text-anchor="middle" class="value">-${publicDrop}</text>
    <text x="128" y="174" text-anchor="middle" class="tick">public</text>
    <rect x="198" y="${Math.round(150 * afterHard / beforeHard)}" width="62" height="${Math.round(150 * hiddenDrop / beforeHard)}" rx="8" fill="#0ea5e9" opacity="0.84" stroke="#0284c7" />
    <text x="229" y="${Math.round(150 * afterHard / beforeHard) + 26}" text-anchor="middle" class="value">-${hiddenDrop}</text>
    <text x="229" y="174" text-anchor="middle" class="tick">hidden</text>
    <rect x="296" y="${Math.round(150 * (beforeHard - afterHard) / beforeHard)}" width="58" height="${Math.round(150 * afterHard / beforeHard)}" rx="8" fill="#f1f5f9" stroke="#64748b" />
    <text x="325" y="${Math.round(150 * (beforeHard - afterHard) / beforeHard) + 28}" text-anchor="middle" class="value">${afterHard}</text>
    <text x="325" y="174" text-anchor="middle" class="tick">after</text>
  </g>
  <rect x="1052" y="506" width="18" height="18" rx="4" fill="#22c55e" opacity="0.86" />
  <text x="1080" y="520" class="value">public history: ${publicHistory.beforeFail} to ${publicHistory.afterFail}</text>
  <rect x="1258" y="506" width="18" height="18" rx="4" fill="#0ea5e9" opacity="0.86" />
  <text x="1286" y="520" class="value">hidden: ${hiddenInfo.beforeFail} to ${hiddenInfo.afterFail}</text>

  <text x="750" y="618" text-anchor="middle" class="tick">Sources: ${escapeXml(args.pilotSummary)} and ${escapeXml(args.attribution)}</text>
</svg>
`
}

function getMainResultRows(summary: PilotSummary, repair: RepairMetrics): Array<{
  agentId: string
  label: string
  shortLabel: string
  parsed: number
  total: number
  parseYield: number
  hardFailures: number
}> {
  const labels: Record<string, { label: string; shortLabel: string }> = {
    'plain-llm': { label: 'plain LLM', shortLabel: 'Plain' },
    'candidate-constrained-llm': { label: 'candidate constrained', shortLabel: 'Cand.' },
    'tom-prompted-llm': { label: 'ToM prompted', shortLabel: 'ToM' },
    'verifier-revision-llm': { label: 'verifier revision', shortLabel: 'Revision' },
  }

  const rowsByAgent = new Map(summary.rows.map((row) => [row.agentId, row]))
  const promptRows = Object.entries(labels).map(([agentId, label]) => {
    const row = rowsByAgent.get(agentId)
    if (!row) {
      throw new Error(`Missing pilot-summary row for ${agentId}`)
    }
    return {
      agentId,
      label: label.label,
      shortLabel: label.shortLabel,
      parsed: row.parsedTraces,
      total: row.totalDecisionPoints,
      parseYield: row.totalDecisionPoints === 0 ? 0 : row.parsedTraces / row.totalDecisionPoints,
      hardFailures: row.hardFailures,
    }
  })
  const repairRow = {
    agentId: 'tom-schema-repair',
    label: 'ToM + schema repair',
    shortLabel: 'Repair',
    parsed: repair.totalParsedTraces,
    total: repair.totalDecisionPoints,
    parseYield: repair.totalDecisionPoints === 0 ? 0 : repair.totalParsedTraces / repair.totalDecisionPoints,
    hardFailures: repair.hardFailureCount,
  }
  return [
    ...promptRows.slice(0, 3),
    repairRow,
    promptRows[3],
  ]
}

function getHardComponent(attribution: VerifierAttribution, label: string): VerifierAttribution['hardComponentRows'][number] {
  const row = attribution.hardComponentRows.find((component) => component.label === label)
  if (!row) {
    throw new Error(`Missing hard component row for ${label}`)
  }
  return row
}

function getQualitativeCases(attribution: VerifierAttribution): Array<{ title: string; case: QualitativeCase }> {
  const order = [
    ['A. Public-history repair', 'public_history_repaired'],
    ['B. Hidden-information repair', 'hidden_info_repaired'],
    ['C. Remaining hard failure', 'remaining_hard_failure'],
    ['D. Parse failure outside paired subset', 'parse_failure_outside_revision'],
  ] as const
  return order.map(([title, caseType]) => {
    const qualitativeCase = attribution.qualitativeCases.find(entry => entry.caseType === caseType)
    if (!qualitativeCase) {
      throw new Error(`Missing qualitative case ${caseType}`)
    }
    return { title, case: qualitativeCase }
  })
}

function summarizeCaseTransition(qualitativeCase: QualitativeCase): string[] {
  if (qualitativeCase.caseType === 'parse_failure_outside_revision') {
    return ['schema: not parseable', 'paired revision: excluded']
  }

  const labelsByCase: Record<string, string[]> = {
    public_history_repaired: ['publicHistoryConsistent', 'partnerConsistent'],
    hidden_info_repaired: ['publicHistoryConsistent', 'hiddenInfoDisciplined'],
    remaining_hard_failure: ['publicHistoryConsistent'],
  }
  return (labelsByCase[qualitativeCase.caseType] ?? ['publicHistoryConsistent'])
    .map((label) => {
      const status = qualitativeCase.labelStatuses[label]
      return status ? `${shortLabel(label)}: ${status.before} -> ${status.after}` : `${shortLabel(label)}: n/a`
    })
}

function renderCaseCard(qualitativeCase: QualitativeCase, title: string, x: number, y: number): string {
  const transition = summarizeCaseTransition(qualitativeCase)
  const actionLine = qualitativeCase.actionChanged === null
    ? 'not revision-eligible'
    : qualitativeCase.actionChanged
      ? 'action changed'
      : 'action same'
  const beforeTitle = qualitativeCase.caseType === 'parse_failure_outside_revision'
    ? 'raw output'
    : 'before'
  const afterTitle = qualitativeCase.caseType === 'parse_failure_outside_revision'
    ? 'E2E accounting'
    : qualitativeCase.afterIssues.length === 0
      ? 'after: pass'
      : 'after: still fails'
  const beforeLines = qualitativeCase.caseType === 'parse_failure_outside_revision'
    ? ['compact action', 'free-form reasoning', 'schema mismatch']
    : [
        compactIssueList(qualitativeCase.beforeIssues),
        transition[0]?.replace(/^.*: /, '') ?? 'label checked',
        qualitativeCase.primaryReasonChanged ? 'reason changes' : 'reason stable',
      ]
  const feedbackLines = qualitativeCase.caseType === 'parse_failure_outside_revision'
    ? ['schema gate', 'no trace contract', 'excluded from pair']
    : qualitativeCase.afterIssues.length === 0
      ? ['verifier feedback', 'repair evidence', 'same decision id']
      : ['verifier feedback', 'repair attempted', 'same issue remains']
  const afterLines = qualitativeCase.caseType === 'parse_failure_outside_revision'
    ? ['counted as', 'parse failure', 'outside revision']
    : qualitativeCase.caseType === 'public_history_repaired'
      ? ['no issues', 'partner repaired', actionLine]
      : qualitativeCase.caseType === 'hidden_info_repaired'
        ? ['no issues', 'hidden info fixed', actionLine]
        : qualitativeCase.caseType === 'remaining_hard_failure'
          ? ['unknown public id', 'public history fails', actionLine]
    : [
        compactIssueList(qualitativeCase.afterIssues),
        transition[1] ?? transition[0] ?? 'labels checked',
        actionLine,
      ]
  const goodAfter = qualitativeCase.afterIssues.length === 0 && qualitativeCase.caseType !== 'parse_failure_outside_revision'
  const arrowClass = goodAfter ? 'arrow' : 'bad'

  return `<g transform="translate(${x},${y})">
    <rect width="628" height="232" rx="18" class="panel" />
    <text x="24" y="34" class="panel-title">${escapeXml(title)}</text>
    <text x="24" y="58" class="id">${escapeXml(qualitativeCase.decisionId)}; ${escapeXml(actionLine)}</text>
    ${renderSmallBox(22, 84, 166, beforeTitle, beforeLines, qualitativeCase.caseType === 'parse_failure_outside_revision' ? 'neutral' : 'before')}
    <path d="M200,136 H238" class="${arrowClass}" />
    ${renderSmallBox(250, 84, 166, 'verifier signal', feedbackLines, 'feedback')}
    <path d="M428,136 H458" class="${arrowClass}" />
    ${renderSmallBox(470, 84, 138, afterTitle, afterLines, goodAfter ? 'after' : 'before')}
    <text x="24" y="212" class="tiny">${escapeXml(transition.join('; '))}</text>
  </g>`
}

function renderSmallBox(x: number, y: number, width: number, title: string, lines: string[], className: string): string {
  const textLines = lines.slice(0, 3).map((line, index) =>
    `<text x="${x + width / 2}" y="${y + 56 + index * 19}" text-anchor="middle" class="text">${escapeXml(line)}</text>`,
  ).join('\n')
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="108" rx="13" class="${className}" />
    <text x="${x + width / 2}" y="${y + 28}" text-anchor="middle" class="label">${escapeXml(title)}</text>
    ${textLines}
  </g>`
}

function compactIssueList(issues: string[]): string {
  if (issues.length === 0) return 'no issues'
  if (issues.includes('UNKNOWN_PUBLIC_EVIDENCE') && issues.includes('HIDDEN_INFO_ASSERTED_AS_FACT')) {
    return 'public + hidden'
  }
  if (issues.includes('UNKNOWN_PUBLIC_EVIDENCE')) return 'unknown public id'
  if (issues.includes('HIDDEN_INFO_ASSERTED_AS_FACT')) return 'hidden fact claim'
  return issues[0]?.toLowerCase().replace(/_/g, ' ') ?? 'issue'
}

function shortLabel(label: string): string {
  const labels: Record<string, string> = {
    publicHistoryConsistent: 'public history',
    hiddenInfoDisciplined: 'hidden info',
    partnerConsistent: 'partner',
    opponentConsistent: 'opponent',
    reasonActionConsistent: 'reason-action',
    teamObjectiveValid: 'team objective',
  }
  return labels[label] ?? label
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function renderToMSchemaRepairFlowSvg(tom: ToMMetrics, repair: RepairMetrics): string {
  const rawFailures = tom.parseFailureCount
  const passThrough = repair.repairStatusCounts.passThrough
  const repaired = repair.repairStatusCounts.repaired
  const notRepairable = repair.repairStatusCounts.notRepairable
  const finalParsed = repair.totalParsedTraces
  const hardFailures = repair.hardFailureCount
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="520" viewBox="0 0 1400 520" role="img" aria-labelledby="title desc">
  <title id="title">ToM schema-repair flow</title>
  <desc id="desc">A source-backed paper figure showing how 50 ToM-prompted provider outputs move through raw parsing, deterministic schema repair, verifier eligibility, and hard verifier failures.</desc>
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#334155" />
    </marker>
    <style>
      .title { font: 700 34px Arial, Helvetica, sans-serif; fill: #111827; }
      .subtitle { font: 400 18px Arial, Helvetica, sans-serif; fill: #475569; }
      .box-title { font: 700 21px Arial, Helvetica, sans-serif; fill: #111827; }
      .count { font: 700 42px Arial, Helvetica, sans-serif; fill: #0f172a; }
      .text { font: 400 17px Arial, Helvetica, sans-serif; fill: #334155; }
      .small { font: 400 14px Arial, Helvetica, sans-serif; fill: #64748b; }
      .blue { fill: #eff6ff; stroke: #2563eb; }
      .green { fill: #ecfdf5; stroke: #059669; }
      .amber { fill: #fffbeb; stroke: #d97706; }
      .red { fill: #fef2f2; stroke: #dc2626; }
      .gray { fill: #f8fafc; stroke: #64748b; }
      .line { stroke: #334155; stroke-width: 2.5; fill: none; marker-end: url(#arrow); }
    </style>
  </defs>
  <rect width="1400" height="520" fill="#ffffff" />
  <text x="700" y="48" text-anchor="middle" class="title">ToM-Prompted Output Flow with Deterministic Schema Repair</text>
  <text x="700" y="78" text-anchor="middle" class="subtitle">Repair changes schema eligibility, not the model-selected action or verifier labels</text>

  <g transform="translate(60,135)">
    <rect width="230" height="145" rx="16" class="blue" stroke-width="2.5" />
    <text x="115" y="38" text-anchor="middle" class="box-title">Provider outputs</text>
    <text x="115" y="92" text-anchor="middle" class="count">${tom.totalDecisionPoints}</text>
    <text x="115" y="122" text-anchor="middle" class="text">Kimi CLI ToM pilot</text>
  </g>

  <g transform="translate(360,95)">
    <rect width="250" height="120" rx="16" class="green" stroke-width="2.5" />
    <text x="125" y="34" text-anchor="middle" class="box-title">Raw schema-valid</text>
    <text x="125" y="82" text-anchor="middle" class="count">${tom.totalParsedTraces}</text>
    <text x="125" y="108" text-anchor="middle" class="small">pass through unchanged</text>
  </g>

  <g transform="translate(360,260)">
    <rect width="250" height="120" rx="16" class="amber" stroke-width="2.5" />
    <text x="125" y="34" text-anchor="middle" class="box-title">Raw schema failures</text>
    <text x="125" y="82" text-anchor="middle" class="count">${rawFailures}</text>
    <text x="125" y="108" text-anchor="middle" class="small">need failure taxonomy</text>
  </g>

  <g transform="translate(680,260)">
    <rect width="250" height="120" rx="16" class="green" stroke-width="2.5" />
    <text x="125" y="34" text-anchor="middle" class="box-title">Schema-repaired</text>
    <text x="125" y="82" text-anchor="middle" class="count">${repaired}</text>
    <text x="125" y="108" text-anchor="middle" class="small">selectedActionId preserved</text>
  </g>

  <g transform="translate(680,405)">
    <rect width="250" height="72" rx="16" class="red" stroke-width="2.5" />
    <text x="70" y="45" text-anchor="middle" class="count" font-size="28">${notRepairable}</text>
    <text x="148" y="34" text-anchor="middle" class="box-title">not repairable</text>
    <text x="148" y="56" text-anchor="middle" class="small">tool-call-like output</text>
  </g>

  <g transform="translate(1000,135)">
    <rect width="250" height="145" rx="16" class="gray" stroke-width="2.5" />
    <text x="125" y="38" text-anchor="middle" class="box-title">Verifier eligible</text>
    <text x="125" y="92" text-anchor="middle" class="count">${finalParsed}</text>
    <text x="125" y="122" text-anchor="middle" class="text">${hardFailures} hard failure remains</text>
  </g>

  <path d="M290,207 C320,185 330,165 360,155" class="line" />
  <path d="M290,207 C320,245 330,305 360,320" class="line" />
  <path d="M610,155 C760,155 850,175 1000,200" class="line" />
  <path d="M610,320 C640,320 650,320 680,320" class="line" />
  <path d="M930,320 C965,290 980,245 1000,215" class="line" />
  <path d="M610,320 C635,370 650,430 680,442" class="line" />

  <text x="700" y="500" text-anchor="middle" class="small">Source: ${escapeXml(args.tomMetrics)} and ${escapeXml(args.repairMetrics)}</text>
</svg>
`
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
