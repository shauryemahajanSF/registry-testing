# UI Targets for Commerce Apps

You are helping a developer register Commerce App components to UI Targets — named extension points in Storefront Next storefronts where third-party components render. The developer is likely an ISV partner who needs to know which targets exist, how to register components to them, and how the build-time replacement system works.

**Key context: UI Targets are build-time placeholders.** At build time, a Vite plugin scans every extension's `target-config.json`, finds all `<UITarget>` elements in the storefront source, and replaces them with the registered components. There is zero runtime overhead — the transformation happens entirely during the build. The ISV developer's job is to write the component (see SKILL-1: storefront-components) and declare which target it belongs to in `target-config.json`.

## Platform Syntax (Update When Finalized)

These values are placeholders or based on current codebase patterns. Update them when technical architects finalize the syntax.

```
# UI Target naming pattern
# Checkout uses hierarchical dot notation:
#   checkout.{section}.{position}
#   checkout.{section}.{subsection}.{position}
#   position = before | after
#   Examples: checkout.payment.before, checkout.orderSummary.tax.after
#
# Other pages use similar dot notation but are less standardized:
#   header.before.cart
#   footer.{section}.{position}  (position = start | end)
#   pdp.after.addToCart
#   orderSummary.{lineItem}.{position}
#   myCart.header.before
#
# Planned sfdc.* namespace (not yet in use):
#   sfdc.checkout.shipping.address-form.after
#   sfdc.pdp.ratingsreviews.starrating
#   sfdc.cart.promotions.banner
UI_TARGET_PATTERN = <namespace finalization pending>

# Extension directory and config file
EXTENSION_PATH = src/extensions/<extension-name>/
TARGET_CONFIG_FILE = target-config.json
```

## How UI Targets Work

### The Three Pieces

1. **`<UITarget>` placeholder** — a React component in the storefront source that marks where extension components can render
2. **`target-config.json`** — a file in each extension that declares which targets to inject into
3. **Vite plugin** (`transformTargetPlaceholderPlugin`) — scans extensions at build time, replaces `<UITarget>` placeholders with actual components

### Build-Time Transformation

The ISV never interacts with the build plugin directly, but understanding the transformation helps explain what happens:

```
Developer writes component → declares target in target-config.json
                                        ↓
                              Vite build starts
                                        ↓
                    Plugin scans all extensions for target-config.json
                                        ↓
                    Builds registry: targetId → [components sorted by order]
                                        ↓
                    For each source file with <UITarget>:
                      - Replaces <UITarget> with registered components
                      - Generates import statements automatically
                                        ↓
                    Final build output has no UITarget elements —
                    only the actual components
```

### Three Replacement Scenarios

| Scenario | What Happens |
|----------|-------------|
| Target has registered components | `<UITarget>` replaced with the component(s) |
| Target has no components but has children | `<UITarget>` replaced with its children (platform default) |
| Target has no components and no children | `<UITarget>` removed entirely |

## target-config.json

Every extension must have a `target-config.json` in its root directory. This is how the ISV declares where components render.

### Schema

