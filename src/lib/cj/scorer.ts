import Anthropic from '@anthropic-ai/sdk'

import type { CandidateProduct } from '@/payload-types'

const client = new Anthropic()

const SYSTEM_PROMPT =
  'You are a product curator for a travel ecommerce store. You evaluate wholesale products for travel relevance and retail viability. Respond ONLY with a JSON object, no markdown fences, no preamble.'

const DESCRIPTION_KEYS = ['descriptionEn', 'productDescriptionEn', 'description'] as const

export type ScoringResult = {
  score: number
  rationale: string
  concerns: string
  suggested_title: string
  suggested_retail_price_cents: number
}

const stripHtml = (input: string): string =>
  input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()

const extractDescription = (candidate: CandidateProduct): string => {
  const supplierData = candidate.supplier_data

  if (!supplierData || typeof supplierData !== 'object' || Array.isArray(supplierData)) {
    return ''
  }

  for (const key of DESCRIPTION_KEYS) {
    const value = supplierData[key]

    if (typeof value === 'string' && value.trim()) {
      return stripHtml(value).slice(0, 500)
    }
  }

  return ''
}

const buildUserPrompt = (candidate: CandidateProduct): string => {
  const description = extractDescription(candidate)
  const category = candidate.supplier_category || ''
  const imageUrl = candidate.supplier_image_url || ''
  const wholesalePrice = (candidate.supplier_price / 100).toFixed(2)

  return `Evaluate this product for a travel ecommerce store:

Product name: ${candidate.supplier_name}
Category: ${category}
Wholesale price: $${wholesalePrice} USD
Description: ${description}
Image URL: ${imageUrl}

Score this product and respond with ONLY this JSON structure:
{
  "score": <integer 1-10>,
  "rationale": "<2-3 sentences explaining the score>",
  "concerns": "<quality, branding, or relevance concerns, or empty string if none>",
  "suggested_title": "<clean, retail-ready product title, max 80 chars>",
  "suggested_retail_price_usd": <suggested retail price as a decimal number in USD>
}

Scoring rubric:
- 9-10: Essential travel item, clear use case, good margin potential
- 7-8: Strong travel relevance, most travelers would consider it
- 5-6: Moderate travel relevance, niche but valid use case
- 3-4: Weak travel connection, could be used for travel but not primarily a travel product
- 1-2: Not a travel product, irrelevant to travel ecommerce

For suggested_retail_price_usd: target a 2.5x-4x markup on the wholesale price. Account for the product category — higher markups on accessories and small items, lower on electronics and luggage.

For suggested_title: remove supplier jargon, Chinese brand names, excessive keywords. Make it clean and descriptive like you'd see on a premium ecommerce site.`
}

const stripMarkdownFences = (input: string): string =>
  input.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()

const parseResponseText = (text: string): ScoringResult => {
  let parsed: unknown

  try {
    parsed = JSON.parse(stripMarkdownFences(text))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse Claude JSON response: ${message}. Raw response: ${text}`)
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Claude response was not a JSON object. Raw response: ${text}`)
  }

  const result = parsed as {
    score?: unknown
    rationale?: unknown
    concerns?: unknown
    suggested_title?: unknown
    suggested_retail_price_usd?: unknown
  }

  const score = result.score
  const rationale = result.rationale
  const concerns = result.concerns
  const suggestedTitle = result.suggested_title
  const suggestedRetailPriceUsd = result.suggested_retail_price_usd

  if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 10) {
    throw new Error(`Invalid score in Claude response. Raw response: ${text}`)
  }

  if (typeof rationale !== 'string' || !rationale.trim()) {
    throw new Error(`Invalid rationale in Claude response. Raw response: ${text}`)
  }

  if (typeof concerns !== 'string') {
    throw new Error(`Invalid concerns in Claude response. Raw response: ${text}`)
  }

  if (typeof suggestedTitle !== 'string' || !suggestedTitle.trim()) {
    throw new Error(`Invalid suggested_title in Claude response. Raw response: ${text}`)
  }

  if (typeof suggestedRetailPriceUsd !== 'number' || !Number.isFinite(suggestedRetailPriceUsd) || suggestedRetailPriceUsd <= 0) {
    throw new Error(`Invalid suggested_retail_price_usd in Claude response. Raw response: ${text}`)
  }

  const validatedScore = score
  const validatedSuggestedRetailPriceUsd = suggestedRetailPriceUsd

  return {
    score: validatedScore,
    rationale: rationale.trim(),
    concerns: concerns.trim(),
    suggested_title: suggestedTitle.trim().slice(0, 80),
    suggested_retail_price_cents: Math.round(validatedSuggestedRetailPriceUsd * 100),
  }
}

export async function scoreCandidate(candidate: CandidateProduct): Promise<ScoringResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(candidate),
      },
    ],
  })

  const textBlocks = response.content.filter((block) => block.type === 'text')

  if (textBlocks.length === 0) {
    throw new Error(`Claude returned no text content for candidate ${candidate.id}`)
  }

  const responseText = textBlocks.map((block) => block.text).join('\n').trim()

  if (!responseText) {
    throw new Error(`Claude returned empty text content for candidate ${candidate.id}`)
  }

  return parseResponseText(responseText)
}
