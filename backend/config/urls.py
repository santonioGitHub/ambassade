from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

urlpatterns = [
    path("api/", include("accounts.urls")),
    path("api/", include("core.urls")),
    path("api/", include("requerants.urls")),
    path("api/", include("agents.urls")),
    path("api/", include("documents.urls")),
]
# Développement (DEBUG=1) : sert les images téléversées. En production, servez /media avec nginx.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
