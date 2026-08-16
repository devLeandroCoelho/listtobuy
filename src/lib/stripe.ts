import Stripe from 'stripe';

const stripeApiKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeApiKey
  ? new Stripe(stripeApiKey, { apiVersion: '2026-07-29.dahlia' })
  : null;

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
