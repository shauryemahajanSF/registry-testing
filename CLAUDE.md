# Commerce Apps Registry

## What This Repo Is

This is the Commerce Apps registry and developer tooling repository for Salesforce Commerce Cloud B2C. It contains published Commerce App Packages, Claude Skills, Cursor Rules, CI/CD workflows, and reference content for ISV and SI developers building Commerce Apps on Storefront Next.

Commerce Apps are installable application packages that extend Storefront Next storefronts with UI components (rendered in UI Target extension points), backend API adapters, and lifecycle management. They are packaged as Commerce App Packages (CAP) and distributed to merchants via a marketplace.

This repo is temporary (`greenstork/commerce-apps-registry-temp`) and will move to an official SalesforceCommerceCloud org repo when approved by IT.

## Architecture Context

Commerce Apps DX Tooling is not a standalone system. It layers on top of existing B2C DX infrastructure:

- **@salesforce/b2c-cli**: The unified CLI for all B2C platform operations (OCLIF-based, replacing sfcc-ci). Commerce Apps will consume this via OCLIF plugins and the `@salesforce/b2c-tooling` programmatic API.
- **@salesforce/b2c-dx-mcp**: The unified MCP server with configurable ToolSets. Commerce Apps defines a COMMERCEAPPS ToolSet that registers alongside MRT, ODS, PWAV3, STOREFRONTNEXT, SCAPI, etc.
- **@salesforce/action-b2c-***: GitHub Actions for CI/CD workflows.
- **Figma-to-Component MCP Tooling**: Five tools (workflow orchestrator, generate-component, map-tokens-to-theme, validate-component, annotate-for-page-designer) that live in the StorefrontNext MCP package. Pattern 1: AI calls Figma MCP and StorefrontNext MCP separately.

The b2c-developer-tooling monorepo lives at: https://github.com/SalesforceCommerceCloud/b2c-developer-tooling

## Storefront Next Tech Stack

- **Framework**: React 19 (this is NOT Next.js despite the name)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4 (configured via `@theme inline` in `app.css`, no `tailwind.config.ts`) + ShadCN UI (built on Radix UI + CVA)
- **Language**: TypeScript
- **Routing**: React Router 7 (formerly Remix)
- **Design Tokens**: CSS custom properties in `app.css`, mapped to Tailwind via `@theme inline` block
- **Component Documentation**: Storybook 10 for React with Vite (`@storybook/react-vite`); Storybook serves as documentation and visual development, Playwright handles functional regression
- **E2E Testing**: CodeceptJS + Playwright
- **Unit Testing**: Vitest + React Testing Library
- **Internationalization**: react-i18next
- **Hosting**: Managed Runtime (MRT)

Storefront Next ships one template (`template-retail-rsc-app`) with four theme variants: Foundations Light, Foundations Dark, Market Street Light, and Market Street Dark. Theme variants are applied via CSS custom property overrides (`:root`, `.dark`, `[data-theme='market-street-light']`, `[data-theme='market-street-dark']`).

## Commerce Apps Concepts

- **UI Targets**: Named extension points in the storefront where Commerce App components render. Defined via `target-config.json` and integrated at build time via a Vite plugin (`@salesforce/storefront-next-dev`) that uses Babel AST transformation to replace `<UITarget>` placeholders with actual components. Current codebase targets use names like `footer.customersupport.end` and `header.before.cart`; the `sfdc.*` namespace (e.g., `sfdc.checkout.shipping.address-form.after`) is planned but not yet in use.
- **CAP (Commerce App Package)**: The packaging format for Commerce Apps. Includes a `cap-manifest.json`, UI Target components, backend API adapters, lifecycle hooks, and configuration.
- **Adapter Provider Interfaces**: Backend contracts that Commerce Apps implement (e.g., `dw.apps.checkout.tax.calculate`).
- **Lifecycle Hooks**: install, uninstall, configure callbacks that run during app installation.
- **Domain Waves**: UI Targets and extensions are released in waves by commerce domain (checkout first, then product, cart, account, etc.).
- **ISV Namespacing**: Platform-defined targets use the `sfdc.*` namespace. SI developers can create custom UI Target namespaces.

## Component Authoring Conventions

When creating or modifying components in this repo:

