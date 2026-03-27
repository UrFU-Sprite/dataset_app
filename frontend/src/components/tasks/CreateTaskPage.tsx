import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
    Button,
    Card,
    Form,
    Image,
    Input,
    notification,
    Select,
    Space,
    Spin,
    Typography,
} from 'antd'
import {useNavigate} from 'react-router-dom'

import type {Id, Project} from 'api/types'
import {createTask, type CreateTaskPayload} from 'api/tasks'
import {listProjects} from 'api/projects'

import './createTaskPage.scss'

function parseLines(text: string): string[] {
    return text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
}

export default function CreateTaskPage() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState<Project[]>([])
    const [projectsLoading, setProjectsLoading] = useState(false)

    const [submitting, setSubmitting] = useState(false)
    const [imageUrlsText, setImageUrlsText] = useState('')
    const imageUrls = useMemo(() => parseLines(imageUrlsText), [imageUrlsText])

    const loadProjects = useCallback(async () => {
        setProjectsLoading(true)
        try {
            const res = await listProjects()
            setProjects(res)
        } catch (e: any) {
            notification.error({
                message: 'Failed to load projects',
                description: e?.message ?? String(e),
            })
        } finally {
            setProjectsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadProjects()
    }, [loadProjects])

    const onFinish = useCallback(
        async (values: {projectId?: Id; assigneesText: string}) => {
            const assignees = parseLines(values.assigneesText)
            if (!assignees.length) {
                notification.warning({
                    message: 'Assignees are required',
                    description: 'Add at least one user email (one per line).',
                })
                return
            }

            if (!imageUrls.length) {
                notification.warning({
                    message: 'Images are required',
                    description: 'Add at least one image URL.',
                })
                return
            }

            setSubmitting(true)
            try {
                const payload: CreateTaskPayload = {
                    projectId: values.projectId,
                    assignees,
                    images: imageUrls.map((url) => ({url})),
                    imageUrls,
                }

                await createTask(payload)
                notification.success({
                    message: 'Task created',
                    description: 'Users can now start adding captions to images.',
                })
                navigate('/tasks')
            } catch (e: any) {
                notification.error({
                    message: 'Failed to create task',
                    description: e?.message ?? String(e),
                })
            } finally {
                setSubmitting(false)
            }
        },
        [imageUrls, navigate],
    )

    return (
        <div className="createTaskPage">
            <Typography.Title level={3} style={{margin: 0}}>
                Create task
            </Typography.Title>

            <Card className="createTaskPage__card" loading={projectsLoading}>
                <Form
                    layout="vertical"
                    requiredMark={false}
                    onFinish={onFinish}
                    initialValues={{projectId: undefined, assigneesText: ''}}
                >
                    <Form.Item label="Project" name="projectId">
                        <Select
                            placeholder="Select a project (optional)"
                            allowClear
                            options={projects.map((p) => ({
                                value: p.id as any,
                                label: p.name ?? String(p.id),
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Assignees (emails / user ids)"
                        name="assigneesText"
                        rules={[
                            {required: true, message: 'Add at least one assignee (one per line)'},
                        ]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder={'user1@example.com\nuser2@example.com'}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Image URLs (one per line)"
                        required
                        validateStatus={imageUrlsText.trim().length ? undefined : 'error'}
                        help={!imageUrlsText.trim().length ? 'Add at least one image URL' : undefined}
                    >
                        <Input.TextArea
                            rows={6}
                            value={imageUrlsText}
                            onChange={(e) => setImageUrlsText(e.target.value)}
                            placeholder={'https://example.com/image1.jpg\nhttps://example.com/image2.jpg'}
                        />
                    </Form.Item>

                    {imageUrls.length > 0 && (
                        <>
                            <Typography.Text type="secondary">Preview</Typography.Text>
                            <div className="createTaskPage__preview">
                                {imageUrls.slice(0, 8).map((url) => (
                                    <div key={url} className="createTaskPage__preview-item">
                                        <Image
                                            src={url}
                                            width={120}
                                            height={120}
                                            style={{objectFit: 'cover'}}
                                            alt="task image preview"
                                            preview={false}
                                        />
                                    </div>
                                ))}
                                {imageUrls.length > 8 && (
                                    <div className="createTaskPage__preview-more">
                                        +{imageUrls.length - 8} more
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <Space style={{marginTop: 16}}>
                        <Button onClick={() => navigate('/tasks')} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {submitting ? 'Creating...' : 'Create task'}
                        </Button>
                    </Space>
                    {imageUrls.length === 0 && <div style={{height: 1}} />}
                </Form>
            </Card>

            {submitting && (
                <div style={{position: 'fixed', inset: 0, pointerEvents: 'none'}}>
                    <Spin spinning={true} />
                </div>
            )}
        </div>
    )
}

