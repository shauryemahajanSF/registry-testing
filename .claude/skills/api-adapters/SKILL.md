# Backend API Adapters for Commerce Apps

You are helping a developer implement backend API adapters for a Commerce App on Salesforce Commerce Cloud. The developer is likely an ISV partner who needs to write Script API hook code that integrates their third-party service (tax, shipping, payments, fraud, etc.) with the Commerce Cloud platform.

**Key context: Backend adapters are Script API hooks packaged inside a cartridge.** The ISV writes JavaScript files that implement platform-defined hook contracts. Each hook receives Commerce Cloud objects (baskets, orders) as parameters, calls the ISV's external API, and writes results back to the Commerce Cloud objects. These hooks run server-side on the Commerce Cloud platform — they are not React components. The cartridge is packaged inside the Commerce App Package (CAP) alongside any frontend extensions.

This skill covers what the ISV authors for the backend. For frontend UI components, see SKILL-1 (storefront-components) and SKILL-2 (ui-targets). For packaging the complete app, see SKILL-5 (cap-packaging).

## Platform Syntax (Update When Finalized)

These values are based on the current working implementation. Update when additional adapter domains are finalized.

```
# Adapter Provider Interface naming pattern
# Format: dw.apps.{domain}.{subdomain}.{action}
#
# Tax domain (implemented):
#   dw.apps.checkout.tax.calculate   — called when tax needs to be calculated
#   dw.apps.checkout.tax.commit      — called after successful order placement
#   dw.apps.checkout.tax.cancel      — called when order is cancelled or payment fails
#
# Additional domains will follow the same pattern as they are defined.
ADAPTER_INTERFACE_PATTERN = dw.apps.{domain}.{subdomain}.{action}

# Cartridge directory structure within a CAP
CARTRIDGE_PATH = cartridges/site_cartridges/{cartridge_name}/cartridge/
HOOKS_JSON = cartridge/scripts/hooks.json
HOOK_SCRIPTS = cartridge/scripts/hooks/
HELPER_SCRIPTS = cartridge/scripts/helpers/

# IMPEX directory structure within a CAP
IMPEX_INSTALL = impex/install/
IMPEX_UNINSTALL = impex/uninstall/
```

## Cartridge Fundamentals

A **cartridge** is the packaging unit for server-side code on Commerce Cloud. If you've never built one before, here's what you need to know:

- A cartridge is a directory with a specific structure. The platform looks for code inside a `cartridge/` subdirectory.
- Cartridge names must be 50 characters or fewer.
- Integration cartridges use the `int_` prefix by convention (e.g., `int_avatax`, `int_vertex`, `int_shipstation`).
- Cartridges use **CommonJS** (`require`/`module.exports`), not ES modules.
- The Script API is available via `require('dw/...')` — these are platform-provided modules, not npm packages.
- All data modifications (basket, order) must be wrapped in `Transaction.wrap()`.
- Cartridge scripts run server-side on the Commerce Cloud platform in a sandboxed JavaScript environment.

## What the ISV Writes

A backend adapter implementation consists of three parts:

1. **Hook scripts** — JavaScript files that implement the platform-defined contracts (e.g., calculate tax, commit tax, cancel tax)
2. **Helper modules** — Shared logic for calling your external API and transforming data
3. **IMPEX files** — XML files that define custom attributes, service credentials, and site preferences your adapter needs

### Directory Structure

```
cartridges/site_cartridges/int_myapp/
  cartridge/
    scripts/
      hooks.json              # Registers hooks with the platform
      hooks/
        calculate.js          # Hook implementation: calculate
        commit.js             # Hook implementation: commit
        cancel.js             # Hook implementation: cancel
      helpers/
        myAppHelper.js        # API client, data transformation, config
  package.json                # Points to hooks.json

impex/
  install/
    meta/
      system-objecttype-extensions.xml   # Custom attributes on Basket, Order, SitePreferences
    services.xml                         # Service credentials, profiles, definitions
    sites/SITEID/
      preferences.xml                    # Default values for site preferences
  uninstall/
    meta/
      system-objecttype-extensions.xml   # Remove custom attributes
    services.xml                         # Remove service definitions

app-configuration/
  tasksList.json              # Post-install setup steps for the merchant
```

## Hook Registration

### hooks.json

This file maps platform-defined hook names to your script files. It lives at `cartridge/scripts/hooks.json`:

