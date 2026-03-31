// frontend/src/api/analytics.ts
import { apiRequest } from './client';

export interface DashboardStatsParams {
  range?: string;
  startDate?: string;
  endDate?: string;
}

export async function getDashboardStats(params?: DashboardStatsParams): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.range) queryParams.append('range', params.range);
  if (params?.startDate) queryParams.append('start_date', params.startDate);
  if (params?.endDate) queryParams.append('end_date', params.endDate);
  
  const url = `/api/v1/analytics/dashboard${queryParams.toString() ? `?${queryParams}` : ''}`;
  return apiRequest<any>(url, { method: 'GET' });
}

export async function getProjectAnalytics(projectId: number): Promise<any> {
  return apiRequest<any>(`/api/v1/analytics/projects/${projectId}`, { method: 'GET' });
}

export async function getWorkerAnalytics(workerId: number): Promise<any> {
  return apiRequest<any>(`/api/v1/analytics/workers/${workerId}`, { method: 'GET' });
}

export async function getQualityMetrics(projectId?: number): Promise<any> {
  const url = projectId 
    ? `/api/v1/analytics/quality?project_id=${projectId}`
    : '/api/v1/analytics/quality';
  return apiRequest<any>(url, { method: 'GET' });
}
