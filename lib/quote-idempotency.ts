type QuoteRow = {
  submission_id?: unknown; user_id?: unknown; customer_name?: unknown
  email?: unknown; phone?: unknown; zip?: unknown; marketing_consent?: unknown; details?: unknown
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`
  return JSON.stringify(value) ?? 'undefined'
}
export function sameQuoteSubmission(existing: QuoteRow, expected: QuoteRow) {
  // Service-role read occurs only on a duplicate UUID. Never expose the existing
  // row to callers, or silently accept a different customer/changed payload.
  const keys = ['submission_id','user_id','customer_name','email','phone','zip','marketing_consent'] as const
  if (keys.some(key => existing[key] !== expected[key])) return false
  if (!existing.details || typeof existing.details !== 'object' || !expected.details || typeof expected.details !== 'object') return false
  const actual = existing.details as Record<string, unknown>
  const desired = expected.details as Record<string, unknown>
  if ((actual.preferredDate ?? '') !== (desired.preferredDate ?? '')) return false
  return Object.entries(desired).every(([key, value]) => {
    if (['pricing', 'contact_consent', 'privacy_version'].includes(key)) return true // server-owned metadata is not the request payload
    if (key === 'preferredDate') return (actual[key] ?? '') === (value ?? '')
    return canonical(actual[key]) === canonical(value)
  })
}