```json
{
  "hooks": [
    {
      "name": "dw.apps.checkout.tax.calculate",
      "script": "./hooks/calculate.js"
    },
    {
      "name": "dw.apps.checkout.tax.commit",
      "script": "./hooks/commit.js"
    },
    {
      "name": "dw.apps.checkout.tax.cancel",
      "script": "./hooks/cancel.js"
    }
  ]
}
```

### package.json

The cartridge's `package.json` must point to `hooks.json`. This is how the platform discovers your hooks:

```json
{
   "hooks": "./cartridge/scripts/hooks.json"
}
```

## Hook Contracts

Each adapter domain defines a set of hooks with specific signatures. The ISV implements the exported function matching the hook's action name.

### Tax Domain Hooks

The tax domain has three hooks that form a complete lifecycle:

| Hook | Exported Function | Parameter | Called When |
|------|-------------------|-----------|------------|
| `dw.apps.checkout.tax.calculate` | `exports.calculate` | `dw.order.LineItemCtnr` (basket) | Checkout needs tax amounts calculated |
| `dw.apps.checkout.tax.commit` | `exports.commit` | `dw.order.Order` | Order successfully placed (payment succeeded) |
| `dw.apps.checkout.tax.cancel` | `exports.cancel` | `dw.order.Order` | Order cancelled or payment failed |

All hooks return `dw.system.Status` — either `Status.OK` or `Status.ERROR`.

## Tax Adapter: Complete Implementation

The Avalara tax app is the reference implementation. Below is the full pattern for ISV developers building a tax adapter or adapting the pattern for other domains.

### calculate.js — Tax Calculation Hook

This is the most complex hook. It receives the basket, calls your tax API, and applies tax amounts to each line item.

```javascript
'use strict';

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var myTaxHelper = require('~/cartridge/scripts/helpers/myTaxHelper');

var logger = Logger.getLogger('MyTaxApp', 'calculate');

/**
 * Calculate taxes using external tax provider.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The basket or order
 * @returns {dw.system.Status} Status.OK on success, Status.ERROR on failure
 */
exports.calculate = function(lineItemCtnr) {
    logger.warn('Starting tax calculation for basket: ' + lineItemCtnr.getUUID());

    try {
        // 1. Sync line item totals before reading basket data
        Transaction.wrap(function() {
            lineItemCtnr.updateTotals();
        });

        // 2. Build the request payload for your tax API
        var taxRequest = myTaxHelper.buildTaxRequest(lineItemCtnr);

        if (!taxRequest.lines || taxRequest.lines.length === 0) {
            logger.warn('No taxable line items found');
            return new Status(Status.OK, 'No taxable items');
        }

        // 3. Call your external tax API
        var response = myTaxHelper.callTaxAPI(taxRequest);

        if (!response.success) {
            logger.error('Tax API call failed: ' + response.error);

            // Fall back to zero tax on error — don't block checkout
            Transaction.wrap(function() {
                setZeroTax(lineItemCtnr);
            });
            return new Status(Status.OK, 'Tax calculation failed, applied zero tax');
        }

        // 4. Apply tax amounts from the response to basket line items
        Transaction.wrap(function() {
            myTaxHelper.applyTaxesToBasket(lineItemCtnr, response.data);
        });

        return new Status(Status.OK, 'Taxes calculated successfully');
    } catch (e) {
        logger.error('Tax calculation exception: ' + e.message + '\n' + e.stack);

        Transaction.wrap(function() {
            setZeroTax(lineItemCtnr);
        });
        return new Status(Status.ERROR, 'Tax calculation exception');
    }
};

/**
 * Fallback: set all line items to zero tax.
 */
function setZeroTax(lineItemCtnr) {
    var Money = require('dw/value/Money');
    var zeroTax = new Money(0, lineItemCtnr.getCurrencyCode());

    var lineItems = lineItemCtnr.getAllLineItems().iterator();
    while (lineItems.hasNext()) {
        var lineItem = lineItems.next();
        try {
            lineItem.setTax(zeroTax);
            lineItem.updateTax(0);
        } catch (e) {
            // Some line item types (e.g., price adjustments) don't support setTax
        }
    }
}
```

**Key patterns:**
- Always wrap data modifications in `Transaction.wrap()`
- Call `lineItemCtnr.updateTotals()` before reading basket data to ensure consistency
- Fall back to zero tax on errors — never block checkout because your API is down
- Return `Status.OK` even on API failure (with zero tax applied) unless it's a true system error

