# Deferred Items — 260429-gbo

Issues discovered out-of-scope for this plan.

## Production env: missing `APP_URL` on Railway

**Severity:** HIGH (blocks public buy flow on production)
**Discovered during:** smoke E2E post-deploy verification

### Evidence

`pnpm test:e2e tests/e2e/smoke-purchase.spec.ts` failed with `net::ERR_CONNECTION_REFUSED` after Stripe checkout completion. Trace inspection (`/tmp/trace-extract/0-trace.network`) shows Stripe redirected the browser to:

```
http://localhost:3000/ordine-confermato?session_id=cs_test_...
```

Source (`src/lib/orders.server.ts:413`):
```ts
const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
```

The fallback is being used, meaning `process.env.APP_URL` is NOT set in the Railway production environment.

### Impact

- Every checkout on production fails the post-payment redirect (browser ends up on localhost which is unreachable from a customer's machine).
- Stripe payment processing itself succeeds (webhook delivered, payment captured) but UX is broken.
- Customer never sees the "Ordine confermato" confirmation page — they are stranded with a Chrome connection-error page.
- Admin-side: order is recorded correctly in DB (webhook flow), so no data is lost.

### Why deferred from this plan

This is a production environment configuration issue (Railway env var). The current plan (260429-gbo) is scoped to admin bulk order management UI and does not touch:
- `src/lib/orders.server.ts`
- Stripe checkout flow
- Webhook handlers
- Cart/checkout routes

None of the 5 commits in this plan modify the public buy path. Verified via `git show --stat 7d62f4a..5047ab1`.

### Resolution required

Set `APP_URL=https://calzoleria-prevenzano-production.up.railway.app` (or the production custom domain when available) in the Railway service environment, then redeploy. Verify with the smoke E2E.

This is an architectural/ops decision (Rule 4 from execute-plan deviation rules) — production env-var configuration is outside the autonomous fix scope of this admin feature task.

### Note

The previous quick task SUMMARY (260429-f6o, commit 25e4461) reported "Smoke E2E PASS in 32.6s". Either `APP_URL` was set then and removed since, or the test was run from a different angle. Worth investigating during the fix.
