import { notFound,permanentRedirect } from 'next/navigation'
import { getServiceKey,pricingConfig } from '@/lib/booking-prices'
export function generateStaticParams(){return ['standard-cleaning','deep-cleaning','move-in-out-cleaning','recurring-cleaning'].map(slug=>({slug}))}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const key=getServiceKey(slug==='recurring-cleaning'?'standard-cleaning':slug);if(!key)notFound();permanentRedirect(`/${pricingConfig.services[key].slug}`)}
