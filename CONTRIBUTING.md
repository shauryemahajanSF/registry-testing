# Contributing to Commerce App Registry

Please follow the guidelines below when submitting new or updated commerce app versions to ensure consistency and smooth reviews.

---

## Pull Request Requirements

Each PR **must** include the following items:

### 1. Commerce App ZIP File

Include the packaged app as a ZIP file with the following naming convention:

```
[appName]-v[appVersion].zip
```

**Example:**
```
avalara-tax-v1.0.0.zip
```

---

### 2. `manifest.json`

Each PR must include a `manifest.json` file containing the metadata for the app version.

#### Required Fields

The manifest **must** include the following fields:

- `name`
- `displayName`
- `domain`
- `description`
- `version`
- `zip`
- `sha256`

> **Note:** For new versions of an existing app, you must at minimum update the `version`, `zip`, and `sha256` fields.

#### Example `manifest.json`

```json
{
  "name": "avalara-tax",
  "displayName": "Avalara Tax",
  "domain": "tax",
  "description": "Sample Avalara tax app",
  "version": "1.0.0",
  "zip": "avalara-tax-v1.0.0.zip",
  "sha256": "492fb0bc3aa5c762c0209bd22375e14ed2af8f672b679d6105232a37fe726a4f"
}
```

---

## Brand New Apps

If you are contributing a **brand new app**, you must also create a `catalog.json` file with **exactly** the following content so CI can update it:

```json
{
  "latest": {
    "version": "INIT",
    "tag": "INIT"
  },
  "versions": []
}
```

---

## Final Checklist

Before submitting your PR, please verify:

- [ ] ZIP file name follows the required format
- [ ] `manifest.json` includes all required fields
- [ ] `version`, `zip`, and `sha256` are updated correctly
- [ ] `catalog.json` is included for new apps only


