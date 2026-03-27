import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
    Alert,
    Button,
    Card,
    Image,
    Input,
    Modal,
    notification,
    Space,
    Spin,
    Tag,
    Typography,
} from 'antd'
import {useNavigate, useParams} from 'react-router-dom'

import type {Id, Task, TaskImage} from 'api/types'
import {listTasks, submitTask} from 'api/tasks'

import './taskDetailPage.scss'

function getTaskImages(task: Task | null | undefined): TaskImage[] {
    if (!task) return []
    if (Array.isArray(task.images)) return task.images
    if (task.data?.images) return task.data.images
    return []
}

function statusTag(status: Task['status']) {
    const s = String(status ?? '').toLowerCase()
    if (s === 'open' || s === 'todo' || s === 'new') return <Tag color="blue">Open</Tag>
    if (s === 'in_progress' || s === 'in-progress' || s === 'progress') return <Tag color="processing">In progress</Tag>
    if (s === 'completed' || s === 'done' || s === 'success') return <Tag color="green">Completed</Tag>
    if (!s) return <Tag>Unknown</Tag>
    return <Tag>{s}</Tag>
}

function captionKey(img: TaskImage): string {
    if (img.id !== undefined && img.id !== null) return String(img.id)
    return img.url
}

export default function TaskDetailPage() {
    const navigate = useNavigate()
    const params = useParams()
    const taskId = params.taskId as Id | undefined

    const [loading, setLoading] = useState(false)
    const [task, setTask] = useState<Task | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const images = useMemo(() => getTaskImages(task), [task])

    const [captions, setCaptions] = useState<Record<string, string>>({})

    const load = useCallback(async () => {
        if (taskId === undefined) return
        setLoading(true)
        setError(null)
        try {
            const res = await listTasks()
            const found = res.find((t) => String(t.id) === String(taskId)) ?? null
            if (!found) {
                setTask(null)
                setError('Task not found')
                return
            }
            setTask(found)
        } catch (e: any) {
            setError(e?.message ?? String(e))
            setTask(null)
        } finally {
            setLoading(false)
        }
    }, [taskId])

    useEffect(() => {
        void load()
    }, [load])

    // Initialize caption editor state once task is loaded.
    useEffect(() => {
        if (!task) return
        const next: Record<string, string> = {}
        for (const img of getTaskImages(task)) {
            next[captionKey(img)] = img.caption ?? ''
        }
        setCaptions(next)
    }, [task])

    const onChangeCaption = useCallback((img: TaskImage, value: string) => {
        const key = captionKey(img)
        setCaptions((prev) => ({...prev, [key]: value}))
    }, [])

    const onSubmit = useCallback(async () => {
        if (taskId === undefined) return
        const submitImages = images.map((img) => ({
            id: img.id,
            url: img.url,
            caption: captions[captionKey(img)] ?? '',
        }))

        setSubmitting(true)
        try {
            await submitTask({id: taskId, taskId, images: submitImages})
            notification.success({
                message: 'Submitted',
                description: 'Your captions were sent to the backend.',
            })
            navigate('/tasks')
        } catch (e: any) {
            notification.error({
                message: 'Failed to submit',
                description: e?.message ?? String(e),
            })
        } finally {
            setSubmitting(false)
        }
    }, [captions, images, navigate, taskId])

    const confirmSubmit = useCallback(() => {
        Modal.confirm({
            title: 'Submit captions?',
            content: 'After submission, the task will be marked as completed (backend behavior).',
            okText: 'Submit',
            cancelText: 'Cancel',
            onOk: () => void onSubmit(),
        })
    }, [onSubmit])

    if (loading) {
        return (
            <div className="taskDetailPage">
                <div className="taskDetailPage__center">
                    <Spin />
                </div>
            </div>
        )
    }

    if (error || !task) {
        return (
            <div className="taskDetailPage">
                <Alert
                    type="error"
                    showIcon
                    message="Cannot open task"
                    description={error ?? 'Unknown error'}
                />
                <div style={{marginTop: 16}}>
                    <Button onClick={() => navigate('/tasks')}>Back to tasks</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="taskDetailPage">
            <div className="taskDetailPage__header">
                <div>
                    <Typography.Title level={3} style={{margin: 0}}>
                        Task #{String(task.id)}
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Project: {task.projectId ? String(task.projectId) : '—'}
                    </Typography.Text>
                </div>
                <div>{statusTag(task.status)}</div>
            </div>

            <Card className="taskDetailPage__card">
                {images.length ? (
                    <>
                        <Typography.Text type="secondary">
                            Add captions for each image below.
                        </Typography.Text>

                        <div className="taskDetailPage__grid">
                            {images.map((img) => {
                                const key = captionKey(img)
                                return (
                                    <div key={key} className="taskDetailPage__item">
                                        <div className="taskDetailPage__image">
                                            <Image src={img.url} width="100%" alt="task image" />
                                        </div>
                                        <div className="taskDetailPage__caption">
                                            <Typography.Text>Caption</Typography.Text>
                                            <Input.TextArea
                                                rows={3}
                                                value={captions[key] ?? ''}
                                                onChange={(e) => onChangeCaption(img, e.target.value)}
                                                placeholder="Describe what is in the image..."
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <Space style={{marginTop: 16}}>
                            <Button onClick={() => navigate('/tasks')} disabled={submitting}>
                                Back
                            </Button>
                            <Button type="primary" onClick={confirmSubmit} loading={submitting} disabled={!images.length}>
                                Submit captions
                            </Button>
                        </Space>
                    </>
                ) : (
                    <div>
                        <Alert
                            type="warning"
                            showIcon
                            message="No images in this task"
                            description="Backend returned an empty task."
                        />
                        <div style={{marginTop: 16}}>
                            <Button onClick={() => navigate('/tasks')}>Back to tasks</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}

