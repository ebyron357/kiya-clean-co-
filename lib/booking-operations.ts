// Domain contract only: NOT connected to live booking tables or exposed as an
// operational endpoint. Callers must derive actors from trusted server auth.
// A reviewed DB adapter must implement atomic reservation + audit/idempotency.
export type BookingStatus = 'requested' | 'pending_confirmation' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'canceled' | 'rescheduled' | 'no_show' | 'disputed'
export type Actor = { id: string; role: 'admin' | 'staff' | 'customer' }
export type BookingRecord = {
  id: string; customerId: string; assignedStaffIds: string[]; status: BookingStatus
  service: string; startsAt: number; endsAt: number
  instructions: string; checklist: { id: string; label: string; completed: boolean }[]
}
const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  requested: ['pending_confirmation', 'canceled'],
  pending_confirmation: ['confirmed', 'canceled'],
  confirmed: ['assigned', 'rescheduled', 'canceled', 'no_show'],
  assigned: ['in_progress', 'rescheduled', 'canceled', 'no_show'],
  in_progress: ['completed', 'disputed'],
  completed: ['disputed'],
  canceled: [], rescheduled: [], no_show: ['disputed'], disputed: [],
}
export function transitionBooking(booking: BookingRecord, actor: Actor, next: BookingStatus, now: number) {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('Invalid audit timestamp')
  if (actor.role !== 'admin' && !(actor.role === 'staff' && booking.assignedStaffIds.includes(actor.id) &&
      ((booking.status === 'assigned' && next === 'in_progress') || (booking.status === 'in_progress' && ['completed', 'disputed'].includes(next))))) {
    throw new Error('Forbidden')
  }
  if (!transitions[booking.status]?.includes(next)) throw new Error('Invalid booking transition')
  if (next === 'completed' && booking.checklist.some(item => !item.completed)) throw new Error('Checklist incomplete')
  return {
    booking: { ...booking, status: next },
    audit: { bookingId: booking.id, actorId: actor.id, from: booking.status, to: next, at: now },
  }
}

// Return a whitelist, never the original booking/customer object. The adapter
// must persist cancellation/reschedule requests separately from final decisions.
export function staffJob(booking: BookingRecord, actor: Actor) {
  if (actor.role !== 'staff' || !booking.assignedStaffIds.includes(actor.id)) throw new Error('Forbidden')
  return {
    id: booking.id, service: booking.service, status: booking.status,
    startsAt: booking.startsAt, endsAt: booking.endsAt,
    instructions: booking.instructions,
    checklist: booking.checklist.map(item => ({ id: item.id, label: item.label, completed: item.completed })),
  }
}
export function customerChangeRequest(booking: BookingRecord, actor: Actor, input: { kind: 'cancel' | 'reschedule'; reason: string }, now: number) {
  if (actor.role !== 'customer' || actor.id !== booking.customerId) throw new Error('Forbidden')
  if (!['requested', 'pending_confirmation', 'confirmed', 'assigned'].includes(booking.status)) throw new Error('Changes unavailable for this status')
  if (!['cancel', 'reschedule'].includes(input.kind) || !input.reason.trim() || input.reason.length > 1000 || !Number.isSafeInteger(now) || now < 0) throw new Error('Invalid request')
  // This is a request for owner review, never a changed appointment or fee.
  return { bookingId: booking.id, customerId: actor.id, kind: input.kind, reason: input.reason.trim(), requestedAt: now, status: 'pending_review' as const }
}

export type Reservation = {
  submissionId: string; customerId: string; resourceId: string
  startsAt: number; endsAt: number; bufferBeforeMs: number; bufferAfterMs: number
}
export function validateReservation(value: Reservation) {
  if (![value.submissionId, value.customerId, value.resourceId].every(id => typeof id === 'string' && id.length > 0 && id.length <= 200)) throw new Error('Missing reservation identity')
  if (![value.startsAt, value.endsAt, value.bufferBeforeMs, value.bufferAfterMs].every(n => Number.isSafeInteger(n) && n >= 0) || value.startsAt >= value.endsAt ||
      value.startsAt < value.bufferBeforeMs || !Number.isSafeInteger(value.endsAt + value.bufferAfterMs)) throw new Error('Invalid reservation interval')
}
export function reservationsConflict(a: Reservation, b: Reservation) {
  validateReservation(a); validateReservation(b)
  return a.resourceId === b.resourceId && a.startsAt - a.bufferBeforeMs < b.endsAt + b.bufferAfterMs &&
    b.startsAt - b.bufferBeforeMs < a.endsAt + a.bufferAfterMs
}
export type ReservationResult = { status: 'reserved'; bookingId: string } | { status: 'conflict' | 'idempotency_conflict' }
export interface AtomicBookingStore {
  // MUST execute under a DB transaction/exclusion constraint (or equivalent):
  // authorize customer, validate approved availability/duration/blackouts, check
  // existing idempotency key + complete payload, reserve, and write audit/outbox.
  // A read-then-write sequence outside a lock is NOT an implementation.
  reserveAtomically(input: Reservation): Promise<ReservationResult>
}
export async function requestReservation(input: Reservation, actor: Actor, store: AtomicBookingStore) {
  if (actor.role !== 'customer' || actor.id !== input.customerId) throw new Error('Forbidden')
  validateReservation(input)
  return store.reserveAtomically(input)
}
