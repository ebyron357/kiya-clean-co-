import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateQuote } from '../lib/pricing.ts'
const example={baseCents:10000,sizeAdjustmentCents:2000,extraCents:{oven:2500},recurringDiscountBps:1000,promotionCents:500,eligibleCreditCents:200,feeCents:300,taxBps:500}
test('unconfigured pricing never invents a price',()=>assert.deepEqual(calculateQuote(null,[]),{status:'unconfigured'}))
test('example-only integer-cent arithmetic applies adjustments discounts fees tax and credit',()=>assert.equal(calculateQuote(example,['oven']).totalCents,13293))
test('duplicate extras are rejected',()=>assert.throws(()=>calculateQuote(example,['oven','oven'])))
test('unknown extras are rejected',()=>assert.throws(()=>calculateQuote(example,['unknown'])))
test('negative rates are rejected',()=>assert.throws(()=>calculateQuote({...example,baseCents:-1},[])))
test('fractional cents are rejected',()=>assert.throws(()=>calculateQuote({...example,baseCents:100.5},[])))
test('discounts cannot exceed 100 percent',()=>assert.throws(()=>calculateQuote({...example,recurringDiscountBps:10001},[])))
test('credit never makes total negative',()=>assert.equal(calculateQuote({...example,eligibleCreditCents:1000000},[]).totalCents,0))
