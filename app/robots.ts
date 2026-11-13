import type { MetadataRoute } from 'next'
import { crawlerRules } from '@/lib/site-metadata'

export default function robots(): MetadataRoute.Robots {
  return crawlerRules(process.env.VERCEL_ENV)
}
