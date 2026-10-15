from django.conf import settings
from django.db import models
from django.utils import timezone

from requerants.models import RequerantModel


class DocumentModel(models.Model):
    RENDU = (("ATTESTATION", "Attestation (lettre sur papier à en-tête)"), ("CARTE", "Carte consulaire (recto/verso)"))

    BENEFICIAIRE = (("REQUERANT", "Requérant"), ("AGENT", "Agent de l'ambassade (mission de service)"))

    designation = models.CharField("Désignation", max_length=100)
    beneficiaire = models.CharField("Délivré à", max_length=10, choices=BENEFICIAIRE, default="REQUERANT")
    description = models.TextField("Description", blank=True)
    image = models.ImageField("image", upload_to="documents/", null=True, blank=True)
    mention = models.CharField("Mention sous la signature (propre à ce document)", max_length=150, blank=True)
    rendu = models.CharField("Modèle d'impression", max_length=12, choices=RENDU, default="ATTESTATION")
    corps = models.TextField("Texte du document", blank=True, max_length=4000)
    validite_annees = models.PositiveSmallIntegerField("Validité (années)", null=True, blank=True)
    created_at = models.DateField(auto_now_add=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ["designation"]

    def __str__(self):
        return self.designation


class DemandeDocumentsModel(models.Model):
    MOTIF = (
        ("Renouvellement", "Renouvellement"),
        ("Perte", "Perte"),
        ("Nouveau", "Nouveau"),
        ("Autre", "Autre"),
    )

    nom_du_demandeur = models.ForeignKey(RequerantModel, on_delete=models.CASCADE, null=True, blank=True)
    # Documents « mission de service » : le bénéficiaire est un agent de l'ambassade, pas un requérant.
    agent = models.ForeignKey("agents.AgentModel", on_delete=models.PROTECT, null=True, blank=True, related_name="missions")
    mission = models.JSONField("Détails de la mission", default=dict, blank=True)
    date_demande = models.DateField("Date de la demande")
    type_document = models.ForeignKey(DocumentModel, on_delete=models.PROTECT)
    motif_de_demande = models.CharField("Motif", max_length=100, choices=MOTIF)
    created_at = models.DateField(auto_now_add=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name="demandes_creees")
    delivred = models.BooleanField(default=False)
    delivered_at = models.DateField(null=True, blank=True)
    delivered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name="demandes_servies")

    class Meta:
        ordering = ["-id"]

    @property
    def reference(self):
        year = self.date_demande.year if self.date_demande else timezone.localdate().year
        return f"DOC-{year}-{self.pk:06d}"

    @property
    def beneficiaire_nom(self):
        if self.agent:
            a = self.agent
            return " ".join(p for p in (a.nom, a.postnom, a.prenom) if p)
        return self.nom_du_demandeur.nom_complet if self.nom_du_demandeur else ""

    @property
    def beneficiaire_code(self):
        if self.agent:
            return self.agent.matricule
        return self.nom_du_demandeur.code if self.nom_du_demandeur else ""

    def __str__(self):
        return f"{self.beneficiaire_nom} {self.date_demande} {self.type_document}"
