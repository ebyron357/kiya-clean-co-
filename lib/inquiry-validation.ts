import { z } from 'zod'
export const applicationDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const
export const inquirySchema = z.object({
  submissionId: z.uuid(),
  kind: z.enum(['waitlist','career','contact']),
  email: z.email().max(254),
  name: z.string().trim().max(100),
  phone: z.string().trim().max(30),
  zip: z.string().regex(/^\d{5}$/),
  message: z.string().trim().max(3000),
  consent: z.literal(true),
  website: z.string().max(0),
  application: z.object({
    town: z.string().trim().min(2).max(100),
    yearsExperience: z.number().finite().min(0).max(80),
    daysAvailable: z.array(z.enum(applicationDays)).min(1).max(7).transform(days => [...new Set(days)]),
    reliableTransportation: z.enum(['yes','no']),
  }).optional(),
}).superRefine((value, context) => {
  if (value.kind !== 'waitlist' && value.name.length < 2) context.addIssue({ code: 'custom', path: ['name'], message: 'Please include your name.' })
  if (value.kind === 'contact' && value.message.length < 10) context.addIssue({ code: 'custom', path: ['message'], message: 'Please include at least 10 characters in your message.' })
  if (value.kind === 'career' && (!value.application || value.phone.replace(/\D/g,'').length < 10)) context.addIssue({ code: 'custom', path: ['application'], message: 'Complete your phone, town, experience, available days, and transportation details.' })
})
