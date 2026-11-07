import { QuoteWizard } from '@/components/quote-wizard'

export const metadata = { title: 'Request a Cleaning Quote' }

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string; service?: string }>
}) {
  const params = await searchParams
  return (
    <main className="shell section">
      <div className="wizard">
        <div className="page-intro">
          <p className="eyebrow">QUOTE REQUEST</p>
          <h1>Tell us about your home.</h1>
          <p>Request a quote without payment or an account. An appointment is not reserved until the details are confirmed.</p>
        </div>
        <QuoteWizard initialZip={params.zip || ''} initialService={params.service || ''} />
      </div>
    </main>
  )
}
