from django.urls import path

from . import views

urlpatterns = [
    path("login/", views.login),
    path("logout/", views.logout),
    path("meta/", views.meta),
    path("users/", views.users),
    path("users/<int:pk>/", views.user_detail),
]
