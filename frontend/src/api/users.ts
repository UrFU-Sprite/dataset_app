import {apiRequest} from './client'
import type {User} from './types'
import {isMockEnabled, mockGetMe, mockLoginUser, mockRegisterUser} from './mock'

export async function registerUser(payload: {email: string; password: string}): Promise<void> {
    if (isMockEnabled()) return mockRegisterUser(payload)
    await apiRequest<void>('/api/v1/users/register', {method: 'POST', body: payload})
}

type LoginResponse = {
    token?: string
    access_token?: string
    accessToken?: string
    [key: string]: unknown
}

export async function loginUser(payload: {email: string; password: string}): Promise<string> {
    if (isMockEnabled()) return mockLoginUser(payload)

    const res = await apiRequest<LoginResponse>('/api/v1/users/login', {
        method: 'POST',
        body: payload,
    })

    const token = res.token ?? res.access_token ?? res.accessToken
    if (!token || typeof token !== 'string') {
        throw new Error('Backend did not return an auth token')
    }
    return token
}

export async function getMe(): Promise<User> {
    if (isMockEnabled()) return mockGetMe()
    return apiRequest<User>('/api/v1/users/me', {method: 'GET'})
}

