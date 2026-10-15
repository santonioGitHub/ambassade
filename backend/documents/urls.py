from rest_framework.routers import SimpleRouter

from .views import DemandeViewSet, DocumentViewSet

router = SimpleRouter()
router.register("documents", DocumentViewSet, basename="document")
router.register("demandes", DemandeViewSet, basename="demande")
urlpatterns = router.urls
