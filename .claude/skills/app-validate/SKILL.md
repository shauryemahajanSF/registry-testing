# Commerce App Validation

You are helping a developer validate their Commerce App before packaging and submission. The developer is likely an ISV partner who needs to ensure their app meets all platform requirements, passes automated CI checks, and will not be rejected during registry review.

**Key context: This skill replaces the `b2c-cli app validate` command until CLI tooling is available.** When the CLI ships, this skill will complement it by providing AI-assisted validation with explanations and fix suggestions. Until then, Claude can perform the same checks by inspecting the developer's code directly.

Run through the validation checklist below. For each check, inspect the relevant files and report PASS, FAIL, or WARN with specific details about what needs to be fixed.

## How to Use This Skill

When a developer asks to validate their Commerce App, work through these sections in order:

1. **Project Structure** — Are the right files in the right places?
2. **Frontend Validation** — Do components follow all conventions? (skip if no frontend)
3. **Backend Validation** — Do adapters follow all patterns? (skip if no backend)
4. **CAP Packaging** — Is the package ready for submission?

Report a summary at the end with total PASS/FAIL/WARN counts and a prioritized list of issues to fix.

---

## 1. Project Structure Checks

### 1.1 Required Files Exist

Check that the project contains at least one of:

- `src/extensions/` — Frontend extension(s)
- `cartridges/` — Backend adapter(s)

A Commerce App must have frontend, backend, or both. An empty project is not valid.

### 1.2 Extension Structure (if frontend)

For each extension in `src/extensions/*/`:

| Check | What to Look For |
|-------|-----------------|
| `target-config.json` exists | Every extension must register its components |
| `target-config.json` is valid JSON | Parse it and check for syntax errors |
| Each component `path` points to an existing file | Resolve paths relative to `src/` |
| Each `targetId` is a known target | Compare against the target list in the `ui-targets` skill |
| Component files exist at declared paths | Every path in target-config must resolve to a real `.tsx` file |
| Stories exist for each component | Every component directory must have `stories/index.stories.tsx` |
| Translations file exists | `locales/en-GB.json` should exist if component has user-visible text |

### 1.3 Cartridge Structure (if backend)

For each cartridge in `cartridges/site_cartridges/*/`:

| Check | What to Look For |
|-------|-----------------|
| `package.json` exists at cartridge root | Must contain `"hooks"` field |
| `package.json` `hooks` field points to valid file | Resolve path, confirm `hooks.json` exists |
| `hooks.json` is valid JSON | Parse and check for syntax errors |
| Each hook `script` points to existing file | Resolve paths, confirm `.js` files exist |
| Hook names follow naming pattern | Must match `dw.apps.{domain}.{subdomain}.{action}` |
| Cartridge name follows conventions | Must start with `int_` or `bm_`, max 50 characters |

### 1.4 IMPEX Files (if backend)

| Check | What to Look For |
|-------|-----------------|
| `impex/install/` exists | Required for backend apps |
| `impex/uninstall/` exists | **Required** — must reverse all install changes |
| Install XML files are well-formed | Parse each XML file for syntax errors |
| Uninstall mirrors install | Every custom attribute, service, or preference defined in install should have a corresponding uninstall entry |

### 1.5 App Configuration

| Check | What to Look For |
|-------|-----------------|
| `app-configuration/tasksList.json` exists | Recommended for all apps with backend |
| `tasksList.json` is valid JSON | Parse and check structure |
| Tasks have required fields | Each task needs `id`, `title`, `description` |

---

## 2. Frontend Validation Checks

Run these checks on every `.tsx` and `.ts` file in `src/extensions/`:

### 2.1 Design Token Compliance

This is the most common reason for marketplace rejection. ISV components must be theme-agnostic.

**FAIL conditions — flag every occurrence:**

| Pattern | Issue |
|---------|-------|
| `bg-blue-500`, `text-gray-900`, etc. | Tailwind built-in color palette used instead of semantic tokens |
| `#fff`, `#000`, `rgb(...)`, `hsl(...)` | Hardcoded color values |
| `style={{ color: '...' }}` | Inline color styles |
| `style={{ fontSize: '...' }}` | Inline font sizes |
| `style={{ padding: '...' }}` | Inline spacing |
| `@apply` in component files | Tailwind @apply is not used in Storefront Next |

**PASS conditions — these are correct:**

