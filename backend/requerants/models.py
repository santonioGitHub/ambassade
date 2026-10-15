from django.conf import settings
from django.db import models


class RequerantModel(models.Model):
    SEXE = (("M", "Masculin"), ("F", "Féminin"))
    ETAT_CIVIL = (
        ("Celibataire", "Celibataire"),
        ("Marié(e)", "Marié(e)"),
        ("Divorcé(e)", "Divorcé(e)"),
    )

    nom = models.CharField("Nom", max_length=50)
    postnom = models.CharField("Postnom", max_length=50, blank=True)
    prenom = models.CharField("Prénom", max_length=50)
    sexe = models.CharField("Sexe", max_length=10, choices=SEXE)
    lieu_naissance = models.CharField("Lieu de naissance", max_length=50)
    date_naissance = models.DateField("Date de naissance")
    etat_civil = models.CharField("Etat civil", max_length=20, choices=ETAT_CIVIL)
    nom_partenaire = models.CharField("Nom Partenaire", max_length=50, blank=True)
    postnom_partenaire = models.CharField("Postnom Partenaire", max_length=50, blank=True)
    prenom_partenaire = models.CharField("Prénom Partenaire", max_length=50, blank=True)
    nationalite_partenaire = models.CharField("Nationalité du (la) partenaire", max_length=100, null=True, blank=True)
    nom_pere = models.CharField("Nom du Père", max_length=50, blank=True)
    postnom_pere = models.CharField("Postnom du Père", max_length=50, blank=True)
    prenom_pere = models.CharField("Prénom du Père", max_length=50, blank=True)
    nationalite_pere = models.CharField("Nationalité du Père", max_length=100, null=True, blank=True)
    nom_mere = models.CharField("Nom de la Mère", max_length=50, blank=True)
    postnom_mere = models.CharField("Postnom de la Mère", max_length=50, blank=True)
    prenom_mere = models.CharField("Prénom de la Mère", max_length=50, blank=True)
    nationalite_mere = models.CharField("Nationalité de la mère", max_length=100, null=True, blank=True)
    nationalite_requerant = models.CharField("Nationalité", max_length=30)
    avanue_requerant = models.CharField("Avenue", max_length=60, null=True, blank=True)
    numero_av_requerant = models.CharField("Numéro", max_length=30, null=True, blank=True)
    quartier_requerant = models.CharField("Quartier", max_length=60, null=True, blank=True)
    province_requerant = models.CharField("Province", max_length=60, null=True, blank=True)
    pays_requerant = models.CharField("Pays", max_length=60, null=True, blank=True)
    adresse = models.TextField("Adresse", max_length=200, blank=True)
    profession = models.CharField("Profession", max_length=60, blank=True)
    email = models.CharField("E-mail", max_length=80, blank=True)
    telephone = models.CharField("Téléphone", max_length=30)
    created_at = models.DateField(auto_now_add=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(null=True, blank=True, upload_to="requerants/")

    class Meta:
        ordering = ["-id"]

    @property
    def code(self):
        return f"REQ-{self.pk:06d}"

    @property
    def nom_complet(self):
        return " ".join(p for p in (self.nom, self.postnom, self.prenom) if p)

    def __str__(self):
        return f"{self.pk} {self.prenom}"
