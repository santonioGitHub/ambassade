from collections import Counter
from datetime import date

from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.permissions import is_admin
from documents.models import DemandeDocumentsModel
from requerants.models import RequerantModel

from .models import AppSettings

MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]


def _last_months(n=12):
    today = timezone.localdate()
    y, m = today.year, today.month
    out = []
    for _ in range(n):
        out.append((y, m))
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return list(reversed(out))


@api_view(["GET"])
def dashboard(request):
    demandes = DemandeDocumentsModel.objects
    total = demandes.count()
    servies = demandes.filter(delivred=True).count()

    pays = Counter()
    for row in RequerantModel.objects.values("pays_requerant").annotate(n=Count("id")):
        pays[(row["pays_requerant"] or "").strip() or "Non renseigné"] += row["n"]

    par_document = list(
        demandes.values("type_document__designation").annotate(n=Count("id")).order_by("-n")
    )

    months = _last_months(12)
    first = date(months[0][0], months[0][1], 1)
    dem, srv = Counter(), Counter()
    for d, dl, dla in demandes.filter(date_demande__gte=first).values_list("date_demande", "delivred", "delivered_at"):
        dem[(d.year, d.month)] += 1
    for dla in demandes.filter(delivred=True, delivered_at__gte=first).values_list("delivered_at", flat=True):
        srv[(dla.year, dla.month)] += 1

    last = demandes.filter(delivred=True).select_related("nom_du_demandeur", "agent", "type_document", "delivered_by") \
        .order_by("-delivered_at", "-id")[:10]
    return Response({
        "kpis": {
            "requerants": RequerantModel.objects.count(),
            "demandes": total,
            "servies": servies,
            "en_attente": total - servies,
        },
        "par_pays": [{"pays": k, "n": v} for k, v in pays.most_common()],
        "par_document": [{"document": r["type_document__designation"], "n": r["n"]} for r in par_document],
        "par_mois": [
            {"mois": f"{MOIS[m - 1]} {str(y)[2:]}", "demandes": dem[(y, m)], "servies": srv[(y, m)]}
            for y, m in months
        ],
        "dernieres_servies": [
            {
                "id": d.id, "reference": d.reference, "code": d.beneficiaire_code,
                "requerant": d.beneficiaire_nom, "document": d.type_document.designation,
                "motif": d.motif_de_demande, "date": d.delivered_at,
                "agent": (d.delivered_by.get_full_name() or d.delivered_by.username) if d.delivered_by else "",
            }
            for d in last
        ],
    })


TEXT = ["embassy_name", "country_line", "city", "address", "phone", "email", "ambassador_name",
        "ambassador_title", "signature_note", "footer_text"]


@api_view(["GET", "PUT"])
def app_settings(request):
    s = AppSettings.get()
    if request.method == "PUT":
        if not is_admin(request.user):
            return Response({"detail": "Réservé à l'administrateur."}, status=403)
        for k in TEXT:
            if k in request.data:
                setattr(s, k, str(request.data[k] or "").strip()[:250])
        if "session_minutes" in request.data:
            try:
                v = int(request.data["session_minutes"])
            except (TypeError, ValueError):
                return Response({"detail": "Durée de session invalide."}, status=400)
            if not 2 <= v <= 240:
                return Response({"detail": "La session doit durer entre 2 et 240 minutes."}, status=400)
            s.session_minutes = v
        if "ambassador_feminin" in request.data:
            s.ambassador_feminin = str(request.data["ambassador_feminin"]).lower() in ("1", "true")
        if not s.embassy_name:
            return Response({"detail": "Le nom de l'ambassade est requis."}, status=400)
        s.save()
    return Response(s.as_dict())


@api_view(["POST", "DELETE"])
def logo(request):
    """`?kind=header` : en-tête des documents (logo + nom) ; sinon logo carré de l'application."""
    if not is_admin(request.user):
        return Response({"detail": "Réservé à l'administrateur."}, status=403)
    s = AppSettings.get()
    kind = "header_image" if request.query_params.get("kind") == "header" else "logo"
    field = getattr(s, kind)
    if request.method == "DELETE":
        if field:
            field.delete(save=False)
        setattr(s, kind, None)
        s.save()
        return Response(s.as_dict())
    f = request.FILES.get("logo")
    if not f:
        return Response({"detail": "Aucun fichier reçu."}, status=400)
    if f.size > 3 * 1024 * 1024:
        return Response({"detail": "Image trop lourde (3 Mo maximum)."}, status=400)
    from PIL import Image
    try:
        Image.open(f).verify()
    except Exception:
        return Response({"detail": "Ce fichier n'est pas une image valide."}, status=400)
    f.seek(0)
    if field:
        field.delete(save=False)
    getattr(s, kind).save(f.name, f, save=True)
    return Response(s.as_dict())


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def branding(request):
    """Nom et logo pour la page de connexion (rien de confidentiel)."""
    d = AppSettings.get().as_dict()
    return Response({k: d[k] for k in ("embassy_name", "country_line", "city", "logo")})
