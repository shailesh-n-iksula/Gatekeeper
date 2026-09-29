import client from '../../client.config';
import { expect, test } from '../../src/fixtures';
import { envCustomer } from '../../src/helpers/data';
import { moneyTolerance } from '../../src/helpers/money';

/**
 * Data-driven: every row in client.config.ts b2b.tierPrices becomes a test.
 * Hundreds of price-matrix rows are cheap here because they run through the API.
 */
const cases = client.b2b?.enabled ? (client.b2b.tierPrices ?? []) : [];

test.describe('B2B tier pricing', () => {
  for (const c of cases) {
    test(`${c.persona} pays ${c.expectedUnitPrice} for ${c.qty} × ${c.sku} in ${c.market}`, { tag: ['@p1', '@b2b'] }, async ({ adapter, sf }) => {
      test.skip(sf.market.code !== c.market, `Case is for ${c.market}`);
      test.skip(!adapter.can.customerPricing, 'Customer pricing not supported on this platform yet');
      const creds = envCustomer(`B2B_${c.persona.toUpperCase()}`);
      test.skip(!creds, `Set B2B_${c.persona.toUpperCase()}_EMAIL / _PASSWORD`);

      const price = await adapter.customerUnitPrice(creds!, c.sku, c.qty);

      expect(price.currency).toBe(sf.currency);
      expect(Math.abs(price.amount - c.expectedUnitPrice), `unit price ${price.amount}`).toBeLessThanOrEqual(moneyTolerance(sf.currency));
    });
  }
});
