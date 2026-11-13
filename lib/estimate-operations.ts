import { z } from 'zod'

// Application-domain types, NOT assumed live SQL columns/status enums. No live
// adapter is supplied until migration/constraint/RLS evidence is reviewed.
const identity = z.string().trim().min(1).max(200)
const timestamp = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const cents = z.number().int().nonnegative().max(100000000)
const line = z.object({ description: z.string().trim().min(1).max(300), quantity: z.number().int().min(1).max(1000), unitCents: cents }).strict()
export const estimateOfferSchema = z.object({
  currency: z.literal('USD'), lines: z.array(line).min(1).max(50),
  discountCents: cents, feeCents: cents, taxCents: cents,
  expiresAt: timestamp, termsVersion: identity, pricingApprovalId: identity,
}).strict()
export type EstimateOffer = z.infer<typeof estimateOfferSchema>
export type EstimateStatus = 'submitted' | 'under_review' | 'quoted' | 'accepted' | 'declined' | 'expired' | 'converted'
export type Estimate = {
  id: string; customerId: string | null; version: number; status: EstimateStatus
  offer?: EstimateOffer; totalCents?: number; bookingId?: string
}
export type EstimateActor = { id: string; role: 'admin' | 'customer' | 'staff' }
export type EstimateCommand =
  | { kind: 'review' }
  | { kind: 'quote'; offer: EstimateOffer }
  | { kind: 'accept' | 'decline' | 'expire' }
  | { kind: 'convert'; bookingId: string }
export type PricingApproval = { id: string; termsVersion: string; active: boolean }

export function estimateTotal(offer: EstimateOffer) {
  const parsed = estimateOfferSchema.parse(offer)
  const subtotal = parsed.lines.reduce((sum, item) => {
    const next = sum + item.quantity * item.unitCents
    if (!Number.isSafeInteger(next) || next > 100000000) throw new Error('Estimate total out of range')
    return next
  }, 0)
  if (parsed.discountCents > subtotal) throw new Error('Discount exceeds subtotal')
  const total = subtotal - parsed.discountCents + parsed.feeCents + parsed.taxCents
  if (!Number.isSafeInteger(total) || total > 100000000) throw new Error('Estimate total out of range')
  return total
}
function validateEstimate(value: Estimate) {
  identity.parse(value.id)
  if (value.customerId !== null) identity.parse(value.customerId)
  if (!Number.isSafeInteger(value.version) || value.version < 0 || value.version >= Number.MAX_SAFE_INTEGER) throw new Error('Invalid estimate version')
  if (!['submitted','under_review','quoted','accepted','declined','expired','converted'].includes(value.status)) throw new Error('Invalid estimate status')
  if (['quoted','accepted','declined','expired','converted'].includes(value.status)) {
    if (!value.offer || value.totalCents !== estimateTotal(value.offer)) throw new Error('Invalid stored offer')
  }
}
export function applyEstimateCommand(source: Estimate, actor: EstimateActor, command: EstimateCommand, now: number, approval: PricingApproval | null = null) {
  validateEstimate(source); identity.parse(actor.id); timestamp.parse(now)
  if (!['admin','customer','staff'].includes(actor.role)) throw new Error('Forbidden')
  if (command.kind === 'accept' || command.kind === 'decline') {
    if (actor.role !== 'customer' || source.customerId === null || actor.id !== source.customerId) throw new Error('Forbidden')
  } else if (actor.role !== 'admin') throw new Error('Forbidden')
  const next = structuredClone(source)
  switch (command.kind) {
    case 'review':
      if (source.status !== 'submitted') throw new Error('Invalid estimate transition')
      next.status = 'under_review'; break
    case 'quote': {
      if (!['under_review','quoted'].includes(source.status)) throw new Error('Invalid estimate transition')
      const offer = estimateOfferSchema.parse(command.offer)
      if (!approval?.active || offer.pricingApprovalId !== approval.id || offer.termsVersion !== approval.termsVersion) throw new Error('Owner-approved pricing and terms required')
      if (offer.expiresAt <= now) throw new Error('Offer must expire in the future')
      next.offer = structuredClone(offer); next.totalCents = estimateTotal(offer); next.status = 'quoted'; break
    }
    case 'accept': case 'decline':
      if (source.status !== 'quoted') throw new Error('Invalid estimate transition')
      if (!source.offer || source.offer.expiresAt <= now) throw new Error('Offer expired')
      next.status = command.kind === 'accept' ? 'accepted' : 'declined'; break
    case 'expire':
      if (source.status !== 'quoted' || !source.offer || source.offer.expiresAt > now) throw new Error('Estimate cannot expire yet')
      next.status = 'expired'; break
    case 'convert':
      if (source.status !== 'accepted' || !source.customerId) throw new Error('Accepted customer estimate required')
      // The transactional repository must validate/create the linked reservation.
      // A client-supplied ID is not proof that a booking exists.
      identity.parse(command.bookingId); next.bookingId = command.bookingId; next.status = 'converted'; break
    default: throw new Error('Unknown estimate command')
  }
  next.version++
  return {
    estimate: next,
    audit: { estimateId: source.id, actorId: actor.id, from: source.status, to: next.status, version: next.version, at: now },
  }
}

export type EstimateTransaction = {
  estimateId: string; expectedVersion: number; idempotencyKey: string
  actor: EstimateActor; command: EstimateCommand; now: number
}
export interface EstimateRepository {
  // Must re-read current record + trusted pricing approval inside one atomic
  // transaction, call applyEstimateCommand, enforce compare-and-swap version,
  // deduplicate actor+key+payload, persist audit/outbox and reserve on convert.
  // Never implement as a client-visible read followed by an unguarded upsert.
  transact(input: EstimateTransaction): Promise<
    { status: 'saved'; estimate: Estimate } | { status: 'conflict' | 'not_found' | 'idempotency_conflict' }
  >
}
export async function executeEstimateCommand(input: EstimateTransaction, repository: EstimateRepository) {
  identity.parse(input.estimateId); identity.parse(input.idempotencyKey); identity.parse(input.actor.id); timestamp.parse(input.now)
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0 || input.expectedVersion >= Number.MAX_SAFE_INTEGER) throw new Error('Invalid expected version')
  if (!['admin','customer'].includes(input.actor.role)) throw new Error('Forbidden')
  if (['accept','decline'].includes(input.command.kind) ? input.actor.role !== 'customer' : input.actor.role !== 'admin') throw new Error('Forbidden')
  if (!['review','quote','accept','decline','expire','convert'].includes(input.command.kind)) throw new Error('Unknown estimate command')
  return repository.transact(input)
}
