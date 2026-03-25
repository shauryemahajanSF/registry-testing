<h1 align="center">Commerce Apps</h1>
<h3 align="center">Salesforce Commerce Cloud</h3>

<p align="center">
  Build, package, and distribute installable extensions for Salesforce Commerce Cloud storefronts.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#published-apps">Published Apps</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#disclaimer">Disclaimer</a>
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

## Quick Start

### Using Claude Code Skills

If you're using Claude Code, we provide comprehensive skills to streamline development:

**Start a new app:**
```
/scaffold-commerce-app
```

**Generate impex files:**
```
/generate-service-impex
/generate-site-preferences-impex
/generate-custom-object-impex
```

**Package and validate:**
```
/generate-commerce-app
/validate-commerce-app
/validate-impex
```

**Submit to registry:**
```
/submit-app-pr
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete skill documentation.

### Manual Development

Build your app directory with the following CAP structure:

```
commerce-{app-name}-app-v{version}/
├── commerce-app.json                # App metadata
├── README.md                        # Documentation
├── app-configuration/
│   └── tasksList.json              # Post-install merchant setup steps
├── cartridges/
│   ├── site_cartridges/{name}/    # Script API hook implementations
│   │   ├── package.json
│   │   ├── cartridge/scripts/
│   │   │   ├── hooks.json         # Registers hooks with the platform
│   │   │   ├── hooks/             # Hook implementations
│   │   │   ├── helpers/           # Business logic
│   │   │   └── services/          # Service framework wrappers
│   │   └── test/                  # Unit tests
│   └── bm_cartridges/             # Business Manager extensions (optional)
├── storefront-next/src/extensions/{name}/  # React components for UI Targets
│   ├── target-config.json         # Maps components → storefront extension points
│   └── components/
├── impex/
│   ├── install/                   # Service configs, custom attributes, preferences
│   │   ├── services.xml
│   │   ├── meta/
│   │   │   ├── system-objecttype-extensions.xml
│   │   │   └── custom-objecttype-definitions.xml
│   │   └── sites/SITEID/
│   │       └── preferences.xml
│   └── uninstall/                 # Cleanup for uninstalled apps
│       └── services.xml
└── icons/                         # App icon (optional)
```

## Published Apps

Apps are organized by domain and ISV/vendor:

```
{domain}/{isv-name}/
  ├── {app-name}-v{version}.zip    # The installable CAP
  ├── manifest.json                 # Version metadata + SHA256 hash
  └── catalog.json                  # Version history (updated by CI)
```

**Example structure:**

```
tax/
├── avalara/
│   ├── avalara-tax-v0.2.8.zip
│   ├── manifest.json
│   └── catalog.json
└── vertex/
    ├── vertex-tax-v1.0.0.zip
    ├── manifest.json
    └── catalog.json

payment/
├── stripe/
│   ├── stripe-payment-v1.0.0.zip
│   ├── manifest.json
│   └── catalog.json
└── adyen/
    ├── adyen-payment-v1.0.0.zip
    ├── manifest.json
    └── catalog.json

additionalFeature/
├── bazaarvoice/
│   ├── bazaarvoice-ratings-v1.0.0.zip
│   ├── manifest.json
│   └── catalog.json
└── salesforce-gift-cards/
    ├── salesforce-gift-cards-v0.0.1.zip
    ├── manifest.json
    └── catalog.json
