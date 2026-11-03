import Image from 'next/image'

export function ArchImage({ src, alt = '' }: { src: string; alt?: string }) {
  return <div className="editorial-arch"><Image src={src} alt={alt} fill sizes="(max-width: 767px) 90vw, 35vw"/></div>
}