### commit.js — Transaction Commit Hook

Called after the order is successfully placed. Record the transaction with your provider for audit and reporting.

```javascript
'use strict';

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

var logger = Logger.getLogger('MyTaxApp', 'commit');

/**
 * Commit tax transaction with external provider.
 * Called after successful order placement.
 *
 * @param {dw.order.Order} order - The placed order
 * @returns {dw.system.Status}
 */
exports.commit = function(order) {
    try {
        logger.warn('Committing tax for order: ' + order.getOrderNo());

        // Call your provider's commit/finalize API
        // var result = myTaxService.commitTransaction(order);

        // Store the provider's transaction ID on the order for reference
        order.getCustom().put('taxProviderTransactionId', 'YOUR-TX-ID');

        return new Status(Status.OK, 'Tax transaction committed');
    } catch (e) {
        logger.error('Failed to commit tax: ' + e.message);
        return new Status(Status.ERROR, 'TAX_COMMIT_FAILED', 'Failed to commit: ' + e.message);
    }
};
```

### cancel.js — Transaction Cancel Hook

Called when an order is cancelled or payment fails. Void the transaction with your provider.

```javascript
'use strict';

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

var logger = Logger.getLogger('MyTaxApp', 'cancel');

/**
 * Void tax transaction with external provider.
 * Called when order is cancelled or payment fails.
 *
 * @param {dw.order.Order} order - The cancelled order
 * @returns {dw.system.Status}
 */
exports.cancel = function(order) {
    try {
        logger.warn('Voiding tax for order: ' + order.getOrderNo());

        // Get the transaction ID stored during commit
        var transactionId = order.getCustom().get('taxProviderTransactionId');

        // Call your provider's void API
        // var result = myTaxService.voidTransaction(transactionId);

        order.getCustom().put('taxProviderVoided', 'true');

        return new Status(Status.OK, 'Tax transaction voided');
    } catch (e) {
        logger.error('Failed to void tax: ' + e.message);
        return new Status(Status.ERROR, 'TAX_VOID_FAILED', 'Failed to void: ' + e.message);
    }
};
```

## Helper Module Pattern

The helper module contains your core integration logic — building API requests, calling your service, and mapping responses back to Commerce Cloud objects.

