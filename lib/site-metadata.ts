import type { Metadata, MetadataRoute } from 'next'

export const siteName = 'Kiya Clean Co.'
export const homeTitle = `${siteName} | Home Cleaning`
export const homeDescription = 'Standard, deep, and move-in or move-out home cleaning from Kiya Clean Co. View services and request a free quote.'
export const siteOrigin = 'https://kiya-clean-co-development.vercel.app'

export function pageMetadata(title: string, description: string, path: '/' | '/privacy'): Metadata {
  const image = { url: '/images/home-interior.jpg', alt: 'A bright, welcoming home interior' }
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'en_US', siteName, title, description, url: path, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export function indexingMetadata(environment: string | undefined): Metadata['robots'] {
  const production = environment === 'production'
  return { index: production, follow: production }
}

export function crawlerRules(environment: string | undefined): MetadataRoute.Robots {
  if (environment !== 'production') return { rules: { userAgent: '*', disallow: '/' } }
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: `${siteOrigin}/sitemap.xml` }
}

export function publicSitemap(environment: string | undefined): MetadataRoute.Sitemap {
  if (environment !== 'production') return []
  return [{ url: `${siteOrigin}/` }, { url: `${siteOrigin}/privacy` }]
}
