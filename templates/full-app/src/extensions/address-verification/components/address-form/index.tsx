/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/Apache-2.0
 */

'use client';

import { useState, useId, useCallback, useRef, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Address suggestion returned from the verification backend.
 */
interface AddressSuggestion {
    id: string;
    text: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

/**
 * Address form field values.
 */
interface AddressFields {
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

const EMPTY_ADDRESS: AddressFields = {
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
};

/**
 * Address Form with Verification — Full App Commerce App Component
 *
 * This component is a wrapper target that REPLACES the platform's default
 * shipping address form. It renders in two UI Targets:
 *
 *   1. checkout.shippingAddress          — Checkout shipping address
 *   2. sfdc.account.addresses.shippingAddress — My Account address management
 *
 * Architecture (backend-for-frontend pattern):
 *   Component → custom SCAPI endpoint → Script API cartridge → Loqate/Experian API
 *
 * The component calls a custom SCAPI endpoint (defined in the int_address_verification
 * cartridge) for address autocomplete and verification. The ISV owns the request/response
 * contract between this component and the backend.
 */
export default function AddressForm(): ReactElement {
    const { t } = useTranslation('addressVerification');
    const formId = useId();

    const [address, setAddress] = useState<AddressFields>(EMPTY_ADDRESS);
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [verified, setVerified] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Updates a single address field.
     */
    const updateField = (field: keyof AddressFields, value: string) => {
        setAddress((prev) => ({ ...prev, [field]: value }));

        // Trigger autocomplete search when address line 1 changes
        if (field === 'address1') {
            setVerified(null);
            debouncedSearch(value);
        }
    };

    /**
     * Searches for address suggestions via the custom SCAPI endpoint.
     * Debounced to avoid excessive API calls while typing.
     */
    const debouncedSearch = useCallback((query: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                // TODO: Replace with your custom SCAPI endpoint URL.
                // This endpoint is defined in the int_address_verification cartridge
                // and proxies requests to Loqate/Experian.
                //
                // Example request/response contract:
                //   GET /s/{site}/dw/shop/v24_1/custom/address-verification/suggest?q={query}
                //   Response: { suggestions: [{ id, text, address1, city, state, postalCode, country }] }
                //
                const response = await fetch(
                    `/api/address-verification/suggest?q=${encodeURIComponent(query)}`
                );

                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data.suggestions || []);
                    setShowSuggestions(true);
                }
            } catch {
                // Fail silently — manual entry is always available
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    /**
     * Selects a suggestion and populates all address fields.
     */
    const selectSuggestion = (suggestion: AddressSuggestion) => {
        setAddress((prev) => ({
            ...prev,
            address1: suggestion.address1,
            address2: suggestion.address2,
            city: suggestion.city,
            state: suggestion.state,
            postalCode: suggestion.postalCode,
            country: suggestion.country,
        }));
        setSuggestions([]);
        setShowSuggestions(false);
        setVerified(true);
    };

    return (
        <div data-slot="address-form" className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-foreground">
                {t('addressVerification.heading')}
            </h3>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
                <FormField
                    id={`${formId}-firstName`}
                    label={t('addressVerification.firstName')}
                    value={address.firstName}
                    onChange={(v) => updateField('firstName', v)}
                />
                <FormField
                    id={`${formId}-lastName`}
                    label={t('addressVerification.lastName')}
                    value={address.lastName}
                    onChange={(v) => updateField('lastName', v)}
                />
            </div>

            {/* Address line 1 with autocomplete */}
            <div className="relative">
                <FormField
                    id={`${formId}-address1`}
                    label={t('addressVerification.addressLine1')}
                    placeholder={t('addressVerification.addressLine1Placeholder')}
                    value={address.address1}
                    onChange={(v) => updateField('address1', v)}
                    aria-expanded={showSuggestions}
                    aria-controls={`${formId}-suggestions`}
                    autoComplete="off"
                />

                {/* Autocomplete suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <ul
                        id={`${formId}-suggestions`}
                        role="listbox"
                        aria-label={t('addressVerification.suggestionLabel')}
                        className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
                    >
                        {suggestions.map((suggestion) => (
                            <li
                                key={suggestion.id}
                                role="option"
                                aria-selected={false}
                                tabIndex={0}
                                className="cursor-pointer rounded-sm px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                                onClick={() => selectSuggestion(suggestion)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        selectSuggestion(suggestion);
                                    }
                                }}
                            >
                                {suggestion.text}
                            </li>
                        ))}
                    </ul>
                )}

                {loading && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('addressVerification.verifying')}
                    </p>
                )}
            </div>

            {/* Address line 2 */}
            <FormField
                id={`${formId}-address2`}
                label={t('addressVerification.addressLine2')}
                value={address.address2}
                onChange={(v) => updateField('address2', v)}
            />

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-3 gap-3">
                <FormField
                    id={`${formId}-city`}
                    label={t('addressVerification.city')}
                    value={address.city}
                    onChange={(v) => updateField('city', v)}
                />
                <FormField
                    id={`${formId}-state`}
                    label={t('addressVerification.state')}
                    value={address.state}
                    onChange={(v) => updateField('state', v)}
                />
                <FormField
                    id={`${formId}-postalCode`}
                    label={t('addressVerification.postalCode')}
                    value={address.postalCode}
                    onChange={(v) => updateField('postalCode', v)}
                />
            </div>

            {/* Country */}
            <FormField
                id={`${formId}-country`}
                label={t('addressVerification.country')}
                value={address.country}
                onChange={(v) => updateField('country', v)}
            />

            {/* Verification status */}
            {verified !== null && (
                <p
                    role="status"
                    className={cn(
                        'text-sm',
                        verified ? 'text-success' : 'text-warning'
                    )}
                >
                    {verified
                        ? t('addressVerification.verified')
                        : t('addressVerification.unverified')
                    }
                </p>
            )}
        </div>
    );
}

/**
 * Reusable form field with label and input.
 * Uses useId()-generated IDs from the parent for accessible label associations.
 */
function FormField({
    id,
    label,
    placeholder,
    value,
    onChange,
    ...props
}: {
    id: string;
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
} & React.InputHTMLAttributes<HTMLInputElement>): ReactElement {
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-sm text-foreground">
                {label}
            </Label>
            <Input
                id={id}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-background"
                {...props}
            />
        </div>
    );
}
