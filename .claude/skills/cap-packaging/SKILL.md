# CAP Packaging and Submission

You are helping a developer package and submit a Commerce App to the Commerce Apps Registry. The developer is likely an ISV partner who needs to create a Commerce App Package (CAP), generate the required metadata files, and submit a pull request to the registry.

**Key context: A CAP is a ZIP file containing the complete app.** It includes backend cartridges, frontend Storefront Next extensions (optional), IMPEX configuration, and setup guidance. The ZIP is submitted to the registry alongside a `manifest.json` and `catalog.json`. CI automation handles version tagging and catalog updates after merge.

## CAP Structure

### Inside the ZIP

A Commerce App Package contains all the code and configuration needed to install the app on a merchant's storefront:

```
commerce-my-app-v1.0.0/
├── README.md                          # Installation and configuration docs
├── cartridges/
│   ├── site_cartridges/
│   │   └── int_myapp/                 # Backend adapter cartridge
│   │       ├── cartridge/
│   │       │   └── scripts/
│   │       │       ├── hooks.json     # Hook registration
│   │       │       ├── hooks/         # Hook implementations
│   │       │       └── helpers/       # API client, data transforms
│   │       └── package.json           # Points to hooks.json
│   └── bm_cartridges/                 # Optional: Business Manager extensions
│       └── bm_myapp/
│           └── cartridge/
├── storefront-next/                   # Optional: Frontend UI components
│   └── src/
│       └── extensions/
│           └── my-extension/
│               ├── target-config.json
│               ├── components/
│               │   └── my-component/
│               │       ├── index.tsx
│               │       └── stories/
│               │           └── index.stories.tsx
│               ├── providers/         # Optional
│               ├── hooks/             # Optional
│               └── locales/           # Optional
│                   └── en-GB.json
├── impex/
│   ├── install/
│   │   ├── meta/
│   │   │   └── system-objecttype-extensions.xml
│   │   ├── services.xml
│   │   ├── jobs.xml                   # Optional
│   │   ├── libraries/LIBRARYID/       # Optional
│   │   └── sites/SITEID/
│   │       └── preferences.xml
│   └── uninstall/
│       ├── meta/
│       │   └── system-objecttype-extensions.xml
│       ├── services.xml
│       └── jobs.xml                   # Optional
└── app-configuration/
    └── tasksList.json                 # Post-install setup steps
```

### What Each Section Contains

| Directory | Required | Purpose |
|-----------|----------|---------|
| `cartridges/site_cartridges/` | Yes (if backend) | Script API hook implementations (see SKILL-3) |
| `cartridges/bm_cartridges/` | No | Business Manager UI extensions |
| `storefront-next/src/extensions/` | Yes (if frontend) | UI Target components (see SKILL-1, SKILL-2) |
| `impex/install/` | Yes (if backend) | Custom attributes, service configs, site preferences |
| `impex/uninstall/` | Yes (if install exists) | Reversal of install IMPEX for clean removal |
| `app-configuration/` | Recommended | Post-install merchant setup guidance |
| `README.md` | Recommended | Installation instructions, feature overview |

A Commerce App must include at least one of: backend cartridges or frontend extensions.

## Registry File Structure

Each app in the registry has three files in its domain directory:

```
tax/
  avalara-tax/
    avalara-tax-v0.2.2.zip     # The CAP ZIP file
    manifest.json               # Version metadata
    catalog.json                # Version history
```

Apps are organized by domain: `tax/`, `shipping/`, `payment/`, `fraud/`, etc.

## manifest.json

The manifest describes the current version of the app. It lives alongside the ZIP file.

### Schema

```json
{
  "name": "avalara-tax",
  "displayName": "Avalara Tax",
  "domain": "tax",
  "description": "Sample Avalara tax app used for testing",
  "version": "0.2.2",
  "zip": "avalara-tax-v0.2.2.zip",
  "sha256": "0b9fbe14673f85d6bce1509d6d61e5fdfee9aa181196ab723b004c0ae119de1a"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Kebab-case app identifier. Must be unique in the registry. |
| `displayName` | String | Yes | Human-readable name for the marketplace. |
| `domain` | String | Yes | Feature domain: `tax`, `shipping`, `payment`, `fraud`, etc. |
| `description` | String | Yes | Short description of what the app does. |
| `version` | String | Yes | Semantic version (`MAJOR.MINOR.PATCH`). |
| `zip` | String | Yes | ZIP filename. Must match format: `[name]-v[version].zip`. |
| `sha256` | String | Yes | SHA256 hash of the ZIP file for integrity verification. |

## catalog.json

The catalog tracks all released versions of an app. It is automatically updated by CI after merge.

### For New Apps

Create an initial catalog.json with the INIT placeholder:

```json
{
  "latest": {
    "version": "INIT",
    "tag": "INIT"
  },
  "versions": []
}
```

### After CI Processing

The CI workflow updates catalog.json automatically:

```json
{
  "latest": {
    "version": "0.2.2",
    "tag": "avalara-tax-v0.2.2"
  },
  "versions": [
    {
      "version": "0.1.2",
      "tag": "avalara-tax-v0.1.2"
    },
    {
      "version": "0.2.2",
      "tag": "avalara-tax-v0.2.2"
    }
  ]
}
```

The `tag` field matches the ZIP filename without `.zip` and is used to create Git tags.

## Packaging Steps

### Step 1: Organize Your App Directory

Ensure your app follows the CAP structure. The top-level directory inside the ZIP should include the app name and version:

```
commerce-my-app-v1.0.0/
  cartridges/
  storefront-next/    # if frontend components exist
  impex/
  app-configuration/
  README.md
