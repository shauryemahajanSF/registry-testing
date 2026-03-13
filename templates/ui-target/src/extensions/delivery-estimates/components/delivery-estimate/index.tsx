/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/Apache-2.0
 */

'use client';

import { useState, useId, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Delivery Estimate Component
 *
 * Renders on the PDP at the sfdc.pdp.deliveryestimates.getestimatefrompostal
 * UI Target. Accepts a postal code from the shopper and displays an estimated
 * delivery date.
 *
 * This is a UI Target Only example — all logic runs client-side. For apps
 * that need backend callouts (e.g., carrier rate APIs), see the full-app
 * template (address-verification) which demonstrates the backend-for-frontend
 * pattern with custom SCAPI and Script API cartridges.
 */
export default function DeliveryEstimate(): ReactElement {
    const { t } = useTranslation('deliveryEstimates');
    const inputId = useId();

    const [postalCode, setPostalCode] = useState('');
    const [estimate, setEstimate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleCheck = async () => {
        if (!postalCode.trim()) return;

        setLoading(true);
        setError(false);
        setEstimate(null);

        try {
            // TODO: Replace with your delivery estimate logic.
            // For client-side only apps, calculate directly.
            // For backend integration, call your API endpoint here:
            //   const response = await fetch(`/api/delivery-estimate?postal=${postalCode}`);
            //   const data = await response.json();

            // Placeholder: simulate a 3–5 business day estimate
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 3);
            const formatted = deliveryDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            });

            setEstimate(formatted);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div data-slot="delivery-estimate" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">
                {t('deliveryEstimate.heading')}
            </h3>

            <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={inputId} className="text-xs text-muted-foreground">
                        {t('deliveryEstimate.postalCodeLabel')}
                    </Label>
                    <Input
                        id={inputId}
                        type="text"
                        inputMode="numeric"
                        placeholder={t('deliveryEstimate.postalCodePlaceholder')}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                        className="w-36"
                        aria-describedby={`${inputId}-result`}
                    />
                </div>
                <Button
                    onClick={handleCheck}
                    disabled={loading || !postalCode.trim()}
                    size="sm"
                    variant="secondary"
                >
                    {t('deliveryEstimate.checkButton')}
                </Button>
            </div>

            <p
                id={`${inputId}-result`}
                className={cn(
                    'text-sm',
                    error ? 'text-destructive' : 'text-muted-foreground'
                )}
                role="status"
                aria-live="polite"
            >
                {loading && t('deliveryEstimate.loading')}
                {error && t('deliveryEstimate.error')}
                {estimate && `${t('deliveryEstimate.estimatePrefix')} ${estimate}`}
                {!loading && !error && !estimate && t('deliveryEstimate.noEstimate')}
            </p>
        </div>
    );
}
