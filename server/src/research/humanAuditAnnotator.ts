import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname } from 'node:path'

const DEFAULT_HEADERS = [
  'sampleId',
  'decisionId',
  'phase',
  'scenarioTags',
  'handCounts',
  'selectedActionId',
  'legalActionCount',
  'publicEventSummary',
  'teamObjective',
  'partnerBelief',
  'opponentBelief',
  'actionRationale',
  'riskSummary',
  'humanPartnerConsistent',
  'humanOpponentConsistent',
  'humanTeamObjectiveValid',
  'humanHiddenInfoDisciplined',
  'humanReasonActionConsistent',
  'humanNotes',
] as const

const HUMAN_LABEL_FIELDS = [
  'humanPartnerConsistent',
  'humanOpponentConsistent',
  'humanTeamObjectiveValid',
  'humanHiddenInfoDisciplined',
  'humanReasonActionConsistent',
] as const

interface AuditSample {
  sampleId: string
  decisionId: string
  phase: string
  scenarioTags: string
  handCounts: string
  selectedActionId: string
  legalActionCount: number
  publicEventSummary: string
  teamObjective: string
  partnerBelief: string
  opponentBelief: string
  actionRationale: string
  riskSummary: string
}

export interface HumanAuditAnnotatorOptions {
  sampleJsonlPath: string
  annotationCsvPath?: string
  outputHtmlPath: string
}

export interface HumanAuditAnnotatorResult {
  htmlPath: string
  sampleCount: number
  headers: string[]
}

export function writeHumanAuditAnnotator(options: HumanAuditAnnotatorOptions): HumanAuditAnnotatorResult {
  const samples = readJsonl<AuditSample>(options.sampleJsonlPath)
  const headers = options.annotationCsvPath
    ? readCsvHeader(options.annotationCsvPath)
    : [...DEFAULT_HEADERS]
  mkdirSync(dirname(options.outputHtmlPath), { recursive: true })
  writeFileSync(options.outputHtmlPath, renderHumanAuditAnnotatorHtml(samples, headers), 'utf8')
  return {
    htmlPath: options.outputHtmlPath,
    sampleCount: samples.length,
    headers,
  }
}

