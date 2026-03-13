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

var log = Logger.getLogger('addressVerification', 'suggest');

/**
 * Custom SCAPI Endpoint — GET address-verification/suggest
 *
 * Called by the frontend AddressForm component as the shopper types in the
 * address line 1 field. Returns autocomplete suggestions from the third-party
 * address verification service (Loqate, Experian, etc.).
 *
 * Request: GET /s/{site}/dw/shop/v24_1/custom/address-verification/suggest?q={query}
 * Response: { suggestions: [{ id, text, address1, address2, city, state, postalCode, country }] }
 *
 * This is the ISV's own backend-for-frontend contract — the request/response
 * schema is defined by the ISV, not the platform.
 *
 * @param {Object} request - The incoming SCAPI request
 * @returns {dw.system.Status} Status.OK with response body
 */
exports.get = function (request) {
    try {
        var query = request.httpParameterMap.get('q').stringValue || '';

        if (!query || query.length < 3) {
            return buildResponse({ suggestions: [] });
        }

        // Call the third-party address verification service
        var result = addressService.suggest(query);

        if (!result.ok) {
            log.error('Address suggestion API failed: {0}', result.errorMessage);
            return buildResponse({ suggestions: [] });
        }

        // Transform the third-party response into the ISV's contract format
        var suggestions = transformSuggestions(result.object);

        return buildResponse({ suggestions: suggestions });

    } catch (e) {
        log.error('Address suggest error: {0}', e.message);
        // Return empty suggestions on error — never break the form
        return buildResponse({ suggestions: [] });
    }
};

/**
 * Transforms raw API response into the frontend contract format.
 *
 * TODO: Customize this mapping for your address verification provider.
 * The example below assumes a Loqate-style response. Adjust field names
 * for Experian, SmartyStreets, Google Places, etc.
 */
function transformSuggestions(apiResponse) {
    var items = apiResponse.Items || apiResponse.results || [];
    var suggestions = [];

    for (var i = 0; i < items.length && i < 5; i++) {
        var item = items[i];
        suggestions.push({
            id: item.Id || item.id || String(i),
            text: item.Text || item.description || '',
            address1: item.Address1 || item.street_line || '',
            address2: item.Address2 || '',
            city: item.City || item.city || '',
            state: item.State || item.state || '',
            postalCode: item.PostalCode || item.zipcode || '',
            country: item.Country || item.country || ''
        });
    }

    return suggestions;
}

/**
 * Builds a successful SCAPI custom endpoint response.
 */
function buildResponse(body) {
    var response = new (require('dw/system/Status'))(Status.OK);
    response.addDetail('body', JSON.stringify(body));
    return response;
}
