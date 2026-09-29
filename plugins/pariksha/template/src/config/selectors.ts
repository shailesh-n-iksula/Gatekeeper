import type { ClientConfig, SelectorMap, Theme } from './types';

/**
 * Default selectors per theme. They match the stock theme. Every client customises
 * something, so run `npm run doctor` on onboarding and override in client.config.ts.
 *
 * Preference order for overrides: data-testid > role/label > stable id/name > class.
 */
const luma: SelectorMap = {
  logo: 'a.logo',
  searchInput: '#search',
  searchResult: '.search.results .product-item',
  categoryProduct: '.products-grid .product-item',
  miniCartCount: '.minicart-wrapper .counter-number',
  pdpPrice: '.product-info-main [data-price-type="finalPrice"] .price',
  pdpAddToCart: '#product-addtocart-button',
  pdpQty: '#qty',
  pdpOutOfStock: '.product-info-main .stock.unavailable',
  addToCartRequest: 'checkout/cart/add',
  cartPath: 'checkout/cart/',
  cartLine: '#shopping-cart-table tbody.cart.item',
  cartLineQty: 'input.qty',
  cartLineRemove: '.action-delete',
  cartUpdate: 'button.action.update',
  cartSubtotal: '.cart-totals .totals.sub .price',
  cartGrandTotal: '.cart-totals .grand.totals .price',
  cartEmpty: '.cart-empty',
  couponToggle: '#block-discount-heading',
  couponInput: '#coupon_code',
  couponApply: '#discount-coupon-form button.action.apply',
  loginPath: 'customer/account/login/',
  loginEmail: '#email',
  loginPassword: '#pass',
  loginSubmit: '#send2',
  accountMarker: '.block-dashboard-info',
  overlayDismiss: [],
  visualMask: ['.price-box', '.block-viewed-products-grid', '.widget.block-products-list'],
};

// Hyvä: storefront markup verified against Hyvä 1.3 default theme. Checkout is Luma
// fallback or Hyvä Checkout (a different flow). Use checkoutFlow: 'custom' for the latter.
const hyva: SelectorMap = {
  ...luma,
  miniCartCount: '#menu-cart-icon span',
  pdpPrice: '.product-info-main .final-price .price',
  pdpOutOfStock: '.product-info-main .stock.unavailable, .product-info-main [title="Out of stock"]',
  cartLine: '#shopping-cart-table .cart.item, form#form-validate .cart.item',
  cartSubtotal: '#cart-totals [data-th="Subtotal"] .price, .cart-summary .totals.sub .price',
  cartGrandTotal: '#cart-totals .grand.totals .price, .cart-summary .grand.totals .price',
  couponToggle: undefined,
};

const dawn: SelectorMap = {
  logo: '.header__heading-link',
  searchOpen: 'details-modal.header__search summary',
  searchInput: '#Search-In-Modal',
  searchResult: '#product-grid .grid__item',
  categoryProduct: '#product-grid .grid__item',
  miniCartCount: '#cart-icon-bubble .cart-count-bubble span[aria-hidden="true"]',
  pdpPrice: '.product__info-container .price-item--last',
  pdpAddToCart: 'product-form button[name="add"]',
  pdpQty: 'input[name="quantity"]',
  pdpOutOfStock: 'product-form button[name="add"][disabled]',
  addToCartRequest: 'cart/add',
  cartPath: 'cart',
  cartLine: 'cart-items .cart-item',
  cartLineQty: 'input.quantity__input',
  cartLineRemove: 'cart-remove-button',
  cartSubtotal: '.totals__total-value',
  cartGrandTotal: '.totals__total-value',
  cartEmpty: 'cart-items.is-empty, .cart__warnings',
  loginPath: 'account/login',
  loginEmail: '#CustomerEmail',
  loginPassword: '#CustomerPassword',
  loginSubmit: '#customer_login button',
  accountMarker: '.customer.account',
  overlayDismiss: [],
  visualMask: ['.price', 'product-recommendations'],
};

const BY_THEME: Record<Exclude<Theme, 'custom'>, SelectorMap> = { luma, hyva, dawn };

export function selectorsFor(cfg: ClientConfig): SelectorMap {
  const base = cfg.theme === 'custom' ? (cfg.platform === 'shopify' ? dawn : luma) : BY_THEME[cfg.theme];
  return { ...base, ...cfg.selectors } as SelectorMap;
}
