import React from 'react'

import {Layout, Button, Typography} from 'antd'
import {useNavigate} from 'react-router-dom'
import {logout} from 'auth/logout'
import {useAuth} from 'auth/AuthContext'
import internetIcon from '../../../assets/internet-favicon.svg'

const {Header} = Layout

function AppHeader() {
    const navigate = useNavigate()
    const {user, clearToken} = useAuth()

    const go = (path: string) => () => navigate(path)

    const onLogout = async () => {
        await logout()
        clearToken()
        navigate('/auth/login')
    }

    return (
        <Header className="sprite-header">
            <div className="sprite-left-header">
                <Button
                    type="link"
                    className="sprite-header-button"
                    onClick={go('/')}
                    aria-label="Dataset App home"
                >
                    <span className="sprite-logo-icon">
                        <img src={internetIcon} alt="Internet logo" />
                    </span>
                </Button>
                <Button type="link" className="sprite-header-button" onClick={go('/projects')}>
                    Projects
                </Button>
                <Button type="link" className="sprite-header-button" onClick={go('/tasks')}>
                    Tasks
                </Button>
                <Button type="link" className="sprite-header-button" onClick={go('/tasks/new')}>
                    Create task
                </Button>
            </div>
            <div className="sprite-right-header">
                <Typography.Text className="sprite-text-color">
                    {user?.email ?? 'Не авторизован'}
                </Typography.Text>
                <Button type="link" className="sprite-header-button" onClick={onLogout}>
                    Logout
                </Button>
            </div>
        </Header>
    )
}

export default AppHeader