import { z } from 'zod'

export const quoteSchema = z.object({
  submissionId: z.uuid(),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.email('Please enter a valid email.').trim().toLowerCase().max(254),
  phone: z.string().trim().max(30).refine(value => !value || /^[+\d\s().-]{7,30}$/.test(value), 'Please enter a valid phone number.'),
  zip: z.string().regex(/^\d{5}$/, 'Please enter a five-digit ZIP code.'),
  service: z.enum(['standard', 'deep', 'move']),
  frequency: z.enum(['once', 'weekly', 'biweekly', 'monthly']),
  bedrooms: z.enum(['studio', '1', '2', '3', '4', '5+']),
  notes: z.string().trim().max(2000),
  consent: z.literal(true, { error: 'Please agree to be contacted about your quote.' }),
  website: z.string().max(0),
})
export type QuoteInput = z.infer<typeof quoteSchema>
