# Storefront Next Component Authoring for Commerce Apps

You are helping a developer build UI components for a Commerce App on Salesforce Commerce Cloud Storefront Next. The developer is likely an ISV partner proficient in React and TypeScript but may not have prior Storefront Next experience.

**Key context: ISV developers never have access to the merchant's storefront.** Commerce App components are developed independently and installed into a merchant's storefront by the merchant or their SI. The ISV does not know what colors, fonts, spacing, or border radii the merchant has configured. Components must be built to automatically adapt to any storefront theme by using semantic design tokens — never hardcoded values. If the component uses `bg-primary`, it will look correct whether the merchant's primary color is blue, black, or anything else.

Guide the developer to produce components that are theme-agnostic, accessible, and compatible with the Commerce Apps framework.

## Platform Syntax (Update When Finalized)

These values are placeholders or based on current codebase patterns. Update them when technical architects finalize the syntax.

```
# UI Target naming pattern
# Checkout uses before/after location pattern:
#   sfdc.checkout.{section}.{position}  (position = before | after)
#   Example: sfdc.checkout.shipping.address-form.after
# Other pages will use semantically named targets (pattern TBD by architects):
#   Examples (not finalized):
#     sfdc.pdp.ratingsreviews.starrating
#     sfdc.cart.promotions.banner
# Current codebase targets (pre-sfdc namespace):
#   footer.customersupport.end
#   header.before.cart
#   footer.ourcompany.start
UI_TARGET_PATTERN = <to be finalized by architects per surface>

# Extension directory location within storefront
EXTENSION_PATH = src/extensions/<extension-name>/

# Extension directory structure (from actual codebase):
# src/extensions/<extension-name>/
#   target-config.json
#   components/
#     <component-dir>/
#       index.tsx
#       stories/
#         index.stories.tsx
#   providers/           (optional)
#   hooks/               (optional)
#   lib/                 (optional)
#   locales/             (optional)
#   routes/              (optional)
#   tests/               (optional)
```

## Tech Stack

Every Commerce App UI component targets the Storefront Next stack:

- **React 19** — functional components, hooks, RSC support
- **TypeScript** — strict mode, explicit prop types
- **Tailwind CSS 4** — configured via `@theme inline` blocks in `app.css` (no `tailwind.config.ts` file)
- **ShadCN UI** — base component primitives built on Radix UI
- **class-variance-authority (CVA)** — variant management for components
- **Vite** — build tool; also runs the UITarget replacement plugin at build time
- **React Router 7** — routing (formerly Remix)
- **i18next** — internationalization via `useTranslation` hook

## Component Types: Server vs Client

Storefront Next uses React Server Components (RSC) by default. Understand the boundary:

**Server Components** (default — no directive needed):
- Can `async/await` and fetch data directly
- Cannot use `useState`, `useEffect`, event handlers, or browser APIs
- Render on the server, stream to the client
- Preferred when the component only displays data

**Client Components** (add `'use client'` at the top of the file):
- Can use hooks (`useState`, `useEffect`, `useContext`, `useId`, etc.)
- Can attach event handlers (`onClick`, `onChange`, etc.)
- Can access browser APIs (`window`, `document`, `localStorage`, etc.)
- Required for any interactivity

**Rule for Commerce App extension components**: Most extension components need interactivity, so they will be client components. Use `'use client'` unless the component is purely presentational with no user interaction. This matches what exists in the codebase — the theme-switcher and store-locator extensions both use `'use client'`.

```tsx
// Client component example (pattern from actual codebase: theme-switcher extension)
'use client';

import { type ReactElement, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeSelect } from '@/components/ui/native-select';

export default function ThemeSwitcher(): ReactElement {
    const modeId = useId();
    const { t } = useTranslation('themeSwitcher');
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

    return (
        <div className="space-y-2">
            <label htmlFor={modeId} className="block text-sm font-medium mb-1">
                {t('themeMode')}
            </label>
            <NativeSelect
                id={modeId}
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark')}
                aria-label={t('ariaLabel')}
            >
                <option value="light">{t('lightTheme')}</option>
                <option value="dark">{t('darkTheme')}</option>
            </NativeSelect>
        </div>
    );
}
```

## Design Tokens

**Never hardcode colors, spacing, font sizes, or border radii.** Your component will be installed into a merchant's storefront where these values are configured by the merchant or their SI. You don't know what they are — and you don't need to. Use semantic design tokens and your component will look native in any storefront.

### How Tokens Work in Storefront Next

