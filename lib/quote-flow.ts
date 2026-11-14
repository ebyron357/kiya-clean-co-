import { quoteSchema, type QuoteInput } from './quote-schema'

export type QuoteStep = 0 | 1 | 2
export type QuoteDetails = Omit<QuoteInput, 'submissionId' | 'consent' | 'website'>

export const quoteSteps = ['Your home', 'Contact', 'Review'] as const
export const serviceLabels = { standard: 'Standard cleaning', deep: 'Deep cleaning', move: 'Move-in / move-out' } as const
export const frequencyLabels = { once: 'Just this once', weekly: 'Every week', biweekly: 'Every two weeks', monthly: 'Every month' } as const

export const quoteHomeSchema = quoteSchema.pick({ service: true, zip: true, bedrooms: true, frequency: true })
export const quoteDetailsSchema = quoteSchema.omit({ submissionId: true, consent: true, website: true })

export function getQuoteService(value: unknown): QuoteDetails['service'] {
  return value === 'deep' || value === 'move' ? value : 'standard'
}

export function quoteServiceHref(currentHref: string, service: QuoteDetails['service']): string {
  const url = new URL(currentHref)
  url.searchParams.set('service', service)
  return `${url.pathname}${url.search}${url.hash}`
}

export function sectionHref(currentHref: string, destinationHref: string): string | null {
  const current = new URL(currentHref)
  const destination = new URL(destinationHref, current)
  if (destination.origin !== current.origin || destination.pathname !== current.pathname || !destination.hash) return null
  current.hash = destination.hash
  if (destination.searchParams.has('service')) return quoteServiceHref(current.href, getQuoteService(destination.searchParams.get('service')))
  return `${current.pathname}${current.search}${current.hash}`
}

export function quoteStepForField(field: string): QuoteStep {
  if (['service', 'zip', 'bedrooms', 'frequency'].includes(field)) return 0
  if (['name', 'email', 'phone', 'notes'].includes(field)) return 1
  return 2
}
