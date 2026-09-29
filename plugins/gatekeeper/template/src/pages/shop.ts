import type { Page } from '@playwright/test';
import { selectorsFor } from '../config/selectors';
import type { ClientConfig, SelectorMap } from '../config/types';
import { MagentoLumaCheckout, ShopifyCheckout, type Checkout } from './checkout';
import { CustomCheckout } from './checkout-custom';
import { AccountPage, CartPage, Header, Listing, ProductPage } from './storefront';

/** One object that gives a test the whole storefront: shop.pdp, shop.cart, shop.checkout... */
export class Shop {
  readonly selectors: SelectorMap;
  readonly header: Header;
  readonly listing: Listing;
  readonly pdp: ProductPage;
  readonly cart: CartPage;
  readonly account: AccountPage;
  readonly checkout: Checkout;

  constructor(page: Page, cfg: ClientConfig) {
    const s = selectorsFor(cfg);
    this.selectors = s;
    this.header = new Header(page, s);
    this.listing = new Listing(page, s);
    this.pdp = new ProductPage(page, s);
    this.cart = new CartPage(page, s);
    this.account = new AccountPage(page, s);
    const flow = cfg.checkoutFlow ?? (cfg.platform === 'shopify' ? 'shopify' : 'magento-luma');
    this.checkout =
      flow === 'shopify' ? new ShopifyCheckout(page) : flow === 'magento-luma' ? new MagentoLumaCheckout(page) : new CustomCheckout(page);
  }
}
