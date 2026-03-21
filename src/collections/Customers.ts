import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'subscription_status', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Display Name',
    },

    // ── Traveler Profile ─────────────────────────────────────────
    {
      name: 'traveler_profile',
      type: 'group',
      label: 'Traveler Profile',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'home_airport',
              type: 'text',
              label: 'Home Airport',
              admin: {
                placeholder: 'IATA code (e.g., SFO, JFK)',
                width: '50%',
              },
            },
            {
              name: 'passport_country',
              type: 'text',
              label: 'Passport Country',
              admin: {
                placeholder: 'ISO 3166-1 alpha-2 (e.g., US, GB)',
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'bag_preferences',
              type: 'select',
              label: 'Bag Preferences',
              options: [
                { label: 'Carry-On Only', value: 'carry_on_only' },
                { label: 'One Checked Bag', value: 'one_checked' },
                { label: 'Two Checked Bags', value: 'two_checked' },
                { label: 'No Preference', value: 'no_preference' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'seat_preferences',
              type: 'select',
              label: 'Seat Preferences',
              options: [
                { label: 'Window', value: 'window' },
                { label: 'Aisle', value: 'aisle' },
                { label: 'Middle', value: 'middle' },
                { label: 'No Preference', value: 'no_preference' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'wifi_priority',
              type: 'checkbox',
              label: 'WiFi Priority',
              defaultValue: false,
              admin: {
                description: 'Always needs WiFi (used for fare reports).',
                width: '33%',
              },
            },
          ],
        },
      ],
    },

    // ── Relationships ────────────────────────────────────────────
    {
      name: 'orders',
      type: 'relationship',
      relationTo: 'orders',
      hasMany: true,
      label: 'Order History',
      admin: {
        readOnly: true,
        description: 'Populated from orders. Can also query via Orders.customer.',
      },
    },
    {
      name: 'subscription_status',
      type: 'select',
      defaultValue: 'none',
      label: 'Subscription Status',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Active', value: 'active' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Past Due', value: 'past_due' },
      ],
      admin: {
        description: 'For Phase 2 subscription products.',
      },
    },
    {
      name: 'stripe_customer_id',
      type: 'text',
      index: true,
      label: 'Stripe Customer ID',
      admin: {
        description: 'Stripe customer ID for payment method reuse.',
        readOnly: true,
      },
    },
  ],
}
