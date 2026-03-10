# Commerce App Scaffolding

You are helping a developer scaffold a new Commerce App project from scratch. The developer is likely an ISV partner who needs a working project structure with the correct directory layout, configuration files, and development tooling in place before they start writing code.

**Key context: This skill replaces the `b2c-cli app scaffold` command until CLI tooling is available.** When the CLI ships, this skill will complement it by providing AI-assisted scaffolding. Until then, Claude can generate the full project structure directly.

## What You Are Building

A Commerce App project is a standalone repository that an ISV developer works in locally. It contains some combination of:

- **Frontend extensions** — React components that render in UI Target slots on the merchant's storefront
- **Backend adapters** — Script API hook implementations that run on Commerce Cloud (cartridges)
- **IMPEX configuration** — XML files that configure the merchant's environment (custom attributes, service credentials, site preferences)
- **App configuration** — Post-install setup guidance for merchants
- **CAP packaging** — Metadata files for registry submission

The project is NOT inside the merchant's storefront repo. It is a separate codebase that produces a CAP (Commerce App Package) ZIP file for distribution.

## Three Project Types

Ask the developer which type of Commerce App they are building:

### 1. UI Target Only

Frontend-only app that adds UI components to a storefront. No backend logic.

**Example use cases:** Ratings & reviews widget, store locator overlay, loyalty points badge, announcement banner, gift card entry field.

### 2. API Adapter Only

Backend-only app that implements platform-defined hook interfaces. No frontend UI.

**Example use cases:** Tax calculation provider (Avalara, Vertex), fraud detection service, address verification, payment gateway adapter.

### 3. Full App (UI + Backend)

Combined frontend components and backend adapters working together.

**Example use cases:** Shipping estimator (backend fetches rates, frontend displays options), BNPL provider (backend processes payment, frontend renders widget), loyalty program (backend manages points, frontend shows balance and redemption UI).

## Scaffolding: UI Target Project

Commerce Apps typically span multiple pages and multiple UI Targets. A single app might render a tax badge after payment, a line item in the order summary, and an informational banner on the PDP — all from the same extension.

### Step 1: Target Selection (Multi-Select)

Ask the developer which UI Targets they need. Most apps target more than one. Present targets grouped by page and let them select multiple:

**Checkout targets:**
- `checkout.expressPayments` (wrapper) — replaces ExpressPayments
- `checkout.contactInfo` (wrapper) — replaces ContactInfo
- `checkout.shippingAddress` (wrapper) — replaces ShippingAddress
- `checkout.shippingOptions` (wrapper) — replaces ShippingOptions
- `checkout.payment` (wrapper) — replaces Payment
- `checkout.payment.paymentMethods` (wrapper) — replaces payment method selector
- `checkout.payment.billingAddress` (wrapper) — replaces billing address form
- `checkout.placeOrder` (wrapper) — replaces place order button
- `checkout.orderSummary` (wrapper) — replaces OrderSummary card
- `checkout.myCart` (wrapper) — replaces MyCart accordion
- Position targets: `checkout.page.before/after`, `checkout.payment.before/after`, etc.

**Order Summary targets:**
- `orderSummary.subtotal` / `.shipping` / `.tax` / `.total` / `.promoCode` (wrapper) — replace line item display
- Position targets: `orderSummary.*.before/after`

**PDP targets:**
- `pdp.after.addToCart` (wrapper) — replaces BuyNowPayLater

**Header / Footer targets:**
- `header.before.cart` (position)
- `footer.customersupport.start/end`, `footer.account.start/end`, `footer.ourcompany.start/end` (position)

Refer to the `ui-targets` skill for the full list with descriptions.

### Step 2: OOTB Component Inclusion

For **wrapper targets**, the storefront has a default (OOTB) component that renders when no extension replaces it. When the developer selects a wrapper target, include the OOTB component as a starting point they can customize.

| Wrapper Target | OOTB Component | ShadCN Primitives It Uses |
|---------------|----------------|--------------------------|
| `checkout.expressPayments` | ExpressPayments | Button |
| `checkout.contactInfo` | ContactInfo | Input, NativeSelect, Button, Form |
| `checkout.shippingAddress` | ShippingAddress | Button, Form |
| `checkout.shippingOptions` | ShippingOptions | RadioGroup, RadioGroupItem, Label, Button |
| `checkout.payment` | Payment | RadioGroup, Checkbox, Separator, Form |
| `checkout.payment.paymentMethods` | PaymentMethods | RadioGroup, RadioGroupItem, Label, Separator |
| `checkout.payment.billingAddress` | BillingAddress | Checkbox, Form |
| `checkout.placeOrder` | PlaceOrderButton | Button |
| `checkout.orderSummary` | OrderSummary | Card, CardHeader, CardTitle, CardContent |
| `checkout.myCart` | MyCart | Accordion, AccordionItem, AccordionTrigger, AccordionContent |
| `orderSummary.promoCode` | PromoCodeForm | Separator |
| `pdp.after.addToCart` | BuyNowPayLater | (custom) |

