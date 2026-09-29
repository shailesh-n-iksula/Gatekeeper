import type { APIRequestContext, BrowserContext } from '@playwright/test';
import type { ResolvedStorefront } from '../config/resolve';
import type { ClientConfig, ProductRef } from '../config/types';
import { NotSupported, type ApiCart, type CommerceAdapter, type CustomerCreds, type Money } from './types';

interface ShopifyCart {
  id: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string }; totalAmount: { amount: string; currencyCode: string } };
  discountAllocations: { discountedAmount: { amount: string } }[];
  discountCodes: { code: string; applicable: boolean }[];
}

const CART_FIELDS = `
  id totalQuantity
  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
  discountAllocations { discountedAmount { amount } }
  discountCodes { code applicable }`;

/**
 * Shopify / Shopify Plus.
 * Browser seeding uses the storefront Ajax API (cart/add.js). API tests use the
 * Storefront GraphQL API with @inContext so Markets pricing is exercised.
 */
export class ShopifyAdapter implements CommerceAdapter {
  readonly platform = 'shopify' as const;
  readonly can: CommerceAdapter['can'];
  private readonly endpoint?: string;

  constructor(
    cfg: ClientConfig,
    private readonly sf: ResolvedStorefront,
    private readonly api: APIRequestContext,
  ) {
    const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
    if (token && cfg.shopify) this.endpoint = `https://${cfg.shopify.storeDomain}/api/${cfg.shopify.apiVersion}/graphql.json`;
    // Password-based customer creation only exists on legacy accounts; new customer accounts use email codes.
    this.can = { createCustomer: false, apiCart: Boolean(this.endpoint), customerPricing: false };
  }

  private get inContext(): string {
    return `@inContext(country: ${this.sf.market.code}, language: ${this.sf.language.toUpperCase()})`;
  }

  private async gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    if (!this.endpoint) throw new NotSupported('Set SHOPIFY_STOREFRONT_TOKEN and shopify.storeDomain to use the Storefront API');
    const res = await this.api.post(this.endpoint, {
      headers: { 'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_TOKEN!, 'Content-Type': 'application/json' },
      data: { query, variables },
    });
    if (!res.ok()) throw new Error(`Shopify Storefront API: HTTP ${res.status()} ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (body.errors?.length) throw new Error(`Shopify Storefront API: ${body.errors.map((e) => e.message).join('; ')}`);
    return body.data as T;
  }

  private variantGid(product: ProductRef): string {
    if (!product.id) throw new Error(`Shopify product ${product.path} needs its numeric variant id in client.config.ts`);
    return `gid://shopify/ProductVariant/${product.id}`;
  }

  async prepareContext(context: BrowserContext): Promise<void> {
    const password = process.env.SHOPIFY_STOREFRONT_PASSWORD;
    if (!password) return;
    await context.request.post(`${this.sf.origin}/password`, {
      form: { form_type: 'storefront_password', utf8: '✓', password },
    });
  }

  async seedBrowserCart(context: BrowserContext, product: ProductRef, qty: number): Promise<void> {
    if (!product.id) throw new Error(`Shopify product ${product.path} needs its numeric variant id in client.config.ts`);
    const res = await context.request.post('cart/add.js', { data: { items: [{ id: Number(product.id), quantity: qty }] } });
    if (!res.ok()) throw new Error(`Shopify cart/add.js failed: HTTP ${res.status()} ${(await res.text()).slice(0, 200)}`);
  }

  async loginBrowser(context: BrowserContext, creds: CustomerCreds): Promise<void> {
    // Legacy customer accounts only. New customer accounts sign in with an emailed code and cannot be automated here.
    const res = await context.request.post('account/login', {
      form: { form_type: 'customer_login', utf8: '✓', 'customer[email]': creds.email, 'customer[password]': creds.password },
    });
    if (res.url().includes('account/login') || res.url().includes('challenge')) {
      throw new Error('Shopify login rejected or challenged (hCaptcha). Use a store with captcha off for automation.');
    }
  }

  async createCustomer(): Promise<CustomerCreds> {
    throw new NotSupported('Shopify: use QA_CUSTOMER_EMAIL / QA_CUSTOMER_PASSWORD for a pre-created test account');
  }

  async apiCart(): Promise<ApiCart> {
    let cartId: string | undefined;
    let latest: ShopifyCart | undefined;
    const errors = (e: { message: string }[]) => {
      if (e.length) throw new Error(`Shopify cart: ${e.map((x) => x.message).join('; ')}`);
    };
    return {
      add: async (product, qty) => {
        const lines = [{ merchandiseId: this.variantGid(product), quantity: qty }];
        if (!cartId) {
          const d = await this.gql<{ cartCreate: { cart: ShopifyCart | null; userErrors: { message: string }[] } }>(
            `mutation Create($input: CartInput!) ${this.inContext} { cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { message } } }`,
            { input: { lines, buyerIdentity: { countryCode: this.sf.market.code } } },
          );
          errors(d.cartCreate.userErrors);
          latest = d.cartCreate.cart!;
          cartId = latest.id;
        } else {
          const d = await this.gql<{ cartLinesAdd: { cart: ShopifyCart | null; userErrors: { message: string }[] } }>(
            `mutation Add($id: ID!, $lines: [CartLineInput!]!) ${this.inContext} { cartLinesAdd(cartId: $id, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`,
            { id: cartId, lines },
          );
          errors(d.cartLinesAdd.userErrors);
          latest = d.cartLinesAdd.cart!;
        }
      },
      totals: async () => {
        if (!cartId) throw new Error('Add a product before reading totals');
        const d = await this.gql<{ cart: ShopifyCart }>(`query Get($id: ID!) ${this.inContext} { cart(id: $id) { ${CART_FIELDS} } }`, { id: cartId });
        latest = d.cart;
        const c = latest.cost;
        return {
          subtotal: { amount: Number(c.subtotalAmount.amount), currency: c.subtotalAmount.currencyCode },
          grandTotal: { amount: Number(c.totalAmount.amount), currency: c.totalAmount.currencyCode },
          discount: latest.discountAllocations.reduce((sum, a) => sum + Number(a.discountedAmount.amount), 0),
          itemsQty: latest.totalQuantity,
        };
      },
      applyCoupon: async (code) => {
        if (!cartId) throw new Error('Add a product before applying a coupon');
        const d = await this.gql<{ cartDiscountCodesUpdate: { cart: ShopifyCart | null; userErrors: { message: string }[] } }>(
          `mutation Codes($id: ID!, $codes: [String!]) ${this.inContext} { cartDiscountCodesUpdate(cartId: $id, discountCodes: $codes) { cart { ${CART_FIELDS} } userErrors { message } } }`,
          { id: cartId, codes: [code] },
        );
        const match = d.cartDiscountCodesUpdate.cart?.discountCodes.find((c) => c.code.toLowerCase() === code.toLowerCase());
        return { applied: Boolean(match?.applicable), message: d.cartDiscountCodesUpdate.userErrors.map((e) => e.message).join('; ') || undefined };
      },
    };
  }

  async customerUnitPrice(): Promise<Money> {
    throw new NotSupported('Customer-specific pricing on Shopify (B2B catalogs) needs the Admin API. Not wired yet.');
  }

  async cleanup(): Promise<void> {
    // Storefront carts expire on their own. Nothing to clean.
  }
}
