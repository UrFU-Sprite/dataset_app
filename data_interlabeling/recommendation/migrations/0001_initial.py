from decimal import Decimal
import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PerformerProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.FloatField(default=0.0)),
                ("completed_tasks", models.IntegerField(default=0)),
                ("preferred_categories", models.JSONField(default=list)),
                ("points_balance", models.IntegerField(default=0)),
                ("money_balance", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("rank_score", models.FloatField(default=0.0)),
                ("last_rank_recalc_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Task",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField()),
                ("category", models.CharField(max_length=100)),
                ("reward_points", models.IntegerField(default=0)),
                ("reward_money", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("status", models.CharField(choices=[("open", "Open"), ("assigned", "Assigned"), ("completed", "Completed")], default="open", max_length=20)),
                ("is_completed", models.BooleanField(default=False)),
                ("assigned_to", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="recommendation.performerprofile")),
            ],
        ),
        migrations.CreateModel(
            name="RewardTransaction",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("kind", models.CharField(choices=[("earn", "Earn"), ("adjust", "Adjust"), ("withdraw", "Withdraw")], max_length=20)),
                ("points_delta", models.IntegerField(default=0)),
                ("money_delta", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("reason", models.CharField(blank=True, default="", max_length=255)),
                ("meta", models.JSONField(blank=True, default=dict)),
                ("performer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reward_transactions", to="recommendation.performerprofile")),
                ("task", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="recommendation.task")),
            ],
        ),
        migrations.CreateModel(
            name="PerformerTaskHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.FloatField(default=0.0)),
                ("completed_at", models.DateTimeField(auto_now_add=True)),
                ("points_awarded", models.IntegerField(default=0)),
                ("money_awarded", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("performer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="recommendation.performerprofile")),
                ("task", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="recommendation.task")),
            ],
        ),
    ]