For **position targets** (`.before`, `.after`, `.start`, `.end`), there is no OOTB component — the developer starts with an empty component since they are adding new content.

### Step 3: ShadCN Dependency Resolution

Based on the selected targets and their OOTB components, automatically include the required ShadCN UI primitives in `src/components/ui/`. Collect the union of all ShadCN components needed:

| If developer selects... | Include these in `src/components/ui/` |
|------------------------|--------------------------------------|
| Any checkout section | `button`, `form`, `input`, `label` |
| `checkout.payment` or `checkout.payment.paymentMethods` | + `radio-group`, `checkbox`, `separator` |
| `checkout.shippingOptions` | + `radio-group` |
| `checkout.orderSummary` | + `card` |
| `checkout.myCart` | + `accordion` |
| `checkout.contactInfo` | + `native-select` |
| `orderSummary.promoCode` | + `separator` |

Also include `@/lib/utils.ts` (the `cn()` helper) which every ShadCN component depends on.

The developer can also request additional ShadCN components beyond what the targets require. The full set of 29 available components is listed in the `storefront-components` skill.

### Step 4: Generate Project Structure

```
my-commerce-app/
├── .claude/
│   └── skills/                          # Copy all skills from registry
├── .cursor/
│   └── rules/                           # Copy all rules from registry
├── .devcontainer/
│   └── devcontainer.json
├── .github/
│   └── workflows/
│       └── commerce-app-ci.yml
├── .storybook/
│   ├── main.ts
│   └── preview.tsx
├── src/
│   ├── components/
│   │   └── ui/                          # ShadCN primitives (auto-selected)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── ...                      # Based on target dependency resolution
│   │       └── separator.tsx
│   ├── lib/
│   │   └── utils.ts                     # cn() helper (always included)
│   └── extensions/
│       └── <extension-name>/
│           ├── target-config.json       # Multi-target registration
│           ├── components/
│           │   ├── <component-1>/       # One per target (or more)
│           │   │   ├── index.tsx
│           │   │   └── stories/
│           │   │       └── index.stories.tsx
│           │   └── <component-2>/
│           │       ├── index.tsx
│           │       └── stories/
│           │           └── index.stories.tsx
│           ├── locales/
│           │   └── en-GB.json
│           └── tests/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Key Files to Generate

**target-config.json** — Multi-target registration:

An app targeting three UI Targets across two pages:

```json
{
  "components": [
    {
      "targetId": "checkout.payment.after",
      "path": "extensions/my-tax-app/components/tax-badge/index.tsx",
      "order": 0
    },
    {
      "targetId": "orderSummary.tax",
      "path": "extensions/my-tax-app/components/tax-line-item/index.tsx",
      "order": 0
    },
    {
      "targetId": "pdp.after.addToCart",
      "path": "extensions/my-tax-app/components/tax-estimate/index.tsx",
      "order": 0
    }
  ]
}
```

Generate one component directory per target entry. If the target is a wrapper, seed the component with the OOTB component's structure and ShadCN imports. If the target is a position, seed with an empty component shell.

**Component for a wrapper target (starts with OOTB structure):**

```tsx
/*
 * Copyright (c) 2025 Salesforce, Inc.
 * Licensed under the Apache License, Version 2.0
 */

'use client';

import { type ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// This component replaces the platform's default for this target.
// The OOTB component uses Card, CardHeader, CardTitle, CardContent.
// Customize as needed while maintaining the same semantic structure.
export default function MyOrderSummary(): ReactElement {
  return (
    <Card data-slot="my-order-summary">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your custom order summary content */}
      </CardContent>
    </Card>
  );
}
```

**Component for a position target (starts empty):**

```tsx
/*
 * Copyright (c) 2025 Salesforce, Inc.
 * Licensed under the Apache License, Version 2.0
 */

'use client';

import { type ReactElement } from 'react';

