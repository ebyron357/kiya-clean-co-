export const site = {
  name: 'Kiya Clean Co.',
  tagline: 'House cleaning that fits your routine.',
  email: null as string | null,
  phone: null as string | null,
  serviceZips: [] as string[],
  siteUrl: null as string | null,
  pricingConfigured: false,
  bookingConfigured: false,
  rewardsConfigured: false,
}

export const services = [
  {
    slug: 'standard-cleaning',
    name: 'Standard Cleaning',
    short: 'Regular home cleaning.',
    description: 'Routine cleaning for kitchens, bathrooms, bedrooms, and living spaces. Review the proposed checklist before requesting a quote.',
    icon: 'house',
    image: '/images/clean-home.png',
    tasks: ['Dust accessible surfaces', 'Vacuum and mop floors', 'Clean kitchen counters and sink', 'Clean bathroom fixtures', 'Empty household waste bins'],
  },
  {
    slug: 'deep-cleaning',
    name: 'Deep Cleaning',
    short: 'A more detailed clean.',
    description: 'For homes that need extra attention, including baseboards, trim, and detailed kitchen and bathroom cleaning.',
    icon: 'sparkles',
    image: '/images/clean-kitchen.png',
    tasks: ['Everything in a standard clean', 'Detailed baseboard cleaning', 'Extra attention to kitchen surfaces', 'Detailed bathroom cleaning', 'Accessible doors and trim'],
  },
  {
    slug: 'move-in-out-cleaning',
    name: 'Move-In / Move-Out',
    short: 'Cleaning before or after a move.',
    description: 'Cleaning for an empty home before move-in or after move-out. Share the property condition and any areas that need extra work.',
    icon: 'key',
    image: '/images/clean-bedroom.png',
    tasks: ['Clean accessible empty rooms', 'Wipe empty interior cabinets', 'Clean kitchen and bathroom surfaces', 'Vacuum and mop floors', 'Clean accessible shelving'],
  },
  {
    slug: 'recurring-cleaning',
    name: 'Recurring Cleaning',
    short: 'Request a regular cleaning schedule.',
    description: 'Request weekly, biweekly, or monthly cleaning. We confirm the schedule, scope, and price before any service begins.',
    icon: 'calendar',
    image: '/images/clean-home.png',
    tasks: ['Regular standard cleaning', 'Share your room priorities', 'Request your preferred frequency', 'Keep cleaning preferences on your account', 'Confirm every arrangement before service'],
  },
] as const

export const faqs = [
  ['How do I get a cleaning quote?', 'Enter your ZIP code, select a service, and tell us about your home. We review the request and confirm coverage, scope, price, and availability before booking. No payment is needed to request a quote.'],
  ['What is included in a cleaning?', 'Each service page has a proposed checklist. The final tasks, optional extras, and any exclusions are confirmed before service.'],
  ['Can I request recurring cleaning?', 'You can request weekly, biweekly, or monthly service. We confirm the rate, schedule, and cancellation terms before making an arrangement.'],
  ['Do I need to be home?', 'Let us know your preference when requesting a quote. We will agree on access arrangements before a visit. Do not share keys, alarm codes, or sensitive access information in the form.'],
  ['Do you serve my ZIP code?', 'Enter your ZIP code in the quote request. We will confirm coverage before offering an appointment.'],
] as const
