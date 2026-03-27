import {apiRequest} from './client'
import {isMockEnabled, mockGetDashboard} from './mock'

export type DashboardResponse = Record<string, unknown>

export async function getDashboard(): Promise<DashboardResponse> {
    if (isMockEnabled()) return mockGetDashboard()
    return apiRequest<DashboardResponse>('/api/v1/analytics/dashboard', {method: 'GET'})
}

