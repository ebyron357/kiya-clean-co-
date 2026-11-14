import type { QuoteInput } from './quote-schema'

export const UNCONFIRMED_MESSAGE = 'We couldn’t confirm your request. Your details are still here. Please retry.'
export const TIMEOUT_MESSAGE = 'Your request took too long to confirm. Your details are still here. Please retry.'

export function prepareQuoteSubmission(input: QuoteInput, previous: QuoteInput | null): QuoteInput {
  const { submissionId: inputId, ...details } = input
  if (!previous) return { ...details, submissionId: inputId }
  const unchanged = (Object.keys(details) as Array<keyof typeof details>).every(key => details[key] === previous[key])
  return unchanged ? previous : { ...details, submissionId: crypto.randomUUID() }
}

class QuoteSubmissionError extends Error {}

type Options = { fetcher?: typeof fetch; timeoutMs?: number }

export async function sendQuote(input: QuoteInput, { fetcher = fetch, timeoutMs = 20000 }: Options = {}): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetcher('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
    const result: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      if (response.status === 429) throw new QuoteSubmissionError('Too many requests. Please try again in an hour. Your details are still here.')
      if (response.status >= 400 && response.status < 500) throw new QuoteSubmissionError('We couldn’t accept this request. Check your details and consent, then try again.')
      throw new QuoteSubmissionError(UNCONFIRMED_MESSAGE)
    }
    if (!result || typeof result !== 'object' || !('success' in result) || result.success !== true) throw new QuoteSubmissionError(UNCONFIRMED_MESSAGE)
  } catch (error) {
    if (controller.signal.aborted) throw new QuoteSubmissionError(TIMEOUT_MESSAGE)
    if (error instanceof QuoteSubmissionError) throw error
    throw new QuoteSubmissionError(UNCONFIRMED_MESSAGE)
  } finally {
    clearTimeout(timer)
  }
}
