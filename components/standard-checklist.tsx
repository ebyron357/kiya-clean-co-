import { standardChecklist } from '@/lib/service-content'
import { KiyaRule } from './kiya-mark'
export function StandardChecklist(){
 const count=Object.values(standardChecklist).reduce((sum,items)=>sum+items.length,0)
 return <div className="standard-checklist"><p className="standard-count font-serif">{count} points. <em>Every visit.</em></p><div className="standard-grid">{Object.entries(standardChecklist).map(([room,items])=><section key={room}><h3 className="font-serif">{room}</h3><p className="eyebrow">{items.length} thoughtful details</p><ul className="check-list">{items.map(item=><li key={item}><KiyaRule/>{item}</li>)}</ul></section>)}</div></div>
}
