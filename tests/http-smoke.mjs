// Run after `pnpm build` and `pnpm start --port 3100`.
// Invalid input only: these cases terminate before authentication/database calls.
import assert from 'node:assert/strict'
const origin = 'http://localhost:3100'
const cases = [
  ['missing origin', {}, '{}', 403],
  ['malformed origin', { origin: 'broken' }, '{}', 403],
  ['cross origin', { origin: 'https://other.example' }, '{}', 403],
  ['scheme mismatch', { origin: 'https://localhost:3100' }, '{}', 403],
  ['invalid JSON', { origin }, '{', 400],
  ['unsupported type', { origin, 'content-type': 'text/plain' }, '{}', 415],
  ['oversized streamed bytes', { origin }, JSON.stringify('é'.repeat(8000)), 413],
  ['invalid quote schema', { origin }, '{}', 400],
]
for (const [name, headers, body, status] of cases) {
  const result = await fetch(`${origin}/api/quotes`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body })
  assert.equal(result.status, status, name)
  assert.equal(typeof (await result.json()).error, 'string', name)
  console.log(`PASS ${name}: ${status}`)
}
const home = await fetch(origin)
assert.equal(home.status,200)
const html = await home.text()
assert.match(html,/Kiya Clean/)
assert.doesNotMatch(html,/maximum-scale=1/)
assert.equal(home.headers.get('x-content-type-options'),'nosniff')
console.log('PASS production-mode home, zoom permission, security header')
console.log('9 HTTP smoke checks passed; no valid quote or database request submitted.')
