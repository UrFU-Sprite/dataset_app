import React, {useCallback} from 'react'
import {Alert, Button, Card, Spin, Space, Typography} from 'antd'

import {useAuth} from 'auth/AuthContext'

export default function ProfilePage() {
    const {user, userLoading, refreshUser} = useAuth()

    const onRefresh = useCallback(() => {
        void refreshUser()
    }, [refreshUser])

    return (
        <div style={{padding: 16, height: '100%'}}>
            <Card>
                {userLoading ? (
                    <div style={{padding: 24, display: 'flex', justifyContent: 'center'}}>
                        <Spin />
                    </div>
                ) : user ? (
                    <>
                        <Typography.Title level={3} style={{marginTop: 0}}>
                            Profile
                        </Typography.Title>
                        <Space direction="vertical" size={8}>
                            <Typography.Text>
                                <b>Email:</b> {user.email ?? '—'}
                            </Typography.Text>
                            <Typography.Text>
                                <b>Username:</b> {user.username ?? '—'}
                            </Typography.Text>
                            <Typography.Text>
                                <b>Name:</b> {user.name ?? '—'}
                            </Typography.Text>
                        </Space>

                        <div style={{marginTop: 16}}>
                            <Button onClick={onRefresh} disabled={userLoading}>
                                Refresh
                            </Button>
                        </div>
                    </>
                ) : (
                    <Alert type="warning" showIcon message="No profile data" description="User is not loaded yet." />
                )}
            </Card>
        </div>
    )
}