// This component adds content at the target position.
// It does not replace any existing component.
export default function TaxBadge(): ReactElement {
  return (
    <div data-slot="tax-badge">
      {/* Your content here */}
    </div>
  );
}
```

**Storybook story (stories/index.stories.tsx):**

```tsx
/*
 * Copyright (c) 2025 Salesforce, Inc.
 * Licensed under the Apache License, Version 2.0
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { waitForStorybookReady } from 'storybook/test';

import MyComponent from '../index';

const meta = {
  title: 'Extensions/MyExtension/MyComponent',
  component: MyComponent,
  tags: ['autodocs', 'interaction'],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitForStorybookReady(canvasElement);
    // Add interaction tests here
  },
};

export const Mobile: Story = {
  globals: { viewport: 'mobile2' },
};
```

**Translations (locales/en-GB.json):**

Generate keys for all components:

```json
{
  "myTaxApp": {
    "taxBadge": {
      "title": "Tax Badge"
    },
    "taxLineItem": {
      "title": "Tax Line Item"
    },
    "taxEstimate": {
      "title": "Tax Estimate"
    }
  }
}
```

**package.json** — Include Radix dependencies for selected ShadCN components:

```json
{
  "name": "<app-name>",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "vite build",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-i18next": "^15.0.0",
    "i18next": "^24.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "vite": "^6.0.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@storybook/react-vite": "^8.6.0",
    "storybook": "^8.6.0",
    "@storybook/addon-a11y": "^8.6.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

Add Radix dependencies based on selected ShadCN components. For example, if `accordion` is included, add `@radix-ui/react-accordion`. If `radio-group` is included, add `@radix-ui/react-radio-group`. Check the ShadCN component source files for exact Radix dependencies.

## Scaffolding: API Adapter Project

Generate the following structure when the developer wants a backend-only Commerce App:

```
my-commerce-app/
├── .claude/
│   └── skills/
├── .cursor/
│   └── rules/
├── .devcontainer/
│   └── devcontainer.json
├── .github/
│   └── workflows/
│       └── commerce-app-ci.yml
├── cartridges/
│   └── site_cartridges/
│       └── int_<appname>/
│           ├── cartridge/
│           │   └── scripts/
│           │       ├── hooks.json
│           │       ├── hooks/
│           │       │   └── <action>.js
│           │       └── helpers/
│           │           └── <appname>Helper.js
│           └── package.json
├── impex/
│   ├── install/
│   │   ├── meta/
│   │   │   └── system-objecttype-extensions.xml
│   │   ├── services.xml
│   │   └── sites/
│   │       └── SITEID/
│   │           └── preferences.xml
│   └── uninstall/
│       ├── meta/
│       │   └── system-objecttype-extensions.xml
│       └── services.xml
├── app-configuration/
│   └── tasksList.json
└── README.md
```

### Key Files to Generate

Ask the developer which domain they are building for. The tax domain is fully documented — refer to the `api-adapters` skill for complete implementation patterns.

**hooks.json** — Hook registration:

```json
{
  "hooks": [
    {
      "name": "dw.apps.checkout.tax.calculate",
      "script": "./hooks/calculate"
    },
    {
      "name": "dw.apps.checkout.tax.commit",
      "script": "./hooks/commit"
    },
    {
      "name": "dw.apps.checkout.tax.cancel",
      "script": "./hooks/cancel"
    }
  ]
}
```

Replace `tax.calculate/commit/cancel` with the appropriate hooks for the developer's domain.

**package.json** (cartridge level) — Must point to hooks.json:

```json
{
  "name": "int_<appname>",
  "hooks": "./cartridge/scripts/hooks.json"
}
```

**Hook implementation starter (hooks/calculate.js):**

```javascript
/*
 * Copyright (c) 2025 Salesforce, Inc.
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('myapp', 'hooks');

/**
 * Hook: dw.apps.checkout.tax.calculate
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Basket or order
 * @returns {dw.system.Status}
 */
exports.calculate = function (lineItemCtnr) {
    try {
        Transaction.wrap(function () {
            lineItemCtnr.updateTotals();
            // TODO: Implement calculation logic
            // See api-adapters skill for complete patterns
        });

        return new Status(Status.OK);
    } catch (e) {
        log.error('Calculate failed: {0}', e.message);
        // Never block checkout — return OK with fallback behavior
        return new Status(Status.OK);
    }
};
```

**tasksList.json** — Post-install merchant setup:

```json
{
  "tasks": [
    {
      "id": "configure-credentials",
      "title": "Configure API Credentials",
      "description": "Enter your API key and secret in Business Manager under Merchant Tools > Site Preferences > Custom Preferences > MyApp Settings.",
      "required": true
    },
    {
      "id": "import-metadata",
      "title": "Import Metadata",
      "description": "Import the IMPEX files from the impex/install/ directory using Business Manager > Administration > Site Development > Site Import & Export.",
      "required": true
    },
    {
      "id": "add-cartridge",
      "title": "Add Cartridge to Path",
      "description": "Add 'int_myapp' to your site's cartridge path in Business Manager > Administration > Sites > Manage Sites > [Your Site] > Settings.",
      "required": true
    }
  ]
}
```

## Scaffolding: Full App Project

A Full App combines multi-target frontend components with backend adapters. The frontend follows the same multi-target + OOTB component flow described above. The backend follows the API Adapter structure.

```
my-commerce-app/
├── .claude/
│   └── skills/
├── .cursor/
│   └── rules/
├── .devcontainer/
│   └── devcontainer.json
├── .github/
│   └── workflows/
│       └── commerce-app-ci.yml
├── .storybook/
│   ├── main.ts
│   └── preview.tsx
├── src/
│   ├── components/
│   │   └── ui/                          # ShadCN primitives (auto-selected)
│   ├── lib/
│   │   └── utils.ts                     # cn() helper
│   └── extensions/
│       └── <extension-name>/
│           ├── target-config.json       # Multi-target registration
│           ├── components/
│           │   ├── <component-1>/       # One or more per target
│           │   │   ├── index.tsx
│           │   │   └── stories/
│           │   │       └── index.stories.tsx
│           │   └── <component-2>/
│           │       ├── index.tsx
│           │       └── stories/
│           │           └── index.stories.tsx
│           ├── locales/
│           │   └── en-GB.json
│           └── tests/
├── cartridges/
│   └── site_cartridges/
│       └── int_<appname>/
│           ├── cartridge/
│           │   └── scripts/
│           │       ├── hooks.json
│           │       ├── hooks/
│           │       └── helpers/
│           └── package.json
├── impex/
│   ├── install/
│   └── uninstall/
├── app-configuration/
│   └── tasksList.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

