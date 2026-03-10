# Avalara Tax — API Adapter Only Template

A Commerce App that integrates Avalara AvaTax for real-time tax calculation. This template demonstrates the **API Adapter Only** path — backend Script API hooks with no frontend UI components.

## Hook Contracts

| Hook | Action | Description |
|------|--------|-------------|
| `dw.apps.checkout.tax.calculate` | `calculate` | Calculates tax for all line items during checkout |
| `dw.apps.checkout.tax.commit` | `commit` | Finalizes the tax transaction after order placement |
| `dw.apps.checkout.tax.cancel` | `cancel` | Voids the tax transaction on order cancellation |

## Project Structure

```
avalara-tax/
├── cartridges/site_cartridges/
│   └── int_avalara_tax/
│       ├── cartridge/scripts/
│       │   ├── hooks.json                # Registers hooks with the platform
│       │   └── hooks/
│       │       ├── taxCalculation.js     # calculate — line item tax
│       │       ├── taxCommit.js          # commit — finalize after order
│       │       └── taxCancel.js          # cancel — void on cancellation
│       └── package.json                  # Points to hooks.json
├── impex/
│   ├── install/
│   │   ├── services.xml                  # Avalara API service definitions
│   │   └── site-preferences.xml          # Account ID, license key, company code
│   └── uninstall/
│       ├── services.xml                  # Clean removal of services
│       └── site-preferences.xml          # Clean removal of preferences
├── app-configuration/
│   └── tasksList.json                    # Post-install merchant setup steps
├── package.json
└── README.md
```

## Getting Started

1. Import IMPEX files to set up service definitions and site preferences:
   - `impex/install/services.xml` — creates the Avalara API service connections
   - `impex/install/site-preferences.xml` — creates configuration preferences in Business Manager

2. Add `int_avalara_tax` to your site's cartridge path.

3. Configure your Avalara credentials in Business Manager:
   - Navigate to **Merchant Tools > Site Preferences > Custom Preferences > Avalara AvaTax**
   - Enter your Account ID, License Key, and Company Code
   - Select the environment (Sandbox or Production)

4. Enable the integration by toggling **Enable Avalara Tax** to true.

## Key Patterns

- **Graceful fallback**: `calculate` returns `Status.OK` with zero tax on API failure — never blocks checkout
- **Commit/cancel lifecycle**: `commit` finalizes tax on order placement; `cancel` voids on order cancellation
- **Transaction.wrap()**: All basket/order modifications are wrapped in transactions
- **Service framework**: Uses `LocalServiceRegistry` with IMPEX-defined credentials — no hardcoded secrets
- **Logging**: All errors logged via `Logger.getLogger('avalara', 'tax')` for Business Manager log monitoring

## Customization

- **Tax codes**: Map your product tax class IDs to Avalara tax codes in `buildTaxRequest()`
- **Ship-from address**: Add your warehouse/origin address to the request for accurate nexus calculation
- **Tax-included pricing**: Adjust the request for markets where prices include tax
- **Custom attributes**: Add order-level custom attributes to store Avalara document codes for reconciliation

See the [ISV Developer Guide](../../docs/Commerce-Apps-ISV-Developer-Guide.pdf) for full details.
