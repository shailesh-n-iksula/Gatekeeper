/**
 * Market facts shared by every client. A client's config picks markets from here;
 * it never restates currency, tax or address rules.
 *
 * Addresses and phone numbers are synthetic test values. Change them in the client
 * config (markets[].address) if a client's address validation rejects them.
 */

export type MarketCode = 'AE' | 'SA' | 'QA' | 'KW' | 'BH' | 'OM' | 'EG' | 'US' | 'IN';

export interface Address {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  /** Region/state/emirate label as shown in the checkout dropdown. */
  region?: string;
  /** Region code where the platform uses codes (Shopify zones, US states). */
  regionCode?: string;
  postcode?: string;
  countryCode: MarketCode;
  phone: string;
}

export interface MarketFacts {
  name: string;
  region: 'MENA' | 'NA' | 'APAC';
  currency: string;
  /** Any of these in a price string proves the market currency is shown. */
  currencyMarkers: string[];
  tax: { kind: 'VAT' | 'GST' | 'SALES_TAX' | 'NONE'; standardRate?: number; pricesInclusive: boolean };
  timezone: string;
  geolocation: { latitude: number; longitude: number };
  phoneCode: string;
  postcode: { required: boolean; pattern?: RegExp };
  /** Cash on delivery is a mainstream payment method here and must be tested. */
  codCommon: boolean;
  address: Address;
  /** Known ways stores break in this market. Surfaced by the agent when planning tests. */
  gotchas: string[];
}

const person = { firstName: 'Qa', lastName: 'Automation' };

