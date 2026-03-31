import React, {useCallback, useState} from 'react'
import {Button, Card, Form, Input, notification, Space, Typography} from 'antd'
import {useNavigate} from 'react-router-dom'

import {useAuth} from 'auth/AuthContext'

import './authPage.scss'

export default function RegisterPage() {
    const navigate = useNavigate()
    const {register} = useAuth()

    const [submitting, setSubmitting] = useState(false)

    const onFinish = useCallback(
        async (values: {email: string; password: string}) => {
            setSubmitting(true)
            try {
                await register(values)
                notification.success({
                    message: 'Account created',
                    description: 'You are logged in now.',
                })
                navigate('/tasks')
            } catch (e: any) {
                notification.error({
                    message: 'Registration failed',
                    description: e?.message ?? String(e),
                })
            } finally {
                setSubmitting(false)
            }
        },
        [navigate, register],
    )

    return (
        <div className="authPage">
            <Card className="authPage__card">
                <Typography.Title level={3} style={{marginTop: 0}}>
                    Register
                </Typography.Title>

                <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            {required: true, message: 'Please enter your email'},
                            {type: 'email', message: 'Invalid email'},
                        ]}
                    >
                        <Input autoComplete="email" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{required: true, message: 'Please enter your password'}]}
                    >
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>

                    <Space style={{marginTop: 8}}>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {submitting ? 'Creating...' : 'Create account'}
                        </Button>
                        <Button type="link" onClick={() => navigate('/auth/login')} disabled={submitting}>
                            Login
                        </Button>
                    </Space>
                </Form>
            </Card>
        </div>
    )
}

