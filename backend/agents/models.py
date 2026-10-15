from django.conf import settings
from django.db import models


class FonctionModel(models.Model):
    libelle = models.CharField("Libellé", max_length=30, unique=True)
    description = models.CharField("Description", max_length=150, blank=True)

    class Meta:
        ordering = ["libelle"]

    def __str__(self):
        return f"{self.libelle} {self.description}"


class AgentModel(models.Model):
    SEXE = (("M", "Masculin"), ("F", "Féminin"))
    STATUT = (
        ("ACTIF", "Actif"),
        ("CONGE", "En congé"),
        ("SUSPENDU", "Suspendu"),
        ("INACTIF", "Inactif"),
    )

    matricule = models.CharField("Matricule", max_length=150, unique=True)
    nom = models.CharField("Nom", max_length=50)
    postnom = models.CharField("Postnom", max_length=50, blank=True)
    prenom = models.CharField("Prénom", max_length=20)
    sexe = models.CharField("Sexe", max_length=10, choices=SEXE)
    date_naissance = models.DateField("Date de naissance")
    fonction = models.ForeignKey(FonctionModel, on_delete=models.PROTECT)
    taxe = models.CharField("Taxe", max_length=20, default="N/A")
    numero_sante = models.CharField("N° santé", max_length=20, default="N/A")
    statut = models.CharField("Statut", max_length=10, choices=STATUT, default="ACTIF")
    created_at = models.DateField(auto_now_add=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(null=True, blank=True, upload_to="agents/")

    class Meta:
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.matricule} {self.nom} {self.prenom}"
