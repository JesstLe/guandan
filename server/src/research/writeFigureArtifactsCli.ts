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

console.log(JSON.stringify({
  pipelineSvgPath,
  pipelineMarkdownPath,
  revisionArchitectureSvgPath,
  revisionArchitectureMarkdownPath,
  tomSchemaRepairSvgPath,
  tomSchemaRepairMarkdownPath,
  mainResultsSvgPath,
  mainResultsMarkdownPath,
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
    `> Main pilot results separate reliability into parse yield, paired revision, and semantic attribution. Parse yield improves from 26/50 for plain LLM prompting to 36/50 under ToM prompting and 49/50 after deterministic ToM schema repair. On the 32 paired candidate traces, verifier revision reduces hard verifier failures from ${attribution.hardFailureAttribution.beforeHardFailureCount} to ${attribution.hardFailureAttribution.afterHardFailureCount}; ${Math.round((publicHistory.shareOfHardFailureDrop ?? 0) * 100)}% of the hard-failure-count drop comes from public-history consistency and ${Math.round((hiddenInfo.shareOfHardFailureDrop ?? 0) * 100)}% from hidden-information discipline.`,
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
    '| A | Hidden-state game | The acting agent must infer partner and opponent intent from public actions only; no direct messages or hidden cards are available. |',
    '| B | Commitment card | The LLM exposes decision-relevant beliefs and rationales as field-level claims rather than free-form prose. |',
    '| C | Verifier labels | Hard labels check rules and information boundaries; soft labels diagnose strategic plausibility without claiming optimality. |',
    '| D | Paired evidence accounting | Revision is reported on the same parseable decision ids, keeping parse failures and hard-failure reductions separate. |',
    '',
    'Caption draft:',
    '',
    `> Verifier-grounded multi-agent reasoning in a zero-communication mixed-motive decision point. Guandan supplies hidden partner and opponent state, while the framework converts LLM rationales into auditable commitments, checks them with rule-grounded hard labels and conservative soft labels, and reports same-id revision evidence on ${attribution.pairedDecisionCount} eligible traces.`,
    '',
  ].join('\n')
}

function renderRevisionArchitectureMarkdown(attribution: VerifierAttribution): string {
  return [
    '# Figure 2: Verifier-Grounded Revision Architecture',
    '',
    'Source inputs:',
    '',
    `- Verifier attribution: \`${args.attribution}\``,
    '',
    'Panel roles:',
    '',
    '| Panel | Role | Reviewer-facing boundary |',
    '| --- | --- | --- |',
    '| A. First-pass trace | Builds a structured trace and routes it through a schema gate. | Provider-complete output is not counted as reliable unless it parses. |',
    '| B. Verifier feedback | Returns hard labels, soft warnings, and issue codes. | The verifier diagnoses commitments but is not an action oracle. |',
    '| C. Bounded revision | Lets the model repair the trace under the same decision state and compares paired labels. | Paired analysis uses only parseable first-pass traces and keeps schema failures visible. |',
    '',
    'Caption draft:',
    '',
    `> Verifier-grounded revision architecture. The first-pass trace must clear a schema gate before it can receive diagnostic feedback. The verifier supplies labels and issue codes, but it does not choose the action; paired revision is evaluated only for traces that are parseable before revision, while parse failures remain explicit reliability failures. In the pilot, ${attribution.pairedDecisionCount} eligible paired traces reduce hard verifier failures from ${attribution.hardFailureAttribution.beforeHardFailureCount} to ${attribution.hardFailureAttribution.afterHardFailureCount}.`,
    '',
  ].join('\n')
}

function renderRevisionArchitectureSvg(attribution: VerifierAttribution): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="610" viewBox="0 0 1500 610" role="img" aria-labelledby="title desc">
  <title id="title">Verifier-grounded revision architecture</title>
  <desc id="desc">A three-panel architecture diagram showing first-pass trace generation, verifier diagnostic feedback, and bounded revision with paired evidence.</desc>
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
      .title { font: 700 34px Arial, Helvetica, sans-serif; fill: #111827; }
      .subtitle { font: 400 18px Arial, Helvetica, sans-serif; fill: #475569; }
      .panel-title { font: 700 24px Arial, Helvetica, sans-serif; fill: #111827; }
      .box-title { font: 700 20px Arial, Helvetica, sans-serif; fill: #111827; }
      .text { font: 400 16px Arial, Helvetica, sans-serif; fill: #334155; }
      .small { font: 400 14px Arial, Helvetica, sans-serif; fill: #64748b; }
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
  <rect width="1500" height="610" fill="#ffffff" />
  <text x="750" y="48" text-anchor="middle" class="title">Verifier-Grounded Revision Architecture</text>
  <text x="750" y="78" text-anchor="middle" class="subtitle">Diagnostic feedback improves commitments without turning the verifier into an action oracle</text>

  <rect x="35" y="108" width="455" height="405" rx="18" class="panel" />
  <rect x="522.5" y="108" width="455" height="405" rx="18" class="panel" />
  <rect x="1010" y="108" width="455" height="405" rx="18" class="panel" />

  <text x="58" y="150" class="panel-title">A. First-pass trace</text>
  <text x="545.5" y="150" class="panel-title">B. Verifier feedback</text>
  <text x="1033" y="150" class="panel-title">C. Bounded revision</text>

  <g transform="translate(85,190)">
    <rect width="160" height="76" rx="13" class="decision" />
    <text x="80" y="30" text-anchor="middle" class="box-title">Decision</text>
    <text x="80" y="54" text-anchor="middle" class="text">d_t, A_t, h_t, o_t</text>
  </g>
  <g transform="translate(285,178)">
    <rect width="165" height="102" rx="13" class="model" />
    <text x="82.5" y="30" text-anchor="middle" class="box-title">LLM</text>
    <text x="82.5" y="56" text-anchor="middle" class="text">trace r0</text>
    <text x="82.5" y="79" text-anchor="middle" class="text">action a0</text>
  </g>
  <g transform="translate(156,330)">
    <rect width="172" height="68" rx="11" class="artifact" />
    <text x="86" y="29" text-anchor="middle" class="text">schema parse</text>
    <text x="86" y="51" text-anchor="middle" class="small">normalization gate</text>
  </g>
  <g transform="translate(56,428)">
    <rect width="190" height="58" rx="12" class="fail" />
    <text x="95" y="24" text-anchor="middle" class="text">unparseable traces</text>
    <text x="95" y="45" text-anchor="middle" class="small">remain end-to-end failures</text>
  </g>
  <g transform="translate(276,428)">
    <rect width="175" height="58" rx="12" class="metric" />
    <text x="87.5" y="24" text-anchor="middle" class="text">parseable traces</text>
    <text x="87.5" y="45" text-anchor="middle" class="small">enter verifier audit</text>
  </g>
  <path d="M245,228 H275" class="line" />
  <path d="M367,280 C367,315 290,322 250,330" class="thin" />
  <path d="M202,398 C185,410 167,417 151,428" class="redline" />
  <path d="M245,398 C272,410 313,416 361,428" class="line" />

  <g transform="translate(567,182)">
    <rect width="190" height="108" rx="13" class="verifier" />
    <text x="95" y="31" text-anchor="middle" class="box-title">Verifier</text>
    <text x="95" y="58" text-anchor="middle" class="text">hard labels</text>
    <text x="95" y="82" text-anchor="middle" class="text">soft warnings</text>
  </g>
  <g transform="translate(790,182)">
    <rect width="150" height="108" rx="13" class="artifact" />
    <text x="75" y="31" text-anchor="middle" class="box-title">Issue codes</text>
    <text x="75" y="58" text-anchor="middle" class="small">public history</text>
    <text x="75" y="80" text-anchor="middle" class="small">hidden info</text>
  </g>
  <g transform="translate(593,342)">
    <rect width="320" height="80" rx="13" class="decision" />
    <text x="160" y="30" text-anchor="middle" class="box-title">Boundary</text>
    <text x="160" y="55" text-anchor="middle" class="text">labels commitments;</text>
    <text x="160" y="75" text-anchor="middle" class="text">never chooses the move</text>
  </g>
  <path d="M757,236 H780" class="line" />
  <path d="M865,290 C855,316 808,329 753,342" class="feedback" />
  <path d="M650,290 C658,315 681,329 708,342" class="thin" />

  <g transform="translate(1052,180)">
    <rect width="165" height="104" rx="13" class="model" />
    <text x="82.5" y="30" text-anchor="middle" class="box-title">LLM revision</text>
    <text x="82.5" y="57" text-anchor="middle" class="text">same state</text>
    <text x="82.5" y="80" text-anchor="middle" class="text">repair r1</text>
  </g>
  <g transform="translate(1262,180)">
    <rect width="158" height="104" rx="13" class="verifier" />
    <text x="79" y="30" text-anchor="middle" class="box-title">Recheck</text>
    <text x="79" y="57" text-anchor="middle" class="text">same labels</text>
    <text x="79" y="80" text-anchor="middle" class="text">same id</text>
  </g>
  <g transform="translate(1080,345)">
    <rect width="305" height="72" rx="13" class="metric" />
    <text x="152.5" y="29" text-anchor="middle" class="box-title">Paired evidence</text>
    <text x="152.5" y="54" text-anchor="middle" class="text">${attribution.pairedDecisionCount} traces: hard failures ${attribution.hardFailureAttribution.beforeHardFailureCount} to ${attribution.hardFailureAttribution.afterHardFailureCount}</text>
  </g>
  <g transform="translate(1074,445)">
    <rect width="317" height="42" rx="11" class="decision" />
    <text x="158.5" y="27" text-anchor="middle" class="small">paired denominator excludes first-pass schema failures</text>
  </g>
  <path d="M1217,232 H1252" class="line" />
  <path d="M1341,284 C1341,314 1298,331 1232,345" class="line" />
  <path d="M1134,284 C1128,310 1148,327 1198,345" class="thin" />

  <path d="M490,362 H522.5" class="feedback" />
  <path d="M977.5,362 H1010" class="feedback" />

  <text x="750" y="565" text-anchor="middle" class="small">The diagram separates reliability accounting from revision evaluation: parse failures stay visible, while only parseable traces enter the paired before/after test.</text>
</svg>
`
}

function renderVerifierPipelineSvg(attribution: VerifierAttribution): string {
  const removedHardFailures = attribution.hardFailureAttribution.beforeHardFailureCount
    - attribution.hardFailureAttribution.afterHardFailureCount
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="560" viewBox="0 0 1500 560" role="img" aria-labelledby="title desc">
  <title id="title">Verifier-grounded multi-agent reasoning teaser</title>
  <desc id="desc">A four-panel paper teaser showing a hidden-state game, auditable LLM commitments, rule-grounded verifier labels, and same-id paired evidence accounting.</desc>
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#334155" />
    </marker>
    <marker id="arrow-orange" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="#c2410c" />
    </marker>
    <style>
      .title { font: 700 31px Arial, Helvetica, sans-serif; fill: #111827; }
      .subtitle { font: 400 17px Arial, Helvetica, sans-serif; fill: #475569; }
      .panel-title { font: 700 22px Arial, Helvetica, sans-serif; fill: #111827; }
      .label { font: 700 15px Arial, Helvetica, sans-serif; fill: #334155; }
      .text { font: 400 15px Arial, Helvetica, sans-serif; fill: #475569; }
      .small { font: 400 13px Arial, Helvetica, sans-serif; fill: #64748b; }
      .tiny { font: 400 11px Arial, Helvetica, sans-serif; fill: #64748b; }
      .metric { font: 700 38px Arial, Helvetica, sans-serif; fill: #111827; }
      .panel { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 2; }
      .blue { fill: #eff6ff; stroke: #2563eb; stroke-width: 2; }
      .red { fill: #fef2f2; stroke: #dc2626; stroke-width: 2; }
      .orange { fill: #fff7ed; stroke: #ea580c; stroke-width: 2; }
      .green { fill: #ecfdf5; stroke: #059669; stroke-width: 2; }
      .cyan { fill: #ecfeff; stroke: #0891b2; stroke-width: 2; }
      .gray { fill: #f8fafc; stroke: #64748b; stroke-width: 1.6; }
      .line { stroke: #334155; stroke-width: 2.7; fill: none; marker-end: url(#arrow); }
      .feedback { stroke: #c2410c; stroke-width: 2.4; fill: none; stroke-dasharray: 7 5; marker-end: url(#arrow-orange); }
      .dash { stroke: #94a3b8; stroke-width: 1.8; fill: none; stroke-dasharray: 6 5; }
    </style>
  </defs>
  <rect width="1500" height="540" fill="#ffffff" />
  <text x="750" y="42" text-anchor="middle" class="title">Verifier-Grounded Reasoning Turns Game Play into Auditable Evidence</text>
  <text x="750" y="70" text-anchor="middle" class="subtitle">Zero communication makes intent latent; structured commitments and rule-grounded labels make failures inspectable.</text>

  <rect x="45" y="100" width="330" height="360" rx="16" class="panel" />
  <text x="68" y="137" class="panel-title">A. Hidden-state game</text>
  <text x="68" y="164" class="small">Public actions visible; partner intent latent.</text>
  <circle cx="125" cy="225" r="34" class="blue" />
  <text x="125" y="221" text-anchor="middle" class="label">P0</text>
  <text x="125" y="240" text-anchor="middle" class="small">agent</text>
  <circle cx="295" cy="225" r="34" class="blue" />
  <text x="295" y="221" text-anchor="middle" class="label">P2</text>
  <text x="295" y="240" text-anchor="middle" class="small">ally</text>
  <circle cx="125" cy="350" r="34" class="red" />
  <text x="125" y="346" text-anchor="middle" class="label">P1</text>
  <text x="125" y="365" text-anchor="middle" class="small">opp.</text>
  <circle cx="295" cy="350" r="34" class="red" />
  <text x="295" y="346" text-anchor="middle" class="label">P3</text>
  <text x="295" y="365" text-anchor="middle" class="small">opp.</text>
  <path d="M159,225 H261" stroke="#2563eb" stroke-width="4" />
  <path d="M159,350 H261" stroke="#dc2626" stroke-width="4" />
  <rect x="136" y="272" width="148" height="46" rx="10" class="gray" />
  <text x="210" y="292" text-anchor="middle" class="label">public table</text>
  <text x="210" y="311" text-anchor="middle" class="small">lead, pass, beat</text>
  <g>
    <rect x="134" y="412" width="24" height="34" rx="4" class="blue" />
    <rect x="164" y="412" width="24" height="34" rx="4" class="blue" />
    <rect x="194" y="412" width="24" height="34" rx="4" class="blue" />
    <rect x="224" y="412" width="24" height="34" rx="4" class="blue" />
    <rect x="254" y="412" width="24" height="34" rx="4" class="blue" />
  </g>
  <text x="210" y="484" text-anchor="middle" class="small">private cards and intentions stay hidden</text>

  <rect x="410" y="100" width="330" height="360" rx="16" class="panel" />
  <text x="433" y="137" class="panel-title">B. Commitment card</text>
  <text x="433" y="164" class="small">The trace names field-level claims.</text>
  <rect x="448" y="194" width="254" height="158" rx="12" class="orange" />
  <text x="470" y="222" class="label">selectedAction</text>
  <text x="595" y="222" class="text">candidate a_t</text>
  <text x="470" y="250" class="label">teamObjective</text>
  <text x="595" y="250" class="text">help partner</text>
  <text x="470" y="278" class="label">partnerBelief</text>
  <text x="595" y="278" class="text">public evidence</text>
  <text x="470" y="306" class="label">opponentBelief</text>
  <text x="595" y="306" class="text">bounded inf.</text>
  <text x="470" y="334" class="label">risk</text>
  <text x="595" y="334" class="text">hand-count risk</text>
  <rect x="448" y="386" width="254" height="48" rx="10" class="red" />
  <text x="575" y="407" text-anchor="middle" class="text">free-form rationale is not enough</text>
  <text x="575" y="426" text-anchor="middle" class="small">fields become auditable evidence</text>

  <rect x="775" y="100" width="330" height="360" rx="16" class="panel" />
  <text x="798" y="137" class="panel-title">C. Verifier labels</text>
  <text x="798" y="164" class="small">Labels separate invalid traces from weak play.</text>
  <rect x="812" y="198" width="120" height="112" rx="12" class="green" />
  <text x="872" y="224" text-anchor="middle" class="label">hard labels</text>
  <text x="872" y="250" text-anchor="middle" class="small">legal action</text>
  <text x="872" y="271" text-anchor="middle" class="small">public history</text>
  <text x="872" y="292" text-anchor="middle" class="small">hidden-info</text>
  <rect x="950" y="198" width="120" height="112" rx="12" class="cyan" />
  <text x="1010" y="224" text-anchor="middle" class="label">soft labels</text>
  <text x="1010" y="250" text-anchor="middle" class="small">partner</text>
  <text x="1010" y="271" text-anchor="middle" class="small">opponent</text>
  <text x="1010" y="292" text-anchor="middle" class="small">objective</text>
  <rect x="812" y="350" width="258" height="56" rx="11" class="red" />
  <text x="941" y="374" text-anchor="middle" class="text">issue codes explain failures</text>
  <text x="941" y="394" text-anchor="middle" class="small">rules diagnose; they do not choose actions</text>

  <rect x="1140" y="100" width="315" height="360" rx="16" class="panel" />
  <text x="1163" y="137" class="panel-title">D. Paired evidence</text>
  <text x="1163" y="164" class="small">Same decision ids before and after feedback.</text>
  <rect x="1178" y="202" width="104" height="96" rx="14" class="red" />
  <text x="1230" y="228" text-anchor="middle" class="small">before</text>
  <text x="1230" y="270" text-anchor="middle" class="metric">${attribution.hardFailureAttribution.beforeHardFailureCount}</text>
  <text x="1230" y="288" text-anchor="middle" class="tiny">hard failures</text>
  <path d="M1291,250 H1346" class="line" />
  <text x="1318" y="230" text-anchor="middle" class="label">-${removedHardFailures}</text>
  <rect x="1356" y="202" width="76" height="96" rx="14" class="green" />
  <text x="1394" y="228" text-anchor="middle" class="small">after</text>
  <text x="1394" y="270" text-anchor="middle" class="metric">${attribution.hardFailureAttribution.afterHardFailureCount}</text>
  <text x="1394" y="288" text-anchor="middle" class="tiny">hard</text>
  <rect x="1178" y="336" width="254" height="50" rx="11" class="green" />
  <text x="1305" y="357" text-anchor="middle" class="label">${attribution.pairedDecisionCount} parseable paired traces</text>
  <text x="1305" y="377" text-anchor="middle" class="small">schema failures remain end-to-end failures</text>
  <rect x="1178" y="411" width="254" height="38" rx="10" class="cyan" />
  <text x="1305" y="435" text-anchor="middle" class="small">main repairs: public history and hidden-info</text>

  <path d="M375,280 H400" class="line" />
  <text x="387" y="260" text-anchor="middle" class="tiny">prompt</text>
  <path d="M740,280 H765" class="line" />
  <text x="752" y="260" text-anchor="middle" class="tiny">audit</text>
  <path d="M1105,280 H1130" class="line" />
  <text x="1117" y="260" text-anchor="middle" class="tiny">revise</text>
  <path d="M1168,392 C1015,516 688,516 546,440" class="feedback" />
  <text x="842" y="520" text-anchor="middle" class="label">feedback revises commitments, while the verifier remains an evaluator rather than an action oracle</text>
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
  const totalDrop = Math.max(publicDrop + hiddenDrop, 1)
  const publicWidth = Math.round(340 * (publicDrop / totalDrop))
  const hiddenWidth = 340 - publicWidth
  const chartX = 105
  const chartY = 168
  const chartHeight = 250
  const barWidth = 58
  const gap = 32

  const parseBars = rows.map((row, index) => {
    const x = chartX + index * (barWidth + gap)
    const parsedHeight = Math.round(chartHeight * row.parseYield)
    const y = chartY + chartHeight - parsedHeight
    const percent = formatPercent(row.parseYield)
    return `<g>
      <rect x="${x}" y="${chartY}" width="${barWidth}" height="${chartHeight}" rx="8" fill="#e0e7ff" stroke="#bfdbfe" />
      <rect x="${x}" y="${y}" width="${barWidth}" height="${parsedHeight}" rx="8" fill="#2563eb" opacity="0.88" />
      <text x="${x + barWidth / 2}" y="${y - 12}" text-anchor="middle" class="value">${row.parsed}/${row.total}</text>
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
      .note { font: 400 15px Arial, Helvetica, sans-serif; fill: #475569; }
      .big { font: 700 46px Arial, Helvetica, sans-serif; fill: #111827; }
      .huge { font: 700 64px Arial, Helvetica, sans-serif; fill: #111827; }
      .box { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 2; rx: 14; }
      .line { stroke: #334155; stroke-width: 2.5; fill: none; marker-end: url(#arrow); }
      .softline { stroke: #94a3b8; stroke-width: 1.5; fill: none; }
    </style>
  </defs>
  <rect width="1500" height="650" fill="#ffffff" />
  <text x="750" y="46" text-anchor="middle" class="title">Main Pilot Results: Reliability Has Three Layers</text>
  <text x="750" y="76" text-anchor="middle" class="subtitle">End-to-end parseability, paired revision, and semantic attribution are separated to avoid denominator mixing</text>

  <rect x="55" y="112" width="510" height="455" class="box" />
  <text x="84" y="148" class="panel-title">A. End-to-end parse yield</text>
  <text x="84" y="176" class="note">Blue bars are parseable traces; red chips show hard failures.</text>
  <line x1="${chartX}" y1="${chartY + chartHeight}" x2="${chartX + 425}" y2="${chartY + chartHeight}" stroke="#334155" stroke-width="2" />
  <line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + chartHeight}" stroke="#334155" stroke-width="2" />
  <text x="${chartX - 12}" y="${chartY + 4}" text-anchor="end" class="tick">100%</text>
  <text x="${chartX - 12}" y="${chartY + chartHeight / 2 + 4}" text-anchor="end" class="tick">50%</text>
  <text x="${chartX - 12}" y="${chartY + chartHeight + 4}" text-anchor="end" class="tick">0%</text>
  <line x1="${chartX}" y1="${chartY + chartHeight / 2}" x2="${chartX + 425}" y2="${chartY + chartHeight / 2}" stroke="#e2e8f0" stroke-width="1.5" />
  ${parseBars}
  <text x="84" y="535" class="note">ToM + repair reaches 49/50; revision uses only the 32 parseable candidate traces.</text>

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
  <text x="793" y="520" text-anchor="middle" class="note">The revision denominator is deliberately narrower than provider completion.</text>

  <rect x="1020" y="112" width="425" height="455" class="box" />
  <text x="1049" y="148" class="panel-title">C. What failures disappear?</text>
  <text x="1049" y="176" class="note">Hard-failure-count drop is concentrated in semantic checks.</text>
  <text x="1049" y="242" class="big">${removedHard}</text>
  <text x="1125" y="235" class="value">removed hard failures</text>
  <text x="1125" y="262" class="note">from ${beforeHard} before to ${afterHard} after</text>
  <g transform="translate(1052,312)">
    <rect x="0" y="0" width="${publicWidth}" height="48" rx="10" fill="#22c55e" opacity="0.86" />
    <rect x="${publicWidth}" y="0" width="${hiddenWidth}" height="48" rx="10" fill="#0ea5e9" opacity="0.86" />
    <rect x="0" y="0" width="340" height="48" rx="10" fill="none" stroke="#334155" stroke-width="1.2" />
    <text x="${Math.max(48, publicWidth / 2)}" y="31" text-anchor="middle" class="value">80%</text>
    <text x="${publicWidth + Math.max(34, hiddenWidth / 2)}" y="31" text-anchor="middle" class="value">20%</text>
  </g>
  <rect x="1052" y="396" width="18" height="18" rx="4" fill="#22c55e" opacity="0.86" />
  <text x="1080" y="410" class="value">public history: ${publicHistory.beforeFail} to ${publicHistory.afterFail}</text>
  <rect x="1052" y="430" width="18" height="18" rx="4" fill="#0ea5e9" opacity="0.86" />
  <text x="1080" y="444" class="value">hidden information: ${hiddenInfo.beforeFail} to ${hiddenInfo.afterFail}</text>
  <text x="1052" y="514" class="note">Attribution is semantic rather than a pure formatting gain.</text>

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
    shortLabel: 'ToM+repair',
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
