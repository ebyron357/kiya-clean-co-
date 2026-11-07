import { sameQuoteSubmission } from '../quote-idempotency.ts'
import type { QuoteRecord, QuoteRepository } from '../quote-submission'

// Narrow structural port makes the real Supabase adapter testable without keys,
// network calls or sample production rows. Source client remains server-only.
type StorageError = { code?: string } | null
export type QuoteDatabase = {
  from(table: 'kiya_quotes'): {
    insert(record: QuoteRecord): PromiseLike<{ error: StorageError }>
    select(columns: string): {
      eq(column: 'submission_id', value: string): {
        maybeSingle(): PromiseLike<{ data: unknown; error: StorageError }>
      }
    }
  }
}
export function quoteRepository(database: QuoteDatabase): QuoteRepository {
  return {
    async save(record) {
      const { error } = await database.from('kiya_quotes').insert(record)
      if (!error) return 'inserted'
      if (error.code !== '23505') throw new Error('Quote storage unavailable')
      // A conflict on any unrelated unique constraint must not become success.
      const existing = await database.from('kiya_quotes')
        .select('submission_id,user_id,customer_name,email,phone,zip,marketing_consent,details')
        .eq('submission_id', record.submission_id).maybeSingle()
      if (existing.error || !existing.data || typeof existing.data !== 'object' || Array.isArray(existing.data)) {
        throw new Error('Quote retry lookup unavailable')
      }
      return sameQuoteSubmission(existing.data, record) ? 'retried' : 'conflict'
    },
  }
}
