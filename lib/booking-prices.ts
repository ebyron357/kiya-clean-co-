export const pricingConfig = {
 currency:'USD', version:'2026-10-circle',
 policies:{changeNoticeHours:24,lateCancelFeeCents:5000,lockoutFeeCents:5000,recleanNoticeHours:24,walkthroughNoticeHours:48,maximumPauseWeeks:4},
 homeSizes:[{bedrooms:2,bathrooms:1},{bedrooms:3,bathrooms:2},{bedrooms:4,bathrooms:3}],
 minimumPricedBedrooms:2, customQuoteBedrooms:5,
 services:{
  standard:{name:'Standard Clean',slug:'standard-cleaning',bookingName:'Standard Cleaning',label:'Biweekly care',rates:[11900,14900,18900],extraFullBath:2000,extraHalfBath:1000,includedAddonIndexes:[] as readonly number[]},
  deep:{name:'Deep Clean',slug:'deep-cleaning',bookingName:'Deep Cleaning',label:'A complete reset',rates:[22900,27900,33900],extraFullBath:3000,extraHalfBath:1500,includedAddonIndexes:[3] as readonly number[]},
  move:{name:'Move-In / Move-Out',slug:'move-out-cleaning',bookingName:'Move-Out Cleaning',label:'Ready for your next chapter',rates:[26900,32900,39900],extraFullBath:3000,extraHalfBath:1500,includedAddonIndexes:[0,1,2,3,4] as readonly number[]},
 },
 frequencies:[{name:'Weekly',multiplier:.9},{name:'Every two weeks',multiplier:1},{name:'Monthly',multiplier:1.15},{name:'One-time',multiplier:1.25}],
 addons:[{name:'Inside fridge',cents:3500,unit:'',max:1},{name:'Inside oven',cents:3500,unit:'',max:1},{name:'Inside cabinets',cents:4000,unit:'',max:1},{name:'Baseboard detail',cents:4000,unit:'',max:1},{name:'Interior windows',cents:500,unit:'window',max:50},{name:'Laundry wash & fold',cents:2500,unit:'load',max:50}],
 circle:{capacity:50,rateLockMonths:12,minimumCleans:3,referralCreditCents:2500,firstDeepAddonIndexes:[0,1,2],monthlyAddonIndexes:[3,0,1],frequency:'Every two weeks',requiresCardOnFile:true},
} as const
export type ServiceKey=keyof typeof pricingConfig.services
export const addons=pricingConfig.addons
export const circleValueCents=pricingConfig.circle.firstDeepAddonIndexes.reduce<number>((sum,index)=>sum+addons[index].cents,0)
export const serviceAreaConfig={zips:['28107','28097','28025','28026','28027','28227'],prefixes:['282']} as const
export function isServedZip(zip:string){return /^\d{5}$/.test(zip)&&((serviceAreaConfig.zips as readonly string[]).includes(zip)||serviceAreaConfig.prefixes.some(prefix=>zip.startsWith(prefix)))}
export const coveredZips=[...serviceAreaConfig.zips,...Array.from({length:100},(_,i)=>`282${String(i).padStart(2,'0')}`)]
export function getServiceKey(name:string):ServiceKey|null {if(name==='Standard Cleaning'||name==='Recurring Cleaning'||name==='standard-cleaning')return 'standard';if(name==='Deep Cleaning'||name==='deep-cleaning')return 'deep';if(['Move-Out Cleaning','Move-In Cleaning','move-out-cleaning','move-in-out-cleaning'].includes(name))return 'move';return null}
export function bookingPrice(input:{service:string;bedrooms:number;bathrooms:number;frequency:string;circle:boolean;quantities:number[]}){
 const {service,bedrooms,bathrooms,frequency,circle,quantities}=input;const key=getServiceKey(service)
 if(!key||!Number.isInteger(bedrooms)||bedrooms<1||bedrooms>=pricingConfig.customQuoteBedrooms||!Number.isFinite(bathrooms)||bathrooms<1||bathrooms%0.5!==0||quantities.length!==addons.length||quantities.some((n,i)=>!Number.isInteger(n)||n<0||n>addons[i].max))return null
 const tier=pricingConfig.homeSizes.findIndex(h=>h.bedrooms===Math.max(pricingConfig.minimumPricedBedrooms,bedrooms));const spec=pricingConfig.services[key];const selectedFrequency=pricingConfig.frequencies.find(f=>f.name===frequency);if(tier<0||!selectedFrequency)return null
 const extraBaths=Math.max(0,bathrooms-pricingConfig.homeSizes[tier].bathrooms);const bathroomCents=Math.floor(extraBaths)*spec.extraFullBath+(extraBaths%1?spec.extraHalfBath:0)
 const baseCents=Math.round(((spec.rates[tier]+bathroomCents)*(key==='standard'?selectedFrequency.multiplier:1))/100)*100
 const circleApplied=circle&&key==='deep'&&frequency===pricingConfig.circle.frequency
 const included=spec.includedAddonIndexes
 const extrasCents=addons.reduce((sum,a,i)=>sum+(included.includes(i)?0:a.cents*(circleApplied&&(pricingConfig.circle.firstDeepAddonIndexes as readonly number[]).includes(i)?Math.max(1,quantities[i]):quantities[i])),0)
 const discountCents=circleApplied?circleValueCents:0
 return {baseCents,bathroomCents,discountCents,extrasCents,totalCents:baseCents+extrasCents-discountCents,circleApplied,currency:pricingConfig.currency,version:pricingConfig.version}
}
export function dollars(cents:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:pricingConfig.currency,maximumFractionDigits:0}).format(cents/100)}
