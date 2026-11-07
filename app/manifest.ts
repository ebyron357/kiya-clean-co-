import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kiya Clean Co.',
    short_name: 'Kiya Clean',
    description: 'Residential cleaning services. Request quotes for standard, deep, move-related, or recurring cleaning.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff9f5',
    theme_color: '#4b205b',
  }
}
