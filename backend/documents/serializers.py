from django.utils import timezone
from rest_framework import serializers

from core.images import validate_image_size
from agents.models import AgentModel
from requerants.serializers import RequerantSerializer

from .models import DemandeDocumentsModel, DocumentModel


class DocumentSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    demandes = serializers.SerializerMethodField()

    class Meta:
        model = DocumentModel
        exclude = ["created_by"]
        extra_kwargs = {"image": {"write_only": True, "required": False}}

    def get_image_url(self, o):
        return o.image.url if o.image else None

    def get_demandes(self, o):
        return o.demandedocumentsmodel_set.count()

    def validate_image(self, f):
        return validate_image_size(f)

    def validate_corps(self, t):
        return t.strip()


def add_years(d, n):
    try:
        return d.replace(year=d.year + n)
    except ValueError:  # 29 février
        return d.replace(year=d.year + n, day=28)


MISSION_KEYS = ("pays", "trajet", "motif", "duree", "frais", "signataire_nom", "signataire_fonction", "signataire_grade")


def clean_mission(m):
    """Ne garde que les champs connus (texte, 200 caractères max) et exige trajet, motif et durée."""
    m = m if isinstance(m, dict) else {}
    out = {k: str(m.get(k) or "").strip()[:200] for k in MISSION_KEYS}
    if not (out["trajet"] and out["motif"] and out["duree"]):
        raise serializers.ValidationError({"mission": "Le trajet, le motif et la durée de la mission sont obligatoires."})
    return out


class AgentFicheSerializer(serializers.ModelSerializer):
    """Seulement ce qui s'imprime : jamais la taxe ni le numéro de santé."""
    fonction_libelle = serializers.CharField(source="fonction.libelle", read_only=True)

    class Meta:
        model = AgentModel
        fields = ["id", "matricule", "nom", "postnom", "prenom", "sexe", "date_naissance", "fonction_libelle"]


class DemandeSerializer(serializers.ModelSerializer):
    reference = serializers.CharField(read_only=True)
    # Gardent leurs noms d'origine mais valent aussi pour un agent (matricule / nom complet)
    requerant_code = serializers.CharField(source="beneficiaire_code", read_only=True)
    requerant_nom = serializers.CharField(source="beneficiaire_nom", read_only=True)
    beneficiaire = serializers.CharField(source="type_document.beneficiaire", read_only=True)
    document_nom = serializers.CharField(source="type_document.designation", read_only=True)
    delivered_by_name = serializers.SerializerMethodField()
    date_expiration = serializers.SerializerMethodField()

    class Meta:
        model = DemandeDocumentsModel
        exclude = ["created_by", "delivered_by"]
        read_only_fields = ["delivered_at", "created_at", "delivred"]
        extra_kwargs = {"date_demande": {"required": False}}

    def get_delivered_by_name(self, o):
        u = o.delivered_by
        return (u.get_full_name() or u.username) if u else ""

    def get_date_expiration(self, o):
        n = o.type_document.validite_annees
        if not n or not o.delivered_at:
            return None
        return add_years(o.delivered_at, n)

    def validate_date_demande(self, d):
        if d > timezone.localdate():
            raise serializers.ValidationError("La date de la demande ne peut pas être dans le futur.")
        return d

    def validate(self, a):
        inst = self.instance
        doc = a.get("type_document") or (inst.type_document if inst else None)
        if doc is None:
            return a
        if doc.beneficiaire == "AGENT":
            agent = a["agent"] if "agent" in a else (inst.agent if inst else None)
            if not agent:
                raise serializers.ValidationError({"agent": "Choisissez l'agent bénéficiaire."})
            a["nom_du_demandeur"] = None
            a["mission"] = clean_mission(a["mission"] if "mission" in a else (inst.mission if inst else {}))
        else:
            req = a["nom_du_demandeur"] if "nom_du_demandeur" in a else (inst.nom_du_demandeur if inst else None)
            if not req:
                raise serializers.ValidationError({"nom_du_demandeur": "Choisissez le requérant."})
            a["agent"] = None
            a["mission"] = {}
        return a


class FicheSerializer(DemandeSerializer):
    """Demande + requérant complet + document : tout ce qu'il faut pour imprimer."""
    requerant = RequerantSerializer(source="nom_du_demandeur", read_only=True)
    document = DocumentSerializer(source="type_document", read_only=True)
    beneficiaire_agent = AgentFicheSerializer(source="agent", read_only=True)
