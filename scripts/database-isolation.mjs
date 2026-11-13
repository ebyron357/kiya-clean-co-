import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const environments = ['production', 'preview', 'development']
const allowed = ['environment', 'variable', 'projectRef', 'gitBranch']
const variables = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']

// Input is deliberately nonsecret. Never pass env dumps, keys, URLs or DSNs.
export function assessIsolation(observations) {
  if (!Array.isArray(observations) || observations.length > 1000) throw new Error('Expected a bounded nonsecret observation list.')
  for (const row of observations) {
    if (!row || typeof row !== 'object' || Array.isArray(row) || Object.keys(row).some(key => !allowed.includes(key)) ||
        !environments.includes(row.environment) || !variables.includes(row.variable) ||
        typeof row.projectRef !== 'string' || !/^[a-z0-9]{20}$/.test(row.projectRef) ||
        (row.gitBranch !== undefined && row.gitBranch !== null && (typeof row.gitBranch !== 'string' || row.gitBranch.length > 200))) {
      throw new Error('Invalid nonsecret observation. Do not supply credentials, URLs or connection strings.')
    }
    if (row.gitBranch && row.environment !== 'preview') throw new Error('Branch overrides must be preview-only.')
  }
  const findings = []
  const refs = new Map()
  for (const environment of environments) {
    const rows = observations.filter(row => row.environment === environment && !row.gitBranch)
    for (const variable of variables) {
      const matches = rows.filter(row => row.variable === variable)
      // NEXT_PUBLIC_SUPABASE_URL is authoritative for the inspected application;
      // SUPABASE_URL is an optional alias, not a required application setting.
      if (variable === 'NEXT_PUBLIC_SUPABASE_URL' && matches.length === 0) findings.push(`${environment}:missing_application_target`)
      if (matches.length > 1) findings.push(`${environment}:ambiguous_variable`)
    }
    const unique = new Set(rows.map(row => row.projectRef))
    if (unique.size > 1) findings.push(`${environment}:conflicting_url_aliases`)
    const app = rows.filter(row => row.variable === 'NEXT_PUBLIC_SUPABASE_URL')
    if (app.length === 1) refs.set(environment, app[0].projectRef)
  }
  for (const environment of ['preview', 'development']) {
    if (refs.has('production') && refs.get(environment) === refs.get('production')) findings.push(`${environment}:shares_production_target`)
  }
  // Evaluate each observed branch overlay, including inherited default aliases.
  for (const branch of new Set(observations.filter(row => row.gitBranch).map(row => row.gitBranch))) {
    const overlay = variables.flatMap(variable => {
      const overrides = observations.filter(row => row.environment === 'preview' && row.gitBranch === branch && row.variable === variable)
      if (overrides.length > 1) findings.push('preview_branch:ambiguous_variable')
      return overrides.length ? overrides : observations.filter(row => row.environment === 'preview' && !row.gitBranch && row.variable === variable)
    })
    if (new Set(overlay.map(row => row.projectRef)).size > 1) findings.push('preview_branch:conflicting_url_aliases')
    const app = overlay.filter(row => row.variable === 'NEXT_PUBLIC_SUPABASE_URL')
    if (app.length !== 1) findings.push('preview_branch:missing_or_ambiguous_application_target')
    if (app.some(row => row.projectRef === refs.get('production'))) findings.push('preview_branch:shares_production_target')
  }
  return {
    configurationIsolatedFromProduction: findings.length === 0,
    findings: [...new Set(findings)],
    // Distinct URL targets do not verify credential provenance, schema, deployed
    // snapshots, cross-user authorization, backup coverage or external effects.
    liveDatabaseVerified: false,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = assessIsolation(JSON.parse(readFileSync(0, 'utf8')))
    console.log(JSON.stringify(report, null, 2))
    if (!report.configurationIsolatedFromProduction) process.exitCode = 1
  } catch {
    // Do not echo input/parser errors: accidental secret-bearing input stays private.
    console.error('Invalid audit input. Supply only the documented nonsecret observation list.')
    process.exitCode = 2
  }
}