Each storefront defines its theme via CSS custom properties in `app.css`. Storefront Next uses a **two-layer token system**:

**Layer 1: Raw tokens** — defined per theme in CSS selectors (`:root`, `.dark`, `[data-theme='...']`). The merchant or SI controls these values:
```css
/* These values vary per merchant storefront — you will never set these */
:root {
    --radius: 0.625rem;    /* could be 0 for sharp corners, or larger */
    --background: #ffffff; /* could be any background color */
    --primary: #3b82f6;    /* could be blue, black, brand color, etc. */
    --destructive: #dc2626;
    --success: #16a34a;
    /* ... */
}
```

**Layer 2: Tailwind mappings** — defined in the `@theme inline` block, mapping `--color-*` to raw tokens:
```css
@theme inline {
    --radius-sm: calc(var(--radius) - 4px);
    --radius-md: calc(var(--radius) - 2px);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) + 4px);
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-destructive: var(--destructive);
    --color-success: var(--success);
    /* ... */
}
```

This means you use **Tailwind class names** that resolve through the token chain. The class `bg-primary` resolves to `--color-primary`, which resolves to `--primary`, which is whatever the merchant has configured. Your component automatically adapts.

### Available Token Names

These are the semantic token names available in every Storefront Next storefront. Use these names in your components — the actual values are set by the merchant's theme and will vary per storefront:

**Core semantic colors** (all have `--color-*` Tailwind mappings):
- `background` / `foreground` — page background and text
- `card` / `card-foreground` — card surfaces
- `popover` / `popover-foreground` — popover/dropdown surfaces
- `primary` / `primary-foreground` — primary actions (buttons, links)
- `secondary` / `secondary-foreground` — secondary actions
- `muted` / `muted-foreground` — subdued elements, helper text
- `accent` / `accent-foreground` — highlighted elements
- `destructive` / `destructive-foreground` — error states, delete actions
- `success` / `success-foreground` — success states
- `info` / `info-foreground` — informational states
- `warning` / `warning-foreground` — warning states
- `border` — border color
- `input` — input border/background
- `ring` — focus ring color
- `separator` / `separator-foreground` — divider lines
- `rating` / `rating-foreground` — star ratings

**Structural tokens**:
- `header-background`, `header-foreground`, `header-border`, `header-divider`
- `header-menu-background`, `header-menu-foreground`, `header-menu-border`, `header-menu-hover-background`, `header-menu-active-background`, `header-menu-icon`
- `footer-background`, `footer-foreground`
- `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`

**Radius tokens** (Tailwind mappings):
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`

**Utility tokens**:
- `--focus` — focus ring color (rgba)
- `--destructive-focus` — destructive focus ring
- `--opacity-90`, `--opacity-80`, `--opacity-50`, `--opacity-30`
- `--bg-input-30`, `--bg-input-50`, `--bg-input-80`
- `--filter-selected`, `--filter-selected-border`

**Brand tokens** (theme-specific — may not exist in all storefronts, avoid relying on these):
- `--brand-black`, `--brand-black-off`, `--brand-black-charcoal`
- `--brand-white`, `--brand-white-bone`, `--brand-white-ivory`
- `--brand-gray-50` through `--brand-gray-900`

**Order status tokens**:
- `--order-status-new` / `--order-status-new-foreground`
- `--order-status-warning` / `--order-status-warning-foreground`
- `--order-status-completed` / `--order-status-completed-foreground`
- `--order-status-cancelled` / `--order-status-cancelled-foreground`

**Payment provider tokens** (fixed values, not theme-dependent):
- `--paypal-gold: #FFC439`
- `--venmo-blue: #3D95CE`

### How to Use Tokens in Components

Use Tailwind classes that reference semantic tokens. Your component will render correctly in any merchant storefront regardless of what values the merchant has configured for these tokens:

```tsx
// CORRECT: Tailwind classes referencing design tokens (actual pattern from codebase)
<div className="bg-primary text-primary-foreground">  // Button style
<div className="bg-card text-card-foreground border">  // Card style
<div className="bg-background text-foreground">        // Page background
<span className="text-muted-foreground">               // Helper text
<div className="bg-destructive text-white">             // Error state
<div className="bg-success text-success-foreground">    // Success state
<div className="rounded-lg border shadow-sm">           // Rounded card with border

// CORRECT: Arbitrary value syntax for tokens not mapped to Tailwind classes
<div className="bg-[var(--filter-selected)] border-[var(--filter-selected-border)]">

// WRONG: hardcoded values
<div className="bg-white text-gray-900">
<div style={{ backgroundColor: "#ffffff" }}>
<div className="bg-blue-500">  // Tailwind color palette instead of theme tokens
```

