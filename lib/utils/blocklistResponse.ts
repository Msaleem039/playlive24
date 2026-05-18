/** GET /admin/fancy/stop and GET /admin/matchodds/stop list payloads */
export type BlocklistListResponse = {
  success?: boolean
  status?: string
  total?: number
  totalBlockedEvents?: number
  eventIds?: Array<string | number>
  items?: BlocklistItem[]
}

export type BlocklistItem = {
  eventId?: string | number
  event_id?: string | number
  blocked?: boolean
  status?: string
  action?: string
  isFancyBlocked?: boolean
  isFancyAllowed?: boolean
  isMatchOddsBlocked?: boolean
  isMatchOddsAllowed?: boolean
  message?: string
}

function isStoppedItem(item: BlocklistItem, kind: 'fancy' | 'matchOdds'): boolean {
  const status = String(item?.status ?? '').toUpperCase()
  if (kind === 'fancy') {
    return (
      item?.blocked === true ||
      item?.isFancyBlocked === true ||
      (typeof item?.isFancyAllowed === 'boolean' && !item.isFancyAllowed) ||
      status === 'STOPPED'
    )
  }
  return (
    item?.blocked === true ||
    item?.isMatchOddsBlocked === true ||
    (typeof item?.isMatchOddsAllowed === 'boolean' && !item.isMatchOddsAllowed) ||
    status === 'STOPPED'
  )
}

export function parseBlocklistEventIds(
  raw: unknown,
  kind: 'fancy' | 'matchOdds'
): { eventIds: Set<string>; totalBlocked: number } {
  const ids = new Set<string>()
  const data = (raw ?? {}) as BlocklistListResponse
  if (!data || typeof data !== 'object') {
    return { eventIds: ids, totalBlocked: 0 }
  }

  if (Array.isArray(data.eventIds)) {
    data.eventIds.forEach((id) => {
      if (id != null && String(id).trim() !== '') ids.add(String(id))
    })
  }

  if (Array.isArray(data.items)) {
    data.items.forEach((item) => {
      const id = item?.eventId ?? item?.event_id
      if (id == null) return
      if (isStoppedItem(item, kind)) ids.add(String(id))
    })
  }

  const totalBlocked =
    typeof data.totalBlockedEvents === 'number'
      ? data.totalBlockedEvents
      : typeof data.total === 'number'
      ? data.total
      : ids.size

  return { eventIds: ids, totalBlocked }
}

/** GET /admin/matchodds/stop/:eventId — single event status */
export function parseMatchOddsStopStatus(raw: unknown): {
  eventId: string
  blocked: boolean
  isMatchOddsBlocked?: boolean
  isMatchOddsAllowed?: boolean
} | null {
  const data = (raw ?? {}) as Record<string, unknown>
  const payload = (data?.data ?? data) as BlocklistItem
  const eventId = payload?.eventId ?? payload?.event_id
  if (eventId == null) return null

  const blocked = isStoppedItem(payload, 'matchOdds')
  return {
    eventId: String(eventId),
    blocked,
    isMatchOddsBlocked: payload?.isMatchOddsBlocked,
    isMatchOddsAllowed: payload?.isMatchOddsAllowed,
  }
}

export function parseFancyStopStatus(raw: unknown): {
  eventId: string
  blocked: boolean
} | null {
  const data = (raw ?? {}) as Record<string, unknown>
  const payload = (data?.data ?? data) as BlocklistItem
  const eventId = payload?.eventId ?? payload?.event_id
  if (eventId == null) return null
  return { eventId: String(eventId), blocked: isStoppedItem(payload, 'fancy') }
}
