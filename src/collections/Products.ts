import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'product_type', 'price', 'status', 'supplier'],
  },
  access: {
    read: () => true,
  },
  fields: [
    // ── Core Fields ──────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated from title. Used for URL paths.',
      },
    },
    {
      name: 'product_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Physical', value: 'physical' },
        { label: 'Digital Download', value: 'digital_download' },
        { label: 'eSIM', value: 'esim' },
        { label: 'Insurance', value: 'insurance' },
        { label: 'Fare Report', value: 'fare_report' },
        { label: 'Claim Package', value: 'claim_package' },
        { label: 'Service Booking', value: 'service_booking' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Bundle', value: 'bundle' },
      ],
      admin: {
        description: 'Controls fulfillment routing and which fields are visible.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
    },
    {
      name: 'short_description',
      type: 'textarea',
      label: 'Short Description',
      maxLength: 200,
      admin: {
        description: 'One-liner for cards and search results. Max 200 characters.',
      },
    },

    // ── Pricing ──────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Price in cents. $9.99 = 999',
            width: '33%',
          },
        },
        {
          name: 'compare_at_price',
          type: 'number',
          min: 0,
          admin: {
            description: 'Strike-through "was" price in cents.',
            width: '33%',
          },
        },
        {
          name: 'cost',
          type: 'number',
          min: 0,
          admin: {
            description: 'Supplier cost in cents. For margin tracking.',
            width: '33%',
          },
        },
      ],
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'usd',
      options: [
        { label: 'USD', value: 'usd' },
        { label: 'EUR', value: 'eur' },
        { label: 'GBP', value: 'gbp' },
        { label: 'CAD', value: 'cad' },
        { label: 'AUD', value: 'aud' },
        { label: 'JPY', value: 'jpy' },
      ],
    },

    // ── Media ────────────────────────────────────────────────────
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Product Images',
      admin: {
        description: 'First image is the primary/hero image.',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Thumbnail Override',
      admin: {
        description: 'Optional. Falls back to first image.',
      },
    },

    // ── Supplier / Sourcing ──────────────────────────────────────
    {
      name: 'supplier',
      type: 'select',
      required: true,
      options: [
        { label: 'CJDropshipping', value: 'cj' },
        { label: 'Airalo', value: 'airalo' },
        { label: 'Cover Genius', value: 'cover_genius' },
        { label: 'Printful', value: 'printful' },
        { label: 'Manual', value: 'manual' },
        { label: 'API Generated', value: 'api_generated' },
      ],
    },
    {
      name: 'supplier_product_id',
      type: 'text',
      label: 'Supplier Product ID',
      admin: {
        description: 'External ID in the supplier system.',
      },
    },
    {
      name: 'supplier_url',
      type: 'text',
      label: 'Supplier URL',
      admin: {
        description: 'Link to product in supplier dashboard.',
      },
    },

    // ── Taxonomy ─────────────────────────────────────────────────
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Categories',
    },
    {
      name: 'collections_ref',
      type: 'relationship',
      relationTo: 'collections',
      hasMany: true,
      label: 'Collections',
      admin: {
        description: 'Which merchandised collections this product appears in.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },

    // ── Product Options (physical only) ──────────────────────────
    {
      name: 'has_variants',
      type: 'checkbox',
      defaultValue: false,
      label: 'Has Variants',
      admin: {
        condition: (data) => data?.product_type === 'physical',
        description: 'Enable named option types (Color, Size, etc.) and variant combinations.',
      },
    },
    {
      name: 'options',
      type: 'array',
      label: 'Product Options',
      maxRows: 3,
      admin: {
        condition: (data) => data?.product_type === 'physical' && data?.has_variants,
        description: 'Define option dimensions (e.g., Color, Size). Max 3.',
      },
      fields: [
        {
          name: 'option_name',
          type: 'text',
          required: true,
          label: 'Option Name',
          admin: {
            placeholder: 'e.g., Color, Size, Capacity',
          },
        },
        {
          name: 'values',
          type: 'array',
          required: true,
          label: 'Option Values',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                placeholder: 'e.g., Black, Large, 40L',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'variants',
      type: 'array',
      label: 'Variants',
      admin: {
        condition: (data) => data?.product_type === 'physical' && data?.has_variants,
        description: 'Each variant maps to a specific combination of option values.',
      },
      fields: [
        {
          name: 'option_selections',
          type: 'array',
          label: 'Option Selections',
          fields: [
            {
              name: 'option_name',
              type: 'text',
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'variant_label',
          type: 'text',
          label: 'Variant Label',
          admin: {
            description: 'Auto-generated display label (e.g., "Black / Large"). Editable.',
          },
        },
        {
          name: 'sku',
          type: 'text',
          label: 'SKU',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'price',
              type: 'number',
              min: 0,
              admin: {
                description: 'In cents. Overrides product-level price.',
                width: '50%',
              },
            },
            {
              name: 'compare_at_price',
              type: 'number',
              min: 0,
              admin: {
                description: 'In cents.',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'supplier_variant_id',
          type: 'text',
          label: 'Supplier Variant ID',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'weight_grams',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
            {
              name: 'inventory_count',
              type: 'number',
              min: 0,
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Variant Image',
          admin: {
            description: 'Variant-specific image (e.g., color swatch).',
          },
        },
      ],
    },

    // ── Inventory / Shipping (physical only) ─────────────────────
    {
      name: 'inventory_tracked',
      type: 'checkbox',
      defaultValue: false,
      label: 'Track Inventory',
      admin: {
        condition: (data) => data?.product_type === 'physical',
      },
    },
    {
      name: 'inventory_count',
      type: 'number',
      min: 0,
      label: 'Inventory Count',
      admin: {
        condition: (data) => data?.product_type === 'physical' && data?.inventory_tracked,
        description: 'Current stock. Synced from CJ for dropship items.',
      },
    },
    {
      name: 'weight_grams',
      type: 'number',
      min: 0,
      label: 'Weight (grams)',
      admin: {
        condition: (data) => data?.product_type === 'physical',
      },
    },
    {
      name: 'sku',
      type: 'text',
      label: 'SKU',
      admin: {
        condition: (data) => data?.product_type === 'physical' && !data?.has_variants,
        description: 'Internal SKU for non-variant products.',
      },
    },

    // ── Digital Delivery (non-physical) ──────────────────────────
    {
      name: 'digital_asset',
      type: 'relationship',
      relationTo: 'digital-assets',
      label: 'Digital Asset',
      admin: {
        condition: (data) =>
          data?.product_type &&
          !['physical', 'bundle'].includes(data.product_type),
        description: 'Link to downloadable file/asset.',
      },
    },
    {
      name: 'fulfillment_handler',
      type: 'text',
      label: 'Fulfillment Handler',
      admin: {
        condition: (data) =>
          data?.product_type &&
          !['physical', 'bundle'].includes(data.product_type),
        description: 'Inngest function identifier (e.g., fulfill-esim, fulfill-fare-report).',
      },
    },
    {
      name: 'api_config',
      type: 'json',
      label: 'API Config',
      admin: {
        condition: (data) =>
          data?.product_type &&
          !['physical', 'bundle'].includes(data.product_type),
        description: 'Handler-specific configuration (Airalo package params, fare report defaults, etc.).',
      },
    },

    // ── Bundle Items (bundle only) ───────────────────────────────
    {
      name: 'bundle_items',
      type: 'array',
      label: 'Bundle Items',
      admin: {
        condition: (data) => data?.product_type === 'bundle',
        description: 'Component products in this bundle. Each fulfilled independently.',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: 'Component Product',
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          label: 'Quantity',
        },
      ],
    },

    // ── SEO ──────────────────────────────────────────────────────
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        {
          name: 'meta_title',
          type: 'text',
          label: 'Meta Title',
          admin: { description: 'Falls back to product title.' },
        },
        {
          name: 'meta_description',
          type: 'textarea',
          label: 'Meta Description',
          admin: { description: 'Falls back to short description.' },
        },
        {
          name: 'og_image',
          type: 'upload',
          relationTo: 'media',
          label: 'OG Image',
          admin: { description: 'Falls back to first product image.' },
        },
      ],
    },
  ],
}
