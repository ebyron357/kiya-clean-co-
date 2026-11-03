import Link from "next/link";
import { dollars, getServiceKey, pricingConfig } from '@/lib/booking-prices';
import {
  KiyaArrow as ArrowUpRight,
  KiyaCalendar as CalendarDays,
  KiyaArch as Heart,
  KiyaLeaf as Leaf,
  KiyaTowel as SlidersHorizontal,
  KiyaTowel as Gift,
  KiyaArrow as ArrowRight,
} from "@/components/kiya-mark";
import { services, faqs } from "@/lib/site";
import { HowWeClean, KiyaStandard, TrustBadges, CustomerReviews, homepageFaqs, HomepageFaqSchema } from './home-trust';

const homepageServices = [
  {
    ...services[0],
    name: "Standard Clean",
    short: "Your home, kept beautifully. Weekly, biweekly, or monthly.",
  },
  {
    ...services[1],
    name: "Deep Clean",
    short: "Top to bottom, inside and out. The reset your home deserves.",
  },
  {
    ...services[2],
    short:
      "Walkthrough-ready, guaranteed. If anything’s flagged, we re-clean it free.",
  },
];
export function ServiceCards({ homepage = false }: { homepage?: boolean }) {
  return <div className="service-menu">{(homepage ? homepageServices : services).map((s, i) => {
    const key = getServiceKey(s.slug) || 'standard';
    return <Link href={s.slug==='move-in-out-cleaning'?'/move-out-cleaning':s.slug==='recurring-cleaning'?'/standard-cleaning':`/${s.slug}`} className="service-menu-row" key={s.slug}>
      <span className="service-roman font-serif" aria-hidden="true">{['I','II','III','IV'][i]}</span>
      <div className="service-menu-copy"><h3 className="font-serif">{s.name}</h3><p>{s.short}</p><span className="sr-only">Explore service</span></div>
      <span className="service-start"><span>From</span><strong className="font-serif">{dollars(pricingConfig.services[key].rates[0])}</strong></span><ArrowUpRight className="service-menu-arrow" size={32}/>
    </Link>;
  })}</div>;
}
export function FaqSection({ items = faqs }: { items?: readonly (readonly string[])[] }) {
  return (
    <section className="section shell faq-section" id="faq">
      <div>
        <p className="eyebrow">A LITTLE CLARITY</p>
        <h2>
          Good questions.
          <br />
          <em>Thoughtful answers.</em>
        </h2>
        <p className="muted">
          Because peace of mind starts before
          <br className="desktop-only" /> we arrive at your door.
        </p>
        <Link href="/contact" className="text-link">
          More questions? Let’s talk <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="faq-list">
        {items.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <span className="faq-toggle" aria-hidden="true"/>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export function HomeSections() {
  return (
    <>
      <div className="trust-strip shell">
        {[
          [Heart, "Care in every corner"],
          [SlidersHorizontal, "Cleaning that fits your life"],
          [Leaf, "More room to breathe"],
          [CalendarDays, "A routine made easier"],
        ].map(([Icon, text]) => {
          const I = Icon as typeof Heart;
          return (
            <div key={String(text)}>
              <I size={19} />
              <span>{String(text)}</span>
            </div>
          );
        })}
      </div>
      <section className="section shell" id="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A CLEAN FOR EVERY CHAPTER</p>
            <h2>Your home. <em>Your kind of clean.</em></h2>
          </div>
          <Link href="/pricing" className="text-link">
            View flat-rate pricing <ArrowUpRight size={17} />
          </Link>
        </div>
        <ServiceCards homepage />
      </section>
      <HowWeClean />
      <KiyaStandard />
      <TrustBadges />
      <CustomerReviews />
      <FaqSection items={homepageFaqs} />
      <HomepageFaqSchema />
      <section className="shell rewards-pair">
        <div className="reward-feature">
          <CalendarDays size={29} />
          <p className="eyebrow">A ROUTINE YOU’LL LOVE</p>
          <h2>
            Keep that just-cleaned
            <br />
            feeling going.
          </h2>
          <p>
            Weekly, biweekly, or monthly. Find a cleaning rhythm that makes room
            for your life.
          </p>
          <Link href="/services/recurring-cleaning" className="text-link">
            Find your rhythm <ArrowRight size={17} />
          </Link>
        </div>
        <div className="reward-feature lavender">
          <Gift size={29} />
          <p className="eyebrow">MORE GOOD THINGS TO COME</p>
          <h2>
            A little thank-you.
            <br />
            For coming home to Kiya.
          </h2>
          <p>
            We’re preparing thoughtful rewards and referral benefits for our
            community. Get to know what’s coming.
          </p>
          <Link href="/rewards" className="text-link">
            Discover Kiya Rewards <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
