import { loadStripe } from '@stripe/stripe-js';

// Chave pública do Stripe (pode ser exposta no cliente)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default stripePromise; 