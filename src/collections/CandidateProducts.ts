import type { CollectionConfig } from 'payload'

export const CandidateProducts: CollectionConfig = {
  slug: 'candidate-products',
  admin: {
    useAsTitle: 'suggested_title',
    defaultColumns: [
      'suggested_title',
      'ai_score',
      'status',
      'supplier',
      'supplier_price',
      'suggested_retail_price',
      'updatedAt',
    ],
    group: 'Product Pipeline',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'supplier',
      type: 'select',
      required: true,
      defaultValue: 'cj',
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
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'External product ID used to deduplicate supplier imports.',
      },
    },
    {
      name: 'supplier_name',
      type: 'text',
      required: true,
    },
    {
      name: 'supplier_price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Wholesale price from supplier, in cents.',
      },
    },
    {
      name: 'supplier_category',
      type: 'text',
    },
    {
      name: 'supplier_image_url',
      type: 'text',
      admin: {
        description: 'Primary supplier image URL for admin preview; not downloaded yet.',
      },
    },
    {
      name: 'supplier_data',
      type: 'json',
      admin: {
        description: 'Full raw supplier API response used by the import pipeline.',
      },
    },
    {
      name: 'variant_count',
      type: 'number',
    },
    {
      name: 'inventory',
      type: 'number',
    },
    {
      name: 'search_keyword',
      type: 'text',
    },
    {
      name: 'ai_score',
      type: 'number',
      min: 1,
      max: 10,
    },
    {
      name: 'ai_rationale',
      type: 'textarea',
    },
    {
      name: 'ai_concerns',
      type: 'textarea',
    },
    {
      name: 'suggested_title',
      type: 'text',
      admin: {
        description: 'AI-cleaned product title; falls back to supplier name before scoring.',
      },
    },
    {
      name: 'suggested_retail_price',
      type: 'number',
      min: 0,
      admin: {
        description: 'Suggested retail price, in cents.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_review',
      options: [
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Needs Review', value: 'needs_review' },
        { label: 'Auto Rejected', value: 'auto_rejected' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Imported', value: 'imported' },
      ],
    },
    {
      name: 'reviewed_at',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'rejection_reason',
      type: 'textarea',
    },
    {
      name: 'imported_product_id',
      type: 'text',
      index: true,
      admin: {
        description: 'Products collection ID created after successful import.',
      },
    },
  ],
}
