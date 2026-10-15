from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AgentViewSet, FonctionViewSet, annuaire

router = SimpleRouter()
router.register("agents", AgentViewSet, basename="agent")
router.register("fonctions", FonctionViewSet, basename="fonction")
# « annuaire/ » doit passer avant la route agents/<id>/
urlpatterns = [path("agents/annuaire/", annuaire)] + router.urls