```json
{
  "components": [
    {
      "targetId": "footer.ourcompany.start",
      "path": "extensions/my-extension/components/footer/index.tsx",
      "order": 0
    }
  ],
  "contextProviders": [
    {
      "path": "extensions/my-extension/providers/my-provider.tsx",
      "order": 0
    }
  ]
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `components` | Array | Yes | Components to inject into targets |
| `components[].targetId` | String | Yes | The UI Target identifier to inject into |
| `components[].path` | String | Yes | Relative path from project `src/` to the component file |
| `components[].order` | Number | No | Render order when multiple components target the same ID (default: 0, ascending) |
| `contextProviders` | Array | No | React context providers to inject at the application root |
| `contextProviders[].path` | String | Yes | Relative path from project `src/` to the provider component |
| `contextProviders[].order` | Number | No | Provider nesting order (default: 0, ascending — lower numbers wrap outer) |

### Example: Single Target

```json
{
  "components": [
    {
      "targetId": "checkout.payment.after",
      "path": "extensions/fraud-check/components/fraud-verification/index.tsx",
      "order": 0
    }
  ]
}
```

### Example: Multiple Targets with Context Provider

```json
{
  "components": [
    {
      "targetId": "footer.ourcompany.start",
      "path": "extensions/store-locator/components/footer/index.tsx",
      "order": 0
    },
    {
      "targetId": "header.before.cart",
      "path": "extensions/store-locator/components/header/store-locator-badge.tsx",
      "order": 0
    }
  ],
  "contextProviders": [
    {
      "path": "extensions/store-locator/providers/store-locator.tsx",
      "order": 0
    }
  ]
}
```

### Path Convention

Paths in `target-config.json` are relative to the project's `src/` directory:
- Component at `src/extensions/my-app/components/widget/index.tsx` → path: `"extensions/my-app/components/widget/index.tsx"`
- Provider at `src/extensions/my-app/providers/my-provider.tsx` → path: `"extensions/my-app/providers/my-provider.tsx"`

### Component Requirements

- Components referenced in `target-config.json` must use `export default`
- Components can be server or client components (use `'use client'` for interactivity)
- Component file names follow kebab-case directories with `index.tsx` main files
- See SKILL-1: storefront-components for full component authoring conventions

## Available UI Targets

These are the targets currently defined in the Storefront Next codebase. Each target is a `<UITarget>` element in the storefront source where your component can render.

### Target Types

Targets come in two forms:

**Position targets** (`.before`, `.after`, `.start`, `.end`) — inject content adjacent to an existing platform component:
```
checkout.payment.before    ← your component renders BEFORE the payment section
[Platform Payment Component]
checkout.payment.after     ← your component renders AFTER the payment section
```

**Wrapper targets** (no position suffix, have children) — can replace the platform's default component:
```
checkout.payment           ← your component REPLACES the default payment component
```

When a wrapper target has a registered component, the platform's default component (passed as children) is replaced by your component. When no component is registered, the platform default renders normally.

### Header Targets

| Target ID | Location | Type |
|-----------|----------|------|
| `header.before.cart` | Between search and user actions in the header | Position |

### Footer Targets

| Target ID | Location | Type |
|-----------|----------|------|
| `footer.customersupport.start` | Beginning of Customer Support links list | Position |
| `footer.customersupport.end` | End of Customer Support links list | Position |
| `footer.account.start` | Beginning of Account links section | Position |
| `footer.account.end` | End of Account links section | Position |
| `footer.ourcompany.start` | Beginning of Our Company links section | Position |
| `footer.ourcompany.end` | End of Our Company links section | Position |

### Product Detail Page (PDP) Targets

| Target ID | Location | Type |
|-----------|----------|------|
| `pdp.after.addToCart` | After the Add to Cart button | Position |

### Checkout Page Targets

The checkout page has the most extensive target coverage. Targets are organized by section:

#### Page-Level

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.page.before` | Very start of the checkout page | Position |
| `checkout.page.after` | Very end of the checkout page | Position |
| `checkout.mainContent.before` | Start of the main content column | Position |
| `checkout.mainContent.after` | End of the main content column | Position |

#### Express Payments Section

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.expressPayments.header.before` | Before section header | Position |
| `checkout.expressPayments.before` | Before ExpressPayments component | Position |
| `checkout.expressPayments` | Wraps ExpressPayments component | Wrapper |
| `checkout.expressPayments.after` | After ExpressPayments component | Position |

#### Contact Info Section

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.contactInfo.header.before` | Before section header | Position |
| `checkout.contactInfo.before` | Before ContactInfo component | Position |
| `checkout.contactInfo` | Wraps ContactInfo component | Wrapper |
| `checkout.contactInfo.after` | After ContactInfo component | Position |

#### Shipping Address Section

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.shippingAddress.header.before` | Before section header | Position |
| `checkout.shippingAddress.before` | Before ShippingAddress component | Position |
| `checkout.shippingAddress` | Wraps ShippingAddress component | Wrapper |
| `checkout.shippingAddress.after` | After ShippingAddress component | Position |
| `checkout.shippingAddress.autocomplete` | Wraps address autocomplete dropdown | Wrapper |

#### Shipping Options Section

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.shippingOptions.header.before` | Before section header | Position |
| `checkout.shippingOptions.before` | Before ShippingOptions component | Position |
| `checkout.shippingOptions` | Wraps ShippingOptions component | Wrapper |
| `checkout.shippingOptions.after` | After ShippingOptions component | Position |

