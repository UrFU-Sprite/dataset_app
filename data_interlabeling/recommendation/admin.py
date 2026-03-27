from django.contrib import admin
from .models import PerformerProfile, Task, PerformerTaskHistory, RewardTransaction

admin.site.register(PerformerProfile)
admin.site.register(Task)
admin.site.register(PerformerTaskHistory)
admin.site.register(RewardTransaction)
