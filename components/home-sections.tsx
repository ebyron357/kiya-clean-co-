import Image from 'next/image'
import { ArrowRight, ArrowUpRight, Check, Clock3, House, Leaf, Sparkles, KeyRound, HeartHandshake, SlidersHorizontal, Plus } from 'lucide-react'

export function Hero() {
  return <><section className="container hero" aria-labelledby="hero-title">
    <div className="hero-copy"><span className="eyebrow"><span className="small-line"/> A CLEAN HOME. A CLEAR MIND.</span><h1 id="hero-title">A fresh home.<br/>A little more <span className="word-life">life.</span></h1><p>Less time cleaning. More time for you.<br className="desktop-break"/> Thoughtful home cleaning that makes room for what matters.</p><div className="hero-actions"><a className="button button-primary" href="#quote">Find your fresh start <ArrowUpRight size={19}/></a><a className="text-link" href="#services">Explore our services <ArrowRight size={17}/></a></div><div className="hero-note"><Check size={16}/> Personalized quotes. No obligation.</div></div>
    <div className="hero-visual"><Image src="/images/fresh-home.png" alt="An airy, sunlit living room with a linen sofa, oak coffee table, and fresh greenery" fill priority sizes="(max-width: 767px) 100vw, 52vw"/><div className="image-note"><span className="note-icon"><Sparkles size={20}/></span><span>A little care. A whole new feeling.<small>Make yourself at home.</small></span></div></div>
  </section><div className="promise-strip"><div className="container promise-inner"><span><House/>A clean for every kind of home</span><span><SlidersHorizontal/>Personalized to your space</span><span><HeartHandshake/>Care in the little details</span></div></div></>
}

const services = [
  { id: 'standard', icon: House, name: 'Standard cleaning', label: 'YOUR EVERYDAY RESET', text: 'Keep the everyday mess from getting in the way of a home you love.', items: ['Kitchen & bathroom surfaces', 'Dusting, vacuuming & mopping', 'A refresh for your living spaces'] },
  { id: 'deep', icon: Sparkles, name: 'Deep cleaning', label: 'A LITTLE EXTRA ATTENTION', text: 'A more detailed clean for the corners that need a little extra care.', items: ['Everything in a standard clean', 'Detailed attention to buildup', 'Baseboards & often-missed areas'] },
  { id: 'move', icon: KeyRound, name: 'Move-in / move-out', label: 'NEW CHAPTER. CLEAN SLATE.', text: 'Leave the old place refreshed. Make the new one feel like yours.', items: ['Cleaning for an empty home', 'Inside cabinets & drawers', 'Kitchen, bathrooms & floors'] },
]
export function Services() {
  return <section className="container section" id="services"><div className="section-heading"><div><span className="eyebrow">A CLEAN THAT FITS YOUR LIFE</span><h2>Your home. Your kind of clean.</h2></div><p>From the everyday reset to a brand-new beginning,<br className="desktop-break"/> there&apos;s a fresh start for every space.</p></div><div className="service-grid">{services.map(({id, icon: Icon, name, label, text, items}) => <article className="service-card" key={id}><div className="service-top"><Icon size={28} strokeWidth={1.4}/><span className="service-tag">{label}</span></div><h3>{name}</h3><p>{text}</p><ul>{items.map(item => <li key={item}><Check size={16}/>{item}</li>)}</ul><a className="service-link" href={`?service=${id}#quote`}>Get a personalized quote<ArrowUpRight size={19}/></a></article>)}</div><p className="section-footnote">Every home is different. Your final cleaning checklist and price are confirmed before booking.</p></section>
}
export function Difference() {
  return <section className="difference" id="our-difference"><div className="container difference-inner"><div><span className="eyebrow">THE KIYA DIFFERENCE</span><h2>It&apos;s more than clean.<br/>It&apos;s feeling cared for.</h2><p>Home is where life happens. We believe taking care of it should feel simple, personal, and a little less like another thing on your list.</p><a className="text-link" href="#quote">Let&apos;s talk about your home <ArrowUpRight size={18}/></a></div><div className="difference-list"><div><HeartHandshake/><section><h3>Your home, respected.</h3><p>Share your priorities, preferences, and the little things that make your space yours.</p></section></div><div><SlidersHorizontal/><section><h3>No one-size-fits-all clean.</h3><p>A quote based on your home and what it needs—not a price pulled out of thin air.</p></section></div><div><Clock3/><section><h3>More room for your everyday.</h3><p>Hand off the cleaning list and make a little more time for the things you love.</p></section></div></div></div></section>
}
export function HowItWorks() {
  return <section className="container section" id="how-it-works"><div className="center-heading"><span className="eyebrow">LESS ON YOUR LIST</span><h2>A fresher home starts here.</h2></div><div className="steps">{[['01','Tell us about your space','Choose your clean and share a few details about your home.'],['02','Get your personal quote','We’ll review your request, confirm coverage, and discuss the details.'],['03','Make room for life','Once your clean is confirmed, we’ll take it from there.']].map(([number,title,text]) => <div className="step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
}
export function Faq() {
  return <section className="container section faq" id="faq"><div><span className="eyebrow">A FEW GOOD QUESTIONS</span><h2>A little clarity.<br/>Before we clean.</h2><p>Good things start with clear expectations.</p></div><div className="faq-items">{[
    ['How much will my cleaning cost?', 'Your quote depends on the size and condition of your home, the type of cleaning, and any special requests. Tell us a little about your space and we’ll review the details with you before you commit.'],
    ['Do you clean in my area?', 'Include your ZIP code in the quote request. We’ll confirm whether we can serve your address before discussing a booking.'],
    ['Can I request a recurring clean?', 'Yes—select weekly, every two weeks, or monthly in your request. Frequency and availability will be confirmed when we discuss your quote.'],
    ['Do I need to book or pay right now?', 'No. This is a free quote request, not a confirmed booking. There’s no payment required and no obligation to proceed.'],
    ['What about pets or special requests?', 'Please tell us about pets, product sensitivities, access instructions, or areas that need extra attention in the notes field. We’ll discuss what’s possible before your clean.'],
  ].map(([q,a]) => <details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>
}
export function Footer() {
 return <footer className="site-footer"><div className="container footer-top"><a href="/" className="footer-brand" aria-label="Kiya Clean Co. home">kiya.<span>CLEAN CO.</span></a><p>A fresh home. A little more life.</p><nav aria-label="Footer navigation"><a href="/#services">Services</a><a href="/#quote">Get a quote</a><a href="/privacy">Privacy</a></nav></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Kiya Clean Co.</span><span>Thoughtfully clean. Simply home.<Leaf size={14}/></span></div></footer>
}
