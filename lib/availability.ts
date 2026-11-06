import { reservationsConflict, validateReservation } from './booking-operations.ts'
import type { Reservation } from './booking-operations'

export type AvailabilityWindow = { resourceId: string; startsAt: number; endsAt: number }
export type AvailabilityRules = {
  approved: boolean; serviceId: string; resourceIds: string[]
  servedZips: string[]; durationMs: number; stepMs: number
  bufferBeforeMs: number; bufferAfterMs: number; minimumNoticeMs: number
}
export type AvailabilityInput = {
  serviceId: string; zip: string; from: number; to: number; now: number
  windows: AvailabilityWindow[]; blackouts: AvailabilityWindow[]; existing: Reservation[]
}
function integer(value: number) { return Number.isSafeInteger(value) && value >= 0 }
function windowValid(value: AvailabilityWindow) {
  return typeof value.resourceId === 'string' && !!value.resourceId && integer(value.startsAt) && integer(value.endsAt) && value.startsAt < value.endsAt
}
export function calculateAvailability(rules: AvailabilityRules | null, input: AvailabilityInput) {
  // Pure candidates only, never live reservation authority. Transactional
  // booking must recheck availability/blackouts under lock to prevent races.
  if (!rules?.approved) return { status: 'unconfigured' as const, candidates: [] }
  if (!rules.serviceId || !Array.isArray(rules.resourceIds) || !rules.resourceIds.length || new Set(rules.resourceIds).size !== rules.resourceIds.length ||
      rules.resourceIds.some(id => typeof id !== 'string' || !id) || !Array.isArray(rules.servedZips) || rules.servedZips.some(zip => !/^\d{5}$/.test(zip)) ||
      ![rules.durationMs, rules.stepMs].every(n => integer(n) && n > 0) || ![rules.bufferBeforeMs, rules.bufferAfterMs, rules.minimumNoticeMs].every(integer)) {
    throw new Error('Invalid approved availability configuration')
  }
  if (![input.from, input.to, input.now].every(integer) || input.from >= input.to || !Number.isSafeInteger(input.now + rules.minimumNoticeMs) ||
      !Number.isSafeInteger(input.to + rules.bufferAfterMs) || input.to - input.from > 31 * 24 * 60 * 60 * 1000 ||
      input.windows.length > 500 || input.blackouts.length > 500 || input.existing.length > 5000 ||
      [...input.windows, ...input.blackouts].some(value => !windowValid(value))) throw new Error('Invalid availability query')
  for (const reservation of input.existing) validateReservation(reservation)
  if (input.serviceId !== rules.serviceId || !/^\d{5}$/.test(input.zip) || !rules.servedZips.includes(input.zip)) return { status: 'unavailable' as const, candidates: [] }
  const candidates: { resourceId: string; startsAt: number; endsAt: number }[] = []
  const seen = new Set<string>()
  let attempts = 0
  for (const window of input.windows) {
    if (!rules.resourceIds.includes(window.resourceId)) continue
    const earliest = Math.max(input.from, input.now + rules.minimumNoticeMs, window.startsAt + rules.bufferBeforeMs)
    // Align to owner's window start, not to a customer's arbitrary query time.
    const anchor = window.startsAt + rules.bufferBeforeMs
    let startsAt = anchor + Math.ceil((earliest - anchor) / rules.stepMs) * rules.stepMs
    const latestEnd = Math.min(input.to, window.endsAt - rules.bufferAfterMs)
    for (; startsAt + rules.durationMs <= latestEnd; startsAt += rules.stepMs) {
      if (++attempts > 10000) throw new Error('Availability query too broad')
      const candidate: Reservation = {
        submissionId: 'availability-candidate', customerId: 'not-reserved', resourceId: window.resourceId,
        startsAt, endsAt: startsAt + rules.durationMs, bufferBeforeMs: rules.bufferBeforeMs, bufferAfterMs: rules.bufferAfterMs,
      }
      validateReservation(candidate)
      const blocked = input.blackouts.some(blackout => blackout.resourceId === candidate.resourceId &&
        candidate.startsAt - candidate.bufferBeforeMs < blackout.endsAt && blackout.startsAt < candidate.endsAt + candidate.bufferAfterMs)
      if (blocked || input.existing.some(existing => reservationsConflict(candidate, existing))) continue
      const key = `${candidate.resourceId}:${candidate.startsAt}`
      if (!seen.has(key)) { seen.add(key); candidates.push({ resourceId: candidate.resourceId, startsAt, endsAt: candidate.endsAt }) }
    }
  }
  candidates.sort((a, b) => a.startsAt - b.startsAt || a.resourceId.localeCompare(b.resourceId))
  return { status: 'candidates' as const, candidates }
}
