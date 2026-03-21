import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt_text',
      type: 'text',
      label: 'Alt Text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
    },
    {
      name: 'source',
      type: 'select',
      label: 'Source',
      defaultValue: 'upload',
      options: [
        { label: 'Upload', value: 'upload' },
        { label: 'CJ Import', value: 'cj_import' },
        { label: 'Supplier', value: 'supplier' },
      ],
    },
  ],
}
