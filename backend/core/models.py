from django.db import models


class AppSettings(models.Model):
    """Paramètres de l'application (une seule ligne)."""
    embassy_name = models.CharField("Nom de l'ambassade", max_length=150, default="Ambassade de la République Démocratique du Congo")
    country_line = models.CharField("Ligne pays", max_length=150, default="République Démocratique du Congo")
    city = models.CharField("Ville", max_length=80, default="Lisbonne")
    address = models.CharField("Adresse", max_length=250, blank=True)
    phone = models.CharField("Téléphone", max_length=40, blank=True)
    email = models.CharField("E-mail", max_length=80, blank=True)
    ambassador_name = models.CharField("Nom du signataire", max_length=100, blank=True)
    ambassador_title = models.CharField("Fonction du signataire", max_length=100, default="Ambassadeur extraordinaire et plénipotentiaire")
    ambassador_feminin = models.BooleanField("Signataire féminin (soussignée)", default=True)
    signature_note = models.CharField("Ligne sous le nom du signataire", max_length=150, blank=True)
    footer_text = models.CharField("Pied de page des documents", max_length=250, blank=True)
    session_minutes = models.PositiveSmallIntegerField("Expiration de session (minutes)", default=10)
    logo = models.ImageField(upload_to="logo/", null=True, blank=True)
    header_image = models.ImageField(upload_to="logo/", null=True, blank=True)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def as_dict(self):
        return {
            "embassy_name": self.embassy_name, "country_line": self.country_line, "city": self.city,
            "address": self.address, "phone": self.phone, "email": self.email,
            "ambassador_name": self.ambassador_name, "ambassador_title": self.ambassador_title, "ambassador_feminin": self.ambassador_feminin,
            "signature_note": self.signature_note,
            "footer_text": self.footer_text, "session_minutes": self.session_minutes,
            "logo": self.logo.url if self.logo else None,
            "header_image": self.header_image.url if self.header_image else None,
        }
