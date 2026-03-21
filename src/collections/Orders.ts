import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'order_number',
    defaultColumns: ['order_number', 'customer_email', 'status', 'total', 'createdAt'],
  },
  fields: [
    // ── Core ─────────────────────────────────────────────────────
    {
      name: 'order_number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated sequential (e.g., TL-10001).',
        readOnly: true,
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Customer',
      admin: {
        description: 'Null for guest checkout.',
      },
    },
    {
      name: 'customer_email',
      type: 'email',
      required: true,
      label: 'Customer Email',
      admin: {
        description: 'Denormalized for guest orders and quick lookup.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Processing', value: 'processing' },
        { label: 'Partially Fulfilled', value: 'partially_fulfilled' },
        { label: 'Fulfilled', value: 'fulfilled' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },

    // ── Line Items ───────────────────────────────────────────────
    {
      name: 'line_items',
      type: 'array',
      label: 'Line Items',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          label: 'Product',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Product Title',
          admin: { description: 'Snapshot at time of purchase.' },
        },
        {
          name: 'variant_label',
          type: 'text',
          label: 'Variant Label',
          admin: { description: 'Snapshot of variant (e.g., "Black / Large"). Null if no variant.' },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'price_at_purchase',
          type: 'number',
          required: true,
          label: 'Price at Purchase',
          admin: { description: 'In cents. Immutable snapshot.' },
        },
        {
          name: 'currency_at_purchase',
          type: 'text',
          label: 'Currency at Purchase',
          admin: { description: 'ISO 4217 code snapshot.' },
        },
        {
          name: 'product_type',
          type: 'text',
          required: true,
          label: 'Product Type',
          admin: { description: 'Drives fulfillment routing.' },
        },
        {
          name: 'fulfillment_status',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Shipped', value: 'shipped' },
            { label: 'Delivered', value: 'delivered' },
            { label: 'Fulfilled (Digital)', value: 'fulfilled_digital' },
            { label: 'Failed', value: 'failed' },
          ],
        },
        {
          name: 'supplier_order_id',
          type: 'text',
          label: 'Supplier Order ID',
          admin: { description: 'CJ order ID, Airalo order ID, etc.' },
        },
        {
          name: 'tracking_number',
          type: 'text',
          label: 'Tracking Number',
        },
        {
          name: 'tracking_url',
          type: 'text',
          label: 'Tracking URL',
        },
      ],
    },

    // ── Payment ──────────────────────────────────────────────────
    {
      name: 'payment',
      type: 'group',
      label: 'Payment',
      fields: [
        {
          name: 'stripe_payment_intent_id',
          type: 'text',
          index: true,
          label: 'Stripe Payment Intent ID',
        },
        {
          name: 'stripe_checkout_session_id',
          type: 'text',
          label: 'Stripe Checkout Session ID',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'subtotal',
              type: 'number',
              required: true,
              admin: { description: 'In cents.', width: '25%' },
            },
            {
              name: 'shipping_cost',
              type: 'number',
              defaultValue: 0,
              admin: { description: 'In cents. 0 for digital-only.', width: '25%' },
            },
            {
              name: 'tax',
              type: 'number',
              defaultValue: 0,
              admin: { description: 'In cents.', width: '25%' },
            },
            {
              name: 'total',
              type: 'number',
              required: true,
              admin: { description: 'In cents.', width: '25%' },
            },
          ],
        },
        {
          name: 'currency',
          type: 'text',
          required: true,
          defaultValue: 'usd',
          admin: { description: 'ISO 4217 code.' },
        },
      ],
    },

    // ── Shipping ─────────────────────────────────────────────────
    {
      name: 'shipping',
      type: 'group',
      label: 'Shipping Address',
      admin: {
        description: 'Only relevant for orders containing physical items.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Full Name',
        },
        {
          name: 'address_line1',
          type: 'text',
          label: 'Address Line 1',
        },
        {
          name: 'address_line2',
          type: 'text',
          label: 'Address Line 2',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              admin: { width: '33%' },
            },
            {
              name: 'state',
              type: 'text',
              admin: { width: '33%' },
            },
            {
              name: 'postal_code',
              type: 'text',
              admin: { width: '33%' },
            },
          ],
        },
        {
          name: 'country',
          type: 'text',
          label: 'Country',
          admin: { description: 'ISO 3166-1 alpha-2.' },
        },
      ],
    },

    // ── Internal ─────────────────────────────────────────────────
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: {
        description: 'Admin-only internal notes.',
      },
    },
    {
      name: 'fulfillment_errors',
      type: 'array',
      label: 'Fulfillment Errors',
      admin: {
        description: 'Logged errors from Inngest handlers.',
        readOnly: true,
      },
      fields: [
        {
          name: 'error',
          type: 'text',
          required: true,
        },
        {
          name: 'occurred_at',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
      ],
    },
  ],
}
