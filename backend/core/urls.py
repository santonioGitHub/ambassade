from django.urls import path

from . import views

urlpatterns = [
    path("branding/", views.branding),
    path("dashboard/", views.dashboard),
    path("settings/", views.app_settings),
    path("settings/logo/", views.logo),
]
