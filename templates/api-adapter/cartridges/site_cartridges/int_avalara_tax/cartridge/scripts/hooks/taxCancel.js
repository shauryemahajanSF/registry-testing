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
 * Tax Cancel Hook — dw.apps.checkout.tax.cancel
 *
 * Called when an order is cancelled to void the tax transaction in Avalara.
 * This ensures cancelled orders are not included in tax reporting or filing.
 *
 * @param {dw.order.Order} order - The cancelled order
 * @returns {dw.system.Status} Status.OK on success, Status.ERROR on failure
 */
exports.cancel = function (order) {
    try {
        var transactionCode = order.getOrderNo();

        var service = LocalServiceRegistry.createService('avalara.tax.void', {
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

        // TODO: Build the void request matching your Avalara configuration.
        // See: https://developer.avalara.com/api-reference/avatax/rest/v2/methods/Transactions/VoidTransaction/
        var voidRequest = {
            companyCode: Site.getCurrent().getCustomPreferenceValue('AvaTax_CompanyCode') || '',
            transactionCode: transactionCode,
            code: 'DocVoided'
        };

        var result = service.call(voidRequest);

        if (!result.ok) {
            log.error('Avalara void failed for order {0}: {1}', transactionCode, result.errorMessage);
            return new Status(Status.ERROR);
        }

        log.info('Tax voided for order {0}', transactionCode);
        return new Status(Status.OK);

    } catch (e) {
        log.error('Tax cancel error for order {0}: {1}', order.getOrderNo(), e.message);
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
