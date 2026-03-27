import React from 'react'
import {Navigate, Route, Routes} from 'react-router-dom'

import AppHeader from './common/header/header'
import {AuthProvider} from 'auth/AuthContext'
import TasksPage from './tasks/TasksPage'
import LoginPage from './users/LoginPage'
import RegisterPage from './users/RegisterPage'
import ProfilePage from './users/ProfilePage'
import ProjectsPage from './projects/ProjectsPage'
import CreateTaskPage from './tasks/CreateTaskPage'
import TaskDetailPage from './tasks/TaskDetailPage'
import WalletPage from './finance/WalletPage'
import DashboardPage from './analytics/DashboardPage'
import RequireAuth from 'auth/RequireAuth'

import '../styles.scss'

export default function () {
    return (
        <AuthProvider>
            <AppHeader/>
            <Routes>
                <Route path="/" element={
                    <RequireAuth>
                        <TasksPage />
                    </RequireAuth>
                }/>
                <Route path="/tasks" element={
                    <RequireAuth>
                        <TasksPage />
                    </RequireAuth>
                }/>
                <Route path="/tasks/new" element={
                    <RequireAuth>
                        <CreateTaskPage />
                    </RequireAuth>
                }/>
                <Route path="/tasks/:taskId" element={
                    <RequireAuth>
                        <TaskDetailPage />
                    </RequireAuth>
                }/>

                <Route path="/projects" element={
                    <RequireAuth>
                        <ProjectsPage />
                    </RequireAuth>
                }/>

                <Route path="/profile" element={
                    <RequireAuth>
                        <ProfilePage />
                    </RequireAuth>
                }/>

                <Route path="/finance/wallet" element={
                    <RequireAuth>
                        <WalletPage />
                    </RequireAuth>
                }/>

                <Route path="/analytics/dashboard" element={
                    <RequireAuth>
                        <DashboardPage />
                    </RequireAuth>
                }/>

                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                <Route path="/auth/me" element={
                    <RequireAuth>
                        <ProfilePage />
                    </RequireAuth>
                }/>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    )
}