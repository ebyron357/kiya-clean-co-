import test from 'node:test'
import assert from 'node:assert/strict'
import { bookingPrice,coveredZips,pricingConfig,circleValueCents } from '../lib/booking-prices.ts'
import { standardChecklist } from '../lib/service-content.ts'
import { brandConfig } from '../lib/brand-config.ts'
const home={service:'Standard Cleaning',bedrooms:3,bathrooms:2,frequency:'Every two weeks',circle:false,quantities:[0,0,0,0,0,0]}
test('all published service tiers match config',()=>{for(const spec of Object.values(pricingConfig.services))pricingConfig.homeSizes.forEach((h,i)=>assert.equal(bookingPrice({...home,...h,service:spec.bookingName}).totalCents,spec.rates[i]))})
test('weekly price rounds to whole dollars',()=>assert.equal(bookingPrice({...home,frequency:'Weekly'}).totalCents,13400))
test('monthly price rounds to whole dollars',()=>assert.equal(bookingPrice({...home,frequency:'Monthly'}).totalCents,17100))
test('one-time price rounds to whole dollars',()=>assert.equal(bookingPrice({...home,frequency:'One-time'}).totalCents,18600))
test('1-bedroom uses 2-bedroom tier',()=>assert.equal(bookingPrice({...home,bedrooms:1,bathrooms:1}).totalCents,11900))
test('standard extra full and half bathroom',()=>assert.equal(bookingPrice({...home,bathrooms:3.5}).totalCents,17900))
test('frequency adjustment includes extra bathrooms',()=>assert.equal(bookingPrice({...home,bathrooms:3.5,frequency:'Monthly'}).totalCents,20600))
test('deep extra full and half bathroom',()=>assert.equal(bookingPrice({...home,service:'Deep Cleaning',bathrooms:3.5}).totalCents,32400))
test('move extra full and half bathroom',()=>assert.equal(bookingPrice({...home,service:'Move-Out Cleaning',bathrooms:3.5}).totalCents,37400))
test('deep price is not frequency-adjusted',()=>assert.equal(bookingPrice({...home,service:'Deep Cleaning',frequency:'Weekly'}).totalCents,27900))
test('Circle automatically adds and credits included extras',()=>{const p=bookingPrice({...home,service:'Deep Cleaning',circle:true});assert.equal(circleValueCents,11000);assert.equal(p.extrasCents,11000);assert.equal(p.discountCents,11000);assert.equal(p.totalCents,27900)})
test('Circle still charges unrelated extras',()=>assert.equal(bookingPrice({...home,service:'Deep Cleaning',circle:true,quantities:[1,1,1,0,2,1]}).totalCents,31400))
test('Circle requires biweekly deep clean',()=>{assert.equal(bookingPrice({...home,circle:true}).discountCents,0);assert.equal(bookingPrice({...home,service:'Deep Cleaning',circle:true,frequency:'Monthly'}).discountCents,0)})
test('included move extras never billed twice',()=>assert.equal(bookingPrice({...home,service:'Move-Out Cleaning',quantities:[1,1,1,1,10,0]}).totalCents,32900))
test('deep baseboards not charged twice',()=>assert.equal(bookingPrice({...home,service:'Deep Cleaning',quantities:[0,0,0,1,0,0]}).totalCents,27900))
test('5+ bedrooms require custom quote',()=>assert.equal(bookingPrice({...home,bedrooms:5}),null))
test('invalid services and input do not generate prices',()=>{for(const change of [{service:'Unknown'},{frequency:'Unknown'},{bedrooms:0},{bedrooms:2.5},{bathrooms:2.2},{quantities:[2,0,0,0,0,0]},{quantities:[0,0,0,0,51,0]},{quantities:[-1,0,0,0,0,0]},{quantities:[0,0,0,0,1.5,0]}])assert.equal(bookingPrice({...home,...change}),null)})
test('outside ZIP rejected',()=>assert.equal(coveredZips.includes('90210'),false))
test('standard has exact 14/12/14/10 checklist counts',()=>assert.deepEqual(Object.values(standardChecklist).map(v=>v.length),[14,12,14,10]))
test('unverified trust badges are disabled',()=>assert.deepEqual(brandConfig.trust,{insured:false,bonded:false,backgroundChecked:false,satisfactionGuarantee:true}))
