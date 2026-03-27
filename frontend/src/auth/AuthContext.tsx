import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import type {User} from 'api/types'
import {getMe, loginUser, registerUser} from 'api/users'

const TOKEN_KEY = 'dataset_app_token'

type AuthContextValue = {
    token: string | null
    user: User | null
    userLoading: boolean
    login: (payload: {email: string; password: string}) => Promise<void>
    register: (payload: {email: string; password: string}) => Promise<void>
    clearToken: () => void
    setToken: (token: string | null) => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY)
    } catch {
        return null
    }
}

export function AuthProvider({children}: {children: React.ReactNode}) {
    const navigate = useNavigate()

    const [token, setTokenState] = useState<string | null>(() => readToken())
    const [user, setUser] = useState<User | null>(null)
    const [userLoading, setUserLoading] = useState(false)

    const setToken = useCallback((next: string | null) => {
        setTokenState(next)
        try {
            if (next) localStorage.setItem(TOKEN_KEY, next)
            else localStorage.removeItem(TOKEN_KEY)
        } catch {
            // ignore
        }
    }, [])

    const clearToken = useCallback(() => {
        setToken(null)
        setUser(null)
    }, [setToken])

    const refreshUser = useCallback(async () => {
        if (!token) return
        setUserLoading(true)
        try {
            const me = await getMe()
            setUser(me)
        } finally {
            setUserLoading(false)
        }
    }, [token])

    const login = useCallback(async (payload: {email: string; password: string}) => {
        const nextToken = await loginUser(payload)
        setToken(nextToken)
        await refreshUser()
    }, [refreshUser, setToken])

    const register = useCallback(async (payload: {email: string; password: string}) => {
        await registerUser(payload)
        await login(payload)
    }, [login])

    useEffect(() => {
        // If the backend returned 401, we need to invalidate auth state.
        const handler = () => {
            clearToken()
            navigate('/auth/login')
        }
        window.addEventListener('auth:unauthorized', handler)
        return () => window.removeEventListener('auth:unauthorized', handler)
    }, [clearToken, navigate])

    useEffect(() => {
        // Keep user in sync after refresh / page reload.
        if (token) refreshUser().catch(() => {
            // If `/me` fails, treat it as auth issue.
            clearToken()
            navigate('/auth/login')
        })
    }, [token, refreshUser, clearToken, navigate])

    const value = useMemo<AuthContextValue>(() => ({
        token,
        user,
        userLoading,
        login,
        register,
        clearToken,
        setToken,
        refreshUser,
    }), [clearToken, login, register, refreshUser, token, user, userLoading, setToken])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

