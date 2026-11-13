export type PricingRules={baseCents:number;sizeAdjustmentCents:number;extraCents:Record<string,number>;recurringDiscountBps:number;promotionCents:number;eligibleCreditCents:number;feeCents:number;taxBps:number}
function integer(value:number,max=100000000){if(!Number.isSafeInteger(value)||value<0||value>max)throw new Error('Invalid pricing configuration');return value}
function percentage(cents:number,bps:number){return Number((BigInt(cents)*BigInt(integer(bps,10000))+BigInt(5000))/BigInt(10000))}
export function calculateQuote(rules:PricingRules|null,extras:string[]){
 if(!rules)return {status:'unconfigured' as const}
 Object.entries(rules).forEach(([key,value])=>{if(key!=='extraCents')integer(value as number,key.endsWith('Bps')?10000:100000000)})
 if(new Set(extras).size!==extras.length)throw new Error('Duplicate extras')
 const extrasCents=extras.reduce((total,key)=>{if(!Object.hasOwn(rules.extraCents,key))throw new Error('Unknown extra');return integer(total+integer(rules.extraCents[key]))},0)
 const subtotal=integer(rules.baseCents+rules.sizeAdjustmentCents+extrasCents)
 const recurringDiscount=percentage(subtotal,rules.recurringDiscountBps)
 const promotion=Math.min(rules.promotionCents,subtotal-recurringDiscount)
 const taxable=integer(subtotal-recurringDiscount-promotion+rules.feeCents)
 const tax=percentage(taxable,rules.taxBps)
 const credit=Math.min(rules.eligibleCreditCents,taxable+tax)
 return {status:'estimate' as const,baseCents:rules.baseCents,sizeAdjustmentCents:rules.sizeAdjustmentCents,extrasCents,recurringDiscountCents:recurringDiscount,promotionCents:promotion,creditCents:credit,feeCents:rules.feeCents,taxCents:tax,totalCents:integer(taxable+tax-credit)}
}