export function renderHumanAuditAnnotatorHtml(samples: AuditSample[], headers: string[]): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Human Soft-Label Audit Annotator</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fa;
      --panel: #ffffff;
      --ink: #172033;
      --muted: #5d6a7c;
      --line: #d8dee8;
      --blue: #2563eb;
      --green: #047857;
      --red: #b91c1c;
      --amber: #a16207;
      --soft-blue: #eef4ff;
      --soft-green: #ecfdf5;
      --soft-red: #fff1f2;
      --soft-amber: #fffbeb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: center;
      padding: 18px 22px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    h1 {
      font-size: 20px;
      margin: 0 0 4px;
      letter-spacing: 0;
    }
    .meta {
      color: var(--muted);
      font-size: 13px;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    button {
      border: 1px solid var(--line);
      background: #fff;
      color: var(--ink);
      border-radius: 6px;
      min-height: 34px;
      padding: 0 12px;
      font: inherit;
      cursor: pointer;
    }
    button.primary {
      background: var(--blue);
      border-color: var(--blue);
      color: white;
      font-weight: 650;
    }
    button:hover { border-color: #94a3b8; }
    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: calc(100vh - 72px);
    }
    aside {
      border-right: 1px solid var(--line);
      background: #fbfcfe;
      padding: 12px;
      overflow: auto;
      max-height: calc(100vh - 72px);
      position: sticky;
      top: 72px;
    }
    .progress {
      padding: 8px 8px 12px;
      color: var(--muted);
      font-size: 13px;
    }
    .bar {
      height: 8px;
      border-radius: 999px;
      background: #e5e7eb;
      overflow: hidden;
      margin-top: 8px;
    }
    .bar > span {
      display: block;
      height: 100%;
      width: 0%;
      background: var(--green);
    }
    .sample-list {
      display: grid;
      gap: 6px;
    }
    .sample-button {
      width: 100%;
      text-align: left;
      min-height: 44px;
      padding: 8px;
      border-radius: 6px;
      display: grid;
      gap: 2px;
    }
    .sample-button.active {
      border-color: var(--blue);
      background: var(--soft-blue);
    }
    .sample-button.done {
      border-color: #86efac;
      background: var(--soft-green);
    }
    .sample-id {
      font-weight: 700;
      font-size: 13px;
    }
    .sample-sub {
      font-size: 12px;
      color: var(--muted);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    main {
      padding: 18px;
      display: grid;
      gap: 14px;
      align-content: start;
    }
    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 16px;
      letter-spacing: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .fact {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
      min-height: 68px;
      background: #fbfcfe;
    }
    .fact b {
      display: block;
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
    }
    .text-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .quote {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
      background: #fff;
      min-height: 116px;
      white-space: pre-wrap;
    }
    .quote strong {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 6px;
    }
    .rubric {
      display: grid;
      gap: 8px;
    }
    .rubric-card {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fbfcfe;
      padding: 10px;
    }
    .rubric-card b {
      display: block;
      margin-bottom: 3px;
    }
    .labels {
      display: grid;
      gap: 12px;
    }
    .label-row {
      display: grid;
      grid-template-columns: minmax(210px, 280px) 1fr;
      gap: 12px;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid #eef2f7;
    }
    .label-row:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }
    .label-title {
      font-weight: 700;
    }
    .label-help {
      color: var(--muted);
      font-size: 12px;
      margin-top: 3px;
    }
    .choice-group {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .choice {
      min-height: 38px;
      border: 1px solid var(--line);
      background: white;
      border-radius: 6px;
      font-weight: 650;
    }
    .choice[data-value="pass"].selected {
      background: var(--soft-green);
      border-color: #22c55e;
      color: var(--green);
    }
    .choice[data-value="fail"].selected {
      background: var(--soft-red);
      border-color: #f43f5e;
      color: var(--red);
    }
    .choice[data-value="uncertain"].selected {
      background: var(--soft-amber);
      border-color: #f59e0b;
      color: var(--amber);
    }
    textarea {
      width: 100%;
      min-height: 96px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px;
      font: inherit;
    }
    .footer-actions {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .status {
      color: var(--muted);
      align-self: center;
    }
    @media (max-width: 920px) {
      header { grid-template-columns: 1fr; }
      .toolbar { justify-content: flex-start; }
      .layout { grid-template-columns: 1fr; }
      aside {
        position: static;
        max-height: none;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .sample-list { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
      .grid, .text-grid, .label-row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Human Soft-Label Audit Annotator</h1>
      <div class="meta">Blind samples only. Do not open the answer key until annotation is complete.</div>
    </div>
    <div class="toolbar">
      <input id="importInput" type="file" accept=".csv,text/csv" hidden>
      <button id="importButton" type="button">Import CSV</button>
      <button id="clearButton" type="button">Clear local labels</button>
      <button id="exportButton" class="primary" type="button">Export CSV</button>
    </div>
  </header>
  <div class="layout">
    <aside>
      <div class="progress">
        <div id="progressText">0/${samples.length} complete</div>
        <div class="bar"><span id="progressBar"></span></div>
      </div>
      <div id="sampleList" class="sample-list"></div>
    </aside>
    <main>
      <section>
        <h2 id="sampleTitle">Sample</h2>
        <div class="grid" id="facts"></div>
      </section>
      <section>
        <h2>Visible Trace</h2>
        <div class="text-grid" id="traceText"></div>
      </section>
      <section>
        <h2>Rubric</h2>
        <div class="rubric">
          <div class="rubric-card"><b>pass</b>Supported by visible public facts, scenario tags, selected action, or cautious probabilistic hedging.</div>
          <div class="rubric-card"><b>fail</b>Contradicts visible facts, asserts hidden cards or private intentions as certain, or justifies a different action.</div>
          <div class="rubric-card"><b>uncertain</b>Visible fields do not contain enough evidence to decide. Do not guess from private information.</div>
        </div>
      </section>
      <section>
        <h2>Human Labels</h2>
        <div class="labels" id="labelControls"></div>
      </section>
      <section>
        <h2>Notes</h2>
        <textarea id="notes" placeholder="Optional annotation notes"></textarea>
      </section>
      <div class="footer-actions">
        <button id="prevButton" type="button">Previous</button>
        <div class="status" id="saveStatus">Saved locally</div>
        <button id="nextButton" type="button">Next</button>
      </div>
    </main>
  </div>
  <script id="samples-data" type="application/json">${escapeScriptJson(samples)}</script>
  <script id="headers-data" type="application/json">${escapeScriptJson(headers)}</script>
  <script>
    const samples = JSON.parse(document.getElementById('samples-data').textContent);
    const headers = JSON.parse(document.getElementById('headers-data').textContent);
    const labelFields = ${JSON.stringify(HUMAN_LABEL_FIELDS)};
    const labels = [
      ['humanPartnerConsistent', 'Partner belief', 'Plausible teammate inference from public state; fail exact hidden-card claims or omitted clear public tags.'],
      ['humanOpponentConsistent', 'Opponent belief', 'Plausible opponent inference from public state; fail exact hidden holdings or unsupported intentions.'],
      ['humanTeamObjectiveValid', 'Team objective', 'Fits team identity, hand counts, scenario tags, and selected action.'],
      ['humanHiddenInfoDisciplined', 'Hidden information', 'Pass hedged uncertainty; fail unobserved cards, suits, ranks, or private plans stated as facts.'],
      ['humanReasonActionConsistent', 'Reason-action link', 'Rationale explains why the selected action follows from the visible state.']
    ];
    const storageKey = 'guandan-human-audit-annotations-v1:' + samples.map(sample => sample.sampleId).join('|');
    let annotations = loadAnnotations();
    let currentIndex = 0;

    function loadAnnotations() {
      try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    }

    function saveAnnotations() {
      localStorage.setItem(storageKey, JSON.stringify(annotations));
      document.getElementById('saveStatus').textContent = 'Saved locally';
      updateProgress();
      renderList();
    }

    function currentSample() {
      return samples[currentIndex];
    }

    function currentAnnotation() {
      const id = currentSample().sampleId;
      annotations[id] = annotations[id] || {};
      return annotations[id];
    }

    function isComplete(sample) {
      const row = annotations[sample.sampleId] || {};
      return labelFields.every(field => ['pass', 'fail', 'uncertain'].includes(row[field]));
    }

    function renderList() {
      const list = document.getElementById('sampleList');
      list.innerHTML = '';
      samples.forEach((sample, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sample-button' + (index === currentIndex ? ' active' : '') + (isComplete(sample) ? ' done' : '');
        button.innerHTML = '<span class="sample-id">' + escapeHtml(sample.sampleId) + '</span><span class="sample-sub">' + escapeHtml(sample.phase + ' · ' + sample.scenarioTags) + '</span>';
        button.addEventListener('click', () => {
          currentIndex = index;
          render();
        });
        list.appendChild(button);
      });
    }

    function renderFacts(sample) {
      const facts = [
        ['decisionId', sample.decisionId],
        ['phase', sample.phase],
        ['scenarioTags', sample.scenarioTags || 'none'],
        ['handCounts', sample.handCounts],
        ['selectedActionId', sample.selectedActionId],
        ['legalActionCount', String(sample.legalActionCount)],
        ['publicEventSummary', sample.publicEventSummary]
      ];
      document.getElementById('facts').innerHTML = facts.map(([label, value]) => '<div class="fact"><b>' + escapeHtml(label) + '</b>' + escapeHtml(value) + '</div>').join('');
    }

    function renderTrace(sample) {
      const rows = [
        ['teamObjective', sample.teamObjective],
        ['partnerBelief', sample.partnerBelief],
        ['opponentBelief', sample.opponentBelief],
        ['actionRationale', sample.actionRationale],
        ['riskSummary', sample.riskSummary]
      ];
      document.getElementById('traceText').innerHTML = rows.map(([label, value]) => '<div class="quote"><strong>' + escapeHtml(label) + '</strong>' + escapeHtml(value || '') + '</div>').join('');
    }

    function renderLabels() {
      const annotation = currentAnnotation();
      const container = document.getElementById('labelControls');
      container.innerHTML = '';
      labels.forEach(([field, title, help]) => {
        const row = document.createElement('div');
        row.className = 'label-row';
        row.innerHTML = '<div><div class="label-title">' + escapeHtml(title) + '</div><div class="label-help">' + escapeHtml(help) + '</div></div>';
        const group = document.createElement('div');
        group.className = 'choice-group';
        ['pass', 'fail', 'uncertain'].forEach(value => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'choice' + (annotation[field] === value ? ' selected' : '');
          button.dataset.value = value;
          button.textContent = value;
          button.addEventListener('click', () => {
            annotation[field] = value;
            saveAnnotations();
            renderLabels();
          });
          group.appendChild(button);
        });
        row.appendChild(group);
        container.appendChild(row);
      });
    }

    function render() {
      const sample = currentSample();
      document.getElementById('sampleTitle').textContent = sample.sampleId + ' · ' + sample.decisionId;
      renderFacts(sample);
      renderTrace(sample);
      renderLabels();
      document.getElementById('notes').value = currentAnnotation().humanNotes || '';
      document.getElementById('prevButton').disabled = currentIndex === 0;
      document.getElementById('nextButton').disabled = currentIndex === samples.length - 1;
      renderList();
      updateProgress();
    }

    function updateProgress() {
      const done = samples.filter(isComplete).length;
      document.getElementById('progressText').textContent = done + '/' + samples.length + ' complete';
      document.getElementById('progressBar').style.width = samples.length === 0 ? '0%' : Math.round(done / samples.length * 100) + '%';
    }

    function exportCsv() {
      const rows = samples.map(sample => {
        const annotation = annotations[sample.sampleId] || {};
        const row = Object.assign({}, sample, annotation);
        return headers.map(header => csvCell(row[header] || '')).join(',');
      });
      const csv = headers.join(',') + '\\n' + rows.join('\\n') + '\\n';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'human-audit-completed-annotations.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function importCsvText(text) {
      const rows = parseCsv(text);
      let imported = 0;
      rows.forEach(row => {
        const sampleId = row.sampleId;
        if (!sampleId || !samples.some(sample => sample.sampleId === sampleId)) return;
        annotations[sampleId] = annotations[sampleId] || {};
        labelFields.forEach(field => {
          const value = normalizeImportedLabel(row[field]);
          if (value) annotations[sampleId][field] = value;
        });
        if (row.humanNotes) annotations[sampleId].humanNotes = row.humanNotes;
        imported += 1;
      });
      saveAnnotations();
      render();
      document.getElementById('saveStatus').textContent = 'Imported ' + imported + ' row(s)';
    }

    function parseCsv(text) {
      const records = [];
      let record = [];
      let cell = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];
        if (inQuotes) {
          if (char === '"' && next === '"') {
            cell += '"';
            i += 1;
          } else if (char === '"') {
            inQuotes = false;
          } else {
            cell += char;
          }
          continue;
        }
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          record.push(cell);
          cell = '';
        } else if (char === '\\n') {
          record.push(cell);
          records.push(record);
          record = [];
          cell = '';
        } else if (char !== '\\r') {
          cell += char;
        }
      }
      if (cell || record.length > 0) {
        record.push(cell);
        records.push(record);
      }
      const nonEmpty = records.filter(row => row.some(value => value.trim()));
      const headers = nonEmpty.shift() || [];
      return nonEmpty.map(record => {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = record[index] || '';
        });
        return row;
      });
    }

    function normalizeImportedLabel(value) {
      const normalized = String(value || '').trim().toLowerCase();
      if (['pass', 'fail', 'uncertain'].includes(normalized)) return normalized;
      if (normalized === 'unknown') return 'uncertain';
      return '';
    }

    function csvCell(value) {
      return '"' + String(value).replace(/"/g, '""').replace(/\\r?\\n/g, ' ') + '"';
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]);
    }

    document.getElementById('notes').addEventListener('input', event => {
      currentAnnotation().humanNotes = event.target.value;
      saveAnnotations();
    });
    document.getElementById('prevButton').addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      render();
    });
    document.getElementById('nextButton').addEventListener('click', () => {
      currentIndex = Math.min(samples.length - 1, currentIndex + 1);
      render();
    });
    document.getElementById('importButton').addEventListener('click', () => {
      document.getElementById('importInput').click();
    });
    document.getElementById('importInput').addEventListener('change', event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      file.text().then(importCsvText);
      event.target.value = '';
    });
    document.getElementById('exportButton').addEventListener('click', exportCsv);
    document.getElementById('clearButton').addEventListener('click', () => {
      if (!confirm('Clear locally saved labels for this audit packet?')) return;
      annotations = {};
      localStorage.removeItem(storageKey);
      render();
    });
    render();
  </script>
</body>
</html>
`
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as T)
}

function readCsvHeader(path: string): string[] {
  const firstLine = readFileSync(path, 'utf8').split(/\r?\n/, 1)[0]
  return parseCsvLine(firstLine)
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      cells.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }
  cells.push(cell)
  return cells
}

function escapeScriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
