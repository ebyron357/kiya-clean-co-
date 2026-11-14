import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crawlerRules, homeDescription, homeTitle, indexingMetadata, pageMetadata, publicSitemap, siteOrigin } from '../lib/site-metadata'

test('home metadata consolidates query variants at the homepage canonical', () => {
  const metadata = pageMetadata(homeTitle, homeDescription, '/')
  assert.equal(metadata.alternates?.canonical, '/')
  assert.equal(metadata.title, homeTitle)
  assert.equal(metadata.description, homeDescription)
  assert.equal(metadata.openGraph?.url, '/')
  assert.equal(metadata.twitter?.title, homeTitle)
  assert.deepEqual(metadata.openGraph?.images, [{ url: '/images/home-interior.jpg', alt: 'A bright, welcoming home interior' }])
})

test('privacy has a distinct canonical and matching sharing details', () => {
  const metadata = pageMetadata('Privacy', 'How quote details are handled.', '/privacy')
  assert.equal(metadata.alternates?.canonical, '/privacy')
  assert.equal(metadata.openGraph?.url, '/privacy')
  assert.equal(metadata.openGraph?.description, metadata.description)
  assert.equal(metadata.twitter?.description, metadata.description)
})

test('non-production environments discourage indexing and publish no sitemap entries', () => {
  for (const environment of ['preview', 'development', undefined]) {
    assert.deepEqual(indexingMetadata(environment), { index: false, follow: false })
    assert.deepEqual(crawlerRules(environment), { rules: { userAgent: '*', disallow: '/' } })
    assert.deepEqual(publicSitemap(environment), [])
  }
})

test('production exposes only public pages on the verified canonical domain', () => {
  assert.deepEqual(indexingMetadata('production'), { index: true, follow: true })
  assert.deepEqual(crawlerRules('production'), { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: `${siteOrigin}/sitemap.xml` })
  assert.deepEqual(publicSitemap('production'), [{ url: `${siteOrigin}/` }, { url: `${siteOrigin}/privacy` }])
  for (const entry of publicSitemap('production')) {
    const url = new URL(entry.url)
    assert.equal(url.protocol, 'https:')
    assert.equal(url.search, '')
    assert.equal(url.hash, '')
    assert.ok(!url.pathname.startsWith('/api/'))
  }
})
