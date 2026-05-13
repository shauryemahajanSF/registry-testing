# CLAUDE.md

## Commerce Apps Testing Repository

This is the Commerce App Package (CAP) registry for Salesforce Commerce Cloud. See `CONTRIBUTING.md` for submission guidelines and `AGENTS.md` for full AI assistant context.

## Rules

### Re-package after any app file change

When you modify any file inside a `commerce-<appName>-app-v*/` directory (e.g. `commerce-app.json`, impex XML, storefront components, icons), the corresponding ZIP is stale. You **must** re-package the ZIP and update the SHA256 hash in `commerce-apps-manifest/manifest.json` before reporting the task as complete. Do not wait for the user to ask — do it proactively as part of the same operation.
