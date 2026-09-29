const DIGIT_SETS = ['٠١٢٣٤٥٦٧٨٩', '۰۱۲۳۴۵۶۷۸۹', '०१२३४५६७८९'];
const ARABIC_DECIMAL = '٫';

/** Arabic-Indic, Persian and Devanagari digits → ASCII. */
export function normaliseDigits(text: string): string {
  let out = text;
  for (const set of DIGIT_SETS) {
    for (let d = 0; d < 10; d++) out = out.split(set[d]).join(String(d));
  }
  return out;
}

function decimalSeparator(locale: string): string {
  return new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === 'decimal')?.value ?? '.';
}

/**
 * Read a price as shown on the page: "AED 1,234.50", "١٬٢٣٤٫٥٠ ر.س", "₹1,00,000", "$12.99 USD".
 * Takes the first number in the text. Pass the storefront locale so ',' vs '.' is read right.
 */
export function parseMoney(text: string, locale: string): number {
  const s = normaliseDigits(text);
  const run = s.match(/\d[\d.,٫٬  ]*/)?.[0]?.replace(/[.,٫٬  ]+$/, '');
  if (!run) throw new Error(`No amount found in "${text}"`);
  const dec = decimalSeparator(locale);
  // Arabic locales often render with Latin separators anyway, so accept '.' too.
  // An Arabic decimal mark is always a decimal mark, whatever the locale says.
  const candidates = dec === ARABIC_DECIMAL ? [ARABIC_DECIMAL, '.'] : [dec, ARABIC_DECIMAL];
  const idx = Math.max(...candidates.map((c) => run.lastIndexOf(c)));
  const intPart = (idx >= 0 ? run.slice(0, idx) : run).replace(/\D/g, '');
  const fracPart = idx >= 0 ? run.slice(idx + 1).replace(/\D/g, '') : '';
  return Number(fracPart ? `${intPart}.${fracPart}` : intPart);
}

/** Decimal places for a currency: 2 for AED/USD/INR, 3 for KWD/BHD/OMR. */
export function minorUnits(currency: string): number {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/** True if the amount has no more precision than the currency allows. */
export function isRoundedFor(amount: number, currency: string): boolean {
  const scaled = amount * 10 ** minorUnits(currency);
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

/** Half a minor unit: the tolerance for comparing two amounts in a currency. */
export function moneyTolerance(currency: string): number {
  return 0.5 / 10 ** minorUnits(currency);
}
