import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Browser-level safety rail. The local server also has only inert test config.
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return route.abort()
    return route.continue()
  })
})

test('homepage imagery, zoom and responsive width', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('House cleaning')
  await expect(page.locator('.hero-photo img')).toBeVisible()
  expect(await page.locator('.hero-photo img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  expect(await page.locator('meta[name=viewport]').getAttribute('content')).not.toContain('maximum-scale=1')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('public copy removes template markers and accurately describes ZIP entry', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('meta[name=generator]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Administration' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Rewards' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Your five-digit ZIP code' }).fill('28227')
  await page.getByRole('button', { name: 'Continue to quote' }).click()
  await expect(page).toHaveURL(url => url.pathname === '/quote' && url.searchParams.get('zip') === '28227')
})

test('mobile navigation Escape restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0)
})

test('recovery is visibly gated and direct reset cannot bypass gate', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByRole('link', { name: 'Forgot your password?' }).click()
  await expect(page.getByText('Account recovery is not enabled yet.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Request recovery link' })).toBeDisabled()
  await page.goto('/auth/reset-password')
  await expect(page).toHaveURL(/\/auth\/forgot-password$/)
})

test('signed-out private routes do not expose account or owner records', async ({ page }) => {
  for (const path of ['/account', '/account/quotes/00000000-0000-4000-8000-000000000001', '/admin', '/admin/quotes/00000000-0000-4000-8000-000000000001']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/auth\/login$/)
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  }
})

test('quote preference flows into mocked persistence request, never a booking', async ({ page }) => {
  let captured: Record<string, unknown> | undefined
  await page.route('**/api/quotes', async route => {
    captured = route.request().postDataJSON()
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  })
  await page.goto('/quote')
  const advance = () => page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('textbox', { name: 'ZIP code' }).fill('123')
  await advance()
  await expect(page.getByText('Enter a five-digit ZIP code')).toBeVisible()
  await page.getByRole('textbox', { name: 'ZIP code' }).fill('28227')
  await advance()
  await page.getByRole('radio', { name: 'Deep Cleaning', exact: true }).check()
  await advance()
  await advance()
  await page.getByRole('checkbox', { name: 'Oven cleaning' }).check()
  await advance()
  await page.getByRole('radio', { name: 'Every two weeks' }).check()
  await page.getByLabel('Preferred cleaning date (optional)').fill('2099-03-01')
  await advance()
  await expect(page.getByText('2099-03-01', { exact: true })).toBeVisible()
  await expect(page.getByText('Pricing and scheduling will be confirmed separately.', { exact: false })).toBeVisible()
  await page.getByRole('textbox', { name: 'Your name' }).fill('Synthetic QA')
  await page.getByRole('textbox', { name: 'Email address' }).fill('synthetic@example.test')
  await page.getByRole('checkbox', { name: 'I agree that Kiya' }).check()
  await page.getByRole('button', { name: 'Send my request' }).click()
  await expect(page.getByRole('heading', { name: 'Quote request received.' })).toBeVisible()
  expect(captured).toMatchObject({ preferredDate: '2099-03-01', service: 'Deep Cleaning', frequency: 'Every two weeks', extras: ['Oven cleaning'] })
  expect(captured).not.toHaveProperty('totalCents')
  expect(captured).not.toHaveProperty('status', 'confirmed')
})

test('quote server module rejects invalid requests before any persistence', async ({ request }) => {
  const origin = 'http://localhost:3107'
  const missingOrigin = await request.post('/api/quotes', { data: {} })
  expect(missingOrigin.status()).toBe(403)
  const invalidQuote = await request.post('/api/quotes', { headers: { origin }, data: {} })
  expect(invalidQuote.status()).toBe(400)
  const malformed = await request.post('/api/quotes', { headers: { origin, 'content-type': 'application/json' }, data: '{' })
  expect(malformed.status()).toBe(400)
  const tooLarge = await request.post('/api/quotes', { headers: { origin, 'content-type': 'application/json' }, data: JSON.stringify('é'.repeat(8000)) })
  expect(tooLarge.status()).toBe(413)
})
