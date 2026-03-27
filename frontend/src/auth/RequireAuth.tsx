import React from 'react'
import {Navigate} from 'react-router-dom'
import {useAuth} from 'auth/AuthContext'
import {Spin} from 'antd'

export default function RequireAuth({children}: {children: React.ReactNode}) {
    const {token, userLoading} = useAuth()

    if (!token) {
        return <Navigate to="/auth/login" replace />
    }

    if (userLoading) {
        return (
            <div style={{padding: 24}}>
                <Spin />
            </div>
        )
    }

    return <>{children}</>
}

