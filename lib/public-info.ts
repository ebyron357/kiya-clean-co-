'use client'
import useSWR from 'swr'
export async function fetchJson<T>(url:string):Promise<T>{const r=await fetch(url);const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to load data.');return data}
export type PublicInfo={limit:number;active:number;pending:number;remaining:number;available:number;trust:Record<string,boolean>;reviewLink:string|null;reviews:{id:string;display_name:string;quote:string;rating:number}[]}
export function usePublicInfo(){return useSWR<PublicInfo>('/api/public-info',fetchJson,{refreshInterval:30000,revalidateOnFocus:true})}
