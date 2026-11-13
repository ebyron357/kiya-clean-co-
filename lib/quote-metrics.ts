'use client'
import { track } from '@vercel/analytics'
import { quoteMetric, type QuoteMetric } from './analytics-policy'

export function trackQuote(event: QuoteMetric, step: number) {
  if (process.env.NEXT_PUBLIC_KIYA_ANALYTICS_ENABLED !== 'true') return
  if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return
  const metric = quoteMetric(event, step)
  if (metric) {
    try { track(metric.name, metric.properties) } catch { /* Metrics never block a quote. */ }
  }
}
