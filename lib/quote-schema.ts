import { z } from 'zod'
export const serviceOptions=['Standard Cleaning','Deep Cleaning','Move-In Cleaning','Move-Out Cleaning','Recurring Cleaning'] as const
export const extraOptions=['Oven cleaning','Refrigerator cleaning','Interior windows','Interior cabinets','Laundry'] as const
export const frequencyOptions=['One-time','Weekly','Every two weeks','Monthly'] as const
// A preference only, never proof of availability. Compare calendar dates in UTC
// until owner-approved business timezone/booking rules are configured.
export function validPreferredDate(value: string, now = new Date()) {
 if(value === '') return true
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
 const parsed = new Date(`${value}T00:00:00.000Z`)
 return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value && value >= now.toISOString().slice(0,10)
}
export const quoteSchema=z.object({submissionId:z.uuid(),zip:z.string().regex(/^\d{5}$/,'Enter a five-digit ZIP code'),service:z.enum(serviceOptions),bedrooms:z.number().int().min(0).max(20),bathrooms:z.number().min(1).max(20).multipleOf(0.5),squareFeet:z.number().int().min(100).max(30000),condition:z.enum(['Regular upkeep','Needs extra attention','Heavy cleaning']),pets:z.enum(['No pets','Cats','Dogs','Other pets']),notes:z.string().max(2000),extras:z.array(z.enum(extraOptions)).max(5).refine(v=>new Set(v).size===v.length),frequency:z.enum(frequencyOptions),preferredDate:z.string().max(10).refine(v=>validPreferredDate(v),'Choose a valid date today or later (UTC), or leave it blank.').optional(),name:z.string().trim().min(2).max(100),email:z.email().max(254),phone:z.string().max(30),consent:z.literal(true),marketing:z.boolean(),website:z.string().max(0)})
export type QuoteInput=z.infer<typeof quoteSchema>
