/**
 * Stripe Client — server-only
 *
 * Initialized with STRIPE_SECRET_KEY from environment.
 * Used by checkout routes and webhook handler.
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "[stripe] STRIPE_SECRET_KEY is required. Set it in .env or environment variables.",
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

/**
 * The publishable key is safe to expose client-side.
 * Read from environment to avoid duplication.
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? "";