### Dark Mode

Dark mode is handled via the `dark` CSS class on `<html>`. The merchant or end user controls whether dark mode is active. The `@custom-variant dark (&:is(.dark *))` declaration in `app.css` enables the `dark:` Tailwind prefix:

```tsx
// Token-based colors switch automatically — no dark: prefix needed for most cases
<div className="bg-background text-foreground">  // Adapts to light or dark automatically

// Use dark: prefix only when you need different behavior beyond token switching
<div className="bg-background dark:bg-input/30">
```

### Theme Compatibility

Storefront Next storefronts can have multiple theme configurations. The built-in templates include themes with different visual characteristics — some use rounded corners, others sharp; some use blue primaries, others black. Merchants and SIs can further customize these values or create entirely new themes.

You don't need to know which theme a merchant uses. If your component uses semantic token classes (`bg-primary`, `text-foreground`, `rounded-lg`, `border`), it will render correctly across all theme configurations. This is the core principle of Commerce App component development: **build to tokens, not to values.**

## ShadCN UI Components

All ShadCN components live in `src/components/ui/` and are built on **Radix UI** primitives + **CVA** (class-variance-authority) + **Tailwind CSS**.

### Available Components (29 in codebase)

| Component | File | Use For |
|-----------|------|---------|
| `Accordion` | `accordion.tsx` | Expandable content sections |
| `AlertDialog` | `alert-dialog.tsx` | Confirmation dialogs |
| `Alert` | `alert.tsx` | Informational/warning messages |
| `AspectRatio` | `aspect-ratio.tsx` | Fixed aspect ratio containers |
| `Avatar` | `avatar.tsx` | User/profile images |
| `Badge` | `badge.tsx` | Status indicators, labels |
| `Breadcrumb` | `breadcrumb.tsx` | Navigation breadcrumbs |
| `Button` | `button.tsx` | All clickable actions |
| `Card` | `card.tsx` | Contained content sections (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction) |
| `Carousel` | `carousel.tsx` | Image/content carousels |
| `Checkbox` | `checkbox.tsx` | Multi-selection |
| `Dialog` | `dialog.tsx` | Modal overlays |
| `Drawer` | `drawer.tsx` | Slide-in panels |
| `DropdownMenu` | `dropdown-menu.tsx` | Context menus, action menus |
| `Form` | `form.tsx` | Form field wrappers with validation |
| `Input` | `input.tsx` | Text entry fields |
| `InputOTP` | `input-otp.tsx` | One-time password entry |
| `Label` | `label.tsx` | Form field labels |
| `NativeSelect` | `native-select.tsx` | Native HTML select dropdowns |
| `NavigationMenu` | `navigation-menu.tsx` | Top-level site navigation |
| `Pagination` | `pagination.tsx` | Page navigation |
| `Popover` | `popover.tsx` | Floating content panels |
| `RadioGroup` | `radio-group.tsx` | Single selection from options |
| `Separator` | `separator.tsx` | Visual dividers |
| `Sheet` | `sheet.tsx` | Side panels (slide-over drawers) |
| `Skeleton` | `skeleton.tsx` | Loading placeholders |
| `Switch` | `switch.tsx` | Toggle switches |
| `Textarea` | `textarea.tsx` | Multi-line text entry |
| `Tooltip` | `tooltip.tsx` | Hover hints |

### Import Pattern

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
```

### Component Patterns (from actual codebase)

ShadCN components in Storefront Next follow these patterns:

1. **`data-slot` attribute** on every component for testing/styling:
```tsx
<div data-slot="card" className={cn("bg-card text-card-foreground ...", className)} />
```

2. **`cn()` utility** for merging class names (from `@/lib/utils`):
```tsx
import { cn } from '@/lib/utils';
// cn() uses clsx + tailwind-merge
```

3. **CVA for variants** (class-variance-authority):
```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

4. **`React.ComponentProps<>` for typing** (not custom interfaces):
```tsx
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  // ...
}
```

5. **`Slot` from Radix UI** for polymorphic `asChild` pattern:
```tsx
import { Slot } from '@radix-ui/react-slot';
const Comp = asChild ? Slot : "button";
```

## Accessibility Requirements

All Commerce App components must meet **WCAG 2.1 Level AA**.

### Checklist