```

### Step 2: Create the ZIP

Exclude hidden files and OS metadata:

```bash
# macOS/Linux
zip -r my-app-v1.0.0.zip commerce-my-app-v1.0.0/ \
  -x "*.DS_Store" -x "__MACOSX/*" -x "*/.*" -x "Thumbs.db"
```

### Step 3: Generate SHA256 Hash

```bash
# macOS
shasum -a 256 my-app-v1.0.0.zip

# Linux
sha256sum my-app-v1.0.0.zip
```

Copy the hash value for the manifest.

### Step 4: Create manifest.json

```json
{
  "name": "my-app",
  "displayName": "My Commerce App",
  "domain": "tax",
  "description": "Integrates My Tax Service with Commerce Cloud checkout.",
  "version": "1.0.0",
  "zip": "my-app-v1.0.0.zip",
  "sha256": "<hash from step 3>"
}
```

### Step 5: Create catalog.json (New Apps Only)

For a brand-new app that doesn't exist in the registry yet:

```json
{
  "latest": {
    "version": "INIT",
    "tag": "INIT"
  },
  "versions": []
}
```

For version updates to an existing app, do not modify catalog.json — CI handles it.

### Step 6: Place Files in Registry

```
[domain]/
  [app-name]/
    [app-name]-v[version].zip
    manifest.json
    catalog.json          # new apps only
```

### Step 7: Submit Pull Request

Create a PR with:
- The ZIP file
- The manifest.json (new or updated)
- The catalog.json (new apps only)

## Version Updates

When releasing a new version of an existing app:

1. Create the new ZIP with the updated version number
2. Generate the new SHA256 hash
3. Update `manifest.json` — change `version`, `zip`, and `sha256`
4. Do NOT modify `catalog.json` — CI updates it automatically
5. Submit a PR with the new ZIP and updated manifest

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| App name | kebab-case | `avalara-tax` |
| ZIP filename | `[name]-v[version].zip` | `avalara-tax-v0.2.2.zip` |
| Git tag | `[name]-v[version]` | `avalara-tax-v0.2.2` |
| Version | Semantic versioning | `1.0.0`, `0.2.2` |
| Domain directory | lowercase | `tax/`, `shipping/`, `payment/` |
| Site cartridge | `int_[name]` prefix | `int_avatax` |
| BM cartridge | `bm_[name]` prefix | `bm_avatax` |
| Cartridge name | Max 50 characters | — |

## CI/CD Automation

The `update-catalog.yml` GitHub Actions workflow runs when a ZIP file is pushed to `main`:

1. Detects changed ZIP files
2. Reads manifest.json for version info
3. Creates a Git tag matching the ZIP filename (without `.zip`)
4. Updates catalog.json:
   - Sets `latest.version` and `latest.tag` to the new release
   - Appends a new entry to the `versions` array
5. Creates an automated PR with the catalog.json update

ISV developers do not need to interact with this workflow directly — it runs automatically after their PR is merged.

## Submission Checklist

Before submitting your PR:

- [ ] ZIP filename follows format: `[appName]-v[version].zip`
- [ ] ZIP excludes hidden files (`.DS_Store`, `__MACOSX/`, `Thumbs.db`)
- [ ] `manifest.json` has all required fields (`name`, `displayName`, `domain`, `description`, `version`, `zip`, `sha256`)
- [ ] `sha256` in manifest matches actual ZIP hash
- [ ] `version` in manifest matches ZIP filename
- [ ] `catalog.json` included (new apps only, with INIT values)
- [ ] ZIP contains `README.md` with installation instructions
- [ ] Backend cartridge has `package.json` pointing to `hooks.json`
- [ ] `impex/uninstall/` reverses all `impex/install/` changes
- [ ] `app-configuration/tasksList.json` guides merchant through setup
- [ ] Frontend extensions have Storybook stories (see SKILL-4)
- [ ] All source files include the Apache 2.0 copyright header

## What NOT to Do

- Do not modify `catalog.json` when updating an existing app — CI handles this
- Do not include node_modules, build artifacts, or IDE config in the ZIP
- Do not include hidden files (`.git/`, `.env`, `.DS_Store`) in the ZIP
- Do not hardcode API credentials anywhere in the package — use IMPEX service definitions
- Do not skip the uninstall IMPEX — merchants need clean removal
- Do not use version `0.0.0` or non-semantic version strings
- Do not include the same ZIP filename as a previous version — each version must have a unique filename
- Do not reference internal Salesforce release numbers in README or any documentation
