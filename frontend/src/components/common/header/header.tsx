import React, {useMemo} from 'react'

import {Button, Layout, Menu, Typography} from 'antd'
import type {MenuProps} from 'antd'
import {useLocation, useNavigate} from 'react-router-dom'
import {logout} from 'auth/logout'
import {useAuth} from 'auth/AuthContext'
import internetIcon from '../../../assets/internet-favicon.svg'

import './styles.scss'

const {Header} = Layout

const navItems: MenuProps['items'] = [
    {key: '/projects', label: 'Projects'},
    {key: '/tasks', label: 'Tasks'},
    {key: '/tasks/new', label: 'Create task'},
]

function AppHeader() {
    const navigate = useNavigate()
    const location = useLocation()
    const {user, clearToken} = useAuth()

    const selectedKeys = useMemo(() => {
        const p = location.pathname
        if (p === '/tasks/new') return ['/tasks/new']
        if (p.startsWith('/projects')) return ['/projects']
        if (p === '/' || p.startsWith('/tasks')) return ['/tasks']
        return []
    }, [location.pathname])

    const onMenuClick: MenuProps['onClick'] = ({key}) => {
        navigate(String(key))
    }

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
                    type="text"
                    className="sprite-header-button sprite-header-logo-btn"
                    onClick={go('/')}
                    aria-label="Dataset App home"
                >
                    <span className="sprite-logo-icon">
                        <img src={internetIcon} alt="" />
                    </span>
                </Button>
                <Menu
                    mode="horizontal"
                    selectedKeys={selectedKeys}
                    items={navItems}
                    onClick={onMenuClick}
                    className="sprite-header-nav-menu"
                />
            </div>
            <div className="sprite-right-header">
                <Typography.Text type="secondary" className="sprite-header-user-email" ellipsis>
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