The frontend and backend components can reference each other conceptually but run in different environments (browser vs Commerce Cloud server). For example, a tax app's backend adapter (`dw.apps.checkout.tax.calculate`) computes tax amounts on the server, and its frontend components display those amounts in `orderSummary.tax` and `checkout.payment.after` on the client.

## Naming Conventions

When scaffolding, apply these naming rules:

| Element | Convention | Example |
|---------|-----------|---------|
| Project/app name | kebab-case | `avalara-tax`, `yotpo-reviews` |
| Extension directory | kebab-case | `src/extensions/tax-display/` |
| Component directory | kebab-case | `components/tax-summary/` |
| Component file | `index.tsx` | `components/tax-summary/index.tsx` |
| Component name | PascalCase | `TaxSummary` |
| Story file | `stories/index.stories.tsx` | Fixed location |
| Test file | `*.test.tsx` | `tax-summary.test.tsx` |
| Cartridge name | `int_` + short name, max 50 chars | `int_avalara` |
| Hook file | action name | `hooks/calculate.js` |
| Helper file | `<appname>Helper.js` | `helpers/avalaraHelper.js` |
| Translation file | `en-GB.json` | Fixed name |
| CAP ZIP | `[name]-v[version].zip` | `avalara-tax-v1.0.0.zip` |

## What to Ask the Developer

Before scaffolding, gather these inputs:

1. **App name** — What is the name of the Commerce App? (kebab-case)
2. **Project type** — UI Target only, API Adapter only, or Full App?
3. **Domain** — What commerce domain does this app extend? (tax, shipping, payment, fraud, product, cart, etc.)
4. **UI Targets** (if frontend) — Which UI Target extension points does the app need? **Select all that apply** — most apps target multiple slots across multiple pages. Present the target list grouped by page (checkout, order summary, PDP, header, footer). For each selected wrapper target, the OOTB component and its ShadCN dependencies will be included automatically.
5. **Additional ShadCN components** (if frontend) — Beyond the ShadCN primitives that come with the selected targets, does the developer need any additional components? Show the full list of 29 from the `storefront-components` skill.
6. **Hook domain** (if backend) — Which hook interfaces? Refer to `api-adapters` skill for available hooks.

## After Scaffolding

Once the project is generated, point the developer to:

- **`storefront-components` skill** — For component authoring conventions (design tokens, ShadCN UI, accessibility)
- **`ui-targets` skill** — For available extension points and target-config.json
- **`api-adapters` skill** — For backend hook implementation patterns
- **`commerce-testing` skill** — For testing patterns (Vitest, Storybook play functions)
- **`cap-packaging` skill** — When ready to package for submission

## What NOT to Do

- Do NOT scaffold into the merchant's storefront repo — Commerce Apps are separate projects
- Do NOT include `node_modules/`, build artifacts, or IDE config in the scaffold
- Do NOT create a `tailwind.config.ts` — Tailwind CSS 4 uses `@theme inline` in CSS
- Do NOT hardcode any Salesforce release numbers in generated files
- Do NOT generate components with hardcoded colors or spacing values
- Do NOT skip the `impex/uninstall/` directory for backend projects — clean removal is required
- Do NOT use `importPackage()` in generated hook files — use `require('dw/...')`
- Do NOT generate components without `'use client'` directive — most extension components need it
- Do NOT skip Storybook stories — every component must have a `stories/` subdirectory
- Do NOT generate hook files that return `undefined` — always return `dw.system.Status`
