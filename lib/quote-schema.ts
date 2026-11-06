import { z } from 'zod'
export const serviceOptions=['Standard Cleaning','Deep Cleaning','Move-In Cleaning','Move-Out Cleaning','Recurring Cleaning'] as const
export const extraOptions=['Oven cleaning','Refrigerator cleaning','Interior windows','Interior cabinets','Laundry'] as const
export const frequencyOptions=['One-time','Weekly','Every two weeks','Monthly'] as const
export const quoteSchema=z.object({submissionId:z.uuid(),zip:z.string().regex(/^\d{5}$/,'Enter a five-digit ZIP code'),service:z.enum(serviceOptions),bedrooms:z.number().int().min(0).max(20),bathrooms:z.number().min(1).max(20).multipleOf(0.5),squareFeet:z.number().int().min(100).max(30000),condition:z.enum(['Regular upkeep','Needs extra attention','Heavy cleaning']),pets:z.enum(['No pets','Cats','Dogs','Other pets']),notes:z.string().max(2000),extras:z.array(z.enum(extraOptions)).max(5).refine(v=>new Set(v).size===v.length),frequency:z.enum(frequencyOptions),name:z.string().trim().min(2).max(100),email:z.email().max(254),phone:z.string().max(30),consent:z.literal(true),marketing:z.boolean(),website:z.string().max(0)})
export type QuoteInput=z.infer<typeof quoteSchema>
