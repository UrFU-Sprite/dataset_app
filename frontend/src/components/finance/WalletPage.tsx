import React, {useCallback, useEffect, useState} from 'react'
import {Alert, Card, notification, Space, Spin, Statistic, Typography} from 'antd'
import {getWallet} from 'api/finance'
import type {WalletResponse} from 'api/finance'

import './walletPage.scss'

export default function WalletPage() {
    const [loading, setLoading] = useState(false)
    const [wallet, setWallet] = useState<WalletResponse | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getWallet()
            setWallet(res)
        } catch (e: any) {
            notification.error({
                message: 'Failed to load wallet',
                description: e?.message ?? String(e),
            })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void load()
    }, [load])

    return (
        <div className="walletPage">
            <Typography.Title level={3} style={{margin: 0}}>
                Wallet
            </Typography.Title>

            <Card className="walletPage__card" loading={loading}>
                {loading ? (
                    <div style={{padding: 24, display: 'flex', justifyContent: 'center'}}>
                        <Spin />
                    </div>
                ) : wallet ? (
                    <Space direction="vertical" size={12}>
                        <Statistic
                            title="Balance"
                            value={typeof wallet.balance === 'number' ? wallet.balance : 0}
                            precision={2}
                            suffix={wallet.currency ?? ''}
                        />
                        {Object.keys(wallet).length > 2 && (
                            <Alert
                                type="info"
                                showIcon
                                message="Wallet details"
                                description="Backend may provide additional fields."
                            />
                        )}
                    </Space>
                ) : (
                    <Alert type="warning" showIcon message="No wallet data" />
                )}
            </Card>
        </div>
    )
}

