import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Kiya Clean Co.', short_name: 'Kiya Clean', description: 'Thoughtful home cleaning. Request a personalized quote.', start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#194c3b', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] }
}
