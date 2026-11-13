import type { QuoteInput } from './quote-schema'

// Existing kiya_quotes columns only. This contract does not create a table or
// define production RLS. Implementations must not expose stored contact details.
export type QuoteRecord = {
  submission_id: string; user_id: string | null; customer_name: string
  email: string; phone: string; zip: string; marketing_consent: boolean
  details: Record<string, unknown>
}
export type QuotePersistenceResult = 'inserted' | 'retried' | 'conflict'
export interface QuoteRepository {
  save(record: QuoteRecord): Promise<QuotePersistenceResult>
}
export type QuoteSubmissionDependencies = {
  rateLimit: () => Promise<boolean>
  authenticatedUser: () => Promise<string | null>
  repository: QuoteRepository
  onInserted?: (submissionId: string) => void
}
export class QuoteSubmissionError extends Error {
  readonly status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}
export async function submitQuote(input: QuoteInput, dependencies: QuoteSubmissionDependencies) {
  if (!await dependencies.rateLimit()) throw new QuoteSubmissionError('Too many requests. Please try again later.', 429)
  const userId = await dependencies.authenticatedUser()
  const { submissionId, name, email, phone, zip, consent, marketing, website, ...details } = input
  const record: QuoteRecord = {
    submission_id: submissionId, user_id: userId,
    customer_name: name, email, phone, zip, marketing_consent: marketing,
    // Pricing is server-owned and inactive. Raw client flags, user totals and
    // the honeypot are excluded; validated contact consent is recorded explicitly.
    details: { ...details, contact_consent: true, privacy_version: '2026-11-13', pricing: { status: 'unconfigured' } },
  }
  const result = await dependencies.repository.save(record)
  if (result === 'conflict') throw new QuoteSubmissionError('This request identifier was already used. Reload to start a new request.', 409)
  if (!['inserted', 'retried'].includes(result)) throw new Error('Invalid quote persistence result')
  if (result === 'inserted' && dependencies.onInserted) {
    // Notification scheduling must never turn an already saved quote into a
    // false failure response. Exact retries do not schedule another email.
    try { dependencies.onInserted(submissionId) } catch { /* Quote remains saved. */ }
  }
  return { success: true, message: 'Your request has been saved. This is not a confirmed booking.' }
}
