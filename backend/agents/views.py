from django.db.models import ProtectedError, Q
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.permissions import IsAdminRole

from .models import AgentModel, FonctionModel
from .serializers import AgentSerializer, FonctionSerializer


class AgentViewSet(viewsets.ModelViewSet):
    serializer_class = AgentSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = AgentModel.objects.select_related("fonction")
        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(nom__icontains=q) | Q(postnom__icontains=q) | Q(prenom__icontains=q)
                           | Q(matricule__icontains=q))
        st = self.request.query_params.get("statut")
        if st:
            qs = qs.filter(statut=st)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *a, **k):
        try:
            return super().destroy(request, *a, **k)
        except ProtectedError:
            return Response({"detail": "Cet agent a des documents de mission : il ne peut pas être supprimé. Passez-le en « Inactif »."}, status=400)


@api_view(["GET"])
def annuaire(request):
    """Liste minimale des collègues (sans données personnelles) : sert à choisir le bénéficiaire d'une mission."""
    qs = AgentModel.objects.exclude(statut="INACTIF").select_related("fonction")
    return Response([
        {"id": a.id, "matricule": a.matricule, "nom_complet": " ".join(p for p in (a.nom, a.postnom, a.prenom) if p),
         "fonction": a.fonction.libelle, "sexe": a.sexe}
        for a in qs
    ])


class FonctionViewSet(viewsets.ModelViewSet):
    queryset = FonctionModel.objects.all()
    serializer_class = FonctionSerializer
    permission_classes = [IsAdminRole]

    def destroy(self, request, *a, **k):
        try:
            return super().destroy(request, *a, **k)
        except ProtectedError:
            return Response({"detail": "Cette fonction est attribuée à des agents."}, status=400)
