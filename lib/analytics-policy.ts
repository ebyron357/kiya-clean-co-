// Never transmit arbitrary paths, query strings, fragments, quote IDs, auth
// tokens or form values. Explicit allowlist rather than a private-route denylist.
const publicPaths = new Set(['/', '/quote', '/services', '/about', '/contact', '/service-areas', '/policies/privacy', '/policies/terms', '/policies/cancellation'])
const servicePaths = new Set(['standard-cleaning', 'deep-cleaning', 'move-in-out-cleaning', 'recurring-cleaning'])
export function analyticsUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (!publicPaths.has(url.pathname) && !(url.pathname.startsWith('/services/') && servicePaths.has(url.pathname.slice(10)))) return null
    url.search = ''; url.hash = ''; url.username = ''; url.password = ''
    return url.toString()
  } catch { return null }
}
export type QuoteMetric = 'started' | 'step_completed' | 'validation_failed' | 'submitted' | 'save_failed' | 'abandoned'
export function quoteMetric(event: QuoteMetric, step: number) {
  // Output is deliberately limited to static names and numeric step. No API for
  // passing email, ZIP, service, notes, identifiers, amounts or error messages.
  if (!Number.isInteger(step) || step < 0 || step > 5) return null
  return { name: `quote_${event}`, properties: { step: step + 1 } }
}
