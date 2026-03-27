from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
import math

from django.db import transaction
from django.db.models import Avg
from django.utils import timezone

from .models import PerformerProfile, Task, PerformerTaskHistory, RewardTransaction


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


@dataclass(frozen=True)
class RewardResult:
    points: int
    money: Decimal


def compute_reward(task: Task, quality: float, performer_rating: float) -> RewardResult:
    """
    quality: обычно 0..1 (можно дать чуть >1 как бонус, но ограничиваем)
    performer_rating: средняя оценка исполнителя (0..1 или 0..5 — зависит от фронта,
    но формула устойчива за счет clamp).
    """

    q = _clamp(float(quality), 0.0, 1.5)
    r = _clamp(float(performer_rating), 0.0, 5.0)

    # Мягкий бонус “стабильному” исполнителю, но без разгона.
    rating_multiplier = 1.0 + (r / 5.0) * 0.25  # до +25%
    quality_multiplier = q  # 0..1.5

    raw_points = int(round(task.reward_points * quality_multiplier * rating_multiplier))
    raw_money = (task.reward_money * Decimal(str(quality_multiplier)) * Decimal(str(rating_multiplier)))

    money = raw_money.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return RewardResult(points=max(0, raw_points), money=max(Decimal("0.00"), money))


def recompute_rank_score(performer: PerformerProfile) -> float:
    """
    rank_score для ранжирования исполнителей: рейтинг + опыт + стабильность.
    """

    rating_component = _clamp(performer.rating, 0.0, 5.0) / 5.0  # 0..1
    exp_component = math.log1p(max(0, performer.completed_tasks)) / math.log1p(200)  # ~0..1

    recent_avg = (
        PerformerTaskHistory.objects.filter(performer=performer)
        .order_by("-completed_at")
        .values("performer")
        .annotate(avg=Avg("rating"))
        .first()
    )
    recent_component = 0.0
    if recent_avg and recent_avg.get("avg") is not None:
        recent_component = _clamp(float(recent_avg["avg"]), 0.0, 5.0) / 5.0

    score = 0.65 * rating_component + 0.25 * exp_component + 0.10 * recent_component
    performer.rank_score = float(score)
    performer.last_rank_recalc_at = timezone.now()
    performer.save(update_fields=["rank_score", "last_rank_recalc_at"])
    return performer.rank_score


@transaction.atomic
def assign_task(task: Task, performer: PerformerProfile) -> Task:
    task.assigned_to = performer
    task.status = Task.Status.ASSIGNED
    task.save(update_fields=["assigned_to", "status"])
    return task


@transaction.atomic
def complete_task(performer: PerformerProfile, task: Task, quality: float) -> RewardResult:
    # фиксируем статус задачи
    task.is_completed = True
    task.assigned_to = performer
    task.status = Task.Status.COMPLETED
    task.save(update_fields=["is_completed", "assigned_to", "status"])

    # история + пересчет среднего рейтинга
    PerformerTaskHistory.objects.create(
        performer=performer,
        task=task,
        rating=float(quality),
    )

    total = performer.rating * performer.completed_tasks
    performer.completed_tasks += 1
    performer.rating = (total + float(quality)) / performer.completed_tasks

    reward = compute_reward(task=task, quality=quality, performer_rating=performer.rating)

    performer.points_balance += reward.points
    performer.money_balance = (performer.money_balance + reward.money).quantize(Decimal("0.01"))
    performer.save(update_fields=["completed_tasks", "rating", "points_balance", "money_balance"])

    # дополняем последние записи истории начислениями (последняя — та, что создали выше)
    PerformerTaskHistory.objects.filter(performer=performer, task=task).update(
        points_awarded=reward.points,
        money_awarded=reward.money,
    )

    RewardTransaction.objects.create(
        performer=performer,
        task=task,
        kind=RewardTransaction.Kind.EARN,
        points_delta=reward.points,
        money_delta=reward.money,
        reason="Task completed",
        meta={
            "quality": float(quality),
            "task_reward_points": task.reward_points,
            "task_reward_money": str(task.reward_money),
            "rating_after": performer.rating,
        },
    )

    recompute_rank_score(performer)
    return reward

