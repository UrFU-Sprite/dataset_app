import React, {useCallback} from 'react'
import {Alert, Button, Card, Descriptions, Spin, Typography} from 'antd'

import {useAuth} from 'auth/AuthContext'

import './profilePage.scss'

export default function ProfilePage() {
    const {user, userLoading, refreshUser} = useAuth()

    const onRefresh = useCallback(() => {
        void refreshUser()
    }, [refreshUser])

    return (
        <div className="profilePage">
            <Card className="profilePage__card">
                {userLoading ? (
                    <div style={{padding: 24, display: 'flex', justifyContent: 'center'}}>
                        <Spin />
                    </div>
                ) : user ? (
                    <>
                        <Typography.Title level={3} style={{marginTop: 0}}>
                            Profile
                        </Typography.Title>
                        <Descriptions bordered column={1} size="middle" style={{marginTop: 8}}>
                            <Descriptions.Item label="Email">{user.email ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Username">{user.username ?? '—'}</Descriptions.Item>
                            <Descriptions.Item label="Name">{user.name ?? '—'}</Descriptions.Item>
                        </Descriptions>

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
