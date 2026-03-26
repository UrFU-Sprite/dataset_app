from __future__ import annotations

import random
from datetime import datetime
from typing import Any, Dict, List, Optional

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import Transaction, Wallet, postgres_manager
from app.models.schemas import TransactionCreate, TransactionResponse, TransactionStatus, TransactionType


class FinanceService:
    """Wallet + transaction ledger (payment gateway integration is stubbed)."""

    async def _get_wallet(self, session: AsyncSession, user_id: int) -> Wallet:
        result = await session.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = result.scalar_one_or_none()
        if wallet is None:
            wallet = Wallet(user_id=user_id, balance=0.0)
            session.add(wallet)
            await session.flush()
        return wallet

    async def deposit(self, data: TransactionCreate, user_id: int) -> TransactionResponse:
        if data.type != TransactionType.DEPOSIT:
            raise ValueError("Invalid transaction type for deposit")

        # Payment gateway stub (pretend we contacted an external provider).
        gateway_ref = random.randint(100000, 999999)

        session = await postgres_manager.get_session()
        try:
            wallet = await self._get_wallet(session, user_id)
            wallet.balance = float(wallet.balance) + float(data.amount)

            tx = Transaction(
                user_id=user_id,
                amount=float(data.amount),
                type=data.type.value,
                status=TransactionStatus.COMPLETED.value,
                reference_id=gateway_ref,
                created_at=datetime.utcnow(),
            )
            session.add(tx)
            await session.commit()

            return TransactionResponse(
                id=tx.id,
                user_id=user_id,
                amount=tx.amount,
                type=TransactionType.DEPOSIT,
                status=TransactionStatus.COMPLETED,
                reference_id=tx.reference_id,
                created_at=tx.created_at,
            )
        finally:
            await session.close()

    async def bonus(self, amount: float, user_id: int, reference_id: Optional[int] = None) -> TransactionResponse:
        """Award bonus for verified/high-quality task (gateway is stubbed)."""
        session = await postgres_manager.get_session()
        try:
            wallet = await self._get_wallet(session, user_id)
            wallet.balance = float(wallet.balance) + float(amount)

            tx = Transaction(
                user_id=user_id,
                amount=float(amount),
                type=TransactionType.BONUS.value,
                status=TransactionStatus.COMPLETED.value,
                reference_id=reference_id,
                created_at=datetime.utcnow(),
            )
            session.add(tx)
            await session.commit()

            return TransactionResponse(
                id=tx.id,
                user_id=user_id,
                amount=tx.amount,
                type=TransactionType.BONUS,
                status=TransactionStatus.COMPLETED,
                reference_id=tx.reference_id,
                created_at=tx.created_at,
            )
        finally:
            await session.close()

    async def list_transactions(self, user_id: int, skip: int = 0, limit: int = 50) -> List[TransactionResponse]:
        session = await postgres_manager.get_session()
        try:
            result = await session.execute(
                select(Transaction)
                .where(Transaction.user_id == user_id)
                .order_by(Transaction.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            txs = result.scalars().all()
        finally:
            await session.close()

        resp: List[TransactionResponse] = []
        for tx in txs:
            # Map stored strings back to enums.
            tx_type = TransactionType(tx.type)
            tx_status = TransactionStatus(tx.status)
            resp.append(
                TransactionResponse(
                    id=tx.id,
                    user_id=tx.user_id,
                    amount=float(tx.amount),
                    type=tx_type,
                    status=tx_status,
                    reference_id=tx.reference_id,
                    created_at=tx.created_at,
                )
            )
        return resp

