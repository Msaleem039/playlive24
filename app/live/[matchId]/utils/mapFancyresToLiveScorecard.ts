/** Map Fancyres tennis/soccer JSON into the shape expected by LiveScorecard (cricket-oriented UI). */

function unwrapPayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: unknown }).data
  }
  return payload
}

/** Fancyres often returns `[{ eventId, score: {...}, ... }]` — same as dashboard `formatFancyresScore`. */
function normalizeFancyresRoot(data: unknown): unknown {
  if (!Array.isArray(data)) return data
  if (data.length === 0) return null
  const first = data[0]
  return first != null && typeof first === 'object' ? first : null
}

function formatElapsed(elapsed: Record<string, unknown> | undefined): string {
  if (!elapsed || typeof elapsed !== 'object') return ''
  const h = Number(elapsed.hour ?? 0) || 0
  const m = Number(elapsed.min ?? 0) || 0
  const s = Number(elapsed.sec ?? 0) || 0
  if (h === 0 && m === 0 && s === 0) return ''
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

const emptyTeam = (name: string) => ({
  fullName: name,
  shortName: name.length > 22 ? `${name.slice(0, 20)}…` : name,
  flag: '',
  score: '',
  overs: '',
})

export function mapFancyresToLiveScorecard(raw: unknown, fallbackMatchName: string): Record<string, unknown> | null {
  const data = normalizeFancyresRoot(unwrapPayload(raw))
  if (data == null || typeof data !== 'object') return null

  const o = data as Record<string, unknown>
  const nestedScore = o.score as Record<string, unknown> | undefined

  if (nestedScore && typeof nestedScore === 'object') {
    const home = nestedScore.home as Record<string, unknown> | undefined
    const away = nestedScore.away as Record<string, unknown> | undefined
    if (!home || !away) return null

    const hName = String(home.name ?? 'Home').trim() || 'Home'
    const aName = String(away.name ?? 'Away').trim() || 'Away'
    const hPts = String(home.score ?? '').trim()
    const aPts = String(away.score ?? '').trim()
    const hGames = String(home.games ?? '').trim()
    const aGames = String(away.games ?? '').trim()
    const hSets = String(home.sets ?? '').trim()
    const aSets = String(away.sets ?? '').trim()

    const hasPoints = hPts !== '' || aPts !== ''
    const hasSets = hSets !== '' || aSets !== ''
    const hasGames = hGames !== '' || aGames !== ''
    const hasTennisShape = hasSets || hasGames || hasPoints
    const t1 = emptyTeam(hName)
    const t2 = emptyTeam(aName)

    if (hasTennisShape) {
      if (hasPoints) {
        t1.score = hPts || '0'
        t2.score = aPts || '0'
      } else if (hasSets) {
        t1.score = hSets || '0'
        t2.score = aSets || '0'
      } else if (hasGames) {
        t1.score = hGames || '0'
        t2.score = aGames || '0'
      } else {
        t1.score = '0'
        t2.score = '0'
      }
      if (hasSets) {
        t1.overs = `Sets ${hSets || '0'}-${aSets || '0'}`
        t2.overs = hasGames ? `Games ${hGames || '0'}-${aGames || '0'}` : ' '
      } else if (hasGames) {
        t1.overs = `Games ${hGames || '0'}-${aGames || '0'}`
        t2.overs = hasPoints ? `Pts ${hPts || '0'}-${aPts || '0'}` : ' '
      } else if (hasPoints) {
        const clock = formatElapsed(o.fullTimeElapsed as Record<string, unknown> | undefined)
        t1.overs = clock || ' '
        const status = o.status ?? o.Status ?? o.commentary ?? o.Commentary
        t2.overs = status != null ? String(status).slice(0, 28) : ' '
      } else {
        t1.overs = ' '
        t2.overs = ' '
      }
    } else {
      t1.score = String(home.score ?? '0')
      t2.score = String(away.score ?? '0')
      const clock = formatElapsed(o.fullTimeElapsed as Record<string, unknown> | undefined)
      t1.overs = clock || ' '
      const status = o.status ?? o.Status ?? o.commentary ?? o.Commentary
      t2.overs = status != null ? String(status).slice(0, 24) : ' '
    }

    const currentSet = o.currentSet != null ? String(o.currentSet) : ''
    const currentGame = o.currentGame != null ? String(o.currentGame) : ''
    const extra = [currentSet && `Set ${currentSet}`, currentGame && `Game ${currentGame}`].filter(Boolean).join(' · ')

    return {
      batsman: [],
      bowler: {},
      lastBowler: {},
      lastWicket: {},
      partnership: { player_a: { ball: 0, run: 0 }, player_b: { ball: 0, run: 0 }, ball: 0, run: 0 },
      sessionData: {},
      lastAllOvers: [],
      lastBalls: [],
      currentInningscurrentBall: extra,
      needByBall: '',
      needByOver: extra,
      matchType: '',
      runRate: '',
      targetRun: 0,
      eventId: String(o.eventId ?? ''),
      currentInnings: '',
      currentBall: '',
      matchName: fallbackMatchName || `${hName} v ${aName}`,
      team1: t1,
      team2: t2,
    }
  }

  const score = o.score ?? o.Score ?? o.matchScore ?? o.MatchScore
  const home = o.home ?? o.Home ?? o.team1
  const away = o.away ?? o.Away ?? o.team2
  if (score == null && (home == null || away == null)) return null

  const t1 = emptyTeam(String(home ?? 'Home'))
  const t2 = emptyTeam(String(away ?? 'Away'))
  if (score != null) {
    const s = String(score)
    t1.score = s
    t2.score = ''
    t1.overs = ' '
    t2.overs = ' '
  }

  return {
    batsman: [],
    bowler: {},
    lastBowler: {},
    lastWicket: {},
    partnership: { player_a: { ball: 0, run: 0 }, player_b: { ball: 0, run: 0 }, ball: 0, run: 0 },
    sessionData: {},
    lastAllOvers: [],
    lastBalls: [],
    currentInningscurrentBall: '',
    needByBall: '',
    needByOver: '',
    matchType: '',
    runRate: '',
    targetRun: 0,
    eventId: '',
    currentInnings: '',
    currentBall: '',
    matchName: fallbackMatchName,
    team1: t1,
    team2: t2,
  }
}
