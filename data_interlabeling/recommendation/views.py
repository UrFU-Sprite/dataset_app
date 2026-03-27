from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import PerformerProfile, Task
from .serializers import TaskSerializer, RewardTransactionSerializer, PerformerProfileSerializer
from .recommendation import recommend_tasks_for_performer
from .services import complete_task, assign_task, recompute_rank_score


class RecommendedTasksView(APIView):
    def get(self, request, performer_id):
        performer = PerformerProfile.objects.get(id=performer_id)
        tasks = recommend_tasks_for_performer(performer)

        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


class TakeTaskView(APIView):
    def post(self, request, task_id, performer_id):
        task = Task.objects.get(id=task_id)
        performer = PerformerProfile.objects.get(id=performer_id)

        assign_task(task, performer)

        return Response({"status": "task assigned"})


class CompleteTaskView(APIView):
    def post(self, request, task_id, performer_id):
        quality = float(request.data.get("quality", 1.0))

        task = Task.objects.get(id=task_id)
        performer = PerformerProfile.objects.get(id=performer_id)

        reward = complete_task(performer, task, quality)

        return Response(
            {"status": "task completed", "reward": {"points": reward.points, "money": str(reward.money)}}
        )


class PerformerRatingView(APIView):
    def get(self, request, performer_id):
        performer = PerformerProfile.objects.get(id=performer_id)

        return Response({
            "rating": performer.rating,
            "completed_tasks": performer.completed_tasks,
            "rank_score": performer.rank_score,
            "points_balance": performer.points_balance,
            "money_balance": str(performer.money_balance),
        })


class PerformerProfileView(APIView):
    def get(self, request, performer_id):
        performer = PerformerProfile.objects.get(id=performer_id)
        # на всякий случай актуализируем rank_score перед выдачей
        recompute_rank_score(performer)
        return Response(PerformerProfileSerializer(performer).data)


class RewardLedgerView(APIView):
    def get(self, request, performer_id):
        performer = PerformerProfile.objects.get(id=performer_id)
        qs = performer.reward_transactions.order_by("-created_at")[:200]
        return Response(RewardTransactionSerializer(qs, many=True).data)