import {apiRequest} from './client'
import {isMockEnabled, mockGetWallet} from './mock'

export type WalletResponse = Record<string, unknown> & {
    balance?: number
    currency?: string
}

export async function getWallet(): Promise<WalletResponse> {
    if (isMockEnabled()) return mockGetWallet()
    return apiRequest<WalletResponse>('/api/v1/finance/wallet', {method: 'GET'})
}

