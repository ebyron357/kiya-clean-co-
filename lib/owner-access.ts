export function isOwner(user: { app_metadata?: Record<string, unknown> } | null) {
  return user?.app_metadata?.role === 'admin'
}
