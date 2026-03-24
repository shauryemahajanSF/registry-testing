/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/Apache-2.0
 */

'use strict';

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var Money = require('dw/value/Money');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var log = Logger.getLogger('avalara', 'tax');

/**
 * Tax Calculation Hook — dw.apps.checkout.tax.calculate
 *
 * Called during checkout to calculate tax for all line items in the basket.
 * This hook is invoked whenever the basket totals are recalculated (e.g.,
 * after adding items, changing quantities, updating shipping address).
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The basket or order
 * @returns {dw.system.Status} Status.OK on success, Status.OK with fallback on API error
 */
exports.calculate = function (lineItemCtnr) {
    try {
        // Ensure totals are current before reading basket data
        lineItemCtnr.updateTotals();

        var shippingAddress = getShippingAddress(lineItemCtnr);
        if (!shippingAddress) {
            log.info('No shipping address yet — skipping tax calculation');
            return new Status(Status.OK);
        }

        // Build the tax request from basket line items
        var taxRequest = buildTaxRequest(lineItemCtnr, shippingAddress);

        // Call Avalara AvaTax API
        var service = LocalServiceRegistry.createService('avalara.tax.calculate', {
            createRequest: function (svc, params) {
                svc.setRequestMethod('POST');
                svc.addHeader('Content-Type', 'application/json');
                svc.addHeader('Authorization', 'Basic ' + getAuthToken());
                return JSON.stringify(params);
            },
            parseResponse: function (svc, response) {
                return JSON.parse(response.text);
            }
        });

        var result = service.call(taxRequest);

        if (!result.ok) {
            log.error('Avalara API call failed: {0}', result.errorMessage);
            // Fall back gracefully — never block checkout on API failure
            return applyFallbackTax(lineItemCtnr);
        }

        // Apply calculated tax amounts to line items
        var taxResponse = result.object;
        Transaction.wrap(function () {
            applyTaxToLineItems(lineItemCtnr, taxResponse);
        });

        return new Status(Status.OK);

    } catch (e) {
        log.error('Tax calculation error: {0}', e.message);
        // Fall back gracefully — return OK with zero/fallback tax
        return applyFallbackTax(lineItemCtnr);
    }
};

/**
 * Gets the shipping address from the first shipment.
 * Returns null if no address is set yet (early checkout stages).
 */
function getShippingAddress(lineItemCtnr) {
    var shipments = lineItemCtnr.getShipments();
    var iter = shipments.iterator();

    if (iter.hasNext()) {
        var shipment = iter.next();
        return shipment.getShippingAddress();
    }

    return null;
}

/**
 * Builds the Avalara CreateTransaction request body from basket data.
 *
 * TODO: Customize this for your Avalara account configuration.
 * See: https://developer.avalara.com/api-reference/avatax/rest/v2/methods/Transactions/CreateTransaction/
 */
function buildTaxRequest(lineItemCtnr, shippingAddress) {
    var companyCode = Site.getCurrent().getCustomPreferenceValue('AvaTax_CompanyCode') || '';
    var lines = [];
    var productLineItems = lineItemCtnr.getAllProductLineItems();
    var iter = productLineItems.iterator();
    var lineNumber = 1;

    while (iter.hasNext()) {
        var pli = iter.next();
        lines.push({
            number: String(lineNumber++),
            quantity: pli.getQuantityValue(),
            amount: pli.getAdjustedNetPrice().getValue(),
            taxCode: pli.getTaxClassID() || 'P0000000',
            description: pli.getProductName()
        });
    }

    return {
        type: 'SalesOrder',
        companyCode: companyCode,
        date: new Date().toISOString().split('T')[0],
        currencyCode: lineItemCtnr.getCurrencyCode(),
        addresses: {
            shipTo: {
                line1: shippingAddress.getAddress1(),
                line2: shippingAddress.getAddress2() || '',
                city: shippingAddress.getCity(),
                region: shippingAddress.getStateCode(),
                postalCode: shippingAddress.getPostalCode(),
                country: shippingAddress.getCountryCode().getValue()
            }
        },
        lines: lines
    };
}

/**
 * Applies Avalara tax response amounts to basket line items.
 * Must be called inside Transaction.wrap().
 */
function applyTaxToLineItems(lineItemCtnr, taxResponse) {
    // TODO: Map Avalara response lines back to basket line items
    // and set the tax amount on each. Example:
    //
    // var lines = taxResponse.lines || [];
    // for (var i = 0; i < lines.length; i++) {
    //     var taxLine = lines[i];
    //     var pli = findLineItem(lineItemCtnr, taxLine.number);
    //     if (pli) {
    //         pli.updateTax(taxLine.tax, new Money(taxLine.tax, lineItemCtnr.getCurrencyCode()));
    //     }
    // }

    log.info('Tax calculated — total tax: {0}', taxResponse.totalTax || 0);
}

/**
 * Applies fallback tax (zero) when the API is unavailable.
 * Never block checkout — graceful degradation is required.
 */
function applyFallbackTax(lineItemCtnr) {
    log.warn('Applying fallback tax (zero) — Avalara API unavailable');

    Transaction.wrap(function () {
        var currencyCode = lineItemCtnr.getCurrencyCode();
        var productLineItems = lineItemCtnr.getAllProductLineItems();
        var iter = productLineItems.iterator();

        while (iter.hasNext()) {
            var pli = iter.next();
            pli.updateTax(0, new Money(0, currencyCode));
        }
    });

    return new Status(Status.OK);
}

/**
 * Retrieves the Base64-encoded auth token from site preferences.
 */
function getAuthToken() {
    var accountId = Site.getCurrent().getCustomPreferenceValue('AvaTax_AccountId') || '';
    var licenseKey = Site.getCurrent().getCustomPreferenceValue('AvaTax_LicenseKey') || '';
    return require('dw/util/StringUtils').encodeBase64(accountId + ':' + licenseKey);
}
