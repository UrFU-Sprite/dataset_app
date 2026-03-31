import {ApiError} from './types'

const TOKEN_KEY = 'dataset_app_token'

const API_BASE_URL = (() => {
    // If you run behind a reverse proxy and keep `/api` under the same origin,
    // leave it as an empty string.
    const fromWindow = (window as any).__DATASET_APP_API_BASE_URL__
    if (typeof fromWindow === 'string') return fromWindow
    return ''
})()

function getToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY)
    } catch {
        return null
    }
}

function getJsonOrText(res: Response): Promise<unknown> {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) return res.json()
    return res.text()
}

export async function apiRequest<T>(
    path: string,
    options?: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
        body?: unknown
        token?: string | null
        signal?: AbortSignal
    },
): Promise<T> {
    const method = options?.method ?? 'GET'
    const token = options?.token ?? getToken()

    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    if (options?.body !== undefined) headers['Content-Type'] = 'application/json'

    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options?.signal,
    })

    if (res.status === 401) {
        window.dispatchEvent(new Event('auth:unauthorized'))
    }

    if (!res.ok) {
        const payload = await getJsonOrText(res)
        throw new ApiError(res.status, 'Request failed', payload)
    }

    // 204 No Content
    if (res.status === 204) return undefined as T

    const payload = await getJsonOrText(res)
    return payload as T
}

