import type { CollectionConfig } from 'payload'

import { slugField } from '../hooks/slugify'

export const Collections: CollectionConfig = {
  slug: 'collections',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'trip_type', 'status', 'hero_enabled', 'display_order'],
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
      hooks: {
        beforeChange: [slugField],
      },
      admin: {
        description: 'Auto-generated from title. Used for URL paths.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: 'Collection page intro copy.',
      },
    },
    {
      name: 'featured_image',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured Image',
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Products',
      admin: {
        description: 'Ordered list of products in this collection.',
      },
    },
    {
      name: 'trip_type',
      type: 'select',
      label: 'Trip Type',
      options: [
        { label: 'Carry-On', value: 'carry_on' },
        { label: 'Checked Bag', value: 'checked_bag' },
        { label: 'Red-Eye', value: 'red_eye' },
        { label: 'International', value: 'international' },
        { label: 'Budget', value: 'budget' },
        { label: 'Business', value: 'business' },
        { label: 'Family', value: 'family' },
        { label: 'Adventure', value: 'adventure' },
        { label: 'Digital Nomad', value: 'digital_nomad' },
      ],
    },
    {
      name: 'display_order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Sort priority on homepage/nav. Lower = first.',
      },
    },
    {
      name: 'hero_enabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Hero Enabled',
      admin: {
        description: 'If true, this collection can be featured in the homepage hero.',
      },
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
  ],
}
