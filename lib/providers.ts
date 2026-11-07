import 'server-only'
export type ProviderResult<T>={status:'connected';data:T}|{status:'unconfigured';reason:string}
export interface BookingProvider {
 availability(input:{zip:string;service:string;date:string}):Promise<ProviderResult<{slotId:string;startsAt:string;endsAt:string}[]>>
 reserve(input:{slotId:string;quoteId:string;idempotencyKey:string}):Promise<ProviderResult<{providerBookingId:string;status:'confirmed'}>>
 cancel(input:{providerBookingId:string;idempotencyKey:string}):Promise<ProviderResult<{status:'cancelled'}>>
}
export interface PaymentProvider {
 checkout(input:{quoteId:string;idempotencyKey:string}):Promise<ProviderResult<{checkoutUrl:string}>>
 verifyWebhook(rawBody:string,signature:string):Promise<ProviderResult<{eventId:string;quoteId:string;status:'paid'|'refunded';amountCents:number}>>
}
export const bookingProvider:BookingProvider={async availability(){return {status:'unconfigured',reason:'No authoritative scheduling provider is connected.'}},async reserve(){return {status:'unconfigured',reason:'Reservations are disabled until availability and cancellation rules are configured.'}},async cancel(){return {status:'unconfigured',reason:'No provider-created bookings are managed by this website.'}}}
export const paymentProvider:PaymentProvider={async checkout(){return {status:'unconfigured',reason:'No payment provider is connected. No charges can be processed.'}},async verifyWebhook(){return {status:'unconfigured',reason:'Payment events cannot be accepted before a verification adapter is configured.'}}}
