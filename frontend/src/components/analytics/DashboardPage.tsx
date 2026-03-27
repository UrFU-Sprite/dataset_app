import React, {useCallback, useEffect, useState} from 'react'
import {Card, notification, Space, Spin, Statistic, Typography} from 'antd'
import type {DashboardResponse} from 'api/analytics'
import {getDashboard} from 'api/analytics'

import './dashboardPage.scss'

export default function DashboardPage() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<DashboardResponse | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getDashboard()
            setData(res)
        } catch (e: any) {
            notification.error({
                message: 'Failed to load dashboard',
                description: e?.message ?? String(e),
            })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const total = Number((data as any)?.total ?? 0)
    const completed = Number((data as any)?.completed ?? 0)
    const open = Number((data as any)?.open ?? 0)

    return (
        <div className="dashboardPage">
            <Typography.Title level={3} style={{margin: 0}}>
                Analytics dashboard
            </Typography.Title>

            <Card className="dashboardPage__card" loading={loading}>
                {loading ? (
                    <div style={{padding: 24, display: 'flex', justifyContent: 'center'}}>
                        <Spin />
                    </div>
                ) : (
                    <Space direction="vertical" size={16}>
                        <Space size={16} wrap>
                            <Statistic title="Total tasks" value={total} />
                            <Statistic title="Completed tasks" value={completed} />
                            <Statistic title="Open tasks" value={open} />
                        </Space>
                        <Typography.Text type="secondary">
                            {typeof (data as any)?.label === 'string' ? (data as any).label : '—'}
                        </Typography.Text>
                    </Space>
                )}
            </Card>
        </div>
    )
}