```javascript
'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

var logger = Logger.getLogger('MyTaxApp', 'helper');

/**
 * Read configuration from Site Custom Preferences.
 * These values are set by the merchant in Business Manager.
 */
function getConfig() {
    var currentSite = Site.getCurrent();
    return {
        enabled: currentSite.getCustomPreferenceValue('MyApp_Enable') || false,
        companyCode: currentSite.getCustomPreferenceValue('MyApp_CompanyCode') || '',
        shipFromCity: currentSite.getCustomPreferenceValue('MyApp_ShipFromCity') || '',
        shipFromState: currentSite.getCustomPreferenceValue('MyApp_ShipFromState') || '',
        shipFromZip: currentSite.getCustomPreferenceValue('MyApp_ShipFromZip') || '',
        shipFromCountry: currentSite.getCustomPreferenceValue('MyApp_ShipFromCountry') || 'US'
    };
}

/**
 * Transform Commerce Cloud basket data into your API's request format.
 *
 * @param {dw.order.LineItemCtnr} basket
 * @returns {Object} Request payload for your API
 */
function buildTaxRequest(basket) {
    var lines = [];
    var lineNumber = 0;

    // Process product line items
    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var pli = productLineItems.next();
        var shipment = pli.getShipment();

        if (!shipment || !shipment.getShippingAddress()) {
            continue; // Skip items without a shipping address
        }

        var addr = shipment.getShippingAddress();

        lines.push({
            number: ++lineNumber,
            quantity: pli.quantityValue,
            amount: pli.adjustedGrossPrice.value,
            itemCode: pli.productID,
            description: pli.productName,
            shipTo: {
                line1: addr.address1 || '',
                city: addr.city || '',
                region: addr.stateCode || '',
                country: addr.countryCode ? addr.countryCode.value : 'US',
                postalCode: addr.postalCode || ''
            }
        });
    }

    // Process shipping line items
    var shipments = basket.getShipments().iterator();
    while (shipments.hasNext()) {
        var shipment = shipments.next();
        var addr = shipment.getShippingAddress();
        if (!addr) continue;

        var shippingLineItems = shipment.getShippingLineItems().iterator();
        while (shippingLineItems.hasNext()) {
            var sli = shippingLineItems.next();
            var shippingAmount = sli.adjustedPrice ? sli.adjustedPrice.value : 0;
            if (shippingAmount <= 0) continue;

            lines.push({
                number: ++lineNumber,
                quantity: 1,
                amount: shippingAmount,
                itemCode: sli.ID,
                description: sli.lineItemText || 'Shipping',
                shipTo: {
                    line1: addr.address1 || '',
                    city: addr.city || '',
                    region: addr.stateCode || '',
                    country: addr.countryCode ? addr.countryCode.value : 'US',
                    postalCode: addr.postalCode || ''
                }
            });
        }
    }

    var config = getConfig();
    return {
        companyCode: config.companyCode,
        customerCode: basket.getCustomerEmail() || 'guest-' + basket.getUUID(),
        currencyCode: basket.getCurrencyCode(),
        lines: lines
    };
}

/**
 * Call your external tax API.
 *
 * @param {Object} taxRequest - The request payload
 * @returns {Object} { success: boolean, data: Object, error: string }
 */
function callTaxAPI(taxRequest) {
    var HTTPClient = require('dw/net/HTTPClient');
    var httpClient = new HTTPClient();
    var config = getConfig();

    if (!config.enabled) {
        return { success: false, error: 'Tax provider not enabled' };
    }

    try {
        var url = 'https://sandbox.example.com/api/v2/transactions/create';

        httpClient.open('POST', url);
        httpClient.setRequestHeader('Content-Type', 'application/json');
        httpClient.setTimeout(15000);
        httpClient.send(JSON.stringify(taxRequest));

        var statusCode = httpClient.getStatusCode();
        var responseText = httpClient.getText();

        if (statusCode === 200 || statusCode === 201) {
            return { success: true, data: JSON.parse(responseText) };
        } else {
            return { success: false, error: 'API error: ' + statusCode };
        }
    } catch (e) {
        logger.error('API call failed: ' + e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Apply tax amounts from your API response to basket line items.
 *
 * @param {dw.order.LineItemCtnr} basket
 * @param {Object} taxResponse - Your API's response
 */
function applyTaxesToBasket(basket, taxResponse) {
    if (!taxResponse || !taxResponse.lines) return;

    var Money = require('dw/value/Money');

    // Build map of line number to tax data from API response
    var taxMap = {};
    taxResponse.lines.forEach(function(line) {
        var rate = 0;
        if (line.taxableAmount && line.taxableAmount > 0) {
            rate = line.tax / line.taxableAmount;
        }
        taxMap[line.lineNumber] = { tax: line.tax, rate: rate };
    });

    var lineNumber = 0;

    // Apply to product line items
    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var pli = productLineItems.next();
        lineNumber++;
        if (taxMap[lineNumber]) {
            var taxMoney = new Money(taxMap[lineNumber].tax, basket.getCurrencyCode());
            pli.setTax(taxMoney);
            pli.updateTax(taxMap[lineNumber].rate);
        }
    }

    // Apply to shipping line items
    var shipments = basket.getShipments().iterator();
    while (shipments.hasNext()) {
        var shipment = shipments.next();
        var shippingLineItems = shipment.getShippingLineItems().iterator();
        while (shippingLineItems.hasNext()) {
            var sli = shippingLineItems.next();
            var shippingAmount = sli.adjustedPrice ? sli.adjustedPrice.value : 0;
            if (shippingAmount <= 0) continue;
            lineNumber++;
            if (taxMap[lineNumber]) {
                var taxMoney = new Money(taxMap[lineNumber].tax, basket.getCurrencyCode());
                sli.setTax(taxMoney);
                sli.updateTax(taxMap[lineNumber].rate);
            }
        }
    }

    // Recalculate basket totals after applying line item taxes
    basket.updateTotals();
}

module.exports = {
    getConfig: getConfig,
    buildTaxRequest: buildTaxRequest,
    callTaxAPI: callTaxAPI,
    applyTaxesToBasket: applyTaxesToBasket
};
```

## Script API Reference

These are the Commerce Cloud server-side modules available in hook scripts. Import them with `require('dw/...')`.

### Core Modules

