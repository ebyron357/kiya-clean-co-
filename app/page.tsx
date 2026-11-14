import { SiteHeader } from '@/components/site-header'
import { Hero, Services, HowItWorks, Faq, Footer } from '@/components/home-sections'
import { QuoteForm } from '@/components/quote-form'
import { getQuoteService } from '@/lib/quote-flow'

export default async function Home({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams
  const initialService = getQuoteService(service)
  return <><a className="skip-link" href="#main">Skip to content</a><SiteHeader/><main id="main"><Hero/><Services/><HowItWorks/><QuoteForm initialService={initialService}/><Faq/></main><Footer/></>
}
