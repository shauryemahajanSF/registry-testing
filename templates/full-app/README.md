# Address Verification — Full App Template

A Commerce App that replaces the platform's shipping address form with an address verification and autocomplete experience powered by a third-party provider (Loqate, Experian, etc.). This template demonstrates the **Full App** path — frontend UI components backed by a custom SCAPI endpoint and Script API cartridge.

## Architecture

```
┌─────────────────────────────┐
│   AddressForm Component     │  Frontend (MRT)
│   (React, wrapper target)   │
└──────────┬──────────────────┘
           │ fetch()
           ▼
┌─────────────────────────────┐
│   Custom SCAPI Endpoint     │  B2C Commerce Instance
│   (hooks/addressSuggest.js) │
│   (hooks/addressVerify.js)  │
└──────────┬──────────────────┘
           │ LocalServiceRegistry
           ▼
┌─────────────────────────────┐
│   addressVerificationService│  Script API Callout
│   (services/*)              │
└──────────┬──────────────────┘
           │ HTTPS
           ▼
┌─────────────────────────────┐
│   Loqate / Experian API     │  Third-Party Service
└─────────────────────────────┘
```

The ISV owns the data contract between the frontend component and the custom SCAPI endpoint. The platform provides the transport layer (SCAPI → Script API dispatch).

## UI Targets

| Target ID | Type | Description |
|-----------|------|-------------|
| `checkout.shippingAddress` | Wrapper | Replaces the default checkout shipping address form |
| `sfdc.account.addresses.shippingAddress` | Wrapper | Replaces the My Account address management form |

Both targets render the same `AddressForm` component — it adapts to its context automatically.

## Custom SCAPI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `address-verification/suggest` | GET | Autocomplete suggestions as the shopper types |
| `address-verification/verify` | POST | Full verification of a complete address |

## Project Structure

```
address-verification/
├── src/extensions/address-verification/
│   ├── target-config.json              # Maps component → 2 UI Targets
│   ├── components/
│   │   └── address-form/
│   │       ├── index.tsx               # Wrapper component (replaces default)
│   │       └── stories/
│   │           └── index.stories.tsx   # Storybook stories
│   └── locales/
│       └── en-GB.json                  # Translation strings
├── cartridges/site_cartridges/
│   └── int_address_verification/
│       ├── cartridge/scripts/
│       │   ├── hooks.json              # Registers custom SCAPI endpoints
│       │   ├── hooks/
│       │   │   ├── addressSuggest.js   # GET suggest endpoint
│       │   │   └── addressVerify.js    # POST verify endpoint
│       │   └── services/
│       │       └── addressVerificationService.js  # Third-party API callout
│       └── package.json                # Points to hooks.json
├── impex/
│   ├── install/
│   │   ├── services.xml                # API service definitions
│   │   └── site-preferences.xml        # API key, provider, countries
│   └── uninstall/
│       ├── services.xml                # Clean removal
│       └── site-preferences.xml        # Clean removal
├── app-configuration/
│   └── tasksList.json                  # Post-install merchant setup steps
├── package.json
└── README.md
```

## Getting Started

### Frontend

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

### Backend

1. Import IMPEX files in Business Manager:
   - `impex/install/services.xml` — creates service connections
   - `impex/install/site-preferences.xml` — creates configuration preferences

2. Add `int_address_verification` to the site cartridge path.

3. Configure in Business Manager:
   - Set your API key, provider, and supported countries
   - Update the service endpoint URL for your provider
   - Enable the integration

## Customization

### Frontend
- **Styling**: Uses design tokens (`bg-popover`, `text-foreground`, `border`, etc.) — automatically adapts to all Storefront Next theme variants.
- **Autocomplete UX**: Adjust debounce timing, minimum character threshold, and max suggestions in `AddressForm`.
- **Additional targets**: Register the same component in more UI Targets by adding entries to `target-config.json`.

### Backend
- **Provider mapping**: Customize `transformSuggestions()` and `transformVerification()` in the hook files for your specific provider's API response format.
- **Service URL**: Update the IMPEX service credentials for your provider's endpoint.
- **Error handling**: The hooks return empty results on API failure — shoppers can always enter addresses manually.

See the [ISV Developer Guide](../../docs/Commerce-Apps-ISV-Developer-Guide.pdf) for full details.
