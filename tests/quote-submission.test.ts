import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quoteSchema } from '../lib/quote-schema'
import { prepareQuoteSubmission, sendQuote, TIMEOUT_MESSAGE, UNCONFIRMED_MESSAGE } from '../lib/quote-submission'

const input = quoteSchema.parse({ submissionId: '123e4567-e89b-42d3-a456-426614174000', name: 'Test Customer', email: 'test@example.com', phone: '', zip: '28202', service: 'deep', frequency: 'once', bedrooms: '2', notes: '', consent: true, website: '' })

test('unchanged retries reuse the same submission and identifier', () => {
  const first = prepareQuoteSubmission(input, null)
  const retry = prepareQuoteSubmission({ ...input, submissionId: crypto.randomUUID() }, first)
  assert.equal(retry, first)
  assert.equal(retry.submissionId, input.submissionId)
})

test('edited requests receive a new identifier without mutating the earlier request', () => {
  const first = prepareQuoteSubmission(input, null)
  const edited = prepareQuoteSubmission({ ...input, service: 'move' }, first)
  assert.notEqual(edited.submissionId, first.submissionId)
  assert.equal(edited.service, 'move')
  assert.equal(first.service, 'deep')
})

test('only an explicit successful acknowledgment confirms the request', async () => {
  await sendQuote(input, { fetcher: async (url, options) => {
    assert.equal(url, '/api/quotes')
    assert.equal(options?.method, 'POST')
    assert.equal(JSON.parse(String(options?.body)).submissionId, input.submissionId)
    assert.ok(options?.signal)
    return Response.json({ success: true }, { status: 201 })
  } })
  for (const response of [Response.json({}), Response.json({ success: false }), Response.json(null), new Response('<html>Gateway error</html>')]) {
    await assert.rejects(sendQuote(input, { fetcher: async () => response }), { message: UNCONFIRMED_MESSAGE })
  }
})

test('network and server failures do not leak technical error messages', async () => {
  await assert.rejects(sendQuote(input, { fetcher: async () => { throw new TypeError('Failed to fetch') } }), { message: UNCONFIRMED_MESSAGE })
  await assert.rejects(sendQuote(input, { fetcher: async () => new Response('Internal details', { status: 503 }) }), { message: UNCONFIRMED_MESSAGE })
})

test('rejected and rate-limited requests give actionable feedback', async () => {
  await assert.rejects(sendQuote(input, { fetcher: async () => Response.json({ success: true }, { status: 400 }) }), /Check your details and consent/)
  await assert.rejects(sendQuote(input, { fetcher: async () => new Response('', { status: 429 }) }), /try again in an hour/)
})

test('a stalled request is aborted and can be retried with the same identifier', async () => {
  await assert.rejects(sendQuote(input, { timeoutMs: 5, fetcher: async (_url, options) => new Promise<Response>((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  }) }), { message: TIMEOUT_MESSAGE })
  const retry = prepareQuoteSubmission(input, input)
  assert.equal(retry.submissionId, input.submissionId)
  await sendQuote(retry, { fetcher: async () => Response.json({ success: true }, { status: 201 }) })
})