| Module | Import | Purpose |
|--------|--------|---------|
| `dw/system/Status` | `require('dw/system/Status')` | Return values from hooks (`Status.OK`, `Status.ERROR`) |
| `dw/system/Transaction` | `require('dw/system/Transaction')` | Wrap basket/order modifications in `Transaction.wrap()` |
| `dw/system/Logger` | `require('dw/system/Logger')` | Logging (`Logger.getLogger(category, scope)`) |
| `dw/system/Site` | `require('dw/system/Site')` | Read site preferences (`Site.getCurrent().getCustomPreferenceValue()`) |
| `dw/net/HTTPClient` | `require('dw/net/HTTPClient')` | Make HTTP calls to external APIs |
| `dw/value/Money` | `require('dw/value/Money')` | Currency-aware money values (`new Money(amount, currencyCode)`) |
| `dw/util/StringUtils` | `require('dw/util/StringUtils')` | String utilities (`encodeBase64()`, etc.) |

### Key Object Types

| Type | Description | Common Methods |
|------|-------------|----------------|
| `dw.order.LineItemCtnr` | Basket or order (base type) | `getAllProductLineItems()`, `getShipments()`, `getCurrencyCode()`, `getCustomerEmail()`, `updateTotals()`, `getUUID()`, `getAllLineItems()` |
| `dw.order.Order` | Placed order (extends LineItemCtnr) | `getOrderNo()`, `getCustom()` |
| `dw.order.ProductLineItem` | A product in the basket | `productID`, `productName`, `quantityValue`, `adjustedGrossPrice`, `getShipment()`, `setTax()`, `updateTax()` |
| `dw.order.ShippingLineItem` | Shipping cost for a shipment | `ID`, `adjustedPrice`, `lineItemText`, `setTax()`, `updateTax()` |
| `dw.order.Shipment` | A shipment with address | `getShippingAddress()`, `getShippingLineItems()`, `getID()` |
| `dw.order.OrderAddress` | Shipping/billing address | `address1`, `address2`, `city`, `stateCode`, `countryCode`, `postalCode` |

### Require Path Syntax

```javascript
// Script API modules — always available
var Logger = require('dw/system/Logger');

// Current cartridge (~ = this cartridge root)
var myHelper = require('~/cartridge/scripts/helpers/myHelper');

// Relative to current file
var utils = require('./utils');
```

### Critical Patterns

**Always wrap modifications in Transaction.wrap():**
```javascript
var Transaction = require('dw/system/Transaction');

// CORRECT
Transaction.wrap(function() {
    lineItem.setTax(taxMoney);
    lineItem.updateTax(rate);
    basket.updateTotals();
});

// WRONG — changes will be lost or throw errors
lineItem.setTax(taxMoney);
```

**Always return dw.system.Status:**
```javascript
var Status = require('dw/system/Status');

// Success
return new Status(Status.OK, 'Success message');

// Error with code and message
return new Status(Status.ERROR, 'ERROR_CODE', 'Detailed error message');
```

**Read configuration from Site Preferences (never hardcode credentials):**
```javascript
var Site = require('dw/system/Site');
var apiKey = Site.getCurrent().getCustomPreferenceValue('MyApp_APIKey');
```

## IMPEX Files

IMPEX (Import/Export) files define the data model extensions and configuration your adapter needs. They are XML files processed during app installation.

### System Object Type Extensions

Define custom attributes on Basket, Order, or SitePreferences:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <!-- Custom attributes on Basket for storing tax results -->
    <type-extension type-id="Basket">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="myApp_TaxDetails">
                <display-name xml:lang="x-default">Tax Details</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
            </attribute-definition>
        </custom-attribute-definitions>
    </type-extension>

    <!-- Custom site preferences for merchant configuration -->
    <type-extension type-id="SitePreferences">
        <custom-attribute-definitions>
            <attribute-definition attribute-id="MyApp_Enable">
                <display-name xml:lang="x-default">Enable My Tax App</display-name>
                <type>boolean</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
                <default-value>true</default-value>
            </attribute-definition>
            <attribute-definition attribute-id="MyApp_CompanyCode">
                <display-name xml:lang="x-default">Company Code</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
            </attribute-definition>
        </custom-attribute-definitions>
        <group-definitions>
            <attribute-group group-id="MyTaxApp">
                <display-name xml:lang="x-default">My Tax App</display-name>
                <attribute attribute-id="MyApp_Enable"/>
                <attribute attribute-id="MyApp_CompanyCode"/>
            </attribute-group>
        </group-definitions>
    </type-extension>
