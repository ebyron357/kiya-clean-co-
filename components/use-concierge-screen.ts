'use client'
import { useSyncExternalStore } from 'react'
function subscribe(onChange:()=>void){const media=window.matchMedia('(max-width: 767px)');media.addEventListener('change',onChange);return()=>media.removeEventListener('change',onChange)}
export function useConciergeScreen(){return useSyncExternalStore(subscribe,()=>window.matchMedia('(max-width: 767px)').matches,()=>false)}
