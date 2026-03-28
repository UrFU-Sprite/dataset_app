import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Button, Card, Form, Input, notification, Space, Spin, Table, Typography} from 'antd'
import type {TableColumnsType} from 'antd'
import {createProject, listProjects} from 'api/projects'
import type {Project} from 'api/types'

import './projectsPage.scss'

export default function ProjectsPage() {
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<Project[]>([])

    const [submitting, setSubmitting] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await listProjects()
            setProjects(res)
        } catch (e: any) {
            notification.error({
                message: 'Failed to load projects',
                description: e?.message ?? String(e),
            })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    const columns = useMemo<TableColumnsType<Project>>(
        () => [
            {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                render: (v) => <Typography.Text code>{String(v)}</Typography.Text>,
            },
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: (v) => (v ? String(v) : '—'),
            },
            {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                render: (v) => (v ? <span>{String(v)}</span> : '—'),
            },
        ],
        [],
    )

    const onFinish = useCallback(
        async (values: {name: string; description?: string}) => {
            setSubmitting(true)
            try {
                await createProject(values)
                notification.success({message: 'Project created'})
                await load()
            } catch (e: any) {
                notification.error({
                    message: 'Failed to create project',
                    description: e?.message ?? String(e),
                })
            } finally {
                setSubmitting(false)
            }
        },
        [load],
    )

    return (
        <div className="projectsPage">
            <div className="projectsPage__header">
                <Typography.Title level={3} style={{margin: 0}}>
                    Projects
                </Typography.Title>
                <Button onClick={() => void load()} loading={loading}>
                    Refresh
                </Button>
            </div>

            <div className="projectsPage__grid">
                <Card className="projectsPage__card">
                    <Typography.Text strong>Create project</Typography.Text>
                    <Form
                        layout="vertical"
                        requiredMark={false}
                        onFinish={onFinish}
                        style={{marginTop: 12}}
                    >
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[{required: true, message: 'Please enter name'}]}
                        >
                            <Input placeholder="Project name" />
                        </Form.Item>
                        <Form.Item label="Description" name="description">
                            <Input.TextArea rows={3} placeholder="Optional description" />
                        </Form.Item>

                        <Space>
                            <Button htmlType="submit" type="primary" loading={submitting}>
                                {submitting ? 'Creating...' : 'Create'}
                            </Button>
                        </Space>
                    </Form>
                </Card>

                <Card className="projectsPage__card" loading={loading}>
                    <Typography.Text strong style={{display: 'block', marginBottom: 12}}>
                        List
                    </Typography.Text>
                    {loading ? (
                        <div style={{padding: 24, display: 'flex', justifyContent: 'center'}}>
                            <Spin />
                        </div>
                    ) : (
                        <Table<Project>
                            rowKey={(p) => String(p.id)}
                            columns={columns}
                            dataSource={projects}
                            pagination={{pageSize: 8, showSizeChanger: false}}
                            bordered
                            size="middle"
                        />
                    )}
                </Card>
            </div>
        </div>
    )
}

