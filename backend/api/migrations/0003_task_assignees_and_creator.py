from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_taskimage"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="assignees",
            field=models.ManyToManyField(blank=True, related_name="assigned_tasks", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="task",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="created_tasks",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