```

**Note:** Extracted app directories (`commerce-{app-name}-app-v{version}/`) are for development only and should NOT be committed to the repository.

### Domains

There are four domains. Every app's `domain` field must be one of these:

| Domain | Description | Example Apps |
|--------|-------------|--------------|
| `tax` | Tax calculation and compliance | Avalara, Vertex |
| `payment` | Payment processing | Stripe, Adyen, PayPal |
| `shipping` | Shipping and fulfillment | ShipStation, EasyPost |
| `additionalFeature` | All other checkout capabilities (see sub-domains) | Gift Cards, Reviews, Loyalty |

### Sub-domains (for `additionalFeature`)

Apps with `domain: "additionalFeature"` must include a `subDomain` field that groups them under a single hub tile. Multiple providers sharing the same `subDomain` appear as options within that tile.

| Sub-domain | Description | Example Apps |
|------------|-------------|--------------|
| `giftCards` | Gift card purchasing, redemption, and balance | Salesforce Gift Cards, Adyen Gift Cards |
| `ratingsAndReviews` | Product ratings and reviews | Bazaarvoice, Yotpo, PowerReviews |
| `loyalty` | Loyalty programs and rewards | LoyaltyLion, Smile.io |
| `search` | Search and merchandising | Algolia, Elasticsearch |
| `addressVerification` | Address validation and standardization | Smarty, Google Address Validation |
| `analytics` | Analytics and reporting | Google Analytics, Segment |
| `approachingDiscounts` | Approaching discount notifications | Salesforce Approaching Discounts |

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete submission requirements and Claude Code skills documentation.

### Publishing Workflow

**Using Claude Code (Recommended):**

1. **Scaffold new app:** `/scaffold-commerce-app`
2. **Build your app code** (cartridges, extensions, etc.)
3. **Generate impex:** `/generate-service-impex`, `/generate-site-preferences-impex`
4. **Package app:** `/generate-commerce-app`
5. **Validate:** `/validate-commerce-app` and `/validate-impex`
6. **Submit PR:** `/submit-app-pr`

**Manual Process:**

1. Build your app directory with required structure
2. Package as a CAP ZIP file: `zip -r my-app-v1.0.0.zip commerce-my-app-app-v1.0.0/ -x "*.DS_Store" -x "__MACOSX/*" -x "*/.*"`
3. Generate SHA256 hash: `shasum -a 256 my-app-v1.0.0.zip`
4. Create `manifest.json` with all required fields (name, displayName, domain, description, version, zip, sha256)
5. Create `catalog.json` with INIT placeholder (new apps only)
6. Place files at `{domain}/{isv-name}/` (e.g., `tax/avalara/` or `additionalFeature/bazaarvoice/`)
7. Commit ONLY the ZIP, manifest.json, and catalog.json (do NOT commit extracted directories)
8. Open a PR

**CI Validation:** Validates ZIP structure, manifest format, and SHA256 hash. On merge, creates a Git tag and updates the catalog automatically.

**Updating an app:** Update the ZIP and `manifest.json` only. Do NOT add new versions to `catalog.json` (CI handles it). You may add `"deprecated": true` to existing versions if needed.

### What to Commit

Only commit these files to the repository:

✅ **DO commit:**
- `{app-name}-v{version}.zip` - The packaged app
- `manifest.json` - App metadata and SHA256 hash
- `catalog.json` - Version catalog (new apps only, with INIT values)

❌ **DO NOT commit:**
- `commerce-{app-name}-app-v{version}/` - Extracted app directories (dev only)
- `.DS_Store`, `Thumbs.db` - System files
- `node_modules/` - Dependencies
- Old ZIP versions - Delete before committing
- IDE files (`.vscode/`, `.idea/`)

The repository `.gitignore` is configured to exclude extracted directories and system files.

### Claude Code Skills

This repository includes comprehensive skills for Commerce App development:

**App Development:**
- `/scaffold-commerce-app` - Generate complete app structure
- `/generate-commerce-app` - Package app into ZIP
- `/update-app-version` - Streamline version bumps

**Impex Generation:**
- `/generate-service-impex` - Service credentials, profiles, definitions
- `/generate-site-preferences-impex` - Custom site preferences
- `/generate-custom-object-impex` - Custom object types
- `/validate-impex` - Validate all impex files

**Validation & Inspection:**
- `/validate-commerce-app` - Comprehensive validation (structure, manifest, impex)
- `/validate-impex` - Deep impex validation (also included in `/validate-commerce-app`)
- `/extract-and-inspect` - Extract and inspect ZIP files
- `/compare-app-versions` - Compare versions for changelogs

**Submission:**
- `/submit-app-pr` - Guide through PR submission process

### External Contributors

All external contributors must sign the Contributor License Agreement (CLA). A prompt to sign the agreement appears when a pull request is submitted.

## Disclaimer

This repository may contain forward-looking statements that involve risks, uncertainties, and assumptions. If any such risks or uncertainties materialize or if any of the assumptions prove incorrect, results could differ materially from those expressed or implied. For more information, see [Salesforce SEC filings](https://investor.salesforce.com/financials/).

---

<p align="center">
  &copy; Copyright 2026 Salesforce, Inc. All rights reserved. Various trademarks held by their respective owners.<br>
  Built for ISV developers by the Commerce Apps team at Salesforce Commerce Cloud.
</p>
