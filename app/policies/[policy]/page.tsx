import { notFound, permanentRedirect } from 'next/navigation'
export default async function Policy({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params
  if (policy === 'terms') permanentRedirect('/terms')
  if (policy === 'privacy') permanentRedirect('/privacy')
  if (policy === 'cancellation') permanentRedirect('/policies')
  notFound()
}
