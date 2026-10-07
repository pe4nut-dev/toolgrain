import { trackToolgrainEvent } from './analytics-events';

// Only called with a successful server action response, never a URL/query parameter.
export function continueToCheckout(state: { checkoutUrl?: string }, navigate: (url: string) => void): void {
  if (!state.checkoutUrl?.startsWith('https://checkout.stripe.com/')) return;
  trackToolgrainEvent('checkout_started', { plan: 'free' });
  navigate(state.checkoutUrl);
}
