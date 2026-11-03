export const site = {
  name: 'Kiya Clean Co.', tagline: 'A Higher Standard of Clean.',
  email: null as string | null, phone: null as string | null,
  serviceZips: [] as string[], siteUrl: null as string | null,
  pricingConfigured: false, bookingConfigured: false, rewardsConfigured: false,
}
export const services = [
  { slug: 'standard-cleaning', name: 'Standard Cleaning', short: 'A fresh start, every time.', description: 'A thoughtful reset for the spaces you live in most. Everyday cleaning for a home that feels beautifully cared for.', icon: 'house', image: '/images/clean-home.png', tasks: ['Dust accessible surfaces', 'Vacuum and mop floors', 'Clean kitchen counters and sink', 'Clean bathroom fixtures', 'Empty household waste bins'] },
  { slug: 'deep-cleaning', name: 'Deep Cleaning', short: 'A little extra attention. A big difference.', description: 'Go beyond the everyday with a more detailed clean. A fresh foundation for a new season or your first visit.', icon: 'sparkles', image: '/images/clean-kitchen.png', tasks: ['Everything in a standard clean', 'Detailed baseboard cleaning', 'Extra attention to kitchen surfaces', 'Detailed bathroom cleaning', 'Accessible doors and trim'] },
  { slug: 'move-in-out-cleaning', name: 'Move-In / Move-Out', short: 'New beginnings, beautifully clean.', description: 'Leave one chapter feeling good and step into the next with a freshly cleaned, empty home.', icon: 'key', image: '/images/clean-bedroom.png', tasks: ['Clean accessible empty rooms', 'Wipe empty interior cabinets', 'Clean kitchen and bathroom surfaces', 'Vacuum and mop floors', 'Clean accessible shelving'] },
  { slug: 'recurring-cleaning', name: 'Recurring Cleaning', short: 'Your clean home, on repeat.', description: 'Make a beautifully maintained home part of your routine. Request weekly, every-two-week, or monthly visits.', icon: 'calendar', image: '/images/clean-home.png', tasks: ['Regular standard cleaning', 'Share your room priorities', 'Request your preferred frequency', 'Keep cleaning preferences on your account', 'Confirm every arrangement before service'] },
] as const
export const faqs = [
  ['How do I get a cleaning quote?', 'Tell us your ZIP code, the type of cleaning you need, and a little about your home. See published pricing for your home and extras, then choose a preferred date and send your request. Unlisted home configurations receive a custom quote. No payment or account is needed.'],
  ['What is included in a cleaning?', 'Each service page outlines a proposed checklist. Your final scope, any extras, and the price will be agreed with you before a cleaning is confirmed.'],
  ['Can I set up recurring cleanings?', 'You can request weekly, every-two-week, or monthly cleaning. Availability, rates, and cancellation terms will be confirmed before you commit. There are no automatic charges from submitting a request.'],
  ['Do I need to be home?', 'Tell us your preferences when you request a quote. We will agree on access arrangements before a confirmed visit. Please do not submit keys, alarm codes, or sensitive access details through the quote form.'],
  ['Do you service my neighborhood?', 'We serve Midland, Locust, Concord, Mint Hill, and Charlotte. Enter your ZIP to check coverage, or join the waitlist if your ZIP is outside our current list. Boundary addresses are reviewed before confirmation.'],
  ['How do rewards and referrals work?', 'The rewards program is being prepared. Earning rates and eligibility will be published before it launches. No points or referral credits are promised until the program terms are confirmed.'],
] as const
