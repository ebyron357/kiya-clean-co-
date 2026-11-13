import { z } from 'zod'

const configSchema = z.object({
  mode: z.literal('sandbox'),
  apiKey: z.string().min(1),
  from: z.email(),
  testRecipient: z.email(),
})
export type NotificationConfig = z.infer<typeof configSchema>
export type NotificationResult = 'disabled' | 'accepted' | 'failed'

// Sandbox only: never send to a submitted customer address, and never include
// customer names, notes, ZIPs, or other PII in a test email. No live activation
// until durable outbox/retry and database isolation are independently verified.
export async function sendQuoteNotifications(
  submissionId: string,
  rawConfig: unknown,
  send: typeof fetch = fetch,
): Promise<NotificationResult> {
  const config = configSchema.safeParse(rawConfig)
  if (!config.success || !z.uuid().safeParse(submissionId).success) return 'disabled'
  const { apiKey, from, testRecipient } = config.data
  try {
    for (const audience of ['customer', 'owner'] as const) {
      const response = await send('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `kiya-quote/${submissionId}/${audience}`,
        },
        body: JSON.stringify({
          from, to: [testRecipient],
          subject: `[SANDBOX] Kiya quote ${audience === 'customer' ? 'request received' : 'owner alert'}`,
          text: audience === 'customer'
            ? `Your quote request has been saved. Reference: ${submissionId}. This is not a booking or payment confirmation. Coverage, price and availability must be confirmed separately.`
            : `A quote request was saved. Reference: ${submissionId}. Sign in to the owner workspace at /admin to review it. No booking or payment was created.`,
        }),
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      })
      if (!response.ok) return 'failed'
      const result: unknown = await response.json()
      if (!result || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'string' || !result.id) return 'failed'
    }
    return 'accepted' // Provider acceptance is not delivery proof.
  } catch { return 'failed' }
}
