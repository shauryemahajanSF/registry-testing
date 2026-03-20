# Testing Commerce App Components

You are helping a developer write tests for Commerce App components on Storefront Next. The developer is likely an ISV partner who needs to know how to write unit tests, Storybook interaction tests, and understand the test infrastructure available in the storefront.

**Key context: Commerce App components are tested in isolation.** ISV developers test their extension components using the same tools and patterns the platform uses — Vitest for unit tests, Storybook play functions for interaction tests, and the built-in test utilities for mocking providers and configuration.

## Testing Stack

Storefront Next uses a three-tier testing approach:

| Tier | Tool | Purpose | Runs In |
|------|------|---------|---------|
| **Unit/Component** | Vitest + React Testing Library | Component rendering, hooks, logic | jsdom (Node) |
| **Interaction/Visual** | Storybook play functions | User interaction flows, visual regression | Browser (Chromium) |
| **E2E** | CodeceptJS + Playwright | Full storefront flows (checkout, cart) | Browser (Chromium) |

For Commerce App extension components, you will primarily write **unit tests** and **Storybook interaction tests**. E2E tests run against the full storefront and are typically maintained by the platform team or SI.

## Unit Tests with Vitest

### Test File Location

Unit test files go next to the component they test, named `index.test.tsx`:

```
src/extensions/my-extension/
  components/
    my-component/
      index.tsx
      index.test.tsx          # Unit test
      stories/
        index.stories.tsx     # Storybook story with play function
```

For route or integration tests, use a `tests/` directory at the extension root:

```
src/extensions/my-extension/
  tests/
    routes.test.ts
    helpers.test.ts
```

### Basic Test Structure

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './index';

describe('MyComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<MyComponent />);
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('handles user interaction', async () => {
        const user = userEvent.setup();
        render(<MyComponent />);

        const button = screen.getByRole('button', { name: /submit/i });
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByText('Submitted')).toBeInTheDocument();
        });
    });
});
```

### Wrapping Components with Providers

Extension components often need context providers (config, i18n, auth). Use the test utilities provided by the storefront:

```tsx
import { render, screen } from '@testing-library/react';
import { ConfigWrapper, createConfigWrapper } from '@/test-utils/config';
import MyComponent from './index';

// Use the default config wrapper
it('renders with default config', () => {
    render(<MyComponent />, { wrapper: ConfigWrapper });
    expect(screen.getByText('My Component')).toBeInTheDocument();
});

// Override specific config values
it('renders with custom config', () => {
    const CustomWrapper = createConfigWrapper({
        app: {
            sites: [{ id: 'TestSite', l10n: { defaultLocale: 'en-US' } }],
        },
    });
    render(<MyComponent />, { wrapper: CustomWrapper });
});
```

### Mocking Hooks and Providers

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock a provider hook
vi.mock('@/providers/basket', () => ({
    useBasket: vi.fn(() => ({
        basket: { basketId: 'test-123', itemCount: 3 },
        addItem: vi.fn(),
    })),
}));

// Mock an async import
vi.mock('@/middlewares/i18next', async () => {
    const actual = await vi.importActual('@/middlewares/i18next');
    return {
        ...actual,
        getI18nextInstance: () => mockI18nextInstance,
    };
});
```

### Mock Data Factories

Create reusable mock data for your extension's tests:

```tsx
function createMockBasket(overrides = {}) {
    return {
        basketId: 'test-basket-123',
        currency: 'USD',
        customerInfo: { email: 'test@example.com' },
        shipments: [{ shipmentId: 'shipment-1', shippingAddress: null }],
        productItems: [],
        orderTotal: 0,
        ...overrides,
    };
}

function createDefaultProps(overrides = {}) {
    return {
        onSubmit: vi.fn(),
        isLoading: false,
        error: null,
        ...overrides,
    };
}
```

### Query Priority

React Testing Library encourages querying by how users interact with elements. Use this priority:

1. **`getByRole`** — preferred for most elements (`button`, `textbox`, `combobox`, `heading`)
2. **`getByLabelText`** — form fields with labels
3. **`getByPlaceholderText`** — inputs with placeholder text
4. **`getByText`** — visible text content
5. **`getByTestId`** — last resort, when no accessible query works

```tsx
// PREFERRED: role-based queries
screen.getByRole('button', { name: /submit/i });
screen.getByRole('combobox', { name: /theme mode/i });
screen.getByRole('heading', { level: 2, name: /tax breakdown/i });

// ACCEPTABLE: label-based
screen.getByLabelText('Email address');

// AVOID: test IDs (use only when necessary)
screen.getByTestId('tax-summary');
```

### Running Unit Tests

```bash
# Run all tests with coverage
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run tests with UI (browser-based test dashboard)
pnpm test:ui

# Run a specific test file
pnpm vitest run src/extensions/my-extension/components/my-component/index.test.tsx
```

## Storybook Interaction Tests

Every extension component must have Storybook stories. Stories serve as both documentation and interaction tests via play functions.

### Story File Location

```
src/extensions/my-extension/
  components/
    my-component/
      stories/
        index.stories.tsx
```

### Story with Play Function

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within, userEvent } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import MyComponent from '../index';

