'use client'
import { Analytics } from '@vercel/analytics/next'
import { analyticsUrl } from '@/lib/analytics-policy'

export function SiteAnalytics() {
  if (process.env.NEXT_PUBLIC_KIYA_ANALYTICS_ENABLED !== 'true') return null
  return <Analytics debug={false} beforeSend={event => {
    if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return null
    const url = analyticsUrl(event.url)
    return url ? { ...event, url } : null
  }} />
}
