import re

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import AdminDeleteMixin

from .models import RequerantModel
from .serializers import RequerantSerializer


class Page(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class RequerantViewSet(AdminDeleteMixin, viewsets.ModelViewSet):
    serializer_class = RequerantSerializer
    pagination_class = Page

    def get_queryset(self):
        qs = RequerantModel.objects.select_related("created_by")
        p = self.request.query_params
        q = (p.get("q") or "").strip()
        if q:
            cond = (Q(nom__icontains=q) | Q(postnom__icontains=q) | Q(prenom__icontains=q)
                    | Q(email__icontains=q) | Q(telephone__icontains=q) | Q(pays_requerant__icontains=q))
            m = re.fullmatch(r"(?:REQ-?)?0*(\d+)", q, re.I)
            if m:
                cond |= Q(pk=int(m.group(1)))
            qs = qs.filter(cond)
        if p.get("sexe") in ("M", "F"):
            qs = qs.filter(sexe=p["sexe"])
        if p.get("pays"):
            qs = qs.filter(pays_requerant__iexact=p["pays"])
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
