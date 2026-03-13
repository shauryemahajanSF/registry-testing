<h1 align="center">Commerce Apps</h1>
<h3 align="center">Salesforce Commerce Cloud</h3>

<p align="center">
  Build, package, and distribute installable extensions for Salesforce Commerce Cloud storefronts.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#isv-developer-guide">Developer Guide</a> •
  <a href="#whats-in-the-repo">Repo Structure</a> •
  <a href="#ai-assisted-development">AI-Assisted Dev</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## What Are Commerce Apps?

Commerce Apps are packaged extensions that add capabilities to [Storefront Next](https://developer.salesforce.com/docs/commerce/b2c-commerce) storefronts. A single app can bundle frontend UI components, backend API adapters, platform configuration, and merchant setup guidance into one installable unit called a **Commerce App Package (CAP)**.

Merchants install Commerce Apps through Business Manager with a click-to-install experience. Developers build them here.

**Three ways to build:**

| Path | You Build | Platform Provides | Example |
|------|-----------|-------------------|---------|
| **UI Target Only** | React components for storefront extension points | Build-time injection via Vite plugin | Ratings widget, store locator, loyalty badge |
| **API Adapter Only** | Script API hooks implementing platform contracts | Hook dispatch, lifecycle management | Tax calculation (Avalara), fraud detection |
| **Full App** | Both UI components and backend adapters | All of the above | Shipping estimator, BNPL provider |

## ISV Developer Guide

**Start here.** The ISV Developer Guide is the comprehensive reference for building Commerce Apps, covering architecture, extension points, UI Targets, CAP packaging, and the submission process.

> **📘 [Commerce Apps ISV Developer Guide (PDF)](docs/Commerce-Apps-ISV-Developer-Guide.pdf)**

## Quick Start

There is no CLI scaffold yet. The fastest path to a working project is the **Claude Code scaffold skill** included in this repo.

### Option A: Claude Code Scaffold (Recommended)

Open this repo in [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and tell it what you want to build:

```
> Scaffold a new full-app Commerce App called "my-shipping-estimator"
  in the shipping domain. I need these UI Targets:
  - checkout.shippingOptions (wrapper, replace the default)
  - pdp.after.addToCart (position, show delivery estimate)
  - orderSummary.shipping (wrapper, show itemized shipping costs)
  Plus a backend adapter with hooks for rate calculation.
```

The `app-scaffold` skill will confirm your UI Target selections, resolve the required ShadCN dependencies for each target (e.g., `RadioGroup` and `Label` for `checkout.shippingOptions`), seed wrapper targets with the platform's default component structure, generate hook stubs with the correct Script API patterns, create IMPEX install/uninstall templates, and wire up Storybook and test scaffolding for every component.

### Option B: Manual Setup

Fork this repo and build your app directory by hand following the CAP structure:

```
my-commerce-app/
├── src/extensions/{name}/          # React components for UI Targets
│   ├── target-config.json          # Maps components → storefront extension points
│   └── components/
├── cartridges/site_cartridges/     # Script API hook implementations
│   └── int_{name}/
│       └── cartridge/scripts/
│           ├── hooks.json          # Registers hooks with the platform
│           └── hooks/
├── impex/
│   ├── install/                    # Custom attributes, services, preferences
│   └── uninstall/                  # Clean removal (required)
├── app-configuration/
│   └── tasksList.json              # Post-install merchant setup steps
└── package.json
```

Refer to the [ISV Developer Guide](docs/Commerce-Apps-ISV-Developer-Guide.pdf) for complete details on each directory.

## What's in the Repo

```
b2c-commerce-apps/
├── .claude/skills/                 # Claude Code skills for AI-assisted development
│   ├── app-scaffold/               #   → Generate a full project from a prompt
│   ├── app-validate/               #   → Validate your app before submission
│   ├── storefront-components/      #   → Component authoring conventions
│   ├── ui-targets/                 #   → Extension point reference
│   ├── api-adapters/               #   → Backend hook implementation patterns
│   ├── cap-packaging/              #   → Package and submit to registry
│   └── commerce-testing/           #   → Test generation (Vitest, Storybook)
├── .cursor/rules/                  # Cursor IDE rules for inline guidance
│   ├── component-authoring.mdc     #   → Design tokens, ShadCN, accessibility
│   ├── api-adapter.mdc             #   → Hook patterns, Script API usage
│   ├── cap-manifest.mdc            #   → Manifest validation
│   └── target-config.mdc           #   → UI Target registration
├── tax/                            # Published Commerce Apps (by domain)
│   └── avalara-tax/                #   → Reference implementation
├── docs/                           # Documentation
│   └── Commerce-Apps-ISV-Developer-Guide.pdf
├── CLAUDE.md                       # Project context for AI assistants
├── CONTRIBUTING.md                 # Submission requirements
└── README.md
```

### Published Apps

Each domain directory contains published Commerce App Packages:

```
tax/avalara-tax/
  ├── avalara-tax-v0.2.2.zip       # The installable CAP
  ├── manifest.json                 # Version metadata + SHA256 hash
  └── catalog.json                  # Version history (updated by CI)
```

## AI-Assisted Development

This repo ships with first-class support for AI coding assistants. The skills and rules give your AI deep context about Commerce Apps conventions, so generated code is correct from the start.

### Claude Code

The `.claude/skills/` directory contains seven skills that Claude Code loads automatically when you open this repo. These skills are agentic: Claude can scaffold entire projects, generate components, implement hooks, write tests, validate your app against submission requirements, and package it for the registry. The skills encode the same conventions and patterns documented in the ISV Developer Guide.

Start with: `Scaffold a Commerce App for [your domain]`

### Cursor

The `.cursor/rules/` directory contains contextual rules (`.mdc` files) that provide inline guidance as you edit. These are not scaffolding tools. They activate based on the file you're working in: component authoring conventions load when you're editing `.tsx` files, adapter patterns when you're in cartridge scripts, and manifest validation rules when editing `manifest.json` or `target-config.json`. Think of them as framework-aware linting that keeps your code aligned with Commerce Apps standards.

### CLAUDE.md

The root `CLAUDE.md` provides project-level context for any AI assistant: architecture overview, tech stack (React 19, Vite, Tailwind CSS 4, ShadCN UI), naming conventions, and coding standards. It works with Claude Code, Cursor, Windsurf, and other tools that read project context files.

## Tech Stack

Commerce App frontend extensions target the Storefront Next stack:

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript (strict) |
| Build | Vite |
| Styling | Tailwind CSS 4 (`@theme inline`, no config file) |
| Components | ShadCN UI (29 primitives on Radix UI) |
| Variants | CVA (class-variance-authority) |
| Routing | React Router 7 |
| i18n | react-i18next |
| Component docs | Storybook 10 |
| Unit testing | Vitest + React Testing Library |
| E2E testing | CodeceptJS + Playwright |

Backend adapters use the Commerce Cloud Script API (CommonJS, `require('dw/...')` modules).

## Security

If you discover any potential security issues, please report them to security@salesforce.com as soon as possible.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for submission requirements. All external contributors must sign the Contributor License Agreement (CLA). A prompt to sign the agreement appears when a pull request is submitted.

**To publish a new Commerce App:**

1. Package your app as a CAP ZIP file
2. Generate a SHA256 hash: `shasum -a 256 my-app-v1.0.0.zip`
3. Create `manifest.json` with all required fields
4. Create `catalog.json` with INIT placeholder (new apps only)
5. Place files at `{domain}/{app-name}/` and open a PR

CI validates the ZIP hash, creates a Git tag on merge, and updates the catalog automatically.

**To update an existing app:** update the ZIP and `manifest.json` only. Do not modify `catalog.json`.

## License

The Commerce Apps framework is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This repository may contain forward-looking statements that involve risks, uncertainties, and assumptions. If any such risks or uncertainties materialize or if any of the assumptions prove incorrect, results could differ materially from those expressed or implied. For more information, see [Salesforce SEC filings](https://investor.salesforce.com/financials/).

---

<p align="center">
  &copy; Copyright 2026 Salesforce, Inc. All rights reserved. Various trademarks held by their respective owners.<br>
  Built for ISV developers by the Commerce Apps team at Salesforce Commerce Cloud.
</p>
