from django.conf import settings
from django.db import models


class Profile(models.Model):
    ROLES = (("ADMIN", "Administrateur"), ("AGENT", "Agent"))
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLES, default="AGENT")
    agent = models.ForeignKey("agents.AgentModel", on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.user} ({self.role})"
