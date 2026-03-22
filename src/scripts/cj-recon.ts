import 'dotenv/config'

import { getPayload } from 'payload'

import config from '@/payload.config'
import { CjClient, type CjProduct } from '@/lib/cj/client'
import { SEARCH_KEYWORDS } from '@/lib/cj/keywords'

const SEARCH_PAGE_SIZE = 50
const MAX_PAGES_PER_KEYWORD = 3
const CJ_REQUEST_DELAY_MS = 2000
const CREATE_DELAY_MS = 500

type CandidateRecord = {
  product: CjProduct
  firstKeyword: string
}

type ReconStats = {
  keywordsFailed: number
  totalProductsFound: number
  crossKeywordDuplicates: number
  alreadyInCandidateProducts: number
  newCandidatesSaved: number
  errors: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const parseSupplierPrice = (sellPrice: CjProduct['sellPrice']): number => {
  if (typeof sellPrice === 'number') {
    return Math.round(sellPrice * 100)
  }

  if (typeof sellPrice === 'string') {
    const lowerBound = sellPrice.includes(' -- ')
      ? sellPrice.split(' -- ')[0]?.trim() || ''
      : sellPrice.split('~')[0]?.trim() || ''
    const parsed = Number.parseFloat(lowerBound)

    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100)
    }
  }

  return 0
}

const buildSupplierCategory = (product: CjProduct): string =>
  [product.oneCategoryName, product.twoCategoryName, product.threeCategoryName].filter(Boolean).join(' / ')

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value)

async function main() {
  if (!process.env.DATABASE_URL && process.env.DATABASE_URI) {
    process.env.DATABASE_URL = process.env.DATABASE_URI
  }

  const payload = await getPayload({ config })
  const cjClient = new CjClient()
  const uniqueProducts = new Map<string, CandidateRecord>()
  let lastCjRequestAt = 0
  const stats: ReconStats = {
    keywordsFailed: 0,
    totalProductsFound: 0,
    crossKeywordDuplicates: 0,
    alreadyInCandidateProducts: 0,
    newCandidatesSaved: 0,
    errors: 0,
  }

  const throttledSearchProducts = async (keyword: string, page: number) => {
    const elapsed = Date.now() - lastCjRequestAt

    if (lastCjRequestAt > 0 && elapsed < CJ_REQUEST_DELAY_MS) {
      await sleep(CJ_REQUEST_DELAY_MS - elapsed)
    }

    const response = await cjClient.searchProducts(keyword, page, SEARCH_PAGE_SIZE)
    lastCjRequestAt = Date.now()
    return response
  }

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`Searching CJ for "${keyword}"`)

    try {
      let keywordFailed = false

      for (let page = 1; page <= MAX_PAGES_PER_KEYWORD; page += 1) {
        const response = await throttledSearchProducts(keyword, page)

        if (!response) {
          keywordFailed = true
          break
        }

        const products = response.products

        if (!products?.length) {
          console.warn(`No product data returned for keyword "${keyword}" page ${page}`)
          console.warn('CJ raw response for empty product data:', JSON.stringify(response.rawResponse, null, 2))
          break
        }

        stats.totalProductsFound += products.length

        for (const product of products) {
          if (!product.id) {
            continue
          }

          if (uniqueProducts.has(product.id)) {
            stats.crossKeywordDuplicates += 1
            continue
          }

          uniqueProducts.set(product.id, {
            product,
            firstKeyword: keyword,
          })
        }

        if (response.pageNumber >= response.totalPages) {
          break
        }
      }

      if (keywordFailed) {
        stats.keywordsFailed += 1
        stats.errors += 1
      }
    } catch (error) {
      stats.keywordsFailed += 1
      stats.errors += 1
      console.error(`Keyword search failed for "${keyword}"`, error)
    }
  }

  for (const [productId, record] of uniqueProducts) {
    try {
      const existing = await payload.find({
        collection: 'candidate-products',
        where: {
          supplier_product_id: {
            equals: productId,
          },
        },
        limit: 1,
        depth: 0,
      })

      if (existing.totalDocs > 0) {
        stats.alreadyInCandidateProducts += 1
        continue
      }

      await payload.create({
        collection: 'candidate-products',
        data: {
          supplier: 'cj',
          supplier_product_id: productId,
          supplier_name: record.product.nameEn || productId,
          supplier_price: parseSupplierPrice(record.product.sellPrice),
          supplier_category: buildSupplierCategory(record.product),
          supplier_image_url: record.product.bigImage || '',
          supplier_data: record.product,
          variant_count: 0,
          inventory: record.product.warehouseInventoryNum ?? undefined,
          search_keyword: record.firstKeyword,
          status: 'pending_review',
        },
      })

      stats.newCandidatesSaved += 1
      await sleep(CREATE_DELAY_MS)
    } catch (error) {
      stats.errors += 1
      console.error(`Failed to save candidate product ${productId}`, error)
    }
  }

  console.log('')
  console.log('CJ Recon Complete')
  console.log('─────────────────')
  console.log(`Keywords searched: ${SEARCH_KEYWORDS.length}`)
  console.log(`Total products found: ${formatNumber(stats.totalProductsFound)}`)
  console.log(`Duplicates (cross-keyword): ${formatNumber(stats.crossKeywordDuplicates)}`)
  console.log(`Already in CandidateProducts: ${formatNumber(stats.alreadyInCandidateProducts)}`)
  console.log(`New candidates saved: ${formatNumber(stats.newCandidatesSaved)}`)
  console.log(`Errors: ${formatNumber(stats.errors)}`)

  if (stats.keywordsFailed > SEARCH_KEYWORDS.length / 2) {
    process.exitCode = 1
  }
}

void main().catch((error) => {
  console.error('CJ recon failed', error)
  process.exit(1)
})
