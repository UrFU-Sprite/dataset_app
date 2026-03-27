import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Button, Card, Empty, notification, Select, Space, Spin, Table, Tag, Typography} from 'antd'
import type {TableColumnsType} from 'antd'
import {useNavigate} from 'react-router-dom'

import {listTasks} from 'api/tasks'
import type {Task, TaskImage} from 'api/types'

import './tasksPage.scss'

function getTaskImages(task: Task): TaskImage[] {
    if (Array.isArray(task.images)) return task.images
    if (task.data?.images) return task.data.images
    return []
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'completed'

function normalizeStatus(raw: Task['status']): StatusFilter | string {
    const s = String(raw ?? '').toLowerCase()
    if (!s) return ''
    if (s === 'open' || s === 'todo' || s === 'new') return 'open'
    if (s === 'in_progress' || s === 'in-progress' || s === 'progress') return 'in_progress'
    if (s === 'completed' || s === 'done' || s === 'success') return 'completed'
    return s
}

function statusTag(status: Task['status']) {
    const normalized = normalizeStatus(status)
    const s = String(normalized)

    if (s === 'open') return <Tag color="blue">Open</Tag>
    if (s === 'in_progress') return <Tag color="processing">In progress</Tag>
    if (s === 'completed') return <Tag color="green">Completed</Tag>
    if (!s) return <Tag>Unknown</Tag>
    return <Tag>{s}</Tag>
}

export default function TasksPage() {
    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [tasks, setTasks] = useState<Task[]>([])
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await listTasks()
            setTasks(res)
        } catch (e: any) {
            notification.error({
                message: 'Failed to load tasks',
                description: e?.message ?? String(e),
            })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const filteredTasks = useMemo(() => {
        if (statusFilter === 'all') return tasks
        return tasks.filter((t) => normalizeStatus(t.status) === statusFilter)
    }, [statusFilter, tasks])

    const columns = useMemo<TableColumnsType<Task>>(
        () => [
            {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                render: (v) => <Typography.Text code>{String(v)}</Typography.Text>,
            },
            {
                title: 'Project',
                dataIndex: 'projectId',
                key: 'projectId',
                render: (v) => (v ? String(v) : '—'),
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (_, record) => statusTag(record.status),
            },
            {
                title: 'Images',
                key: 'images',
                render: (_, record) => <Typography.Text>{getTaskImages(record).length}</Typography.Text>,
            },
            {
                title: '',
                key: 'actions',
                render: (_, record) => (
                    <Button type="primary" onClick={() => navigate(`/tasks/${record.id}`)}>
                        Open
                    </Button>
                ),
            },
        ],
        [navigate],
    )

    return (
        <div className="tasksPage">
            <div className="tasksPage__header">
                <Typography.Title level={3} style={{margin: 0}}>
                    Tasks
                </Typography.Title>

                <Space wrap>
                    <Select<StatusFilter>
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{minWidth: 220}}
                        options={[
                            {value: 'all', label: 'All'},
                            {value: 'open', label: 'Open'},
                            {value: 'in_progress', label: 'In progress'},
                            {value: 'completed', label: 'Completed'},
                        ]}
                    />
                    <Button onClick={() => void load()} loading={loading}>
                        Refresh
                    </Button>
                </Space>
            </div>

            <Card className="tasksPage__card">
                {loading ? (
                    <div style={{padding: 24, display: 'flex', justifyContent: 'center'}}>
                        <Spin />
                    </div>
                ) : filteredTasks.length ? (
                    <Table<Task>
                        rowKey={(t) => String(t.id)}
                        columns={columns}
                        dataSource={filteredTasks}
                        pagination={{pageSize: 10}}
                    />
                ) : (
                    <Empty description="No tasks found" />
                )}
            </Card>
        </div>
    )
}