from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path("api/", include("accounts.urls")),
    path("api/", include("core.urls")),
    path("api/", include("requerants.urls")),
    path("api/", include("agents.urls")),
    path("api/", include("documents.urls")),
]
# Développement (DEBUG=1) : sert les images téléversées.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if not settings.DEBUG:
    # Démo sur Render : Django sert /media lui-même. Pour une vraie production, préférez
    # un stockage persistant (disque Render, S3...) servi par le serveur web.
    urlpatterns += [re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT})]
