import type { CollectionConfig } from 'payload'

export const DigitalAssets: CollectionConfig = {
  slug: 'digital-assets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'delivery_type', 'version', 'updatedAt'],
  },
  upload: {
    mimeTypes: ['application/pdf', 'application/zip', 'application/x-zip-compressed'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal label (e.g., "SFO Airport Briefing v2").',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Product',
      admin: {
        description: 'Which product this asset belongs to.',
      },
    },
    {
      name: 'delivery_type',
      type: 'select',
      required: true,
      label: 'Delivery Type',
      options: [
        { label: 'Email Attachment', value: 'email_attachment' },
        { label: 'Signed Download URL', value: 'signed_download_url' },
        { label: 'API Provisioned', value: 'api_provisioned' },
      ],
    },
    {
      name: 'fulfillment_handler',
      type: 'text',
      label: 'Fulfillment Handler',
      admin: {
        description: 'Inngest function identifier. Overrides the product-level handler if set.',
      },
    },
    {
      name: 'version',
      type: 'text',
      label: 'Version',
      admin: {
        description: 'Version tracking (e.g., "1.2", "March 2026").',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
    },
  ],
}
