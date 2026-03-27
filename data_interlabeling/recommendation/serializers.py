from rest_framework import serializers
from .models import Task, PerformerProfile, PerformerTaskHistory, RewardTransaction


class PerformerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformerProfile
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"


class PerformerTaskHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformerTaskHistory
        fields = "__all__"


class RewardTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardTransaction
        fields = "__all__"