import random
import secrets
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Profile
from agents.models import FonctionModel
from core.models import AppSettings
from documents.models import DemandeDocumentsModel, DocumentModel
from requerants.models import RequerantModel

FONCTIONS = [("Ambassadeur", "Chef de mission"), ("Conseiller", "Conseiller diplomatique"),
             ("Chancelier", "Responsable de la chancellerie"), ("Secrétaire", "Secrétariat"),
             ("Agent consulaire", "Guichet et délivrance des documents")]
# Textes de départ : à relire et adapter par l'ambassade (Ajouter document → modifier).
# Variables disponibles : voir la liste affichée dans « Ajouter document ». **gras** et lignes « > » (italique) acceptés.
CELIBAT = """Je {soussigne} {signataire}, {fonction_signataire} de l'{ambassade} agissant, en qualité d'Officier de l'État Civil, conformément à l'article 76, point 4 de la Loi nº 87 – 010 du 1er août 1987 portant Code de la famille, telle que modifiée et complétée par la loi n° 016/008 du 15 juillet 2016 ;

> Certifie que, conformément aux dispositions de l'article 330 de la loi précitée, « Le mariage est un acte civil, public et solennel par lequel un homme et une femme, qui ne sont engagés ni l'un ni l'autre dans les liens d'un précédent mariage enregistré, établissent entre eux une union légale et durable dont les conditions de formation, les effets et la dissolution sont déterminés par la présente loi » ;

Comme en témoignent les documents d'état civil ou d'identité présentés par {le_nomme} **{nom_complet}** {ne} à {lieu_naissance}, le {date_naissance} ; {fils} de {pere} (père) et {mere} (mère) ; de nationalité {nationalite} ; résidant à {adresse}, Est célibataire jusqu'à preuve du contraire.

En foi de quoi, le présent lui est donné pour servir ce que de droit."""

RESIDENCE = """Je {soussigne} {signataire}, {fonction_signataire} de l'{ambassade}, certifie que {civilite} **{nom_complet}**, {ne} à {lieu_naissance}, le {date_naissance}, {fils} de {pere} (père) et {mere} (mère), de nationalité {nationalite}, est enregistré(e) auprès de nos services sous le code {code} et déclare résider à {adresse}.

La présente attestation est établie sur la base des déclarations de l'intéressé(e) et des pièces présentées.

En foi de quoi, le présent lui est délivré pour servir ce que de droit."""

NATIONALITE = """Je {soussigne} {signataire}, {fonction_signataire} de l'{ambassade}, certifie que {civilite} **{nom_complet}**, {ne} à {lieu_naissance}, le {date_naissance}, {fils} de {pere} (père) et {mere} (mère), est de nationalité {nationalite}, au vu des documents d'état civil ou d'identité présentés.

En foi de quoi, le présent lui est délivré pour servir ce que de droit."""

GENERIQUE = """Je {soussigne} {signataire}, {fonction_signataire} de l'{ambassade} ;

Certifie que, selon les documents d'état civil ou d'identité présentés par {le_nomme} **{nom_complet}** {ne} à {lieu_naissance}, le {date_naissance} ; {fils} de {pere} (père) et {mere} (mère) ; de nationalité {nationalite} ; résidant à {adresse}, a introduit auprès de nos services une demande de « {document} » (motif : {motif}), enregistrée le {date_demande} sous la référence {reference}.

En foi de quoi, le présent lui est donné pour servir ce que de droit."""

ORDRE_MISSION = """La personne dont les nom et postnoms sont repris ci-dessous est {autorise} à se rendre en République Démocratique du Congo pour des raisons de services.

**Nom** : {agent_nom}
**Postnom** : {agent_postnom}
**Prénom** : {agent_prenom}
**Matricule** : {agent_matricule}
**Grade** : {grade}
**Pays** : {mission_pays}

**Trajet** : {mission_trajet}
**Motif** : {mission_motif}
**Durée** : {mission_duree}
**Frais** : {mission_frais}"""

