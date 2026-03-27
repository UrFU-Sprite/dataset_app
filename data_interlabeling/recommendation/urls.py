from django.urls import path
from .views import (
    RecommendedTasksView,
    TakeTaskView,
    CompleteTaskView,
    PerformerRatingView,
    PerformerProfileView,
    RewardLedgerView,
)

urlpatterns = [
    path("recommended/<int:performer_id>/", RecommendedTasksView.as_view()),
    path("take/<int:task_id>/<int:performer_id>/", TakeTaskView.as_view()),
    path("complete/<int:task_id>/<int:performer_id>/", CompleteTaskView.as_view()),
    path("rating/<int:performer_id>/", PerformerRatingView.as_view()),
    path("profile/<int:performer_id>/", PerformerProfileView.as_view()),
    path("ledger/<int:performer_id>/", RewardLedgerView.as_view()),
]