| Pattern | Why It's Correct |
|---------|-----------------|
| `bg-primary`, `text-foreground`, `border-destructive` | Semantic token classes |
| `text-sm`, `text-lg`, `p-4`, `gap-2` | Tailwind sizing utilities (not color-dependent) |
| `rounded-md`, `shadow-sm` | Structural utilities |
| `cn('bg-primary', condition && 'bg-secondary')` | Conditional semantic classes via cn() |

### 2.2 Component Structure

For each component file:

| Check | What to Look For |
|-------|-----------------|
| `'use client'` directive | Must be present for components with hooks, events, or browser APIs |
| `export default` | Component must be the default export (required by UI Target system) |
| Return type is `ReactElement` | Function signature should include `: ReactElement` |
| `data-slot` attribute on wrapper | Root element should have `data-slot="component-name"` |
| No `any` type | Search for `: any`, `as any`, `<any>` — all are violations |
| Apache 2.0 copyright header | Must be present at top of every source file |

### 2.3 ShadCN UI Usage

| Check | What to Look For |
|-------|-----------------|
| Import paths correct | Must use `@/components/ui/<component>` pattern |
| Props typed correctly | Should use `React.ComponentProps<typeof Component>` |
| `cn()` imported correctly | Must import from `@/lib/utils` |

### 2.4 Accessibility (WCAG 2.1 AA)

| Check | What to Look For |
|-------|-----------------|
| No `<div onClick>` | Clickable elements must be `<button>` or `<a>` |
| Form inputs have labels | Every `<input>` must have an associated `<label>` |
| `useId()` for label associations | Never hardcode `id` values for form elements |
| ARIA attributes present | Interactive elements need `aria-label`, `aria-expanded`, etc. where appropriate |
| Keyboard navigation | Interactive components should handle `onKeyDown` for Enter/Space/Escape |
| Focus styles | Must include `focus-visible:` styles |
| Image alt text | Every `<img>` must have meaningful `alt` attribute |

### 2.5 Storybook Stories

For each story file:

| Check | What to Look For |
|-------|-----------------|
| Imports from correct package | Must use `'@storybook/react-vite'` not `'@storybook/react'` |
| Test utils from correct package | Must use `'storybook/test'` not `'@storybook/testing-library'` |
| Actions from correct package | Must use `'storybook/actions'` not `'@storybook/addon-actions'` |
| Has `tags` array | Should include `['autodocs', 'interaction']` |
| Has `play` function | At least one story should have interaction tests |
| Uses `waitForStorybookReady` | Play functions must call `waitForStorybookReady(canvasElement)` before assertions |
| Mobile story exists | At least one story should have `globals: { viewport: 'mobile2' }` |
| Does NOT use `parameters.viewport` | Must use `globals` for viewport, not `parameters` |

### 2.6 Internationalization

| Check | What to Look For |
|-------|-----------------|
| No hardcoded user-visible strings | All display text should use `useTranslation()` or come from props |
| Translation hook used correctly | `useTranslation('extensionName')` with correct namespace |
| Translation file exists | `locales/en-GB.json` with matching keys |

### 2.7 TypeScript

| Check | What to Look For |
|-------|-----------------|
| Strict mode enabled | `tsconfig.json` should have `"strict": true` |
| No `any` types | Search all files for `any` usage |
| Props are explicitly typed | Component props should have TypeScript interfaces or type aliases |

---

## 3. Backend Validation Checks

Run these checks on every `.js` file in `cartridges/`:

### 3.1 Hook Implementation

For each hook file:

| Check | What to Look For |
|-------|-----------------|
| `'use strict';` at top | Required for all Script API files |
| Exports match hook action | `exports.calculate` for a `calculate` hook, etc. |
| Returns `dw.system.Status` | Every hook must return `new Status(Status.OK)` or `new Status(Status.ERROR)` |
| Never returns `undefined` | Check all code paths — every branch must return Status |
| Uses `Transaction.wrap()` | All basket/order modifications must be inside Transaction.wrap |
| Calls `updateTotals()` | Must call `lineItemCtnr.updateTotals()` before reading basket data |

### 3.2 Error Handling

| Check | What to Look For |
|-------|-----------------|
| Try/catch around external calls | API calls to external services must be wrapped |
| Never blocks checkout | On API failure, hook should return `Status.OK` with graceful fallback (e.g., zero tax) |
| Logging on errors | Must use `Logger.getLogger()` to log failures |
| `Status.ERROR` only for system failures | External API errors should NOT return Status.ERROR |

### 3.3 Script API Usage

| Check | What to Look For |
|-------|-----------------|
| Uses `require('dw/...')` | Must use `require` syntax for all Script API imports |
| No `importPackage()` | Legacy syntax — must not be used |
| No npm packages | `require('some-npm-package')` is not supported in Script API |
| Cartridge-relative imports correct | Internal imports should use `~/cartridge/scripts/...` pattern |

