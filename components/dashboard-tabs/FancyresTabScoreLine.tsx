'use client'

import {
  useGetFancyresSoccerScoreQuery,
  useGetFancyresTennisScoreQuery,
} from '@/app/services/CricketApi'

function unwrapPayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: unknown }).data
  }
  return payload
}

/** Turn Fancyres JSON into a short single-line score for the dashboard tab. */
export function formatFancyresScore(payload: unknown): string | null {
  const raw = unwrapPayload(payload)
  if (raw == null) return null

  if (Array.isArray(raw)) {
    if (raw.length === 0) return null
    const first = raw[0]
    if (typeof first === 'string' || typeof first === 'number') {
      return raw.map(String).join(' · ')
    }
    if (first && typeof first === 'object') {
      const o = first as Record<string, unknown>
      const line = pickScoreLine(o)
      if (line) return line
      return JSON.stringify(first).slice(0, 120)
    }
  }

  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const line = pickScoreLine(o)
    if (line) return line
  }

  return null
}

function pickScoreLine(o: Record<string, unknown>): string | null {
  // Fancyres shape:
  // { eventId, score: { home:{name,score,games,sets,...}, away:{...} }, currentSet, currentGame, fullTimeElapsed }
  const nestedScore = o.score as Record<string, unknown> | undefined
  if (nestedScore && typeof nestedScore === 'object') {
    const home = nestedScore.home as Record<string, unknown> | undefined
    const away = nestedScore.away as Record<string, unknown> | undefined
    const homeName = String(home?.name ?? 'Home').trim()
    const awayName = String(away?.name ?? 'Away').trim()

    const homePoints = String(home?.score ?? '').trim()
    const awayPoints = String(away?.score ?? '').trim()
    const homeGames = String(home?.games ?? '').trim()
    const awayGames = String(away?.games ?? '').trim()
    const homeSets = String(home?.sets ?? '').trim()
    const awaySets = String(away?.sets ?? '').trim()

    const hasPoints = homePoints !== '' || awayPoints !== ''
    const hasGames = homeGames !== '' || awayGames !== ''
    const hasSets = homeSets !== '' || awaySets !== ''

    const scoreBits: string[] = []
    if (hasPoints) scoreBits.push(`${homePoints || '0'}-${awayPoints || '0'}`)
    if (hasGames) scoreBits.push(`G ${homeGames || '0'}-${awayGames || '0'}`)
    if (hasSets) scoreBits.push(`S ${homeSets || '0'}-${awaySets || '0'}`)

    const currentSet = o.currentSet != null ? String(o.currentSet) : ''
    const currentGame = o.currentGame != null ? String(o.currentGame) : ''
    if (currentSet) scoreBits.push(`Set ${currentSet}`)
    if (currentGame) scoreBits.push(`Game ${currentGame}`)

    const elapsed = o.fullTimeElapsed as Record<string, unknown> | undefined
    if (elapsed && typeof elapsed === 'object') {
      const h = Number(elapsed.hour ?? 0) || 0
      const m = Number(elapsed.min ?? 0) || 0
      const s = Number(elapsed.sec ?? 0) || 0
      if (h > 0 || m > 0 || s > 0) {
        const hh = String(h).padStart(2, '0')
        const mm = String(m).padStart(2, '0')
        const ss = String(s).padStart(2, '0')
        scoreBits.push(`${hh}:${mm}:${ss}`)
      }
    }

    if (homeName && awayName) {
      const suffix = scoreBits.length ? ` (${scoreBits.join(' · ')})` : ''
      return `${homeName} vs ${awayName}${suffix}`
    }
  }

  const score =
    o.score ?? o.Score ?? o.scoreStr ?? o.ScoreStr ?? o.matchScore ?? o.MatchScore
  const setScore = o.setScore ?? o.SetScore ?? o.sets ?? o.Sets
  const home = o.home ?? o.Home ?? o.homeTeam ?? o.HomeTeam ?? o.player1 ?? o.Player1 ?? o.team1
  const away = o.away ?? o.Away ?? o.awayTeam ?? o.AwayTeam ?? o.player2 ?? o.Player2 ?? o.team2
  const homeS = home != null ? String(home) : ''
  const awayS = away != null ? String(away) : ''
  if (homeS && awayS) {
    const core = score != null ? `${homeS} ${String(score)} ${awayS}` : `${homeS} v ${awayS}`
    return setScore != null ? `${core} (${setScore})` : core
  }
  if (score != null) return String(score)
  if (setScore != null) return String(setScore)
  const commentary = o.commentary ?? o.Commentary ?? o.status ?? o.Status
  if (commentary != null) return String(commentary)
  return null
}

export function FancyresTabScoreLine({
  eventId,
  sport,
  isLive,
}: {
  eventId: string
  sport: 'tennis' | 'soccer'
  isLive: boolean
}) {
  const tennisQ = useGetFancyresTennisScoreQuery(
    { eventId },
    {
      skip: !isLive || sport !== 'tennis',
      pollingInterval: isLive && sport === 'tennis' ? 20000 : 0,
    }
  )
  const soccerQ = useGetFancyresSoccerScoreQuery(
    { eventId },
    {
      skip: !isLive || sport !== 'soccer',
      pollingInterval: isLive && sport === 'soccer' ? 20000 : 0,
    }
  )

  const q = sport === 'tennis' ? tennisQ : soccerQ
  const text = formatFancyresScore(q.data)

  if (!isLive) return null
  if (q.isLoading) {
    return <span className="text-[10px] text-gray-500">Loading score…</span>
  }
  if (q.isError) return null
  if (!text) return null

  return (
    <div
      className="text-[10px] sm:text-xs text-gray-700 font-semibold mt-0.5 truncate max-w-full"
      title={text}
    >
      {text}
    </div>
  )
}