- Use **CSS custom properties** (design tokens from `app.css`) for all colors, spacing, typography, and sizing. Never hardcode color values or use Tailwind's built-in color palette (`bg-blue-500`). Use semantic token classes instead (`bg-primary`, `text-foreground`).
- Use **Tailwind CSS 4** utility classes. Tailwind is configured entirely via `@theme inline` in `app.css` — there is no `tailwind.config.ts` file.
- Use **ShadCN UI** primitives (29 components in `src/components/ui/`) as the base component library. Import via `@/components/ui/<component>`.
- Use **`cn()`** from `@/lib/utils` for conditional class merging (combines clsx + tailwind-merge).
- Use **CVA** (class-variance-authority) for component variants.
- Every component must have a `stories/` subdirectory with Storybook stories. Stories import from `'@storybook/react-vite'` and test utils from `'storybook/test'`.
- Components must be accessible: include ARIA attributes, support keyboard navigation, and meet WCAG 2.1 AA. Use `useId()` for form label associations.
- Understand the RSC (React Server Components) vs client component boundary. UI Target components that need interactivity should be client components (`'use client'` directive). Most extension components are client components.
- Storybook renders components in isolation using a global decorator that wraps stories with `ComposeProviders` (ConfigProvider, I18nextProvider, AuthProvider, BasketProvider, etc.) and `TargetProviders`. Extension-specific stories only need to add their own providers if the extension defines a custom context provider.
- All source files require the Apache 2.0 copyright header.

## Design Token Structure

Design tokens are CSS custom properties defined in the storefront's `app.css` using a two-layer system:

**Layer 1 — Raw tokens** (defined per theme variant in CSS selectors like `:root`, `.dark`, `[data-theme='market-street-light']`):
- `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--info`, `--warning`, `--border`, `--input`, `--ring`, `--radius`, etc.

**Layer 2 — Tailwind mappings** (defined in the `@theme inline` block, mapping `--color-*` to raw tokens):
- `--color-background: var(--background)`, `--color-primary: var(--primary)`, `--color-destructive: var(--destructive)`, etc.
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`

This enables Tailwind classes like `bg-primary`, `text-foreground`, `border-destructive` to resolve through the token chain and automatically adapt across all four theme variants.

The Figma-to-code pipeline's `map-tokens-to-theme` tool parses `app.css` via PostCSS, builds a dictionary of existing tokens, and matches Figma design values to them. When building Commerce App components, always resolve to existing tokens rather than introducing new ones unless the storefront's token set is missing a needed value.

## User Personas

**ISV App Developer**: Full-stack developer at a partner company (e.g., Avalara, Yotpo, Zenkraft, Forter). Proficient in React/TypeScript. May not have prior SFCC experience. Needs guardrails and scaffolding that ensure correctness from the start.

**SI Developer**: Developer at a systems integrator implementing Storefront Next for merchants. Proficient in the Storefront Next stack. Needs to package repeatable custom work (UI, extensions, API logic) into portable Commerce Apps that carry between stores, brands, and customers.

## What Lives in This Repo

```
b2c-commerce-apps/
├── .claude/skills/                    # Claude Code skills for AI-assisted development
│   ├── app-scaffold/                  #   → Generate a full project from a prompt
│   │   └── SKILL.md
│   ├── app-validate/                  #   → Validate your app before submission
│   │   └── SKILL.md
│   ├── storefront-components/         #   → Component authoring conventions
│   │   └── SKILL.md
│   ├── ui-targets/                    #   → Extension point reference
│   │   └── SKILL.md
│   ├── api-adapters/                  #   → Backend hook implementation patterns
│   │   └── SKILL.md
│   ├── cap-packaging/                 #   → Package and submit to registry
│   │   └── SKILL.md
│   └── commerce-testing/              #   → Test generation (Vitest, Storybook)
│       └── SKILL.md
├── .cursor/rules/                     # Cursor IDE rules for inline guidance
│   ├── component-authoring.mdc        #   → Design tokens, ShadCN, accessibility
│   ├── api-adapter.mdc               #   → Hook patterns, Script API usage
│   ├── cap-manifest.mdc              #   → Manifest validation
│   └── target-config.mdc             #   → UI Target registration
├── .devcontainer/
│   └── devcontainer.json              # GitHub Codespaces configuration
├── .github/workflows/
│   └── commerce-app-ci.yml           # CI: validates CAP submissions, tags on merge
├── tax/                               # Published Commerce Apps (by domain)
│   └── avalara-tax/                   #   → Reference implementation
├── docs/                              # Documentation
│   └── Commerce-Apps-ISV-Developer-Guide.pdf
├── templates/                         # Starter project templates
│   ├── ui-target/                     #   → Single UI Target component
│   ├── api-adapter/                   #   → Backend API adapter
│   └── full-app/                      #   → Combined UI + backend + lifecycle
├── CLAUDE.md                          # This file — project context for AI assistants
├── CONTRIBUTING.md                    # Submission requirements
└── README.md
```

## Coding Conventions for This Repo

- Use TypeScript for all code
- Use ES modules (import/export)
- Follow the Storefront Next naming conventions for components (PascalCase for components, kebab-case for directories, `index.tsx` for main component files)
- All configuration files should include inline comments explaining each field
- Skills and rules should be written in clear, direct language aimed at developers who may not have prior SFCC experience
- Do not reference internal Salesforce release numbers (e.g., 262, 264) in any developer-facing content
- Do not reference internal team names or individual engineers in developer-facing content