- **ARIA attributes**: Use `aria-label`, `aria-describedby`, `aria-expanded`, `aria-controls`, `aria-live` where appropriate
- **Keyboard navigation**: All interactive elements must be reachable via Tab and operable via Enter/Space
- **Focus styles**: Use `focus-visible:` Tailwind prefix. Actual pattern from codebase:
  ```
  focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
  ```
- **Semantic HTML**: Use `<button>` for actions (not `<div onClick>`), `<a>` for navigation, heading levels in order
- **Form labels**: Every input must have an associated `<label>` with matching `htmlFor`/`id` (use `useId()` for generated IDs). Example from codebase:
  ```tsx
  const modeId = useId();
  <label htmlFor={modeId}>Theme Mode</label>
  <NativeSelect id={modeId} aria-label={t('ariaLabel')}>
  ```
- **Color contrast**: Use semantic token pairs (e.g., `bg-primary` + `text-primary-foreground`) to inherit the storefront's accessible color combinations. Since you don't control the merchant's theme values, always use the paired foreground token to ensure contrast
- **Storybook a11y addon**: The codebase includes `@storybook/addon-a11y` which runs axe-core checks on stories

## Storybook

Every component must have a Storybook story. Stories are the primary documentation and visual development environment.

### Story File Location

Stories go in a `stories/` subdirectory next to the component:

```
src/extensions/my-extension/
  components/
    my-component/
      index.tsx
      stories/
        index.stories.tsx
```

### Story Structure (from actual codebase)

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import { action } from 'storybook/actions';
import MyComponent from '../index';

