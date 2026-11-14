import type { MetadataRoute } from 'next'
import { publicSitemap } from '@/lib/site-metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSitemap(process.env.VERCEL_ENV)
}
