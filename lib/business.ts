import 'server-only'
import { parseBusinessProfile } from './business-profile'
export function businessProfile() { return parseBusinessProfile(process.env.KIYA_BUSINESS_PROFILE) }
