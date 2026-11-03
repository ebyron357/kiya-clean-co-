'use client'
import { KiyaArch } from './kiya-mark'
export function MemberCard({capacity}:{capacity:number}) {
 return <div className="member-card-wrap"><div className="member-card" onPointerMove={event=>{
  if(event.pointerType!=='mouse'||!window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches)return;
  const box=event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.transform=`rotateX(${(0.5-(event.clientY-box.top)/box.height)*6}deg) rotateY(${((event.clientX-box.left)/box.width-0.5)*6}deg)`;
 }} onPointerLeave={event=>{event.currentTarget.style.transform=''}}>
 <div className="member-card-top"><span>KIYA CIRCLE</span><KiyaArch size={48}/></div><p className="member-number font-serif">No. __ <span>of {capacity}</span></p><span className="member-card-label">YOUR HOME, BEAUTIFULLY CARED FOR</span>
 </div></div>
}
