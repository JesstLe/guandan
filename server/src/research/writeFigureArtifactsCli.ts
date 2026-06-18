import {
  mkdirSync,
  readFileSync,
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

const svgPath = join(args.out, 'figure-2-tom-schema-repair-flow.svg')
const markdownPath = join(args.out, 'figure-2-tom-schema-repair-flow.md')
const mainResultsSvgPath = join(args.out, 'figure-3-main-pilot-results.svg')
const mainResultsMarkdownPath = join(args.out, 'figure-3-main-pilot-results.md')

writeFileSync(svgPath, renderToMSchemaRepairFlowSvg(tomMetrics, repairMetrics), 'utf8')
writeFileSync(markdownPath, renderToMSchemaRepairFlowMarkdown(tomMetrics, repairMetrics), 'utf8')
writeFileSync(mainResultsSvgPath, renderMainPilotResultsSvg(pilotSummary, repairMetrics, attribution), 'utf8')
writeFileSync(mainResultsMarkdownPath, renderMainPilotResultsMarkdown(pilotSummary, repairMetrics, attribution), 'utf8')

console.log(JSON.stringify({
  svgPath,
  markdownPath,
  mainResultsSvgPath,
  mainResultsMarkdownPath,
  totalOutputs: tomMetrics.totalDecisionPoints,
  rawParsed: tomMetrics.totalParsedTraces,
  repaired: repairMetrics.repairStatusCounts.repaired,
  finalParsed: repairMetrics.totalParsedTraces,
  hardFailures: repairMetrics.hardFailureCount,
  pairedDecisionCount: attribution.pairedDecisionCount,
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

function renderToMSchemaRepairFlowMarkdown(tom: ToMMetrics, repair: RepairMetrics): string {
  return [
    '# Figure 2: ToM Schema-Repair Flow',
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
    '# Figure 3: Main Pilot Results',
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
    `> Main pilot results. Parse yield improves from 26/50 for plain LLM prompting to 36/50 under ToM prompting and 49/50 after deterministic ToM schema repair. On the 32 paired candidate traces, verifier revision reduces hard verifier failures from ${attribution.hardFailureAttribution.beforeHardFailureCount} to ${attribution.hardFailureAttribution.afterHardFailureCount}; ${Math.round((publicHistory.shareOfHardFailureDrop ?? 0) * 100)}% of the hard-failure-count drop comes from public-history consistency and ${Math.round((hiddenInfo.shareOfHardFailureDrop ?? 0) * 100)}% from hidden-information discipline.`,
    '',
  ].join('\n')
}

function renderMainPilotResultsSvg(summary: PilotSummary, repair: RepairMetrics, attribution: VerifierAttribution): string {
  const rows = getMainResultRows(summary, repair)
  const publicHistory = getHardComponent(attribution, 'publicHistoryConsistent')
  const hiddenInfo = getHardComponent(attribution, 'hiddenInfoDisciplined')
  const chartX = 94
  const chartY = 165
  const chartHeight = 260
  const barWidth = 62
  const gap = 50
  const maxHard = Math.max(...rows.map((row) => row.hardFailures), 1)
  const beforeHard = attribution.hardFailureAttribution.beforeHardFailureCount
  const afterHard = attribution.hardFailureAttribution.afterHardFailureCount
  const publicDrop = Math.abs(publicHistory.failDelta)
  const hiddenDrop = Math.abs(hiddenInfo.failDelta)

  const parseBars = rows.map((row, index) => {
    const x = chartX + index * (barWidth + gap)
    const parsedHeight = Math.round(chartHeight * row.parseYield)
    const y = chartY + chartHeight - parsedHeight
    const hardHeight = Math.round(chartHeight * (row.hardFailures / maxHard))
    const hardY = chartY + chartHeight - hardHeight
    return `<g>
      <rect x="${x}" y="${y}" width="${barWidth}" height="${parsedHeight}" rx="7" fill="#2563eb" opacity="0.82" />
      <rect x="${x + barWidth + 8}" y="${hardY}" width="22" height="${hardHeight}" rx="5" fill="#dc2626" opacity="0.78" />
      <text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" class="value">${row.parsed}/${row.total}</text>
      <text x="${x + barWidth + 19}" y="${hardY - 10}" text-anchor="middle" class="value">${row.hardFailures}</text>
      <text x="${x + barWidth / 2 + 10}" y="462" text-anchor="middle" class="axis-label">${escapeXml(row.shortLabel)}</text>
    </g>`
  }).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="650" viewBox="0 0 1500 650" role="img" aria-labelledby="title desc">
  <title id="title">Main pilot results</title>
  <desc id="desc">Source-backed pilot results showing parse yield, hard verifier failures, and paired hard-failure attribution after verifier revision.</desc>
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
      .note { font: 400 15px Arial, Helvetica, sans-serif; fill: #475569; }
      .big { font: 700 42px Arial, Helvetica, sans-serif; fill: #111827; }
      .box { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 2; rx: 14; }
      .line { stroke: #334155; stroke-width: 2.5; fill: none; marker-end: url(#arrow); }
    </style>
  </defs>
  <rect width="1500" height="650" fill="#ffffff" />
  <text x="750" y="48" text-anchor="middle" class="title">Main Pilot Results: Reliability Is Layered</text>
  <text x="750" y="78" text-anchor="middle" class="subtitle">Parse yield, hard verifier failures, and paired verifier-revision attribution are reported separately</text>

  <rect x="55" y="115" width="785" height="455" class="box" />
  <text x="90" y="150" class="panel-title">A. End-to-end trace reliability by condition</text>
  <line x1="${chartX}" y1="${chartY + chartHeight}" x2="${chartX + 600}" y2="${chartY + chartHeight}" stroke="#334155" stroke-width="2" />
  <line x1="${chartX}" y1="${chartY}" x2="${chartX}" y2="${chartY + chartHeight}" stroke="#334155" stroke-width="2" />
  <text x="${chartX - 12}" y="${chartY + 4}" text-anchor="end" class="tick">100%</text>
  <text x="${chartX - 12}" y="${chartY + chartHeight / 2 + 4}" text-anchor="end" class="tick">50%</text>
  <text x="${chartX - 12}" y="${chartY + chartHeight + 4}" text-anchor="end" class="tick">0%</text>
  <line x1="${chartX}" y1="${chartY + chartHeight / 2}" x2="${chartX + 600}" y2="${chartY + chartHeight / 2}" stroke="#e2e8f0" stroke-width="1.5" />
  ${parseBars}
  <rect x="590" y="135" width="18" height="18" rx="4" fill="#2563eb" opacity="0.82" />
  <text x="616" y="149" class="note">parsed traces</text>
  <rect x="590" y="164" width="18" height="18" rx="4" fill="#dc2626" opacity="0.78" />
  <text x="616" y="178" class="note">hard failures</text>
  <text x="90" y="525" class="note">ToM + repair reaches 49/50 parseable traces; revision is paired on 32 candidate traces.</text>

  <rect x="890" y="115" width="555" height="455" class="box" />
  <text x="925" y="150" class="panel-title">B. Paired verifier revision changes semantic failures</text>

  <g transform="translate(930,205)">
    <rect x="0" y="0" width="145" height="118" rx="14" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
    <text x="72.5" y="38" text-anchor="middle" class="note">before</text>
    <text x="72.5" y="86" text-anchor="middle" class="big">${beforeHard}</text>
  </g>
  <path d="M1090,264 C1140,234 1182,234 1230,264" class="line" />
  <g transform="translate(1245,205)">
    <rect x="0" y="0" width="145" height="118" rx="14" fill="#ecfdf5" stroke="#059669" stroke-width="2" />
    <text x="72.5" y="38" text-anchor="middle" class="note">after</text>
    <text x="72.5" y="86" text-anchor="middle" class="big">${afterHard}</text>
  </g>
  <text x="1167" y="224" text-anchor="middle" class="value">hard failures</text>
  <text x="1167" y="306" text-anchor="middle" class="note">95% bootstrap CI ${attribution.hardFailureAttribution.hardFailureDeltaBootstrap95Ci[0]} to ${attribution.hardFailureAttribution.hardFailureDeltaBootstrap95Ci[1]}</text>

  <g transform="translate(955,375)">
    <text x="0" y="0" class="axis-label">Hard-failure drop attribution</text>
    <rect x="0" y="24" width="${publicDrop * 18}" height="38" rx="8" fill="#22c55e" opacity="0.82" />
    <text x="${publicDrop * 18 + 14}" y="50" class="value">public history ${publicHistory.beforeFail} to ${publicHistory.afterFail}</text>
    <rect x="0" y="86" width="${hiddenDrop * 18}" height="38" rx="8" fill="#0ea5e9" opacity="0.82" />
    <text x="${hiddenDrop * 18 + 14}" y="112" class="value">hidden information ${hiddenInfo.beforeFail} to ${hiddenInfo.afterFail}</text>
  </g>
  <text x="925" y="525" class="note">McNemar before-only ${attribution.hardFailureAttribution.decisionLevelMcnemar.beforeOnly}, after-only ${attribution.hardFailureAttribution.decisionLevelMcnemar.afterOnly}, p &lt; 0.001.</text>

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
