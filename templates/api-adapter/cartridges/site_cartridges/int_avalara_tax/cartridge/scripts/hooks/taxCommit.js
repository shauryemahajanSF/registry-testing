/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/Apache-2.0
 */

'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var log = Logger.getLogger('avalara', 'tax');

/**
 * Tax Commit Hook — dw.apps.checkout.tax.commit
 *
 * Called after order placement to finalize the tax transaction in Avalara.
 * This converts the SalesOrder (estimate) to a SalesInvoice (committed)
 * so that Avalara records the transaction for tax reporting and filing.
 *
 * @param {dw.order.Order} order - The placed order
 * @returns {dw.system.Status} Status.OK on success, Status.ERROR on failure
 */
exports.commit = function (order) {
    try {
        var transactionCode = order.getOrderNo();

        var service = LocalServiceRegistry.createService('avalara.tax.commit', {
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

        // TODO: Build the commit request matching your Avalara configuration.
        // The commit call transitions the document from SalesOrder to SalesInvoice.
        // See: https://developer.avalara.com/api-reference/avatax/rest/v2/methods/Transactions/CommitTransaction/
        var commitRequest = {
            companyCode: Site.getCurrent().getCustomPreferenceValue('AvaTax_CompanyCode') || '',
            transactionCode: transactionCode,
            commit: true
        };

        var result = service.call(commitRequest);

        if (!result.ok) {
            log.error('Avalara commit failed for order {0}: {1}', transactionCode, result.errorMessage);
            // Return ERROR so the platform can retry or alert
            return new Status(Status.ERROR);
        }

        log.info('Tax committed for order {0}', transactionCode);
        return new Status(Status.OK);

    } catch (e) {
        log.error('Tax commit error for order {0}: {1}', order.getOrderNo(), e.message);
        return new Status(Status.ERROR);
    }
};

/**
 * Retrieves the Base64-encoded auth token from site preferences.
 */
function getAuthToken() {
    var accountId = Site.getCurrent().getCustomPreferenceValue('AvaTax_AccountId') || '';
    var licenseKey = Site.getCurrent().getCustomPreferenceValue('AvaTax_LicenseKey') || '';
    return require('dw/util/StringUtils').encodeBase64(accountId + ':' + licenseKey);
}
