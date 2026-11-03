export type AnalyticsEvent='quote_started'|'booking_completed'|'circle_joined'|'call_click'|'text_click'|'booking_request_submitted'
declare global { interface Window {dataLayer:unknown[];gtag?:(...args:unknown[])=>void} }
export function trackEvent(event:AnalyticsEvent,properties:Record<string,string|number|boolean>={}){if(typeof window!=='undefined')window.gtag?.('event',event,properties)}
