import test from 'node:test'
import assert from 'node:assert/strict'
import { readJsonRequest } from '../lib/request-validation.ts'
const target = 'https://preview.example/api/quotes'
function request(body = '{}', headers = {}) {
  return new Request(target, { method: 'POST', headers: { origin: 'https://preview.example', 'content-type': 'application/json', ...headers }, body })
}
async function rejected(r, status, max) {
  await assert.rejects(() => readJsonRequest(r, max), e => e.status === status)
}
test('accepts same-origin JSON with charset', async () => assert.deepEqual(await readJsonRequest(request('{"ok":true}', {'content-type':'application/json; charset=utf-8'})), {ok:true}))
test('missing origin fails closed', async () => { const r = request(); r.headers.delete('origin'); await rejected(r,403) })
test('malformed origin is rejected without throwing outside the handler', async () => rejected(request('{}',{origin:'not a URL'}),403))
test('cross-origin requests are rejected', async () => rejected(request('{}',{origin:'https://other.example'}),403))
test('insecure scheme cannot match a secure origin', async () => rejected(request('{}',{origin:'http://preview.example'}),403))
test('forwarded host cannot authorize an attacker origin', async () => rejected(request('{}',{origin:'https://other.example','x-forwarded-host':'other.example'}),403))
test('non-JSON content type is rejected', async () => rejected(request('{}',{'content-type':'text/plain'}),415))
test('invalid JSON is a client error, not a database failure', async () => rejected(request('{'),400))
test('declared oversized body is rejected', async () => rejected(request('{}',{'content-length':'16001'}),413))
test('negative content length is rejected', async () => rejected(request('{}',{'content-length':'-1'}),413))
test('undeclared oversized body is rejected', async () => rejected(request(JSON.stringify('x'.repeat(16000))),413))
test('limits UTF-8 bytes rather than JS string length', async () => rejected(request(JSON.stringify('é'.repeat(8000))),413))
test('exact size limit is accepted', async () => assert.equal(await readJsonRequest(request('"123"'),5),'123'))
test('stream is canceled when a chunk exceeds the limit', async () => {
  let canceled = false
  const body = new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(16))},cancel(){canceled=true}})
  const r = new Request(target,{method:'POST',headers:{origin:'https://preview.example','content-type':'application/json'},body,duplex:'half'})
  await rejected(r,413,8)
  assert.equal(canceled,true)
})
