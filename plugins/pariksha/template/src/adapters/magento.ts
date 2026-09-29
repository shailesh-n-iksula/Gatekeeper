import { randomUUID } from 'node:crypto';
import type { APIRequestContext, APIResponse, BrowserContext } from '@playwright/test';
import type { ResolvedStorefront } from '../config/resolve';
import type { ClientConfig, ProductRef } from '../config/types';
import type { ApiCart, CartTotals, CommerceAdapter, CustomerCreds, Money } from './types';

interface MagentoTotals {
  grand_total: number;
  subtotal: number;
  discount_amount: number;
  items_qty: number;
  quote_currency_code: string;
  items: { item_id: number; price: number; qty: number }[];
}

/**
 * Magento Open Source / Adobe Commerce, 2.4.x.
 * API calls use REST (rest/<store>/V1) and GraphQL. Browser seeding posts the same
 * forms the storefront posts, so it works on Luma and Hyvä alike.
 */
export class MagentoAdapter implements CommerceAdapter {
  readonly platform = 'magento' as const;
  readonly can = { createCustomer: true, apiCart: true, customerPricing: true };
  private readonly created: CustomerCreds[] = [];
  private readonly apiOrigin: string;

  constructor(
    cfg: ClientConfig,
    private readonly sf: ResolvedStorefront,
    private readonly api: APIRequestContext,
  ) {
    this.apiOrigin = cfg.magento?.apiOrigin ?? sf.origin;
    if (!sf.storeCode) throw new Error(`Storefront ${sf.locale} needs magentoStoreCode in client.config.ts`);
  }

  private rest(path: string): string {
    return `${this.apiOrigin}/rest/${this.sf.storeCode}/V1/${path}`;
  }

  private async json<T>(res: APIResponse, what: string): Promise<T> {
    if (!res.ok()) throw new Error(`Magento ${what} failed: HTTP ${res.status()} ${(await res.text()).slice(0, 300)}`);
    return (await res.json()) as T;
  }

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const res = await this.api.post(`${this.apiOrigin}/graphql`, {
      headers: { Store: this.sf.storeCode!, 'Content-Type': 'application/json' },
      data: { query, variables },
    });
    const body = await this.json<{ data?: T; errors?: { message: string }[] }>(res, 'GraphQL');
    if (body.errors?.length) throw new Error(`Magento GraphQL: ${body.errors.map((e) => e.message).join('; ')}`);
    return body.data as T;
  }

  private async productId(product: ProductRef): Promise<string> {
    if (product.id) return product.id;
    const data = await this.graphql<{ products: { items: { id: number; sku: string }[] } }>(
      'query($sku: String!) { products(filter: { sku: { eq: $sku } }) { items { id sku } } }',
      { sku: product.sku },
    );
    const item = data.products.items.find((i) => i.sku === product.sku);
    if (!item) throw new Error(`SKU ${product.sku} not found in store ${this.sf.storeCode}`);
    return String(item.id);
  }

  private async formKey(context: BrowserContext, path: string): Promise<string> {
    await context.request.get(path);
    const key = (await context.cookies(this.sf.url)).find((c) => c.name === 'form_key')?.value;
    if (!key) throw new Error('Magento form_key cookie missing. Check that the storefront URL and basic auth are right.');
    return key;
  }

  async prepareContext(): Promise<void> {
    // Nothing needed for Luma or Hyvä. Store view is selected by URL.
  }

  async seedBrowserCart(context: BrowserContext, product: ProductRef, qty: number): Promise<void> {
    const formKey = await this.formKey(context, product.path);
    const res = await context.request.post('checkout/cart/add/', {
      form: { product: await this.productId(product), qty: String(qty), form_key: formKey },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!res.ok()) throw new Error(`Magento add-to-cart failed: HTTP ${res.status()}`);
  }

  async loginBrowser(context: BrowserContext, creds: CustomerCreds): Promise<void> {
    const formKey = await this.formKey(context, 'customer/account/login/');
    const res = await context.request.post('customer/account/loginPost/', {
      form: { form_key: formKey, 'login[username]': creds.email, 'login[password]': creds.password },
    });
    if (res.url().includes('customer/account/login')) {
      throw new Error('Magento login was rejected. Is reCAPTCHA enabled for customer login on staging?');
    }
  }

  async createCustomer(namespace: string): Promise<CustomerCreds> {
    const email = `${namespace}@${process.env.TEST_EMAIL_DOMAIN ?? 'example.com'}`;
    const password = `Qa!9${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const res = await this.api.post(this.rest('customers'), {
      data: { customer: { email, firstname: 'Qa', lastname: 'Automation' }, password },
    });
    const customer = await this.json<{ id: number }>(res, 'create customer');
    const creds = { email, password, id: String(customer.id) };
    this.created.push(creds);
    return creds;
  }

  async apiCart(): Promise<ApiCart> {
    const cartId = await this.json<string>(await this.api.post(this.rest('guest-carts')), 'create guest cart');
    const base = `guest-carts/${cartId}`;
    return {
      add: async (product, qty) => {
        await this.json(
          await this.api.post(this.rest(`${base}/items`), { data: { cartItem: { sku: product.sku, qty, quote_id: cartId } } }),
          `add ${product.sku}`,
        );
      },
      totals: async () => toTotals(await this.json<MagentoTotals>(await this.api.get(this.rest(`${base}/totals`)), 'totals')),
      applyCoupon: async (code) => {
        const res = await this.api.put(this.rest(`${base}/coupons/${encodeURIComponent(code)}`));
        if (res.ok()) return { applied: true };
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        return { applied: false, message: body.message };
      },
    };
  }

  async customerUnitPrice(creds: CustomerCreds, sku: string, qty: number): Promise<Money> {
    const token = await this.json<string>(
      await this.api.post(this.rest('integration/customer/token'), { data: { username: creds.email, password: creds.password } }),
      'customer token',
    );
    const headers = { Authorization: `Bearer ${token}` };
    const quoteId = await this.json<number>(await this.api.post(this.rest('carts/mine'), { headers }), 'customer cart');
    const item = await this.json<{ item_id: number }>(
      await this.api.post(this.rest('carts/mine/items'), { headers, data: { cartItem: { sku, qty, quote_id: String(quoteId) } } }),
      `add ${sku}`,
    );
    try {
      const totals = await this.json<MagentoTotals>(await this.api.get(this.rest('carts/mine/totals'), { headers }), 'totals');
      const line = totals.items.find((i) => i.item_id === item.item_id);
      if (!line) throw new Error(`Line for ${sku} missing from customer cart totals`);
      return { amount: line.price, currency: totals.quote_currency_code };
    } finally {
      // Leave the shared B2B account's cart as we found it.
      await this.api.delete(this.rest(`carts/mine/items/${item.item_id}`), { headers });
    }
  }

  async cleanup(): Promise<void> {
    const token = process.env.MAGENTO_ADMIN_TOKEN;
    if (!token) return;
    for (const c of this.created) {
      await this.api
        .delete(`${this.apiOrigin}/rest/V1/customers/${c.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => undefined);
    }
  }
}

function toTotals(t: MagentoTotals): CartTotals {
  const currency = t.quote_currency_code;
  return {
    subtotal: { amount: t.subtotal, currency },
    grandTotal: { amount: t.grand_total, currency },
    discount: Math.abs(t.discount_amount ?? 0),
    itemsQty: t.items_qty,
  };
}
