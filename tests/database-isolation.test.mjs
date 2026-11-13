import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { assessIsolation } from '../scripts/database-isolation.mjs'
// Synthetic project references; not real provider resources.
const production = 'p'.repeat(20), preview = 'v'.repeat(20), development = 'd'.repeat(20)
function rows(refs = [production, preview, development]) {
  return ['production','preview','development'].flatMap((environment,i) => ['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_URL'].map(variable => ({environment,variable,projectRef:refs[i]})))
}
test('distinct configured database targets pass without claiming live verification', () => {
  assert.deepEqual(assessIsolation(rows()),{configurationIsolatedFromProduction:true,findings:[],liveDatabaseVerified:false})
})
test('shared production reference blocks both non-production environments', () => {
  const result=assessIsolation(rows([production,production,production]))
  assert.equal(result.configurationIsolatedFromProduction,false)
  assert.deepEqual(result.findings,['preview:shares_production_target','development:shares_production_target'])
})
test('empty observations fail closed', () => assert.equal(assessIsolation([]).configurationIsolatedFromProduction,false))
test('missing application URL cannot be hidden by the unused server alias', () => assert.ok(assessIsolation(rows().filter(r=>r.variable!=='NEXT_PUBLIC_SUPABASE_URL')).findings.includes('preview:missing_application_target')))
test('unused alias is optional', () => assert.equal(assessIsolation(rows().filter(r=>r.variable!=='SUPABASE_URL')).configurationIsolatedFromProduction,true))
test('conflicting aliases fail closed', () => {
  const data=rows();data[3].projectRef=production
  assert.ok(assessIsolation(data).findings.includes('preview:conflicting_url_aliases'))
})
test('duplicate application observations fail closed', () => assert.equal(assessIsolation([...rows(),rows()[0]]).configurationIsolatedFromProduction,false))
test('branch override cannot silently reintroduce production', () => {
  const data=[...rows(),{environment:'preview',variable:'NEXT_PUBLIC_SUPABASE_URL',projectRef:production,gitBranch:'test'}]
  assert.ok(assessIsolation(data).findings.includes('preview_branch:shares_production_target'))
  assert.ok(assessIsolation(data).findings.includes('preview_branch:conflicting_url_aliases'))
})
test('isolating one preview branch does not fix an unsafe default', () => {
  const data=[...rows([production,production,development]),...rows().filter(r=>r.environment==='preview').map(r=>({...r,gitBranch:'safe'}))]
  assert.ok(assessIsolation(data).findings.includes('preview:shares_production_target'))
})
test('matching isolated branch overrides are accepted', () => {
  const data=[...rows(),...rows().filter(r=>r.environment==='preview').map(r=>({...r,gitBranch:'safe'}))]
  assert.equal(assessIsolation(data).configurationIsolatedFromProduction,true)
})
test('branch-specific production observations are rejected', () => assert.throws(()=>assessIsolation([{...rows()[0],gitBranch:'bad'}])))
test('raw credentials and URLs are not accepted or echoed', () => {
  for(const value of [[{...rows()[0],secret:'SYNTHETIC-DO-NOT-ECHO'}],[{...rows()[0],projectRef:'https://user:SYNTHETIC-DO-NOT-ECHO@host'}]]) {
    assert.throws(()=>assessIsolation(value),error=>!error.message.includes('SYNTHETIC-DO-NOT-ECHO'))
  }
})
test('CLI errors never include raw malformed input', () => {
  const script=fileURLToPath(new URL('../scripts/database-isolation.mjs',import.meta.url))
  const result=spawnSync(process.execPath,[script],{input:'SYNTHETIC-DO-NOT-ECHO',encoding:'utf8'})
  assert.equal(result.status,2);assert.doesNotMatch(result.stdout+result.stderr,/SYNTHETIC-DO-NOT-ECHO/)
})
test('CLI unsafe configuration exits nonzero', () => {
  const script=fileURLToPath(new URL('../scripts/database-isolation.mjs',import.meta.url))
  const result=spawnSync(process.execPath,[script],{input:JSON.stringify(rows([production,production,production])),encoding:'utf8'})
  assert.equal(result.status,1);assert.equal(JSON.parse(result.stdout).configurationIsolatedFromProduction,false)
})