### 3.4 Configuration & Security

| Check | What to Look For |
|-------|-----------------|
| No hardcoded credentials | Search for API keys, URLs, secrets in source files |
| No hardcoded URLs | External service endpoints should come from Site Preferences or service definitions |
| Config via Site Preferences | Should use `Site.getCurrent().getCustomPreferenceValue()` |
| Credentials in IMPEX service definitions | API keys should be in `services.xml`, not in code |
| No sensitive data in custom attributes | Custom attributes on Order/Basket should not store secrets |

### 3.5 Data Handling

| Check | What to Look For |
|-------|-----------------|
| Uses `dw/value/Money` for currency | Never plain numbers for monetary values |
| Null checks on addresses | `shipment.getShippingAddress()` can return null |
| Iterator pattern correct | Must use `.iterator()` then `while (iter.hasNext())` |

---

## 4. CAP Packaging Checks

These checks apply when the developer is ready to package for submission.

### 4.1 ZIP Structure

| Check | What to Look For |
|-------|-----------------|
| Single top-level directory | ZIP must contain exactly one root directory |
| Root directory named correctly | Should be `<appname>-v<version>/` |
| Only allowed subdirectories | `cartridges/`, `storefront-next/`, `impex/`, `app-configuration/` |
| No hidden files | No `.DS_Store`, `.__MACOSX/`, `.git/`, `.env` |
| No build artifacts | No `node_modules/`, `dist/`, `build/` |
| No IDE config | No `.vscode/`, `.idea/` |

### 4.2 Manifest

| Check | What to Look For |
|-------|-----------------|
| `manifest.json` exists | Must be next to the ZIP file |
| All 7 required fields present | `name`, `displayName`, `domain`, `description`, `version`, `zip`, `sha256` |
| `name` is kebab-case | Lowercase letters, numbers, hyphens only |
| `version` is semantic | `MAJOR.MINOR.PATCH` format, never `0.0.0` |
| `zip` matches actual filename | Must be exactly `<name>-v<version>.zip` |
| `sha256` matches actual hash | Compute: `shasum -a 256 <zipfile>` and compare |

### 4.3 Catalog

| Check | What to Look For |
|-------|-----------------|
| `catalog.json` exists (new apps only) | Required for first-time submissions |
| Uses INIT placeholder | `"version": "INIT"`, `"tag": "INIT"`, `"versions": []` |
| Not manually modified (updates) | For version updates, only change `manifest.json` — CI updates catalog |

### 4.4 Registry Directory

| Check | What to Look For |
|-------|-----------------|
| Correct location | Files must be at `<domain>/<app-name>/` |
| Three files present | `<app-name>-v<version>.zip`, `manifest.json`, `catalog.json` |

---

## Validation Report Format

After running all applicable checks, provide a summary:

```
## Validation Report: <app-name>

### Summary
- PASS: <count>
- FAIL: <count>
- WARN: <count>

### Failures (Must Fix)
1. [FAIL] <category> — <specific issue and file location>
   → Fix: <what to do>

2. [FAIL] <category> — <specific issue and file location>
   → Fix: <what to do>

### Warnings (Should Fix)
1. [WARN] <category> — <specific issue>
   → Recommendation: <what to do>

### All Checks Passed
- [PASS] <list of passed categories>
```

Prioritize failures by impact:
1. **Blocking** — Will cause CI rejection (SHA256 mismatch, missing manifest fields, invalid ZIP structure)
2. **Compliance** — Will cause marketplace rejection (hardcoded colors, missing accessibility, no Storybook stories)
3. **Quality** — Should fix for best practices (missing translations, no mobile story, missing error logging)

## What NOT to Do

- Do NOT skip validation checks because the developer says "it's just a prototype"
- Do NOT approve hardcoded color values under any circumstances — theme-agnostic is non-negotiable
- Do NOT ignore missing `impex/uninstall/` — clean removal is a platform requirement
- Do NOT validate against `sfdc.*` namespace targets that don't exist yet in the codebase
- Do NOT require files that are optional (e.g., `bm_cartridges/` is optional, `storefront-next/` is optional for backend-only apps)
- Do NOT check for `tailwind.config.ts` — it does not exist in Tailwind CSS 4
- Do NOT flag Tailwind sizing utilities (`p-4`, `text-sm`, `gap-2`) as hardcoded values — only color and theme-dependent values are violations
