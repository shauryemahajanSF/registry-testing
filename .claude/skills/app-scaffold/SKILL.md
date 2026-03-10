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

Generate the following structure when the developer wants a frontend-only Commerce App:

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
│   └── extensions/
│       └── <extension-name>/
│           ├── target-config.json
│           ├── components/
│           │   └── <component-name>/
│           │       ├── index.tsx
│           │       └── stories/
│           │           └── index.stories.tsx
│           ├── locales/
│           │   └── en-GB.json
│           └── tests/
│               └── <component-name>.test.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Key Files to Generate

**target-config.json** — Registers components to UI Target extension points:

```json
{
  "components": [
    {
      "targetId": "<target-id>",
      "path": "extensions/<extension-name>/components/<component-name>/index.tsx",
      "order": 0
    }
  ]
}
```

Ask the developer which UI Target they want to use. Refer to the `ui-targets` skill for the complete list of available targets.

**Component (index.tsx)** — Starter component following all conventions:

```tsx
/*
 * Copyright (c) 2025 Salesforce, Inc.
 * Licensed under the Apache License, Version 2.0
 */

'use client';

import { type ReactElement } from 'react';

export default function MyComponent(): ReactElement {
  return (
    <div data-slot="my-component">
      {/* Component content */}
    </div>
  );
}
```

**Storybook story (stories/index.stories.tsx)** — Starter story:

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

**Translations (locales/en-GB.json)** — Starter translations file:

```json
{
  "extensionName": {
    "title": "My Component",
    "description": "Description text"
  }
}
```

**package.json** — Project dependencies:

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

Generate both the frontend and backend structures combined:

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
│   └── extensions/
│       └── <extension-name>/
│           ├── target-config.json
│           ├── components/
│           │   └── <component-name>/
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

This combines both structures. The frontend and backend components can reference each other conceptually but run in different environments (browser vs Commerce Cloud server).

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
4. **UI Target** (if frontend) — Which UI Target extension point? Refer to `ui-targets` skill for options.
5. **Hook domain** (if backend) — Which hook interfaces? Refer to `api-adapters` skill for available hooks.

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
