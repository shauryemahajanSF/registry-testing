# Delivery Estimates — UI Target Only Template

A Commerce App that shows estimated delivery dates on the PDP. This template demonstrates the **UI Target Only** path — React components rendered in storefront extension points with no backend adapters.

## UI Target

| Target ID | Type | Description |
|-----------|------|-------------|
| `sfdc.pdp.deliveryestimates.getestimatefrompostal` | Platform-defined | Renders a delivery estimate widget based on the shopper's postal code |

## Project Structure

```
delivery-estimates/
├── src/extensions/delivery-estimates/
│   ├── target-config.json              # Maps component → UI Target
│   ├── components/
│   │   └── delivery-estimate/
│   │       ├── index.tsx               # Main component
│   │       └── stories/
│   │           └── index.stories.tsx   # Storybook stories
│   └── locales/
│       └── en-GB.json                  # Translation strings
└── package.json
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Storybook for visual development:
   ```bash
   npm run storybook
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Customization

- **Delivery logic**: Replace the placeholder calculation in `index.tsx` with your actual delivery estimation — either client-side calculation or an API call to your service.
- **Styling**: Uses design tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `text-destructive`) so the component automatically adapts to any Storefront Next theme variant.
- **Translations**: Add locale files alongside `en-GB.json` for additional languages.

## Key Conventions

- `'use client'` directive — this component uses hooks and event handlers
- `useId()` for accessible label/input associations
- `useTranslation()` for all user-facing strings
- `data-slot` attribute for testability
- `aria-live="polite"` on the result for screen reader announcements
- Design tokens only — no hardcoded colors

See the [ISV Developer Guide](../../docs/Commerce-Apps-ISV-Developer-Guide.pdf) for full details.
