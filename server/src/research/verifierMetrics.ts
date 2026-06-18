import {
  type VerifierLabelStatus,
  type VerifierResult,
} from '@guandan/shared'

export const verifierLabelNames = [
  'legalAction',
  'beatsTable',
  'publicHistoryConsistent',
  'hiddenInfoDisciplined',
  'partnerConsistent',
  'opponentConsistent',
  'reasonActionConsistent',
  'teamObjectiveValid',
] as const

export interface VerifierMetrics {
  totalDecisionPoints: number
  hardFailureCount: number
  labelStatusCounts: Record<typeof verifierLabelNames[number], Record<VerifierLabelStatus, number>>
}

export function summarizeVerifierResults(results: VerifierResult[]): VerifierMetrics {
  const labelStatusCounts = Object.fromEntries(
    verifierLabelNames.map(label => [label, emptyStatusCounts()]),
  ) as VerifierMetrics['labelStatusCounts']

  for (const result of results) {
    for (const label of verifierLabelNames) {
      labelStatusCounts[label][result.labels[label].status]++
    }
  }

  return {
    totalDecisionPoints: results.length,
    hardFailureCount: results.reduce((sum, result) => sum + result.hardFailures.length, 0),
    labelStatusCounts,
  }
}

function emptyStatusCounts(): Record<VerifierLabelStatus, number> {
  return {
    pass: 0,
    fail: 0,
    unknown: 0,
    not_applicable: 0,
  }
}
