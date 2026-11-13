import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Kiya Clean Co.', short_name: 'Kiya Clean', description: 'Home cleaning services. Request a free quote.', start_url: '/', display: 'standalone', background_color: '#fffcf7', theme_color: '#805035', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] }
}
