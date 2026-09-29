# Platform testing reference

## Magento Open Source / Adobe Commerce 2.4.x

**How the template talks to it**
- REST: `/rest/<store_code>/V1/...` (guest carts, customer create, customer token, carts/mine). GraphQL `/graphql` with header `Store: <code>` for product lookup.
- Browser seeding posts `checkout/cart/add` with the `form_key` cookie, exactly as the storefront does. Works for Luma and Hyvä. Configurable products need `super_attribute[...]` params, so use **simple** products for seeding.
- Login seeding posts `customer/account/loginPost`.

**Gotchas that break suites**
- **Full-page cache / Varnish** on staging serves stale pages right after a deploy. Post-deploy runs should start after cache flush + warm-up (ask DevOps to trigger the dispatch after warm-up).
- **Private content (customer-data sections)** loads by AJAX after the page. The mini-cart count arrives late; assert with web-first `expect`, never read it immediately.
- **Knockout checkout** shows `.loading-mask` spinners between steps; the Luma checkout object waits for them to hide.
- **Indexers on "Update by schedule"**: a product or price changed in admin shows on the storefront only after cron. Never create catalog data inside a test.
- **reCAPTCHA** (Stores → Config → Security → Google reCAPTCHA Storefront) must be off for login/checkout/registration on staging.
- **Store codes in URL** (`web/url/use_store`) vs per-domain store views: the storefront URL in config must match what shoppers see.
- **MSI (multi-source inventory)**: stock per website. The in-stock test product must be salable in every tested website's stock.
- **Tier prices / customer groups / shared catalogs (B2B)**: prices differ for logged-in company users. Test through `customerUnitPrice`, data-driven.
- **B2B features:** company accounts and roles, requisition lists, negotiable quotes, purchase orders with approval rules, quick order (SKU/CSV). Each needs its own persona.
- **Hyvä**: storefront uses Alpine.js; selectors differ from Luma (see `selectors.ts`). Hyvä Checkout (Magewire) is a different flow: use `checkoutFlow: 'custom'`.
- **Cron-based emails and order export** are async. Do not assert them in E2E; assert through the order API later or in integration tests.

## Shopify / Shopify Plus

**How the template talks to it**
- Browser seeding: Ajax Cart API `cart/add.js` with the **variant id** (numeric).
- API tests: Storefront GraphQL API with `@inContext(country, language)` so Markets pricing and currency are exercised. Needs a Storefront API token.
- Checkout: Shopify-hosted one-page checkout. Card fields are per-field iframes (`card-fields-*`).

**Gotchas that break suites**
- **Automate checkout only on development stores** with the **Bogus Gateway** (card `1` succeeds, `2` fails, `3` raises an exception). Shopify's terms and bot protection block automated checkout on live stores.
- **Password-protected dev stores**: the adapter posts the password when `SHOPIFY_STOREFRONT_PASSWORD` is set.
- **Bot protection / hCaptcha** on login, contact and checkout can trigger under automation. Use a dev store and modest parallelism.
- **Customer accounts**: new customer accounts sign in with a one-time email code, which cannot be automated this way. Test login only on legacy accounts, or cover it manually.
- **Markets**: currency and price per market come from Markets settings and price lists. Test each market's subfolder/domain; check `@inContext` API prices match the UI.
- **Theme app extensions** (reviews, BNPL, bundles) inject late DOM and cause layout shift. Mask them in visual tests and block their analytics.
- **Cart drawer vs cart page**: many themes open a drawer on add. The mini-cart count assertion still holds; cart tests use the `/cart` page.
- **Discounts** in Dawn are applied at checkout, not in the cart. The API test covers coupon logic; the cart-UI coupon test skips.
- **Shopify Functions / Checkout extensibility** (Plus): custom checkout UI extensions need client-specific steps in `checkout-custom.ts`.
- **Rate limits**: the Storefront API is generous but not unlimited. Keep API-heavy data-driven suites to hundreds of calls, not thousands.
