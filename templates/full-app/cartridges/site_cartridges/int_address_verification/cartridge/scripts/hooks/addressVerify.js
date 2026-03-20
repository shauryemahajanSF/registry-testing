/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/Apache-2.0
 */

'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');

var addressService = require('~/cartridge/scripts/services/addressVerificationService');

var log = Logger.getLogger('addressVerification', 'verify');

/**
 * Custom SCAPI Endpoint — POST address-verification/verify
 *
 * Called by the frontend to fully verify a selected or manually entered address.
 * Returns the verified/standardized address from the third-party service.
 *
 * Request:  POST /s/{site}/dw/shop/v24_1/custom/address-verification/verify
 *           Body: { address1, address2, city, state, postalCode, country }
 * Response: { verified: true/false, address: { address1, address2, city, state, postalCode, country } }
 *
 * @param {Object} request - The incoming SCAPI request
 * @returns {dw.system.Status} Status.OK with response body
 */
exports.post = function (request) {
    try {
        var body = JSON.parse(request.httpParameterMap.requestBodyAsString);

        var result = addressService.verify(body);

        if (!result.ok) {
            log.error('Address verification API failed: {0}', result.errorMessage);
            // Return unverified — don't block the shopper
            return buildResponse({
                verified: false,
                address: body
            });
        }

        var verifiedAddress = transformVerification(result.object);

        return buildResponse({
            verified: verifiedAddress.verified,
            address: verifiedAddress
        });

    } catch (e) {
        log.error('Address verify error: {0}', e.message);
        return buildResponse({
            verified: false,
            address: {}
        });
    }
};

/**
 * Transforms the third-party verification response.
 *
 * TODO: Customize for your provider (Loqate, Experian, SmartyStreets, etc.).
 */
function transformVerification(apiResponse) {
    // Example: Loqate-style response
    var item = apiResponse.Items ? apiResponse.Items[0] : apiResponse;

    return {
        verified: item.VerificationStatus === 'Verified' || item.verified === true,
        address1: item.Address1 || item.street_line || '',
        address2: item.Address2 || '',
        city: item.City || item.city || '',
        state: item.State || item.state || '',
        postalCode: item.PostalCode || item.zipcode || '',
        country: item.Country || item.country || ''
    };
}

/**
 * Builds a successful SCAPI custom endpoint response.
 */
function buildResponse(body) {
    var response = new (require('dw/system/Status'))(Status.OK);
    response.addDetail('body', JSON.stringify(body));
    return response;
}
