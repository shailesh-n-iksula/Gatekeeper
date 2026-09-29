# Gatekeeper client intake

Send this to the client's tech lead or your delivery manager before onboarding. Everything here
is about **staging**. No passwords in this document: those go into the CI secret directly.

## 1. Platform
- [ ] Platform: Magento Open Source / Adobe Commerce / Adobe Commerce B2B / Shopify / Shopify Plus
- [ ] Version (Magento 2.4.x) or Shopify plan
- [ ] Theme: Luma / Hyvä / custom (name) / Dawn / other OS 2.0 theme (name)
- [ ] Checkout: default / Hyvä Checkout / one-step-checkout extension (name) / headless
- [ ] Staging protection: HTTP basic auth? Shopify storefront password? reCAPTCHA on login or checkout? (reCAPTCHA must be off on staging for automation)

## 2. Markets and storefronts
One row per storefront (country + language):

| Country | Language | Staging URL | Production URL (optional) | Magento store view code |
|---|---|---|---|---|
| AE | English | | | |
| AE | Arabic | | | |
| SA | Arabic | | | |
| IN | English | | | |
| US | English | | | |

*Where to find the store code (Magento):* Admin → Stores → All Stores → click the store view → "Code".

## 3. Test products (must exist on staging and stay stable)
- [ ] One **simple** product (no size/colour choice), in stock in every market: URL + SKU
- [ ] One out-of-stock product: URL + SKU
- [ ] Shopify only: the **variant id** of each. Admin → Products → product → variant → the number at the end of the URL
- [ ] A search word that returns the in-stock product
- [ ] A category / collection URL

## 4. Checkout and payments (staging)
- [ ] Is guest checkout enabled?
- [ ] Test payment method per market (Check/Money order, COD, PSP sandbox such as Checkout.com / Tap / PayTabs / Telr / Razorpay / Stripe / Adyen, Shopify Bogus Gateway)
- [ ] COD offered in which markets? Any fee or order-value cap?
- [ ] A test coupon: applies to the test product, no expiry, no usage limit

## 5. Accounts and B2B
- [ ] Magento: an integration token for cleanup (Admin → System → Integrations), optional
- [ ] Shopify: Storefront API token (Headless channel or custom app), optional but recommended
- [ ] Shopify: a pre-created test customer (legacy accounts), if login is in scope
- [ ] B2B: one test buyer per price tier / customer group, plus 3–5 expected tier prices per market

## 6. Delivery
- [ ] CI: GitHub or GitLab? Org/group where the test repo lives
- [ ] Who reviews test changes on the client side (teams for CODEOWNERS)
- [ ] Slack/Teams channel for failure alerts
- [ ] Is synthetic monitoring on production approved? (read-only, every 15 minutes)
