import re

from django.db import transaction
from django.db.models import ProtectedError, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import AdminDeleteMixin
from core.models import AppSettings
from requerants.views import Page

from .models import DemandeDocumentsModel, DocumentModel
from .serializers import DemandeSerializer, DocumentSerializer, FicheSerializer


class DocumentViewSet(AdminDeleteMixin, viewsets.ModelViewSet):
    queryset = DocumentModel.objects.all()
    serializer_class = DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *a, **k):
        try:
            return super().destroy(request, *a, **k)
        except ProtectedError:
            return Response({"detail": "Ce document a déjà été demandé : il ne peut pas être supprimé."}, status=400)


def _deliver(d, user):
    d.delivred = True
    d.delivered_at = timezone.localdate()
    d.delivered_by = user
    d.save(update_fields=["delivred", "delivered_at", "delivered_by"])


class DemandeViewSet(AdminDeleteMixin, viewsets.ModelViewSet):
    serializer_class = DemandeSerializer
    pagination_class = Page

    def get_queryset(self):
        qs = DemandeDocumentsModel.objects.select_related(
            "nom_du_demandeur", "agent", "type_document", "delivered_by")
        p = self.request.query_params
        if p.get("delivred") in ("true", "false"):
            qs = qs.filter(delivred=p["delivred"] == "true")
        if p.get("requerant"):
            qs = qs.filter(nom_du_demandeur_id=p["requerant"])
        q = (p.get("q") or "").strip()
        if q:
            cond = (Q(nom_du_demandeur__nom__icontains=q) | Q(nom_du_demandeur__prenom__icontains=q)
                    | Q(nom_du_demandeur__postnom__icontains=q) | Q(type_document__designation__icontains=q)
                    | Q(agent__nom__icontains=q) | Q(agent__prenom__icontains=q) | Q(agent__matricule__icontains=q))
            m = re.fullmatch(r"(?:(?:REQ|DOC)-?(?:\d{4}-)?)?0*(\d+)", q, re.I)
            if m:
                cond |= Q(pk=int(m.group(1))) | Q(nom_du_demandeur_id=int(m.group(1)))
            qs = qs.filter(cond)
        return qs

    @transaction.atomic
    def create(self, request, *a, **k):
        """`servir=true` : la demande est créée et servie dans la foulée (octroi immédiat)."""
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.save(created_by=request.user,
                     date_demande=ser.validated_data.get("date_demande") or timezone.localdate())
        if str(request.data.get("servir", "")).lower() in ("1", "true"):
            _deliver(d, request.user)
        return Response(self.get_serializer(d).data, status=201)

    @action(detail=True, methods=["post"])
    def servir(self, request, pk=None):
        d = self.get_object()
        if not d.delivred:
            _deliver(d, request.user)
        return Response(self.get_serializer(d).data)

    @action(detail=True, methods=["get"])
    def fiche(self, request, pk=None):
        d = self.get_object()
        data = FicheSerializer(d, context=self.get_serializer_context()).data
        return Response({"demande": data, "settings": AppSettings.get().as_dict()})
