---
name: inspect-app
description: >-
  Extract and optionally inspect a commerce app ZIP. Handles both quick extraction for modification
  and full inspection for learning/review/debugging. Use when users want to "extract", "look at",
  "inspect", "explore", "review", "examine", or "see what's inside" any app ZIP. Trigger proactively
  whenever users express curiosity about an app's implementation, structure, or contents.
---

# Extract & Inspect Commerce App

Extract commerce app ZIPs with optional deep inspection. Determines depth from user intent:
- **Extract only** — user wants to modify/edit → extract and stop
- **Full inspection** — user wants to understand/review/debug → extract, inspect, report, cleanup

## Usage

```bash
/inspect-app <app-name>
/inspect-app <domain>/<app-name>
```

## Step 1: Locate and extract ZIP

```bash
# Find ZIP (app name only → search all domains; domain/app → direct lookup)
find . -name "*<app-name>-v*.zip" -type f | head -1

# Validate and extract
cd <domain>/<app-name>/
unzip -t <app-name>-v<version>.zip
unzip -q <app-name>-v<version>.zip
```

Creates: `commerce-<app-name>-app-v<version>/`

If directory already exists, ask user before overwriting.

## Step 2: Determine intent

**If user wants to modify/edit** → show path, stop:

```
✅ Extracted to: <domain>/<app-name>/commerce-<app-name>-app-v<version>/

When done editing, use /package-app to repackage.
⚠️  Delete extracted directory before committing.
```

**If user wants to inspect/review/learn/debug** → continue to Step 3.

## Step 3: Inspect structure and key files

```bash
cd commerce-<app-name>-app-v<version>/
tree -L 3 -I 'node_modules|*.log'
```

Read and validate:
- **commerce-app.json** — id, version, domain, publisher
- **README.md** — installation docs present
- **hooks.json** — `cartridges/site_cartridges/*/cartridge/scripts/hooks.json`
- **services.xml** — `impex/install/services.xml` (if present)

Verify referenced script files actually exist.

## Step 4: Check for issues

```bash
# Junk files
find . -name ".DS_Store" -o -name "Thumbs.db" -o -name "__MACOSX" -o -name "*.swp"

# Shouldn't be in ZIP
find . -type d -name "node_modules"

# Absolute paths
grep -r "/Users/\|C:\\\\" . 2>/dev/null

# Hardcoded secrets
grep -ri "password\|apikey\|secret" cartridges/ impex/ 2>/dev/null
```

## Step 5: Report and cleanup

Generate summary:

```markdown
## Inspection Report: <app-name> v<version>

### Structure
- Root: `commerce-<app-name>-app-v<version>/`
- Files: <count>
- Cartridges: <list>

### Validation
- [ ] commerce-app.json valid
- [ ] Hook scripts exist
- [ ] Services configured
- [ ] No junk files
- [ ] No hardcoded secrets

### Issues
<list or "None found">
```

Cleanup:
```bash
cd <domain>/<app-name>/
rm -rf commerce-<app-name>-app-v<version>/
```

## Related skills

- `/package-app` — repackage after modifications
- `/diff-versions` — compare two app versions
- `/validate-app` — full pre-submission validation