export const MARKETS: Record<MarketCode, MarketFacts> = {
  AE: {
    name: 'United Arab Emirates',
    region: 'MENA',
    currency: 'AED',
    currencyMarkers: ['AED', 'د.إ', 'Dhs', 'DH'],
    tax: { kind: 'VAT', standardRate: 0.05, pricesInclusive: true },
    timezone: 'Asia/Dubai',
    geolocation: { latitude: 25.2048, longitude: 55.2708 },
    phoneCode: '+971',
    postcode: { required: false },
    codCommon: true,
    address: { ...person, street: 'Office 1204, Test Tower, Sheikh Zayed Road', city: 'Dubai', region: 'Dubai', countryCode: 'AE', phone: '+971500000001' },
    gotchas: [
      'The UAE has no postcodes. A checkout that requires one blocks every order.',
      'Arabic store views must set <html dir="rtl">. Icons, carousels and breadcrumbs must mirror.',
      'COD usually carries a fee and an order-value cap. Test both.',
    ],
  },
  SA: {
    name: 'Saudi Arabia',
    region: 'MENA',
    currency: 'SAR',
    currencyMarkers: ['SAR', 'ر.س', 'SR', '⃁'],
    tax: { kind: 'VAT', standardRate: 0.15, pricesInclusive: true },
    timezone: 'Asia/Riyadh',
    geolocation: { latitude: 24.7136, longitude: 46.6753 },
    phoneCode: '+966',
    postcode: { required: false, pattern: /^\d{5}$/ },
    codCommon: true,
    address: { ...person, street: 'King Fahd Road, Al Olaya', city: 'Riyadh', region: 'Riyadh', postcode: '12211', countryCode: 'SA', phone: '+966500000001' },
    gotchas: [
      'ar-SA formats numbers with Arabic-Indic digits (١٢٣). Price parsing must normalise them.',
      'The new Riyal symbol (U+20C1) renders as tofu on older fonts. Check it visually.',
      'VAT at 15% makes rounding differences between line and order totals visible.',
    ],
  },
  QA: {
    name: 'Qatar',
    region: 'MENA',
    currency: 'QAR',
    currencyMarkers: ['QAR', 'ر.ق', 'QR'],
    tax: { kind: 'NONE', pricesInclusive: true },
    timezone: 'Asia/Qatar',
    geolocation: { latitude: 25.2854, longitude: 51.531 },
    phoneCode: '+974',
    postcode: { required: false },
    codCommon: true,
    address: { ...person, street: 'Building 12, Street 850, West Bay', city: 'Doha', region: 'Doha', countryCode: 'QA', phone: '+97450000001' },
    gotchas: ['No VAT. A tax line showing a non-zero amount is a configuration bug.', 'No postcodes.'],
  },
  KW: {
    name: 'Kuwait',
    region: 'MENA',
    currency: 'KWD',
    currencyMarkers: ['KWD', 'د.ك', 'KD'],
    tax: { kind: 'NONE', pricesInclusive: true },
    timezone: 'Asia/Kuwait',
    geolocation: { latitude: 29.3759, longitude: 47.9774 },
    phoneCode: '+965',
    postcode: { required: false, pattern: /^\d{5}$/ },
    codCommon: true,
    address: { ...person, street: 'Block 3, Street 30, Salmiya', city: 'Kuwait City', region: 'Hawalli', countryCode: 'KW', phone: '+96550000001' },
    gotchas: ['KWD has 3 decimal places. Code that assumes 2 decimals shows rounding errors here first.'],
  },
  BH: {
    name: 'Bahrain',
    region: 'MENA',
    currency: 'BHD',
    currencyMarkers: ['BHD', 'د.ب', 'BD'],
    tax: { kind: 'VAT', standardRate: 0.1, pricesInclusive: true },
    timezone: 'Asia/Bahrain',
    geolocation: { latitude: 26.2285, longitude: 50.586 },
    phoneCode: '+973',
    postcode: { required: false },
    codCommon: true,
    address: { ...person, street: 'Road 2803, Block 428, Seef', city: 'Manama', region: 'Capital', countryCode: 'BH', phone: '+97330000001' },
    gotchas: ['BHD has 3 decimal places.'],
  },
  OM: {
    name: 'Oman',
    region: 'MENA',
    currency: 'OMR',
    currencyMarkers: ['OMR', 'ر.ع.', 'RO'],
    tax: { kind: 'VAT', standardRate: 0.05, pricesInclusive: true },
    timezone: 'Asia/Muscat',
    geolocation: { latitude: 23.588, longitude: 58.3829 },
    phoneCode: '+968',
    postcode: { required: false, pattern: /^\d{3}$/ },
    codCommon: true,
    address: { ...person, street: 'Way 3017, Shatti Al Qurum', city: 'Muscat', region: 'Muscat', postcode: '100', countryCode: 'OM', phone: '+96890000001' },
    gotchas: ['OMR has 3 decimal places.'],
  },
  EG: {
    name: 'Egypt',
    region: 'MENA',
    currency: 'EGP',
    currencyMarkers: ['EGP', 'ج.م', 'E£', 'LE'],
    tax: { kind: 'VAT', standardRate: 0.14, pricesInclusive: true },
    timezone: 'Africa/Cairo',
    geolocation: { latitude: 30.0444, longitude: 31.2357 },
    phoneCode: '+20',
    postcode: { required: false, pattern: /^\d{5}$/ },
    codCommon: true,
    address: { ...person, street: '26 July Street, Zamalek', city: 'Cairo', region: 'Cairo', postcode: '11511', countryCode: 'EG', phone: '+201000000001' },
    gotchas: ['COD dominates. Test COD before card.'],
  },
  US: {
    name: 'United States',
    region: 'NA',
    currency: 'USD',
    currencyMarkers: ['$', 'USD', 'US$'],
    tax: { kind: 'SALES_TAX', pricesInclusive: false },
    timezone: 'America/New_York',
    geolocation: { latitude: 40.7128, longitude: -74.006 },
    phoneCode: '+1',
    postcode: { required: true, pattern: /^\d{5}(-\d{4})?$/ },
    codCommon: false,
    address: { ...person, street: '350 Fifth Avenue', city: 'New York', region: 'New York', regionCode: 'NY', postcode: '10001', countryCode: 'US', phone: '+12125550100' },
    gotchas: [
      'Prices exclude tax. Tax appears only after a shipping address is entered and varies by state/ZIP.',
      'ADA exposure makes accessibility failures a legal risk, not only a UX one.',
    ],
  },
  IN: {
    name: 'India',
    region: 'APAC',
    currency: 'INR',
    currencyMarkers: ['₹', 'Rs', 'INR'],
    tax: { kind: 'GST', standardRate: 0.18, pricesInclusive: true },
    timezone: 'Asia/Kolkata',
    geolocation: { latitude: 19.076, longitude: 72.8777 },
    phoneCode: '+91',
    postcode: { required: true, pattern: /^[1-9]\d{5}$/ },
    codCommon: true,
    address: { ...person, street: 'Nariman Point', city: 'Mumbai', region: 'Maharashtra', regionCode: 'MH', postcode: '400001', countryCode: 'IN', phone: '+919000000001' },
    gotchas: [
      'en-IN groups digits in lakhs (1,00,000). Western grouping on an Indian store is a bug.',
      'GST rate depends on the product HSN code, not one flat rate.',
      'PIN-code serviceability (can we deliver here? is COD allowed here?) is a P0 check.',
    ],
  },
};

export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];
