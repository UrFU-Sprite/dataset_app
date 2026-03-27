from .models import Task


def recommend_tasks_for_performer(performer, top_n=5):
    tasks = Task.objects.filter(is_completed=False, status=Task.Status.OPEN, assigned_to__isnull=True)

    # приоритет по категориям
    if performer.preferred_categories:
        tasks = tasks.filter(category__in=performer.preferred_categories)

    # сортировка по награде
    tasks = tasks.order_by("-reward_points", "-reward_money", "id")

    return tasks[:top_n]