const meta: Meta<typeof MyComponent> = {
    title: 'Extensions/MyExtension/MyComponent',  // Storybook nav path
    component: MyComponent,
    tags: ['autodocs', 'interaction'],             // autodocs generates prop docs
    parameters: {
        layout: 'padded',                          // 'padded' | 'centered' | 'fullscreen'
        docs: {
            description: {
                component: `Description of the component and its features.`,
            },
        },
    },
    decorators: [
        (Story: React.ComponentType) => (
            <Story />                              // Add wrappers/providers if needed
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    parameters: {
        docs: {
            description: {
                story: `Description of this specific story variant.`,
            },
        },
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        // Interaction test: verify rendering
        const element = await canvas.findByRole('button', {}, { timeout: 5000 });
        await expect(element).toBeInTheDocument();
    },
};

export const MobileLayout: Story = {
    globals: {
        viewport: 'mobile2',                       // Built-in Storybook viewport
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        // ...
    },
};

export const DesktopLayout: Story = {
    globals: {
        viewport: 'desktop',
    },
};
```

### Key Storybook Patterns from Codebase

1. **Import from `'@storybook/react-vite'`** (not `'@storybook/react'`)
2. **Import test utils from `'storybook/test'`** (not `'@storybook/testing-library'`)
3. **Import actions from `'storybook/actions'`** (not `'@storybook/addon-actions'`)
4. **Use `waitForStorybookReady(canvasElement)`** before any assertions in `play` functions
5. **Use `globals: { viewport: 'mobile2' }`** for mobile stories (not `parameters.viewport`)
6. **Use `tags: ['autodocs', 'interaction']`** for auto-generated docs and interaction test support
7. **Decorators** receive `Story` as `React.ComponentType`, not as a function to call

### Storybook Addons Available

- `@chromatic-com/storybook` — visual regression testing via Chromatic
- `@storybook/addon-docs` — auto-generate component documentation
- `@storybook/addon-a11y` — accessibility testing with axe-core
- `@storybook/addon-vitest` — Vitest integration for play function tests

### Storybook Provider Setup

Stories are automatically wrapped with all application providers by the global decorator in `.storybook/preview.tsx`. This includes:
- `ConfigProvider` — app configuration
- `I18nextProvider` — internationalization
- `AuthProvider` — user authentication/session
- `BasketProvider` — shopping basket state
- `StoreLocatorProvider` — store location data
- `CheckoutOneClickProvider` — checkout state
- `TargetProviders` — extension context providers
- `RouterProvider` — React Router (memory router for stories)

You do NOT need to manually wrap your stories with these providers. They are injected automatically. Only add extension-specific providers in your story decorators if your extension defines its own context provider.

## Extension File Structure

Commerce App extensions in Storefront Next follow this structure:

```
src/extensions/<extension-name>/
  target-config.json              # Maps components to UI Target IDs (see SKILL-2: ui-targets)
  components/
    <component-name>/
      index.tsx                   # Component implementation
      stories/
        index.stories.tsx         # Storybook stories
  providers/                      # Context providers (optional)
    <provider-name>.tsx
  hooks/                          # Custom hooks (optional)
  lib/                            # Utility functions (optional)
  locales/                        # i18n translation files (optional)
    en-GB.json
  routes/                         # Route loaders/actions (optional)
  tests/                          # Test files (optional)
```

For details on `target-config.json`, UI Target IDs, and how the build-time UITarget replacement works, see **SKILL-2: ui-targets**.

## Component File Conventions

- **File names**: kebab-case for directories, `index.tsx` for main component file
- **Component names**: PascalCase (`ThemeSwitcher`, `StoreLocatorBadge`)
- **Exports**: Use `export default` for extension components (this is what the target system imports)
- **Return type**: Annotate with `ReactElement`
- **`data-slot` attribute**: Include on wrapper elements for testability
- **Copyright header**: All files require the Apache 2.0 copyright header

## Internationalization

Use `react-i18next` for all user-facing strings:

```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent(): ReactElement {
    const { t } = useTranslation('myExtension');

    return <span>{t('labelKey')}</span>;
}
```

Translation files go in `extensions/<name>/locales/en-GB.json`.

## Utility Functions

Import the `cn()` utility for conditional class merging:

```tsx
import { cn } from '@/lib/utils';

// cn() combines clsx (conditional classes) with tailwind-merge (deduplication)
<div className={cn("bg-card text-card-foreground", isActive && "ring-2 ring-ring", className)} />
```

## Figma-to-Code Pipeline

When a developer provides a Figma design link, the following MCP tools are available in the `odyssey-mcp` package:

1. **Figma MCP** retrieves design metadata (node hierarchy, styles, generated code)
2. **`generate-component`** converts the Figma output into a Storefront Next React component
3. **`map-tokens-to-theme`** maps Figma design values to the storefront's CSS custom properties (parses `app.css` via PostCSS, builds a token dictionary, matches values)
4. **`validate-component`** checks the generated component against Storefront Next conventions
5. **`annotate-for-page-designer`** adds Page Designer metadata if applicable

When building Commerce App components from Figma designs, always run `map-tokens-to-theme` to resolve design values to semantic token names rather than hardcoding the Figma color/spacing values. Since ISV developers don't have access to the merchant's storefront, the tool maps to the standard token vocabulary (e.g., `bg-primary`, `text-foreground`) — these names are consistent across all Storefront Next storefronts even though their values differ.

## What Does NOT Exist Yet

The following items are referenced in PRD documents but do NOT exist in the current codebase. Do not reference them as if they work today:

- **`PluginProviders` slot** — the PRD uses this term but it does not exist. Storybook providers are injected via a global decorator in `.storybook/preview.tsx`
- **`tailwind.config.ts`** — does not exist. Tailwind v4 is configured entirely in `app.css` via `@theme inline`
- **`target-config.json.snippet`** — the ISV Developer Guide references this file name, but the actual file in the codebase is `target-config.json`
- **`sfdc.*` UI Target namespace** — planned but not used in the current codebase. Current targets use names like `footer.customersupport.end`
- **`app connect` CLI command** — planned for pulling a storefront's theme into an ISV project, but does not exist yet
- **`app validate` CLI command** — planned for automated validation, but does not exist yet
- **Token names from PRD like `--color-interactive`, `--spacing-4`, `--font-size-lg`, `--button-background`** — these do not exist. Use the actual token names listed in this skill
- **Two separate templates (Market Street and Foundations)** — there is one template (`template-retail-rsc-app`) with four theme variants

## What NOT to Do

- Do not hardcode any color, spacing, font size, or border radius value — the merchant's storefront controls these via tokens
- Do not use Tailwind's built-in color palette (`bg-blue-500`, `text-gray-900`) — use semantic tokens (`bg-primary`, `text-foreground`)
- Do not assume specific token values (e.g., "primary is blue") — different merchants use different themes
- Do not rely on theme-specific tokens like `--brand-*` — use universal semantic tokens that exist in all storefronts
- Do not use `<div onClick>` — use `<button>` for actions, `<a>` for navigation
- Do not use `any` type — explicitly type all props and data
- Do not skip the `stories/` directory — every component needs Storybook stories
- Do not create a `tailwind.config.ts` — Tailwind v4 uses `@theme inline` in `app.css`
- Do not use `@apply` in component files — use Tailwind utility classes directly in JSX
- Do not reference internal Salesforce release numbers (262, 264, etc.) in any code or comments
- Do not import from `'@storybook/react'` — use `'@storybook/react-vite'`
- Do not omit the Apache 2.0 copyright header from source files
