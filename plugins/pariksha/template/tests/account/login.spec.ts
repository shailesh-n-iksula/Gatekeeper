import { expect, test } from '../../src/fixtures';
import { envCustomer } from '../../src/helpers/data';

test.describe('Customer account', () => {
  test('customer signs in through the login form', { tag: ['@smoke', '@p0'] }, async ({ adapter, shop, ns }) => {
    const creds = adapter.can.createCustomer ? await adapter.createCustomer(ns) : envCustomer();
    test.skip(!creds, 'Platform cannot create customers by API and QA_CUSTOMER_EMAIL/PASSWORD are not set');

    await shop.account.login(creds!.email, creds!.password);

    await expect(shop.account.marker()).toBeVisible();
  });

  test('wrong password is refused', { tag: ['@p1'] }, async ({ page, adapter, shop, ns }) => {
    const creds = adapter.can.createCustomer ? await adapter.createCustomer(ns) : envCustomer();
    test.skip(!creds, 'No test customer available');

    await shop.account.login(creds!.email, `${creds!.password}-wrong`);

    await expect(shop.account.marker()).toBeHidden();
    await expect(page).toHaveURL(/login/);
  });
});
