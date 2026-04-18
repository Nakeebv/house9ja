const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status = 500, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Pass explicitly to override; null to suppress; undefined = auto-inject from localStorage */
  token?: string | null
  signal?: AbortSignal
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('rentnaija_token')
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // Auto-inject token from localStorage unless explicitly overridden
  const token = options.token !== undefined ? options.token : getStoredToken()

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: 'no-store',
  })

  const text = await response.text()
  let data: any = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rentnaija_token')
      window.location.href = '/'
      // Throw to halt any further processing in the caller
      throw new ApiError('Session expired', 401, data)
    }

    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`

    throw new ApiError(message, response.status, data)
  }

  return data as T
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE', body }),
}
