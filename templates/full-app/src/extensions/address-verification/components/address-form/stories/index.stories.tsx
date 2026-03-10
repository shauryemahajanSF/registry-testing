/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import AddressForm from '../index';

const meta = {
    title: 'Extensions/AddressVerification/AddressForm',
    component: AddressForm,
    tags: ['autodocs', 'interaction'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof AddressForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default empty form */
export const Default: Story = {};

/** Mobile viewport */
export const Mobile: Story = {
    globals: { viewport: 'mobile2' },
};

/** User types in the address field to trigger autocomplete */
export const WithAutocomplete: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Type in the first name
        const firstName = canvas.getByLabelText(/first name/i);
        await userEvent.type(firstName, 'Jane');

        // Type in the last name
        const lastName = canvas.getByLabelText(/last name/i);
        await userEvent.type(lastName, 'Smith');

        // Start typing an address to trigger autocomplete
        const address1 = canvas.getByLabelText(/address line 1/i);
        await userEvent.type(address1, '123 Main');

        // Verify the input has the typed value
        await expect(address1).toHaveValue('123 Main');
    },
};
