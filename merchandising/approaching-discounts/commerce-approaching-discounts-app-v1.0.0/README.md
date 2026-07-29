# Approaching Discounts

Show shoppers how close their basket is to unlocking order and shipping promotions.

## Overview

The Approaching Discounts app surfaces a progress banner that tells shoppers how much
more they need to spend to unlock the next order or shipping promotion — and celebrates
when a promotion has been achieved. It reads the basket's approaching-discounts data
(exposed by the Shopper Baskets SCAPI `expand=approaching_discounts`) and renders up to
a configurable number of banners.

## Features

- Progress banner toward the next order- or shipping-level promotion
- "Achieved" state when the basket already qualifies for a promotion
- Reads live basket data via the `approaching_discounts` SCAPI expansion
- Bundled for four storefront surfaces, each with its own Business Manager visibility toggle
- Localized copy across the supported storefront locales

## Prerequisites

- Salesforce Commerce Cloud B2C Commerce instance with Storefront Next `1.2.0` or later
- The Shopper Baskets SCAPI `expand=approaching_discounts` capability enabled on the instance

## Installation

1. Download the app from the Commerce App Registry
2. Import the app into your Commerce Cloud instance
3. Review the bundled storefront extension, then adjust each surface's visibility under
   Component Visibility (see the defaults below)

## Configuration

### Component Visibility

The banner is bundled for four storefront surfaces. Each has an independent visibility
toggle under Business Manager → Component Visibility, with these default states:

| Surface | Toggle | Default |
| --- | --- | --- |
| Checkout order summary (`sfcc.checkout.orderSummary.body.before`) | Show on Checkout | Off |
| Cart order summary (`sfcc.cart.orderSummary.body.before`) | Show on Cart Order Summary | On |
| Cart promotions region (`sfcc.cart.promotions.approachingDiscounts`) | Show on Cart Items | Off |
| Mini-cart promotions region (`sfcc.miniCart.promotions.approachingDiscounts`) | Show on Mini-Cart | On |

### Customization

The app can be customized by modifying:
- The banner presentation under `components/`
- The approaching/achieved derivation in `hooks/use-approaching-discounts-state.ts`
- Translation strings in the `locales/` directories

## Post-Installation Checklist

- [ ] Merge the storefront pull request (added automatically when a storefront is connected)
- [ ] Set up your approaching-discount promotions in Business Manager
- [ ] Verify the integration in your local environment — confirm the banner appears on the storefront
- [ ] Review each surface's visibility default under Component Visibility and adjust as needed

## Local Development (Storefront Next)

This app bundles a storefront extension under
`storefront-next/src/extensions/approaching-discounts/`. Extensions are not built on
their own — the template's Vite build discovers and compiles them. To preview locally,
copy the extension into your storefront-next project and run the dev server from the
project root:

```bash
# From your storefront-next project root
pnpm dev
```

The banner is bundled for four storefront surfaces; it ships visible on the cart order
summary and mini-cart, and hidden on checkout and the cart promotions region. Adjust each
surface under Component Visibility to preview it in the running app.

## Support

- Salesforce Help: https://help.salesforce.com/

## License

Copyright 2026 Salesforce, Inc. All rights reserved.
