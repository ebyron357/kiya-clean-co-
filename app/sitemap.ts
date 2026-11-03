import type { MetadataRoute } from 'next'
import { towns } from '@/lib/towns'
import { pricingConfig } from '@/lib/booking-prices'
export default function sitemap():MetadataRoute.Sitemap{return ['','about','pricing','services','service-areas','quote','careers','policies','contact','rewards','refer-a-friend','offers','privacy','terms',...towns.map(t=>t.slug),'book','the-kiya-standard','kiya-circle','realtors',...Object.values(pricingConfig.services).map(s=>s.slug)].map(path=>({url:`https://kiyacleaning.com/${path}`}))}
