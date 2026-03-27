from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import uuid

class PerformerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    rating = models.FloatField(default=0.0)
    completed_tasks = models.IntegerField(default=0)
    preferred_categories = models.JSONField(default=list)  # для персонализации
    points_balance = models.IntegerField(default=0)
    money_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    rank_score = models.FloatField(default=0.0)
    last_rank_recalc_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.user.username


class Task(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ASSIGNED = "assigned", "Assigned"
        COMPLETED = "completed", "Completed"

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    reward_points = models.IntegerField(default=0)
    reward_money = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    assigned_to = models.ForeignKey(PerformerProfile, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class PerformerTaskHistory(models.Model):
    performer = models.ForeignKey(PerformerProfile, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    rating = models.FloatField(default=0.0)  # оценка качества выполнения
    completed_at = models.DateTimeField(auto_now_add=True)
    points_awarded = models.IntegerField(default=0)
    money_awarded = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))


class RewardTransaction(models.Model):
    """
    Прозрачный журнал начислений/списаний, чтобы можно было показать пользователю:
    за что и когда начислили баллы/деньги.
    """

    class Kind(models.TextChoices):
        EARN = "earn", "Earn"
        ADJUST = "adjust", "Adjust"
        WITHDRAW = "withdraw", "Withdraw"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    performer = models.ForeignKey(PerformerProfile, on_delete=models.CASCADE, related_name="reward_transactions")
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    points_delta = models.IntegerField(default=0)
    money_delta = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(default=timezone.now)
    reason = models.CharField(max_length=255, blank=True, default="")
    meta = models.JSONField(default=dict, blank=True)