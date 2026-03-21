import type { CollectionConfig } from 'payload'

export const Editorial: CollectionConfig = {
  slug: 'editorial',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'published_at'],
  },
  access: {
    read: () => true,
  },
  fields: [
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
      name: 'body',
      type: 'richText',
      required: true,
      label: 'Body',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 300,
      label: 'Excerpt',
      admin: {
        description: 'Short preview for cards and feeds. Max 300 characters.',
      },
    },
    {
      name: 'featured_image',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured Image',
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { label: 'Guide', value: 'guide' },
        { label: 'Review', value: 'review' },
        { label: 'Comparison', value: 'comparison' },
        { label: 'How To', value: 'how_to' },
        { label: 'Deal Alert', value: 'deal_alert' },
        { label: 'News', value: 'news' },
      ],
    },
    {
      name: 'related_products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Related Products',
      admin: {
        description: 'Products referenced or recommended in this article.',
      },
    },
    {
      name: 'related_collections',
      type: 'relationship',
      relationTo: 'collections',
      hasMany: true,
      label: 'Related Collections',
    },
    {
      name: 'author',
      type: 'text',
      label: 'Author',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'published_at',
      type: 'date',
      label: 'Published At',
      admin: {
        description: 'Explicit publish date for display and sorting.',
        date: { pickerAppearance: 'dayOnly' },
      },
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
          admin: { description: 'Falls back to article title.' },
        },
        {
          name: 'meta_description',
          type: 'textarea',
          label: 'Meta Description',
          admin: { description: 'Falls back to excerpt.' },
        },
        {
          name: 'og_image',
          type: 'upload',
          relationTo: 'media',
          label: 'OG Image',
          admin: { description: 'Falls back to featured image.' },
        },
      ],
    },
  ],
}
