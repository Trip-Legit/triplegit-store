'use client'

import type { CandidateProduct } from '@/payload-types'
import { useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 24

const TABS = ['needs_review', 'auto_rejected', 'approved', 'rejected', 'imported'] as const

type ReviewStatus = (typeof TABS)[number]

type CandidateResponse = {
  docs: CandidateProduct[]
  totalDocs: number
  page: number
  totalPages: number
}

type BatchProgress = {
  complete: number
  total: number
}

const TAB_LABELS: Record<ReviewStatus, string> = {
  needs_review: 'Needs Review',
  auto_rejected: 'Auto Rejected',
  approved: 'Approved',
  rejected: 'Rejected',
  imported: 'Imported',
}

const SCORE_CLASS_BY_VALUE = {
  low: 'candidate-review-score--low',
  mid: 'candidate-review-score--mid',
  high: 'candidate-review-score--high',
}

const formatCurrency = (value?: number | null): string => {
  if (typeof value !== 'number') {
    return 'N/A'
  }

  return `$${(value / 100).toFixed(2)}`
}

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value)

const getScoreClass = (score?: number | null): string => {
  if (typeof score !== 'number') {
    return SCORE_CLASS_BY_VALUE.low
  }

  if (score <= 3) {
    return SCORE_CLASS_BY_VALUE.low
  }

  if (score <= 6) {
    return SCORE_CLASS_BY_VALUE.mid
  }

  return SCORE_CLASS_BY_VALUE.high
}

const buildQueryString = (status: ReviewStatus, page: number, keyword: string): string => {
  const params = new URLSearchParams()
  const trimmedKeyword = keyword.trim()

  params.set('limit', String(PAGE_SIZE))
  params.set('page', String(page))
  params.set('depth', '0')
  params.set('where[status][equals]', status)

  if (status === 'needs_review') {
    params.set('sort', '-ai_score')
  } else if (status === 'auto_rejected') {
    params.set('sort', 'ai_score')
  } else {
    params.set('sort', '-reviewed_at')
  }

  if (trimmedKeyword) {
    params.delete('where[status][equals]')
    params.set('where[and][0][status][equals]', status)
    params.set('where[and][1][search_keyword][contains]', trimmedKeyword)
  }

  return params.toString()
}

const PlaceholderImage = () => <div className="candidate-review-image-placeholder">No Image</div>

