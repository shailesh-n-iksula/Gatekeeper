# Market testing reference

The machine-readable version is `template/src/markets/markets.ts`. This sheet explains what to test and why.

## MENA (general)
- **RTL.** Arabic storefronts must set `<html dir="rtl" lang="ar">`. Check that the header, breadcrumbs, carousels (swipe direction), arrows/chevrons, form field alignment, price placement and the checkout step indicator all mirror. Snapshot at least the header and PDP buy box per Arabic storefront.
- **Digits.** Some Arabic storefronts render Arabic-Indic digits (٠١٢٣), especially ar-SA. Prices, quantities, order numbers and phone inputs must accept and display them consistently. Phone and card inputs must accept Latin digits typed on an Arabic keyboard.
- **Mixed-direction text.** Latin SKUs, emails and URLs inside Arabic text must not jumble. Check the order confirmation and address display.
- **COD.** Usually the #1 payment method. Test availability per country, fee line, order-value cap, and COD being hidden for disallowed products (gift cards, digital).
- **BNPL** (Tabby, Tamara): widget on PDP/cart plus the redirect flow in sandbox. Block their analytics, not their checkout script.
- **Regional PSPs:** Checkout.com, Tap, PayTabs, Telr, HyperPay, Amazon Payment Services, mada cards (KSA). Use sandbox cards from each provider's docs. 3DS challenge pages are provider-hosted and change: test them weekly, not per PR.
- **Addresses.** AE and QA have no postcodes, and SA/KW/OM postcodes are often optional. Area/district dropdowns (Dubai → area) are common custom fields. National Address (KSA) short codes may be required.
- **Weekend.** Fri–Sat (UAE: Sat–Sun since 2022). Schedule heavy runs then; check delivery-date estimators around it.
- **Ramadan / White Friday / 11.11 / DSF.** Peak events: run k6 load and the full weekly matrix before each.

## Currency precision
| 2 decimals | AED, SAR, QAR, EGP, INR, USD |
|---|---|
| **3 decimals** | **KWD, BHD, OMR**: rounding, display and PSP amount conversion (×1000, not ×100) bugs show up here first |

## India
- **Lakh/crore grouping** in en-IN: ₹1,00,000.00. Western grouping is a localisation bug.
- **GST** is included in displayed prices; the rate depends on HSN code (5/12/18/28%). Invoices need CGST+SGST (intra-state) vs IGST (inter-state) splits, which depend on the ship-to state vs seller state. Test both.
- **PIN serviceability.** A 6-digit PIN (first digit 1–9) decides delivery ETA and COD availability. Test serviceable, non-serviceable and COD-blocked PINs.
- **Payments:** UPI (intent/collect), cards, netbanking, wallets, COD, EMI via Razorpay/PayU/Cashfree/CCAvenue. UPI flows need the PSP's sandbox VPA.
- **Hindi** (hi-IN) storefronts: check Devanagari font loading and text overflow in buttons.
- **Mobile first:** most traffic is Android Chrome on mid-range devices. Weight mobile chromium lanes; use CPU throttling in perf runs.

## United States
- **Tax is excluded** from displayed prices and appears only after the shipping address. Rates vary by state/county/ZIP (Avalara/Vertex/TaxJar). Test a no-sales-tax state (OR, DE, MT, NH), a high-tax one (e.g. CA/NY), and tax-exempt B2B buyers.
- **Address validation** (USPS/SmartyStreets suggestion modals) can block checkout. Handle the suggestion dialog in the checkout page object.
- **ADA / WCAG** lawsuits are common. A11y failures on checkout are P0 for US storefronts.
- **Payments:** cards, Apple Pay/Google Pay (not automatable end to end: test that the button renders), PayPal sandbox, Affirm/Klarna sandbox.
- **CCPA/state privacy** consent banners: pre-accept in tests, and test "Do Not Sell" link presence.
