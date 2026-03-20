/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import DeliveryEstimate from '../index';

const meta = {
    title: 'Extensions/DeliveryEstimates/DeliveryEstimate',
    component: DeliveryEstimate,
    tags: ['autodocs', 'interaction'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof DeliveryEstimate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state — postal code input with check button */
export const Default: Story = {};

/** Mobile viewport */
export const Mobile: Story = {
    globals: { viewport: 'mobile2' },
};

/** User enters a postal code and checks delivery estimate */
export const WithEstimate: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const input = canvas.getByPlaceholderText(/e\.g\./);
        await userEvent.type(input, '90210');

        const button = canvas.getByRole('button', { name: /check/i });
        await userEvent.click(button);

        // Wait for the estimate to appear
        await expect(
            await canvas.findByRole('status')
        ).toHaveTextContent(/estimated delivery by/i);
    },
};