function CandidateCard({
  candidate,
  rejectValue,
  rejectOpen,
  isBusy,
  isRemoving,
  onApprove,
  onRejectToggle,
  onRejectValueChange,
  onRejectConfirm,
}: {
  candidate: CandidateProduct
  rejectValue: string
  rejectOpen: boolean
  isBusy: boolean
  isRemoving: boolean
  onApprove: () => void
  onRejectToggle: () => void
  onRejectValueChange: (value: string) => void
  onRejectConfirm: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article
      className={[
        'candidate-review-card',
        isBusy ? 'candidate-review-card--busy' : '',
        isRemoving ? 'candidate-review-card--removing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="candidate-review-image-frame">
        {candidate.supplier_image_url && !imageFailed ? (
          <img
            alt={candidate.suggested_title || candidate.supplier_name}
            className="candidate-review-image"
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={candidate.supplier_image_url}
          />
        ) : (
          <PlaceholderImage />
        )}
      </div>

      <div className="candidate-review-card-body">
        <div className="candidate-review-card-top">
          <span className={`candidate-review-score ${getScoreClass(candidate.ai_score)}`}>
            {typeof candidate.ai_score === 'number' ? candidate.ai_score : '?'}
          </span>
        </div>

        <h2 className="candidate-review-title">{candidate.suggested_title || candidate.supplier_name}</h2>
        <p className="candidate-review-original">Original: {candidate.supplier_name}</p>

        <p className="candidate-review-pricing">
          {formatCurrency(candidate.supplier_price)} wholesale {'\u2192'} {formatCurrency(candidate.suggested_retail_price)}
        </p>

        <dl className="candidate-review-meta">
          <div>
            <dt>Category</dt>
            <dd>{candidate.supplier_category || 'Uncategorized'}</dd>
          </div>
          <div>
            <dt>Variants</dt>
            <dd>{candidate.variant_count ?? 0}</dd>
          </div>
          <div>
            <dt>Inventory</dt>
            <dd>{candidate.inventory ?? 0}</dd>
          </div>
          <div>
            <dt>Keyword</dt>
            <dd>{candidate.search_keyword || 'N/A'}</dd>
          </div>
        </dl>

        <details className="candidate-review-rationale">
          <summary>AI Rationale</summary>
          <p>{candidate.ai_rationale || 'No rationale provided.'}</p>
        </details>

        {candidate.ai_concerns ? <p className="candidate-review-concerns">{candidate.ai_concerns}</p> : null}

        <div className="candidate-review-actions">
          <button disabled={isBusy} onClick={onApprove} type="button">
            Approve
          </button>
          <button className="secondary" disabled={isBusy} onClick={onRejectToggle} type="button">
            {rejectOpen ? 'Cancel Reject' : 'Reject'}
          </button>
        </div>

        {rejectOpen ? (
          <div className="candidate-review-reject">
            <input
              disabled={isBusy}
              onChange={(event) => onRejectValueChange(event.target.value)}
              placeholder="Optional rejection reason"
              type="text"
              value={rejectValue}
            />
            <button className="danger" disabled={isBusy} onClick={onRejectConfirm} type="button">
              Confirm Reject
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function ReviewClient() {
  const [status, setStatus] = useState<ReviewStatus>('needs_review')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(1)
  const [docs, setDocs] = useState<CandidateProduct[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyIds, setBusyIds] = useState<number[]>([])
  const [removingIds, setRemovingIds] = useState<number[]>([])
  const [rejectOpenIds, setRejectOpenIds] = useState<number[]>([])
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({})
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const visibleIds = useMemo(() => docs.map((doc) => doc.id), [docs])

  useEffect(() => {
    let active = true

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/candidate-products?${buildQueryString(status, page, keyword)}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to load candidates (${response.status})`)
        }

        const data = (await response.json()) as CandidateResponse

        if (!active) {
          return
        }

        setDocs(data.docs)
        setTotalDocs(data.totalDocs)
        setTotalPages(Math.max(data.totalPages, 1))
      } catch (fetchError) {
        if (!active) {
          return
        }

        const message = fetchError instanceof Error ? fetchError.message : 'Failed to load candidates'
        setError(message)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [keyword, page, refreshKey, status])

  const removeCardFromGrid = (id: number) => {
    setRemovingIds((current) => (current.includes(id) ? current : [...current, id]))

    window.setTimeout(() => {
      setDocs((current) => {
        const nextDocs = current.filter((doc) => doc.id !== id)
        setRemovingIds((currentRemoving) => currentRemoving.filter((candidateId) => candidateId !== id))
        setBusyIds((currentBusy) => currentBusy.filter((candidateId) => candidateId !== id))
        setRejectOpenIds((currentOpen) => currentOpen.filter((candidateId) => candidateId !== id))
        setRejectReasons((currentReasons) => {
          const nextReasons = { ...currentReasons }
          delete nextReasons[id]
          return nextReasons
        })

        return nextDocs
      })

      setTotalDocs((current) => {
        const nextTotalDocs = Math.max(0, current - 1)
        const nextTotalPages = Math.max(1, Math.ceil(nextTotalDocs / PAGE_SIZE))

        setTotalPages(nextTotalPages)
        setPage((currentPage) => Math.min(currentPage, nextTotalPages))
        setRefreshKey((currentRefreshKey) => currentRefreshKey + 1)

        return nextTotalDocs
      })
    }, 220)
  }

  const updateCandidateStatus = async (candidate: CandidateProduct, nextStatus: 'approved' | 'rejected', rejectionReason = '') => {
    setBusyIds((current) => (current.includes(candidate.id) ? current : [...current, candidate.id]))

    try {
      const response = await fetch(`/api/candidate-products/${candidate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: nextStatus,
          reviewed_at: new Date().toISOString(),
          ...(nextStatus === 'rejected' ? { rejection_reason: rejectionReason } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update candidate (${response.status})`)
      }

      removeCardFromGrid(candidate.id)
    } catch (updateError) {
      setBusyIds((current) => current.filter((candidateId) => candidateId !== candidate.id))
      const message = updateError instanceof Error ? updateError.message : 'Failed to update candidate'
      window.alert(message)
    }
  }

  const approveAllVisible = async () => {
    if (visibleIds.length === 0) {
      return
    }

    const confirmed = window.confirm(`Approve all ${visibleIds.length} visible candidates?`)

    if (!confirmed) {
      return
    }

    setBatchProgress({
      complete: 0,
      total: visibleIds.length,
    })

    let completed = 0

    await Promise.allSettled(
      docs.map(async (candidate) => {
        await updateCandidateStatus(candidate, 'approved')
        completed += 1
        setBatchProgress({
          complete: completed,
          total: visibleIds.length,
        })
      }),
    )

    setBatchProgress(null)
  }

  return (
    <div className="candidate-review-shell">
      <header className="candidate-review-header">
        <div>
          <h1>Candidate Review</h1>
          <p>{formatNumber(totalDocs)} candidates in this view</p>
        </div>

        <div className="candidate-review-header-actions">
          <label className="candidate-review-filter">
            <span>Keyword</span>
            <input
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setPage(1)
                  setKeyword(keywordInput)
                }
              }}
              placeholder="Filter by search keyword"
              type="text"
              value={keywordInput}
            />
          </label>
          <button
            className="secondary"
            onClick={() => {
              setPage(1)
              setKeyword(keywordInput)
            }}
            type="button"
          >
            Apply Filter
          </button>
          <button disabled={docs.length === 0 || Boolean(batchProgress)} onClick={() => void approveAllVisible()} type="button">
            Approve All Visible
          </button>
        </div>
      </header>

      <nav className="candidate-review-tabs">
        {TABS.map((tab) => (
          <button
            className={tab === status ? 'active' : ''}
            key={tab}
            onClick={() => {
              setStatus(tab)
              setPage(1)
            }}
            type="button"
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {batchProgress ? (
        <p className="candidate-review-progress">
          Approved {batchProgress.complete}/{batchProgress.total}...
        </p>
      ) : null}

      {error ? <p className="candidate-review-error">{error}</p> : null}
      {loading ? <p className="candidate-review-loading">Loading candidates...</p> : null}

      {!loading ? (
        <div className="candidate-review-grid">
          {docs.map((candidate) => (
            <CandidateCard
              candidate={candidate}
              isBusy={busyIds.includes(candidate.id)}
              isRemoving={removingIds.includes(candidate.id)}
              key={candidate.id}
              onApprove={() => void updateCandidateStatus(candidate, 'approved')}
              onRejectConfirm={() => void updateCandidateStatus(candidate, 'rejected', rejectReasons[candidate.id] || '')}
              onRejectToggle={() =>
                setRejectOpenIds((current) =>
                  current.includes(candidate.id) ? current.filter((id) => id !== candidate.id) : [...current, candidate.id],
                )
              }
              onRejectValueChange={(value) => setRejectReasons((current) => ({ ...current, [candidate.id]: value }))}
              rejectOpen={rejectOpenIds.includes(candidate.id)}
              rejectValue={rejectReasons[candidate.id] || ''}
            />
          ))}
        </div>
      ) : null}

      {!loading && docs.length === 0 && !error ? <p className="candidate-review-empty">No candidates match this filter.</p> : null}

      <footer className="candidate-review-pagination">
        <button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} type="button">
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} type="button">
          Next
        </button>
      </footer>
    </div>
  )
}
