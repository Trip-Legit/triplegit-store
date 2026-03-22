import type { FieldHook } from 'payload'

export const generateSlug = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

export const slugField: FieldHook = ({ data, operation, originalDoc, value }) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return generateSlug(value)
  }

  const title = typeof data?.title === 'string' ? data.title : ''
  const hasSlugInput = Boolean(data && Object.prototype.hasOwnProperty.call(data, 'slug'))

  if (operation === 'create') {
    return generateSlug(title)
  }

  if (operation === 'update') {
    if (hasSlugInput) {
      return generateSlug(title)
    }

    return typeof originalDoc?.slug === 'string' ? originalDoc.slug : value
  }

  return value
}
