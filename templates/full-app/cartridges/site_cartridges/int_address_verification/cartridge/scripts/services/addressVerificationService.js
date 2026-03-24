/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/Apache-2.0
 */

'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('addressVerification', 'service');

/**
 * Address Verification Service
 *
 * Encapsulates all HTTP callouts to the third-party address verification
 * provider (Loqate, Experian, SmartyStreets, Google Places, etc.).
 *
 * Service credentials (API key, endpoint URL) are stored in IMPEX service
 * definitions — never hardcoded. The merchant configures these in Business
 * Manager after installing the Commerce App.
 */

/**
 * Fetches address autocomplete suggestions.
 *
 * @param {string} query - The partial address typed by the shopper
 * @returns {dw.svc.Result} Service result with suggestions array
 */
exports.suggest = function (query) {
    var service = LocalServiceRegistry.createService('addressverification.suggest', {
        createRequest: function (svc, params) {
            var apiKey = Site.getCurrent().getCustomPreferenceValue('AddressVerification_ApiKey') || '';

            svc.setRequestMethod('GET');
            svc.addHeader('Accept', 'application/json');

            // TODO: Customize the URL path and query parameters for your provider.
            //
            // Loqate:    /Capture/Interactive/Find/v1.10/json3.ws?Key={key}&Text={query}
            // Experian:  /address/search/v1?query={query}&country=US
            // SmartyStreets: /suggest?search={query}&key={key}
            //
            svc.setURL(svc.getURL() + '/suggest?key=' + apiKey + '&query=' + encodeURIComponent(params.query));

            return null;
        },
        parseResponse: function (svc, response) {
            return JSON.parse(response.text);
        }
    });

    return service.call({ query: query });
};

/**
 * Verifies and standardizes a complete address.
 *
 * @param {Object} address - { address1, address2, city, state, postalCode, country }
 * @returns {dw.svc.Result} Service result with verified address
 */
exports.verify = function (address) {
    var service = LocalServiceRegistry.createService('addressverification.verify', {
        createRequest: function (svc, params) {
            var apiKey = Site.getCurrent().getCustomPreferenceValue('AddressVerification_ApiKey') || '';

            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Accept', 'application/json');

            // TODO: Customize the request body for your provider.
            return JSON.stringify({
                key: apiKey,
                address: {
                    address1: params.address1,
                    address2: params.address2,
                    city: params.city,
                    state: params.state,
                    postalCode: params.postalCode,
                    country: params.country
                }
            });
        },
        parseResponse: function (svc, response) {
            return JSON.parse(response.text);
        }
    });

    return service.call(address);
};
