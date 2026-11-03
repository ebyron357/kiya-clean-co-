import test from 'node:test'
import assert from 'node:assert/strict'
import { inquirySchema } from '../lib/inquiry-validation.ts'

const base = { submissionId: 'e1141604-0dab-448a-99da-afb04d58dc8e', kind: 'contact', email: 'qa@example.com', name: 'QA Applicant', phone: '7045550123', zip: '28025', message: 'A validation test message.', consent: true, website: '' }
const application = { town: 'Concord', yearsExperience: 0, daysAvailable: ['Monday'], reliableTransportation: 'no' }
test('contact messages validate without career fields', () => assert.equal(inquirySchema.safeParse(base).success, true))
test('career applications allow new cleaners and no transportation', () => assert.equal(inquirySchema.safeParse({...base,kind:'career',message:'',application}).success,true))
test('career applications require structured details and a valid phone', () => {
  assert.equal(inquirySchema.safeParse({...base,kind:'career'}).success,false)
  assert.equal(inquirySchema.safeParse({...base,kind:'career',phone:'123',application}).success,false)
})
test('applications reject missing days, invalid experience and transport', () => {
  for (const change of [{daysAvailable:[]},{daysAvailable:['Funday']},{yearsExperience:-1},{yearsExperience:Infinity},{reliableTransportation:'maybe'},{town:''}]) assert.equal(inquirySchema.safeParse({...base,kind:'career',application:{...application,...change}}).success,false)
})
test('consent and honeypot are enforced and contact detail is required', () => {
  for (const change of [{consent:false},{website:'spam'},{zip:'ABC'},{message:'short'},{name:'x'}]) assert.equal(inquirySchema.safeParse({...base,...change}).success,false)
})
test('waitlist remains backward compatible', () => assert.equal(inquirySchema.safeParse({...base,kind:'waitlist',name:'',phone:'',message:''}).success,true))
