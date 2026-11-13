import { z } from 'zod'

const schema = z.object({
  approved: z.literal(true),
  email: z.email().optional(),
  privacyEmail: z.email().optional(),
  phone: z.string().regex(/^\+?[0-9 ()-]{7,30}$/).optional(),
  areaLabel: z.string().trim().min(2).max(100).optional(),
  serviceZips: z.array(z.string().regex(/^\d{5}$/)).max(1000).default([]),
  responseTime: z.string().trim().min(2).max(160).optional(),
}).strict()

// Only explicit owner-approved content is published. Invalid or missing profiles
// fail closed; no placeholder contact details, rates, or business claims.
export function parseBusinessProfile(raw: string | undefined) {
  try {
    const result = schema.safeParse(JSON.parse(raw || '{}'))
    return result.success ? result.data : null
  } catch { return null }
}
