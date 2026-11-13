import { z } from 'zod'

export const customerQuoteColumns = 'id,user_id,status,created_at,zip,details'
export type CustomerQuoteDatabase = {
  from(table: 'kiya_quotes'): {
    select(columns: string): {
      eq(column: 'id', value: string): {
        eq(column: 'user_id', value: string): {
          maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>
        }
      }
    }
  }
}
const displayText = (value: unknown) => typeof value === 'string' ? value : ''
export async function customerQuote(database: CustomerQuoteDatabase, sessionUserId: string | null, quoteId: string) {
  // Authentication comes from server getUser, never a query parameter or email.
  if (!sessionUserId) throw new Error('Authentication required')
  const id = z.uuid().parse(quoteId)
  const userId = z.uuid().parse(sessionUserId)
  const { data, error } = await database.from('kiya_quotes').select(customerQuoteColumns).eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw new Error('Request unavailable')
  if (!data) return null
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Request unavailable')
  const row = data as Record<string, unknown>
  // Defense in depth: protect against an incorrectly implemented data adapter.
  if (row.id !== id || row.user_id !== userId) return null
  const details = row.details && typeof row.details === 'object' && !Array.isArray(row.details) ? row.details as Record<string, unknown> : {}
  const amount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? String(value) : ''
  return {
    id, status: displayText(row.status), zip: displayText(row.zip), createdAt: displayText(row.created_at),
    service: displayText(details.service), bedrooms: amount(details.bedrooms), bathrooms: amount(details.bathrooms),
    squareFeet: amount(details.squareFeet), frequency: displayText(details.frequency), preferredDate: displayText(details.preferredDate),
    condition: displayText(details.condition), pets: displayText(details.pets), notes: displayText(details.notes),
    extras: Array.isArray(details.extras) ? details.extras.filter((value): value is string => typeof value === 'string') : [],
  }
}