const meta: Meta<typeof MyComponent> = {
    title: 'Extensions/MyExtension/MyComponent',
    component: MyComponent,
    tags: ['autodocs', 'interaction'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Displays tax breakdown for an order.',
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        // Always wait for Storybook to finish rendering
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        // Verify the component rendered
        const heading = await canvas.findByRole('heading', { name: /tax breakdown/i }, { timeout: 5000 });
        await expect(heading).toBeInTheDocument();
    },
};

export const WithInteraction: Story = {
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        // Find and interact with elements
        const button = await canvas.findByRole('button', { name: /view details/i });
        await userEvent.click(button);

        // Verify state change
        const details = await canvas.findByText(/federal tax/i);
        await expect(details).toBeInTheDocument();
    },
};

export const MobileLayout: Story = {
    globals: {
        viewport: 'mobile2',
    },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        // Verify mobile-specific rendering
        const mobileMenu = await canvas.findByRole('button', { name: /menu/i });
        await expect(mobileMenu).toBeInTheDocument();
    },
};
```

### Key Storybook Test Patterns

1. **Always call `waitForStorybookReady(canvasElement)`** before any assertions — this waits for the component to mount
2. **Use `canvas.findByRole()`** (with `find`, not `get`) for async element queries with timeout
3. **Use `userEvent` from `'storybook/test'`** for interactions (not `fireEvent`)
4. **Set viewport via `globals: { viewport: 'mobile2' }`** for responsive tests
5. **Add `tags: ['interaction']`** to enable the interaction test runner

### Storybook Provider Setup

Stories are automatically wrapped with all storefront providers by the global decorator in `.storybook/preview.tsx`. You do not need to manually add `ConfigProvider`, `I18nextProvider`, `AuthProvider`, `BasketProvider`, etc. Only add your own extension's context provider if it defines one.

### Running Storybook Tests

```bash
# Start Storybook
pnpm storybook

# Run interaction tests (requires Storybook running)
pnpm test-storybook:interaction

# Run snapshot tests
pnpm test-storybook:snapshot

# Update snapshots
pnpm test-storybook:snapshot:update
```

## Accessibility Testing

The storefront includes `@storybook/addon-a11y` which runs axe-core accessibility checks on every story. This automatically validates:

- Color contrast ratios
- ARIA attribute correctness
- Keyboard navigation
- Form label associations
- Heading hierarchy

When you write stories for your extension components, accessibility issues will be flagged in the Storybook UI under the "Accessibility" panel. Fix any violations before submitting your Commerce App.

## Test Configuration

### Vitest Configuration

The main `vite.config.ts` configures Vitest:

- **Environment**: `jsdom`
- **Globals**: `true` (no need to import `describe`, `it`, `expect`)
- **Setup file**: `vitest.setup.ts` (configures jest-dom matchers, mocks browser APIs)
- **Coverage provider**: `v8`
- **Test pattern**: `**/*.{test,spec}.{ts,tsx}`

### What the Setup File Mocks

The `vitest.setup.ts` file pre-configures several browser APIs that don't exist in jsdom:

- `window.matchMedia` — required by responsive components
- `ResizeObserver` — required by carousel/accordion components
- `IntersectionObserver` — required by lazy-loading components
- `localStorage` — via `vitest-localstorage-mock`
- Static asset imports (images, SVGs, favicons)
- i18next initialization with test translations

You don't need to mock these yourself — they're handled globally.

### Coverage

Coverage is collected with `@vitest/coverage-v8`. Key exclusions:
- `src/components/ui/**/*` — ShadCN UI library (not your code)
- `src/**/*.stories.{ts,tsx}` — story files
- `src/**/*.test.{ts,tsx}` — test files themselves
- `src/test-utils/*` — test utilities

## Testing Checklist for Commerce App Extensions

Before submitting your Commerce App, verify:

- [ ] Every component has a unit test file (`index.test.tsx`)
- [ ] Every component has a Storybook story with at least one `play` function
- [ ] Stories include `tags: ['autodocs', 'interaction']`
- [ ] Unit tests use role-based queries (not test IDs)
- [ ] Form components test keyboard navigation and label associations
- [ ] Interactive components test user flows (click, type, select)
- [ ] Mobile viewport stories exist for responsive components (`globals: { viewport: 'mobile2' }`)
- [ ] No accessibility violations in the Storybook a11y panel
- [ ] Tests pass: `pnpm test` and `pnpm test-storybook:interaction`

## What NOT to Do

- Do not import from `'@storybook/react'` — use `'@storybook/react-vite'`
- Do not import test utilities from `'@storybook/testing-library'` — use `'storybook/test'`
- Do not import actions from `'@storybook/addon-actions'` — use `'storybook/actions'`
- Do not skip `waitForStorybookReady()` in play functions — assertions will fail on unmounted components
- Do not use `parameters.viewport` for mobile stories — use `globals: { viewport: 'mobile2' }`
- Do not manually wrap stories with `ConfigProvider` or `I18nextProvider` — they are injected by the global decorator
- Do not test ShadCN UI component internals — test your component's behavior, not the library's
- Do not use `fireEvent` — use `userEvent` for realistic interaction simulation
- Do not use snapshot tests as the primary testing strategy — prefer interaction and behavior tests
