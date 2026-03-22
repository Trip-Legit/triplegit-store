const CJ_API_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1'

type CJProductSearchResponse = {
  code: number
  result: boolean
  data?: {
    pageNumber: number
    pageSize: number
    totalRecords: number
    totalPages: number
    content: Array<{
      productList?: CjProduct[] | null
      relatedCategoryList?: unknown[]
      keyWord?: string
      keyWordOld?: string
      [key: string]: unknown
    }>
  } | null
  message?: string
}

export type CjProduct = {
  id: string
  nameEn?: string | null
  sellPrice?: string | number | null
  bigImage?: string | null
  oneCategoryName?: string | null
  twoCategoryName?: string | null
  threeCategoryName?: string | null
  warehouseInventoryNum?: number | null
  [key: string]: unknown
}

export type CjSearchProductsResult = {
  pageNumber: number
  pageSize: number
  totalRecords: number
  totalPages: number
  products: CjProduct[]
  rawResponse: CJProductSearchResponse
}

type CJRefreshResponse = {
  code: number
  result: boolean
  data?: {
    accessToken: string
    refreshToken: string
    createDate: string
  } | null
  message?: string
}

export class CjClient {
  private accessToken: string
  private refreshTokenValue: string

  constructor() {
    this.accessToken = process.env.CJ_ACCESS_TOKEN || ''
    this.refreshTokenValue = process.env.CJ_REFRESH_TOKEN || ''

    if (!this.accessToken) {
      throw new Error('Missing CJ_ACCESS_TOKEN')
    }

    if (!this.refreshTokenValue) {
      throw new Error('Missing CJ_REFRESH_TOKEN')
    }
  }

  async searchProducts(keyword: string, page: number, size: number): Promise<CjSearchProductsResult | null> {
    const response = await this.request<CJProductSearchResponse>(
      `/product/listV2?${new URLSearchParams({
        keyWord: keyword,
        size: String(size),
        page: String(page),
        currency: 'USD',
        features: 'enable_description,enable_category',
        startWarehouseInventory: '20',
      }).toString()}`,
    )

    if (!response?.data) {
      return null
    }

    const products = response.data.content.flatMap((group) => group.productList ?? [])

    return {
      pageNumber: response.data.pageNumber,
      pageSize: response.data.pageSize,
      totalRecords: response.data.totalRecords,
      totalPages: response.data.totalPages,
      products,
      rawResponse: response,
    }
  }

  async refreshToken(): Promise<void> {
    const response = await fetch(`${CJ_API_BASE_URL}/authentication/refreshAccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: this.refreshTokenValue,
      }),
    })

    const body = (await response.json()) as CJRefreshResponse

    if (!response.ok || body.code !== 200 || !body.result || !body.data?.accessToken || !body.data?.refreshToken) {
      console.warn('CJ token refresh failed', {
        httpStatus: response.status,
        code: body.code,
        message: body.message,
      })
      throw new Error('Unable to refresh CJ access token')
    }

    this.accessToken = body.data.accessToken
    this.refreshTokenValue = body.data.refreshToken
    process.env.CJ_ACCESS_TOKEN = body.data.accessToken
    process.env.CJ_REFRESH_TOKEN = body.data.refreshToken
  }

  private async request<T>(path: string, allowRetry = true): Promise<T | null> {
    const response = await fetch(`${CJ_API_BASE_URL}${path}`, {
      headers: {
        'CJ-Access-Token': this.accessToken,
      },
    })

    if (response.status === 401 && allowRetry) {
      await this.refreshToken()
      return this.request<T>(path, false)
    }

    const body = (await response.json()) as { code?: number; result?: boolean; data?: unknown; message?: string }

    if (!response.ok) {
      console.warn('CJ request failed', {
        path,
        httpStatus: response.status,
        code: body.code,
        message: body.message,
      })
      return null
    }

    if (body.code !== 200 || body.result !== true) {
      console.warn('CJ API returned non-success response', {
        path,
        code: body.code,
        message: body.message,
      })
      return null
    }

    return body as T
  }
}
