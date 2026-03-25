---
name: validate-commerce-app
description: >-
  Validate a commerce app package before PR submission. Checks directory structure,
  root manifest format, SHA256 hash, commerce-app.json, and runs the full PR checklist
  from CONTRIBUTING.md. Use when preparing to submit a PR or debugging validation issues.
---

# Validate Commerce App Package

Run comprehensive validation checks on a commerce app before submitting a PR.

## Step 1: Identify the app to validate

Gather or infer:
- Domain (one of: `tax`, `payment`, `shipping`, `additionalFeature`)
- Sub-domain (for `additionalFeature` only, e.g., `giftCards`, `ratingsAndReviews`)
- App name (e.g., `avalara-tax`)
- Version to validate (or use latest ZIP in directory)

## Step 2: Validate ZIP file exists

Check that ZIP file exists at `<domain>/<isv-name>/<appName>-v<version>.zip`

## Step 3: Compute and verify SHA256

1. Compute SHA256 hash:
   ```bash
   shasum -a 256 <domain>/<isv-name>/<appName>-v<version>.zip
   ```

2. Read the root manifest at `commerce-apps-manifest/manifest.json`

3. Find your app's entry in the appropriate domain array (`tax`, `shipping`, `payment`, or `additionalFeature`)

4. Compare computed hash with `sha256` field in the manifest entry

5. **CRITICAL**: Hashes must match exactly

## Step 4: Validate root manifest entry

Check that the app entry in `commerce-apps-manifest/manifest.json` contains all required fields:

**Required fields:**
- `id` - must match app name
- `name` - human-readable display name
- `description` - app description
- `iconName` - icon filename (e.g., `avalara.png`)
- `domain` - must be one of: `tax`, `payment`, `shipping`, `additionalFeature`
- `subDomain` - required when `domain` is `additionalFeature`. Must be one of: `giftCards`, `ratingsAndReviews`, `loyalty`, `search`, `addressVerification`, `analytics`, `approachingDiscounts`
- `type` - must be `"app"`
- `provider` - must be `"thirdParty"`
- `version` - semantic version (e.g., `0.2.8`)
- `zip` - must match `<appName>-v<version>.zip`
- `sha256` - must match actual ZIP hash

**Validation steps:**
1. Verify entry exists in correct domain array
2. Verify all required fields are present and non-empty
3. Verify `domain` is a valid value
4. If `domain` is `additionalFeature`, verify `subDomain` is present and valid
5. Verify version format follows semantic versioning
6. Verify zip filename matches the actual file
7. Verify SHA256 matches computed hash

## Step 5: Validate ZIP contents

Extract and inspect the ZIP structure:

1. List ZIP contents without extracting:
   ```bash
   unzip -l <domain>/<isv-name>/<appName>-v<version>.zip
   ```

2. Check for common issues:
   - [ ] Single root folder named `commerce-<appName>-app-v<version>/`
   - [ ] No registry path prefixes (no `tax/`, `domain/`, etc.)
   - [ ] No junk files (`.DS_Store`, `__MACOSX`, `Thumbs.db`, hidden files)
   - [ ] No duplicate directory trees
   - [ ] commerce-app.json exists at root

3. Verify required files are present:
   - [ ] `commerce-app.json`
   - [ ] `README.md`
   - [ ] `app-configuration/tasksList.json`
   - [ ] `cartridges/` directory with at least one cartridge
   - [ ] `impex/install/services.xml`

## Step 6: Validate commerce-app.json

Extract and read `commerce-<appName>-app-v<version>/commerce-app.json`:

**Required fields:**
- `id` - must match app name
- `name` - display name
- `description`
- `domain` - must match root manifest domain
- `version` - must match root manifest version
- `publisher.name`
- `publisher.url`
- `publisher.support`

**Validation steps:**
1. Verify version in commerce-app.json matches root manifest version
2. Verify id matches app name
3. Verify domain matches
4. Check that publisher fields are valid URLs

## Step 7: Check for catalog.json

- If this is an **existing app** (catalog.json already exists):
  - [ ] Do NOT modify catalog.json - CI will update it
  - [ ] Verify catalog.json exists but unchanged in PR

- If this is a **brand new app** (no catalog.json):
  - [ ] Verify catalog.json is created with INIT values:
    ```json
    {
      "latest": {
        "version": "INIT",
        "tag": "INIT"
      },
      "versions": []
    }
    ```

## Step 8: Run final PR checklist

From CONTRIBUTING.md:

- [ ] ZIP file name follows format: `<appName>-v<version>.zip`
- [ ] Root manifest (commerce-apps-manifest/manifest.json) is updated
- [ ] Root manifest entry has all required fields
- [ ] version, zip, and sha256 in root manifest are correct
- [ ] SHA256 hash matches the actual ZIP file
- [ ] catalog.json is included for new apps only
- [ ] ZIP contains no junk files
- [ ] commerce-app.json version matches root manifest version
- [ ] All file paths are relative to app root (no absolute paths)
- [ ] No extracted directories are committed

## Report validation results

Provide a clear summary:
- **✅ PASS** - All validations passed, ready for PR
- **❌ FAIL** - List specific issues found with file paths and line numbers
- Provide fix recommendations for each issue
