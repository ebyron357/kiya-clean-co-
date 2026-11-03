import type { SVGProps } from 'react'

type MarkName = 'arch' | 'towel' | 'key' | 'calendar' | 'roof' | 'leaf' | 'pin' | 'phone' | 'envelope' | 'arrow' | 'menu' | 'close' | 'chevron'
type MarkProps = Omit<SVGProps<SVGSVGElement>, 'name'> & { size?: number; title?: string }
const drawings: Record<MarkName, string> = {
  arch: 'M5.2 21V10.1C5.2 1.5 18.8 1.1 18.8 10.1V21M3 21h18M8.4 21V10.5C8.4 5.5 15.6 5.5 15.6 10.5V21M13.4 14.6h.2',
  towel: 'M4 5.1l16-.2V20H4.2L4 5.1ZM4.1 14.2l7.4 5.6M4.1 14.2l7.5.2-.1 5.4M7 8.3l10-.2M7 10.8l8.4-.1',
  key: 'M10.5 8.3c0 5.5-7.6 5.4-7.5.1.1-5.4 7.5-5.3 7.5-.1ZM9.4 11.2l10.9 9M15.2 16l2.2-2.5M18.2 18.4l2.1-2.3',
  calendar: 'M4 6.5l16-.3.2 14.3H4V6.5ZM7.4 3v5M16.5 3.1v4.8M4.2 10.5l15.6-.2M8 14.3h1M13.5 14.2h2M8 17.6h5',
  roof: 'M2.5 11.2L12 3.5l9.5 7.4M5 9.4v11h14V9.3M9.6 20.3v-7h4.9v7',
  leaf: 'M5.3 18.8C1.1 10.6 7.4 4.7 20 3.2c-.8 12.6-6.3 18.6-14.7 15.6ZM3.5 21L16.2 7.5M8.3 15.5l-.7-5.3M12.1 11.7l4.3.5',
  pin: 'M5 10.1c-.2-9.2 14.1-9.5 14-.1 0 5.3-7 11-7 11s-6.9-5.5-7-10.9ZM13.4 10.2c0 1.8-2.8 1.8-2.8 0s2.8-1.9 2.8 0Z',
  phone: 'M7.5 3.2l3 5-2.2 2.4c1.5 2.6 3.1 4.2 5.7 5.6l2.4-2.1 4.5 3.1c-1 6.6-6 3.6-11.4-.7C4.2 12.2.5 7.3 7.5 3.2Z',
  envelope: 'M3.2 5.5l17.5-.2.1 13.3-17.6-.1V5.5ZM3.5 6l8.4 7.1L20.4 6M3.5 18.1l5.6-6.8M20.5 18.2l-5.7-6.9',
  arrow: 'M2 12.2l19-.4M16.3 7.4l4.9 4.4-4.7 4.7M2.1 10l-.2 4.3',
  menu: 'M4 7.5l16-.3M4 16.5l16 .2',
  close: 'M5 5l14 14M19 5L5 19',
  chevron: 'M6 9l6 6 6-6',
}

export function KiyaMark({ name, size = 24, title, className = '', ...props }: MarkProps & { name: MarkName }) {
  return <svg {...props} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" className={`kiya-mark kiya-mark--${name} ${className}`} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} aria-label={title} focusable="false">{title && <title>{title}</title>}<path d={drawings[name]} vectorEffect="non-scaling-stroke"/></svg>
}
export const KiyaArch = (props: MarkProps) => <KiyaMark name="arch" {...props}/>
export const KiyaTowel = (props: MarkProps) => <KiyaMark name="towel" {...props}/>
export const KiyaKey = (props: MarkProps) => <KiyaMark name="key" {...props}/>
export const KiyaCalendar = (props: MarkProps) => <KiyaMark name="calendar" {...props}/>
export const KiyaRoof = (props: MarkProps) => <KiyaMark name="roof" {...props}/>
export const KiyaLeaf = (props: MarkProps) => <KiyaMark name="leaf" {...props}/>
export const KiyaPin = (props: MarkProps) => <KiyaMark name="pin" {...props}/>
export const KiyaPhone = (props: MarkProps) => <KiyaMark name="phone" {...props}/>
export const KiyaEnvelope = (props: MarkProps) => <KiyaMark name="envelope" {...props}/>
export const KiyaArrow = (props: MarkProps) => <KiyaMark name="arrow" {...props}/>
export const KiyaMenu = (props: MarkProps) => <KiyaMark name="menu" {...props}/>
export const KiyaClose = (props: MarkProps) => <KiyaMark name="close" {...props}/>
export const KiyaChevron = (props: MarkProps) => <KiyaMark name="chevron" {...props}/>
export function KiyaRule({ className = '' }: MarkProps) { return <span className={`kiya-rule ${className}`} aria-hidden="true"/> }