</metadata>
```

### Service Definitions

Define the HTTP service credentials and profiles for your external API:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns="http://www.demandware.com/xml/impex/services/2014-09-26">
    <service-credential service-credential-id="credentials.mytaxapp.rest">
        <url>https://sandbox.example.com/</url>
        <user-id>placeholder</user-id>
        <password encrypted="true" encryption-type="common.export">placeholder</password>
    </service-credential>

    <service-profile service-profile-id="profile.mytaxapp.rest">
        <timeout-millis>20000</timeout-millis>
        <rate-limit-enabled>false</rate-limit-enabled>
    </service-profile>

    <service service-id="mytaxapp.rest.all">
        <service-type>HTTP</service-type>
        <enabled>true</enabled>
        <profile-id>profile.mytaxapp.rest</profile-id>
        <credential-id>credentials.mytaxapp.rest</credential-id>
    </service>
</services>
```

### Site Preferences Defaults

Provide default values so the app works out of the box (or clearly requires configuration):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2007-03-31">
    <custom-preferences>
        <all-instances>
            <preference preference-id="MyApp_Enable">1</preference>
            <preference preference-id="MyApp_CompanyCode"></preference>
        </all-instances>
    </custom-preferences>
</preferences>
```

### Uninstall IMPEX

Always provide uninstall IMPEX files in `impex/uninstall/` that reverse the install. This allows clean removal of your app's custom attributes and service definitions.

## App Configuration Tasks

Provide a `tasksList.json` in `app-configuration/` that guides the merchant through post-install setup:

```json
[
  {
    "name": "Verify Service Credentials",
    "description": "Confirm service credentials are configured in Operations > Services > Credentials.",
    "link": "/on/demandware.store/Sites-Site/default/ServiceCredential-DisplayAll",
    "taskNumber": "0"
  },
  {
    "name": "Configure Site Preferences",
    "description": "Set your API key and company code in Merchant Tools > Site Preferences > Custom Preferences.",
    "link": "/on/demandware.store/Sites-Site/default/ViewApplication-BM?SelectedMenuItem=site-prefs_custom_prefs",
    "taskNumber": "1"
  }
]
```

## Adapter Flow Summary

End-to-end flow for a tax adapter during checkout:

```
Shopper enters shipping address
    ↓
Platform invokes dw.apps.checkout.tax.calculate
    ↓
Your calculate.js hook:
    1. Read config from Site Preferences
    2. Build request from basket line items + shipping addresses
    3. Call your external API (HTTPClient)
    4. Map response back to line items (setTax, updateTax)
    5. Return Status.OK
    ↓
Checkout displays calculated taxes
    ↓
Shopper places order → payment succeeds
    ↓
Platform invokes dw.apps.checkout.tax.commit
    ↓
Your commit.js hook:
    1. Call your API to finalize the transaction
    2. Store transaction ID on order
    3. Return Status.OK
    ↓
If order is later cancelled:
    ↓
Platform invokes dw.apps.checkout.tax.cancel
    ↓
Your cancel.js hook:
    1. Read transaction ID from order
    2. Call your API to void the transaction
    3. Return Status.OK
```

## Adapting the Pattern for Other Domains

The tax hooks are the first implemented domain, but the same pattern applies to other adapter domains. When building for a new domain:

1. **Implement the hook contract** — the exported function name and parameters are defined by the platform
2. **Follow the same structure** — hooks.json, hook scripts, helper module, IMPEX
3. **Use the same Script API modules** — Transaction, Status, Logger, HTTPClient, Site, Money
4. **Provide the same configuration infrastructure** — service credentials, site preferences, app-configuration tasks

## What NOT to Do

- Do not hardcode API credentials in script files — use Site Custom Preferences and IMPEX service definitions
- Do not modify basket or order data outside of `Transaction.wrap()` — changes will be lost or cause errors
- Do not block checkout on API failures — fall back gracefully (e.g., zero tax) and log the error
- Do not use `importPackage()` — use `require()` for all module imports (`importPackage` is legacy syntax)
- Do not skip the uninstall IMPEX — merchants need a clean way to remove your app's data model changes
- Do not return `undefined` from hooks — always return `dw.system.Status`
- Do not store sensitive data in custom attributes — use IMPEX service credentials for API keys and secrets
- Do not assume line items have shipping addresses — check for null before accessing address fields (items may not be associated with a shipment early in checkout)
- Do not use npm packages in cartridge scripts — only `dw/*` Script API modules and your own cartridge code are available in the server-side environment
