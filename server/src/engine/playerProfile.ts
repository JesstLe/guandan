import {
  type PlayerProfile, type PlayerInference, type CardCombination,
  type CombinationType, type Rank,
  RANK_ORDER,
} from '@guandan/shared'

export interface PlayerStyle {
  aggression: number
  bombTendency: number
  controlTendency: number
  cooperationScore: number
}

export function createProfile(seat: number): PlayerProfile {
  return {
    seat,
    handCount: 0,
    playedCards: [],
    passedRounds: [],
    inferences: [],
  }
}

export function updateProfile(
  profile: PlayerProfile,
  action: 'play' | 'pass',
  combination?: CardCombination,
  roundNumber?: number,
): void {
  if (action === 'play' && combination && roundNumber !== undefined) {
    profile.playedCards.push({
      playedBy: profile.seat,
      playedAtRound: roundNumber,
      playedInCombo: combination,
      timestamp: Date.now(),
    })
  }

  if (action === 'pass' && combination && roundNumber !== undefined) {
    profile.passedRounds.push({ round: roundNumber, againstType: combination.type })
  }
}

export function addInference(
  profile: PlayerProfile,
  inference: PlayerInference,
): void {
  profile.inferences.push(inference)
}

export function analyzeStyle(profile: PlayerProfile): PlayerStyle {
  const totalPlays = profile.playedCards.length
  const totalPasses = profile.passedRounds.length
  const totalActions = totalPlays + totalPasses

  const aggression = totalActions > 0 ? totalPlays / totalActions : 0.5

  const bombPlays = profile.playedCards.filter(
    p => p.playedInCombo.type === 'bomb' || p.playedInCombo.type === 'joker_bomb'
  ).length
  const bombTendency = totalPlays > 0 ? Math.min(bombPlays / totalPlays * 5, 1) : 0

  const bigCardPlays = profile.playedCards.filter(p => {
    const rank = p.playedInCombo.mainRank
    return rank && RANK_ORDER[rank] >= 14
  }).length
  const controlTendency = totalPlays > 0 ? Math.min(bigCardPlays / totalPlays * 3, 1) : 0.5

  const cooperationScore = 0.5

  return { aggression, bombTendency, controlTendency, cooperationScore }
}

export function getWeakRanks(profile: PlayerProfile): Rank[] {
  const passedTypes = new Set(profile.passedRounds.map(p => p.againstType))
  const weakRanks: Rank[] = []

  if (passedTypes.has('pair')) {
    weakRanks.push(...findHighRanksNotPlayed(profile, 'pair'))
  }
  if (passedTypes.has('single')) {
    weakRanks.push(...findHighRanksNotPlayed(profile, 'single'))
  }

  return [...new Set(weakRanks)]
}

function findHighRanksNotPlayed(profile: PlayerProfile, comboType: CombinationType): Rank[] {
  const playedRanks = new Set(
    profile.playedCards
      .filter(p => p.playedInCombo.type === comboType && p.playedInCombo.mainRank)
      .map(p => p.playedInCombo.mainRank as Rank)
  )

  const highRanks: Rank[] = ['A', '2']
  return highRanks.filter(r => !playedRanks.has(r))
}
