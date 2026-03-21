import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'parent', 'depth', 'display_order'],
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
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Category description for SEO and display.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Category Image',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Parent Category',
      admin: {
        description: 'Leave empty for top-level categories. Set to a parent for sub-categories.',
      },
    },
    {
      name: 'depth',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: '0 = top-level, 1 = sub-category. Auto-set based on parent.',
        readOnly: true,
      },
    },
    {
      name: 'display_order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Sort priority within the same depth level. Lower = first.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data?.parent) {
          // Look up the parent's depth
          const parent = await req.payload.findByID({
            collection: 'categories',
            id: data.parent,
            depth: 0,
          })
          const parentDepth = (parent?.depth as number) ?? 0
          if (parentDepth >= 1) {
            throw new Error('Categories support a maximum of two levels. Cannot nest deeper than one sub-level.')
          }
          data.depth = parentDepth + 1
        } else {
          data.depth = 0
        }
        return data
      },
    ],
  },
}
