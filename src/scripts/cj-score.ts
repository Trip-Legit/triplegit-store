import 'dotenv/config'

import { getPayload } from 'payload'
import type { Payload } from 'payload'

import { scoreCandidate } from '@/lib/cj/scorer'
import type { CandidateProduct } from '@/payload-types'
import config from '@/payload.config'

const FETCH_PAGE_SIZE = 100
const CLAUDE_REQUEST_DELAY_MS = 6000

type ScoreStats = {
  totalPendingReview: number
  scoredSuccessfully: number
  needsReview: number
  autoRejected: number
  errors: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value)

const parseLimitArg = (): number | null => {
  const index = process.argv.indexOf('--limit')

  if (index === -1) {
    return null
  }

  const rawValue = process.argv[index + 1]
  const parsed = Number.parseInt(rawValue || '', 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid --limit value. Use a positive integer.')
  }

  return parsed
}

const fetchPendingCandidates = async (payload: Payload): Promise<CandidateProduct[]> => {
  const candidates: CandidateProduct[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const result = await payload.find({
      collection: 'candidate-products',
      where: {
        status: {
          equals: 'pending_review',
        },
      },
      sort: 'createdAt',
      limit: FETCH_PAGE_SIZE,
      page,
      depth: 0,
    })

    candidates.push(...(result.docs as CandidateProduct[]))
    totalPages = result.totalPages
    page += 1
  }

  return candidates
}

async function main() {
  if (!process.env.DATABASE_URL && process.env.DATABASE_URI) {
    process.env.DATABASE_URL = process.env.DATABASE_URI
  }

  const limit = parseLimitArg()
  const payload = await getPayload({ config })
  const pendingCandidates = await fetchPendingCandidates(payload)
  const candidates = limit ? pendingCandidates.slice(0, limit) : pendingCandidates
  const stats: ScoreStats = {
    totalPendingReview: candidates.length,
    scoredSuccessfully: 0,
    needsReview: 0,
    autoRejected: 0,
    errors: 0,
  }
  let lastClaudeRequestAt = 0

  for (const candidate of candidates) {
    try {
      const elapsed = Date.now() - lastClaudeRequestAt

      if (lastClaudeRequestAt > 0 && elapsed < CLAUDE_REQUEST_DELAY_MS) {
        await sleep(CLAUDE_REQUEST_DELAY_MS - elapsed)
      }

      const result = await scoreCandidate(candidate)
      lastClaudeRequestAt = Date.now()

      await payload.update({
        collection: 'candidate-products',
        id: candidate.id,
        data: {
          ai_score: result.score,
          ai_rationale: result.rationale,
          ai_concerns: result.concerns,
          suggested_title: result.suggested_title,
          suggested_retail_price: result.suggested_retail_price_cents,
          status: result.score < 3 ? 'auto_rejected' : 'needs_review',
        },
      })

      stats.scoredSuccessfully += 1

      if (result.score < 3) {
        stats.autoRejected += 1
      } else {
        stats.needsReview += 1
      }

      console.log(`Scored candidate ${candidate.id}: ${candidate.supplier_name} -> ${result.score}`)
    } catch (error) {
      lastClaudeRequestAt = Date.now()
      stats.errors += 1
      console.error(`Failed to score candidate ${candidate.id} (${candidate.supplier_name})`, error)
    }
  }

  console.log('')
  console.log('CJ Score Complete')
  console.log('─────────────────')
  console.log(`Total pending_review: ${formatNumber(stats.totalPendingReview)}`)
  console.log(`Scored successfully: ${formatNumber(stats.scoredSuccessfully)}`)
  console.log(`  → needs_review (score ≥ 3): ${formatNumber(stats.needsReview)}`)
  console.log(`  → auto_rejected (score < 3): ${formatNumber(stats.autoRejected)}`)
  console.log(`Errors (skipped): ${formatNumber(stats.errors)}`)

  if (stats.totalPendingReview > 0 && stats.errors > stats.totalPendingReview / 2) {
    process.exitCode = 1
  }
}

void main().catch((error) => {
  console.error('CJ score failed', error)
  process.exit(1)
})
