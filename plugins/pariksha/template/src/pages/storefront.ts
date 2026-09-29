import type { Locator, Page } from '@playwright/test';
import type { ProductRef, SelectorMap } from '../config/types';

/**
 * Page objects expose locators and actions. Assertions stay in tests.
 * All selectors come from the SelectorMap, so a new theme is a config change, not a code change.
 */

export class Header {
  constructor(private readonly page: Page, private readonly s: SelectorMap) {}

  logo(): Locator {
    return this.page.locator(this.s.logo).first();
  }

  miniCartCount(): Locator {
    return this.page.locator(this.s.miniCartCount).first();
  }

  async search(term: string): Promise<void> {
    if (this.s.searchOpen) await this.page.locator(this.s.searchOpen).first().click();
    const input = this.page.locator(this.s.searchInput).first();
    await input.fill(term);
    await input.press('Enter');
  }
}

export class Listing {
  constructor(private readonly page: Page, private readonly s: SelectorMap) {}

  searchResults(): Locator {
    return this.page.locator(this.s.searchResult);
  }

  categoryProducts(): Locator {
    return this.page.locator(this.s.categoryProduct);
  }
}

export class ProductPage {
  constructor(private readonly page: Page, private readonly s: SelectorMap) {}

  async open(product: ProductRef): Promise<void> {
    await this.page.goto(product.path);
  }

  price(): Locator {
    return this.page.locator(this.s.pdpPrice).first();
  }

  addToCartButton(): Locator {
    return this.page.locator(this.s.pdpAddToCart).first();
  }

  outOfStock(): Locator {
    return this.page.locator(this.s.pdpOutOfStock).first();
  }

  async addToCart(qty = 1): Promise<void> {
    if (qty !== 1) await this.page.locator(this.s.pdpQty).first().fill(String(qty));
    const added = this.page.waitForResponse(
      (r) => r.url().includes(this.s.addToCartRequest) && r.request().method() === 'POST',
    );
    await this.addToCartButton().click();
    await added;
  }
}

export class CartPage {
  constructor(private readonly page: Page, private readonly s: SelectorMap) {}

  async open(): Promise<void> {
    await this.page.goto(this.s.cartPath);
  }

  lines(): Locator {
    return this.page.locator(this.s.cartLine);
  }

  subtotal(): Locator {
    return this.page.locator(this.s.cartSubtotal).first();
  }

  grandTotal(): Locator {
    return this.page.locator(this.s.cartGrandTotal).first();
  }

  empty(): Locator {
    return this.page.locator(this.s.cartEmpty).first();
  }

  async setQty(line: number, qty: number): Promise<void> {
    const input = this.lines().nth(line).locator(this.s.cartLineQty);
    await input.fill(String(qty));
    if (this.s.cartUpdate) await this.page.locator(this.s.cartUpdate).first().click();
    else await input.press('Enter');
  }

  async remove(line: number): Promise<void> {
    await this.lines().nth(line).locator(this.s.cartLineRemove).first().click();
  }

  canApplyCoupon(): boolean {
    return Boolean(this.s.couponInput && this.s.couponApply);
  }

  async applyCoupon(code: string): Promise<void> {
    if (!this.s.couponInput || !this.s.couponApply) throw new Error('Theme has no cart coupon form. Set couponInput/couponApply.');
    if (this.s.couponToggle) {
      const input = this.page.locator(this.s.couponInput).first();
      if (!(await input.isVisible())) await this.page.locator(this.s.couponToggle).first().click();
    }
    await this.page.locator(this.s.couponInput).first().fill(code);
    await this.page.locator(this.s.couponApply).first().click();
  }
}

export class AccountPage {
  constructor(private readonly page: Page, private readonly s: SelectorMap) {}

  async login(email: string, password: string): Promise<void> {
    await this.page.goto(this.s.loginPath);
    await this.page.locator(this.s.loginEmail).first().fill(email);
    await this.page.locator(this.s.loginPassword).first().fill(password);
    await this.page.locator(this.s.loginSubmit).first().click();
  }

  marker(): Locator {
    return this.page.locator(this.s.accountMarker).first();
  }
}