#### Payment Section

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.payment.header.before` | Before section header | Position |
| `checkout.payment.before` | Before Payment component | Position |
| `checkout.payment` | Wraps Payment component | Wrapper |
| `checkout.payment.after` | After Payment component | Position |
| `checkout.payment.paymentMethods.before` | Before payment method selection | Position |
| `checkout.payment.paymentMethods` | Wraps payment method selection UI | Wrapper |
| `checkout.payment.paymentMethods.after` | After payment method selection | Position |
| `checkout.payment.billingAddress.before` | Before billing address form | Position |
| `checkout.payment.billingAddress` | Wraps billing address form | Wrapper |
| `checkout.payment.billingAddress.after` | After billing address form | Position |
| `checkout.payment.billingAddress.autocomplete` | Wraps billing address autocomplete | Wrapper |

#### Create Account Section

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.createAccount.before` | Before guest account creation | Position |
| `checkout.createAccount` | Wraps GuestAccountCreation component | Wrapper |
| `checkout.createAccount.after` | After guest account creation | Position |

#### Place Order Section

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.placeOrder.before` | Before place order button | Position |
| `checkout.placeOrder` | Wraps place order form/button | Wrapper |
| `checkout.placeOrder.after` | After place order button | Position |

#### Sidebar / Order Summary

| Target ID | Location | Type |
|-----------|----------|------|
| `checkout.sidebar.before` | Before the order summary sidebar | Position |
| `checkout.sidebar.after` | After the order summary sidebar | Position |
| `checkout.orderSummary.before` | Before OrderSummary inside sidebar card | Position |
| `checkout.orderSummary` | Wraps OrderSummary component | Wrapper |
| `checkout.orderSummary.after` | After OrderSummary component | Position |
| `checkout.myCart.header.before` | Before "Order Summary" heading | Position |
| `checkout.myCart.before` | Before My Cart section in sidebar | Position |
| `checkout.myCart` | Wraps MyCartWithData component | Wrapper |
| `checkout.myCart.after` | After My Cart section | Position |

### Order Summary Line Item Targets

These targets allow injection around individual order summary line items:

| Target ID | Location | Type |
|-----------|----------|------|
| `orderSummary.subtotal.before` | Before subtotal line | Position |
| `orderSummary.subtotal` | Wraps subtotal display | Wrapper |
| `orderSummary.subtotal.after` | After subtotal line | Position |
| `orderSummary.adjustments.before` | Before price adjustments/promotions | Position |
| `orderSummary.adjustments` | Wraps adjustment items | Wrapper |
| `orderSummary.adjustments.after` | After price adjustments | Position |
| `orderSummary.shipping.before` | Before shipping cost line | Position |
| `orderSummary.shipping` | Wraps shipping display | Wrapper |
| `orderSummary.shipping.after` | After shipping line | Position |
| `orderSummary.tax.before` | Before tax line | Position |
| `orderSummary.tax` | Wraps tax display | Wrapper |
| `orderSummary.tax.after` | After tax line | Position |
| `orderSummary.total.before` | Before order total | Position |
| `orderSummary.total` | Wraps order total display | Wrapper |
| `orderSummary.total.after` | After order total | Position |
| `orderSummary.promoCode.before` | Before promo code form | Position |
| `orderSummary.promoCode` | Wraps promo code form | Wrapper |
| `orderSummary.promoCode.after` | After promo code form | Position |

### My Cart Targets

| Target ID | Location | Type |
|-----------|----------|------|
| `myCart.header.before` | Before My Cart accordion header | Position |

## Ordering: Multiple Components on the Same Target

When multiple Commerce Apps register components for the same target, the `order` field controls render sequence:

```json
// App A: Gift Card Extension
{
  "components": [{
    "targetId": "orderSummary.adjustments.after",
    "path": "extensions/gift-card/components/balance-display/index.tsx",
    "order": 0
  }]
}

// App B: Loyalty Extension
{
  "components": [{
    "targetId": "orderSummary.adjustments.after",
    "path": "extensions/loyalty/components/points-earned/index.tsx",
    "order": 1
  }]
}
```

Result: Gift card component renders first (order 0), loyalty component renders second (order 1). Multiple components on the same target are wrapped in a React fragment:

```tsx
<>
  <GiftCard_BalanceDisplay />
  <Loyalty_PointsEarned />
</>
```

## Context Providers

If your extension needs shared state across multiple components (e.g., a store locator that shows data in both header and footer), register a context provider:

```json
{
  "components": [
    { "targetId": "header.before.cart", "path": "extensions/store-locator/components/header/store-locator-badge.tsx", "order": 0 },
    { "targetId": "footer.ourcompany.start", "path": "extensions/store-locator/components/footer/index.tsx", "order": 0 }
  ],
  "contextProviders": [
    { "path": "extensions/store-locator/providers/store-locator.tsx", "order": 0 }
  ]
}
```

### How Context Providers Work

- Context providers are injected at the application root via the `<TargetProviders>` component in `root.tsx`
- At build time, `<TargetProviders>` is replaced with nested provider components from all extensions
- Lower `order` values wrap outer (closer to root), higher values wrap inner (closer to children)
- Provider components must use `export default` and accept `children` as a prop
- Providers are `'use client'` components (they use React context, which requires client-side rendering)

### Provider Pattern

```tsx
'use client';