OEC = "Agir en qualité d'Officier d'état civil"
# (désignation, description, rendu, texte, mention sous la signature, validité en années)
DOCS = [
    ("Attestation de célibat", "Attestation de célibat", "ATTESTATION", CELIBAT, OEC, None),
    ("Carte consulaire", "Carte consulaire (recto/verso)", "CARTE", "", "", 2),
    ("Attestation de résidence", "Attestation de résidence", "ATTESTATION", RESIDENCE, "", None),
    ("Certificat de nationalité", "Certificat de nationalité", "ATTESTATION", NATIONALITE, OEC, None),
    ("Laissez-passer", "Laissez-passer de retour", "ATTESTATION", GENERIQUE, "", None),
    ("Acte de naissance", "Copie d'acte de naissance", "ATTESTATION", GENERIQUE, OEC, None),
    ("Passeport", "Passeport ordinaire", "ATTESTATION", GENERIQUE, "", None),
    ("Ordre de mission", "Ordre de mission de service pour un agent de l'ambassade", "ATTESTATION", ORDRE_MISSION, "", None),
]
AGENT_DOCS = {"Ordre de mission"}  # délivrés à un agent, pas à un requérant
# En-tête / pied de page du « modèle de document 2026 »
SETTINGS_DEFAULTS = {
    "embassy_name": "Ambassade de la République Démocratique du Congo au Portugal",
    "address": "RUA FERNAM GOMES N° 14 - RESTELO, 1400-143 LISBOA PORTUGAL",
    "phone": "+351 210 966 714",
    "email": "mission.rdc.lisbonne@gmail.com",
    "signature_note": "Embaixadora Extraordinária e Plenipotenciária",
}
OLD_NAME = "Ambassade de la République Démocratique du Congo"


class Command(BaseCommand):
    help = "Crée l'administrateur, les fonctions et types de documents de base. --demo ajoute des données fictives."

    def add_arguments(self, parser):
        parser.add_argument("--demo", action="store_true", help="ajoute des requérants et demandes fictifs")

    def handle(self, *a, **o):
        st = AppSettings.get()
        for k, v in SETTINGS_DEFAULTS.items():  # ne remplace que ce qui est vide (ou le nom par défaut)
            cur = getattr(st, k)
            if not cur or (k == "embassy_name" and cur == OLD_NAME):
                setattr(st, k, v)
        st.save()
        if not User.objects.filter(is_superuser=True).exists():
            pw = secrets.token_urlsafe(9)
            u = User.objects.create_superuser("admin", password=pw, first_name="Administrateur")
            Profile.objects.create(user=u, role="ADMIN")
            self.stdout.write(self.style.WARNING(f"Compte créé : admin / {pw}  (notez-le, il ne sera plus affiché ; changez-le dans Paramètre)"))
        for lib, desc in FONCTIONS:
            FonctionModel.objects.get_or_create(libelle=lib, defaults={"description": desc})
        for des, desc, rendu, corps, mention, val in DOCS:
            d, _ = DocumentModel.objects.get_or_create(designation=des, defaults={"description": desc})
            changed = []
            if des in AGENT_DOCS and d.beneficiaire != "AGENT":
                d.beneficiaire = "AGENT"; changed.append("beneficiaire")
            if d.rendu != rendu:
                d.rendu = rendu; changed.append("rendu")
            if corps and not d.corps:  # ne touche jamais à un texte déjà modifié
                d.corps = corps; changed.append("corps")
            if mention and not d.mention:
                d.mention = mention; changed.append("mention")
            if val and not d.validite_annees:
                d.validite_annees = val; changed.append("validite_annees")
            if changed:
                d.save(update_fields=changed)
        if o["demo"]:
            self.demo()
        self.stdout.write(self.style.SUCCESS("Base initialisée."))

    def demo(self):
        rnd = random.Random(7)
        noms = ["Mbuyi", "Kabongo", "Tshimanga", "Lukusa", "Mutombo", "Ilunga", "Kasongo", "Nzuzi", "Mavungu", "Kalala"]
        prenoms = ["Jean", "Marie", "Patrick", "Grâce", "Joël", "Esther", "David", "Sarah", "Eliane", "Daniel"]
        pays = ["Portugal"] * 10 + ["Espagne"] * 3 + ["France"] * 3 + ["Angola"] * 2 + ["Belgique", "Brésil", "Suisse"]
        docs = list(DocumentModel.objects.all())
        today = timezone.localdate()
        for i in range(40):
            r = RequerantModel.objects.create(
                nom=rnd.choice(noms), postnom=rnd.choice(noms), prenom=rnd.choice(prenoms),
                sexe=rnd.choice("MF"), lieu_naissance="Kinshasa", date_naissance=date(1960 + rnd.randint(0, 40), rnd.randint(1, 12), rnd.randint(1, 28)),
                etat_civil=rnd.choice(["Celibataire", "Marié(e)", "Divorcé(e)"]), nationalite_requerant="Congolaise",
                pays_requerant=rnd.choice(pays), telephone=f"+3519{rnd.randint(10000000, 99999999)}", adresse="Lisbonne")
            for _ in range(rnd.randint(0, 3)):
                d = today - timedelta(days=rnd.randint(0, 330))
                served = rnd.random() < 0.7
                DemandeDocumentsModel.objects.create(
                    nom_du_demandeur=r, type_document=rnd.choice(docs), date_demande=d,
                    motif_de_demande=rnd.choice(["Renouvellement", "Perte", "Nouveau", "Autre"]),
                    delivred=served, delivered_at=min(today, d + timedelta(days=rnd.randint(0, 10))) if served else None)
