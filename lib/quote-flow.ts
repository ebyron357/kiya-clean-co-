import { quoteSchema, type QuoteInput } from './quote-schema'

export type QuoteStep = 0 | 1 | 2
export type QuoteDetails = Omit<QuoteInput, 'submissionId' | 'consent' | 'website'>

export const quoteSteps = ['Your home', 'Contact', 'Review'] as const
export const serviceLabels = { standard: 'Standard cleaning', deep: 'Deep cleaning', move: 'Move-in / move-out' } as const
export const frequencyLabels = { once: 'Just this once', weekly: 'Every week', biweekly: 'Every two weeks', monthly: 'Every month' } as const

export const quoteHomeSchema = quoteSchema.pick({ service: true, zip: true, bedrooms: true, frequency: true })
export const quoteDetailsSchema = quoteSchema.omit({ submissionId: true, consent: true, website: true })

export function quoteStepForField(field: string): QuoteStep {
  if (['service', 'zip', 'bedrooms', 'frequency'].includes(field)) return 0
  if (['name', 'email', 'phone', 'notes'].includes(field)) return 1
  return 2
}
