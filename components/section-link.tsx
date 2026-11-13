'use client'

import type { ComponentProps, MouseEvent } from 'react'
import { sectionHref } from '@/lib/quote-flow'

type Props = ComponentProps<'a'> & { href: string }

export function SectionLink({ href, onClick, children, ...props }: Props) {
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.currentTarget.hasAttribute('download') || (props.target && props.target !== '_self')) return
    const nextHref = sectionHref(window.location.href, href)
    if (!nextHref) return
    const destination = new URL(nextHref, window.location.href)
    const section = document.getElementById(destination.hash.slice(1))
    const form = document.querySelector<HTMLFormElement>('#quote form')
    if (!section || (new URL(href, window.location.href).searchParams.has('service') && form?.dataset.ready !== 'true')) return

    event.preventDefault()
    const changingService = destination.searchParams.get('service') !== new URL(window.location.href).searchParams.get('service')
    if (!(changingService && form?.getAttribute('aria-busy') === 'true') && destination.href !== window.location.href) {
      window.history.pushState(null, '', nextHref)
    }
    requestAnimationFrame(() => {
      const focusTarget = section.querySelector<HTMLElement>(section.id === 'quote' ? '.quote-card h3' : 'h2')
      if (focusTarget) {
        focusTarget.tabIndex = -1
        focusTarget.focus({ preventScroll: true })
      }
      const scrollTarget = section.id === 'quote' ? section.querySelector('form, .quote-success') ?? section : section
      scrollTarget.scrollIntoView({ block: 'start' })
    })
  }

  return <a {...props} href={href} onClick={navigate}>{children}</a>
}
