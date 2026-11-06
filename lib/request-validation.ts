export class RequestError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Compare complete origins (including scheme), not just host names. The request
// URL is the trusted target; do not authorize a client-supplied forwarded host.
export async function readJsonRequest(request: Request, maxBytes = 16000): Promise<unknown> {
  let sameOrigin = false
  try {
    const origin = request.headers.get('origin')
    sameOrigin = !!origin && new URL(origin).origin === new URL(request.url).origin
  } catch { /* Malformed origins fail closed. */ }
  if (!sameOrigin) throw new RequestError('Request origin not allowed.', 403)
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RequestError('Send a JSON request.', 415)
  }
  const length = request.headers.get('content-length')
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    throw new RequestError('Request is too large.', 413)
  }
  // Enforce the byte limit while reading, including chunked and multibyte bodies.
  const reader = request.body?.getReader()
  if (!reader) throw new RequestError('Invalid JSON request.', 400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new RequestError('Request is too large.', 413)
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) }
  catch { throw new RequestError('Invalid JSON request.', 400) }
}