import { createContext, type PropsWithChildren, useContext, useRef } from 'react';

// Create context
const MyAppContext = createContext<MyAppStore | undefined>(undefined);

// Provider component (must be default export)
export default function MyAppProvider({ children }: PropsWithChildren) {
    const storeRef = useRef<MyAppStore | null>(null);
    if (storeRef.current === null) {
        storeRef.current = createMyAppStore();
    }
    return (
        <MyAppContext.Provider value={storeRef.current}>
            {children}
        </MyAppContext.Provider>
    );
}

// Hook for consuming the context
export function useMyApp() {
    const context = useContext(MyAppContext);
    if (!context) {
        throw new Error('useMyApp must be used within MyAppProvider');
    }
    return context;
}
```

## Choosing the Right Target

### ISV Use Cases and Recommended Targets

| ISV Domain | Likely Targets | Example |
|------------|---------------|---------|
| Tax calculation | `orderSummary.tax` (wrapper), `checkout.orderSummary.after` | Replace tax display with provider-calculated tax |
| Fraud prevention | `checkout.payment.after` | Add fraud verification challenge after payment |
| Address verification | `checkout.shippingAddress.after` | Add address validation UI |
| Shipping/delivery estimates | `checkout.shippingOptions.before`, `pdp.after.addToCart` | Show delivery date estimates |
| Gift cards | `orderSummary.adjustments.after`, `checkout.payment.before` | Gift card balance and redemption |
| Loyalty/rewards | `orderSummary.subtotal.after`, `checkout.placeOrder.before` | Show points earned, redemption option |
| Ratings & reviews | `pdp.after.addToCart` | Star rating, review summary |
| Store locator | `header.before.cart`, `footer.ourcompany.start` | Store finder badge and link |
| Payment providers | `checkout.payment.paymentMethods` (wrapper) | Replace or extend payment method selection |
| Buy Now Pay Later | `pdp.after.addToCart`, `checkout.payment.after` | BNPL messaging and payment option |

### Position vs Wrapper: When to Use Each

**Use position targets** (`.before`, `.after`) when you want to:
- Add content next to an existing platform component
- Display supplementary information (badges, messages, verification results)
- Insert a new UI section without modifying platform defaults

**Use wrapper targets** (no position suffix) when you want to:
- Replace a platform component entirely with your own implementation
- Wrap a platform component with additional behavior
- Provide an alternative implementation (e.g., a third-party payment form replacing the default)

## Extension File Structure

For reference, a complete extension targeting multiple slots looks like this:

```
src/extensions/my-app/
  target-config.json              # Declares targets and providers
  components/
    checkout-widget/
      index.tsx                   # Component for checkout target
      stories/
        index.stories.tsx         # Storybook story
    header-badge/
      index.tsx                   # Component for header target
      stories/
        index.stories.tsx
  providers/                      # Optional: shared state
    my-app-provider.tsx
  hooks/                          # Optional: custom hooks
    use-my-app-data.ts
  locales/                        # Optional: i18n
    en-GB.json
```

## What Does NOT Exist Yet

- **`sfdc.*` UI Target namespace** — planned but not yet in use. Current targets use names like `checkout.payment.after`, `footer.ourcompany.start`
- **PLP, Account, Home, Content page targets** — not in the current codebase
- **`target-config.json.snippet`** — the ISV Developer Guide references this file name, but the actual file is `target-config.json`
- **Runtime target registration** — targets are resolved entirely at build time. There is no runtime API to register or modify targets
- **Target discovery CLI** — no `app targets list` or similar command exists yet to browse available targets

## What NOT to Do

- Do not invent target IDs — only use IDs that exist in the storefront source. If a target doesn't exist for your use case, the component simply won't render
- Do not rely on the `sfdc.*` namespace yet — use the target IDs listed in this skill
- Do not assume wrapper targets pass children to your component — when you register a wrapper target, your component fully replaces the platform default
- Do not omit `export default` from components referenced in `target-config.json` — the build system imports them as default exports
- Do not put non-component files in the `path` field — it must point to a React component file
- Do not forget the `order` field when multiple components may target the same ID — without explicit ordering, render sequence is unpredictable
- Do not create context providers unless your extension has multiple components that need shared state — a single-target extension doesn't need one
