from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TaskImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("url", models.URLField()),
                ("caption", models.TextField(blank=True, default="")),
                ("task", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="api.task")),
            ],
        ),
    ]
