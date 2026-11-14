import { frequencyLabels, type QuoteDetails, type QuoteStep } from '@/lib/quote-flow'

type Props = {
  step: QuoteStep
  service: QuoteDetails['service']
  onServiceChange: (service: QuoteDetails['service']) => void
  errorField: string
}

export function QuoteFields({ step, service, onServiceChange, errorField }: Props) {
  const validation = (name: string) => ({
    'aria-invalid': errorField === name || undefined,
    'aria-describedby': errorField === name ? 'quote-error' : undefined,
  })

  return <>
    <div hidden={step !== 0}>
      <fieldset>
        <legend>What kind of clean?</legend>
        <div className="service-picker">
          {([{ id: 'standard', name: 'Standard' }, { id: 'deep', name: 'Deep clean' }, { id: 'move', name: 'Moving' }] as const).map(({ id, name }) => (
            <label className={`service-option ${service === id ? 'selected' : ''}`} key={id}>
              <input type="radio" name="service" value={id} checked={service === id} onChange={() => onServiceChange(id)}/>
              <span>{name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-grid home-grid">
        <label>ZIP code<input name="zip" inputMode="numeric" autoComplete="postal-code" placeholder="12345" pattern="[0-9]{5}" maxLength={5} required {...validation('zip')}/></label>
        <label>Bedrooms<select name="bedrooms" defaultValue="2" {...validation('bedrooms')}><option value="studio">Studio</option>{['1', '2', '3', '4', '5+'].map(n => <option value={n} key={n}>{n} {n === '1' ? 'bedroom' : 'bedrooms'}</option>)}</select></label>
        <label className="form-full-width">How often?<select name="frequency" defaultValue="once" {...validation('frequency')}>{Object.entries(frequencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <p className="form-bottom-note">We&apos;ll confirm service availability for your ZIP code.</p>
    </div>
    <div hidden={step !== 1}>
      <div className="form-grid">
        <label>Full name<input name="name" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={120} {...validation('name')}/></label>
        <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} {...validation('email')}/></label>
        <label className="form-full-width">Phone <span className="optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="Your phone number" maxLength={30} {...validation('phone')}/></label>
      </div>
      <label className="notes-label">Cleaning notes <span className="optional">(optional)</span><textarea name="notes" placeholder="Pets, areas to focus on, or special requirements" maxLength={2000} rows={2} {...validation('notes')}/></label>
    </div>
  </>
}
