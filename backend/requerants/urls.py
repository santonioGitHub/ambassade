from rest_framework.routers import SimpleRouter

from .views import RequerantViewSet

router = SimpleRouter()
router.register("requerants", RequerantViewSet, basename="requerant")
urlpatterns = router.urls
