import { businessProfile } from '@/lib/business'

export function BusinessDetails() {
  const profile = businessProfile()
  if (!profile) return <p className="muted">Verified business contact details and response times are awaiting owner approval. No response time is promised yet.</p>
  return <dl className="lead-details">
    {profile.email && <div><dt>Email</dt><dd><a className="text-link" href={`mailto:${profile.email}`}>{profile.email}</a></dd></div>}
    {profile.phone && <div><dt>Phone</dt><dd><a className="text-link" href={`tel:${profile.phone.replace(/[^+0-9]/g, '')}`}>{profile.phone}</a></dd></div>}
    {profile.areaLabel && <div><dt>Service area</dt><dd>{profile.areaLabel}</dd></div>}
    {!!profile.serviceZips.length && <div><dt>Service ZIP codes</dt><dd>{profile.serviceZips.join(', ')}</dd></div>}
    {profile.responseTime && <div><dt>Expected response</dt><dd>{profile.responseTime}</dd></div>}
  </dl>
}
