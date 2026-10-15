"""Tests de l'API. Lancer avec :  python manage.py test"""
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import Profile
from agents.models import FonctionModel
from core.models import AppSettings
from documents.models import DemandeDocumentsModel, DocumentModel
from requerants.models import RequerantModel

PW = "secret-pass-1"


class Base(TestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_superuser("boss", password=PW)
        Profile.objects.create(user=self.admin, role="ADMIN")
        self.agent = User.objects.create_user("agent1", password=PW)
        Profile.objects.create(user=self.agent, role="AGENT")
        self.doc = DocumentModel.objects.create(designation="Passeport")
        self.req = RequerantModel.objects.create(
            nom="Mbuyi", prenom="Jean", sexe="M", lieu_naissance="Kinshasa", date_naissance="1980-05-02",
            etat_civil="Celibataire", nationalite_requerant="Congolaise", telephone="+351900000000",
            pays_requerant="Portugal")

    def client_for(self, username):
        c = APIClient()
        r = c.post("/api/login/", {"username": username, "password": PW}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        c.credentials(HTTP_AUTHORIZATION="Token " + r.data["token"])
        return c


class AuthTests(Base):
    def test_pas_d_inscription_et_login_obligatoire(self):
        self.assertEqual(APIClient().get("/api/requerants/").status_code, 401)
        self.assertEqual(APIClient().post("/api/register/", {}, format="json").status_code, 404)

    def test_mauvais_mot_de_passe(self):
        r = APIClient().post("/api/login/", {"username": "boss", "password": "x"}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_compte_desactive_refuse(self):
        self.agent.is_active = False
        self.agent.save()
        r = APIClient().post("/api/login/", {"username": "agent1", "password": PW}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_session_expire_selon_les_parametres(self):
        s = AppSettings.get()
        s.session_minutes = 5
        s.save()
        c = self.client_for("agent1")
        self.assertEqual(c.get("/api/meta/").status_code, 200)
        Token.objects.filter(user=self.agent).update(created=timezone.now() - timedelta(minutes=6))
        self.assertEqual(c.get("/api/meta/").status_code, 401)


class DroitsTests(Base):
    def test_agent_n_a_pas_acces_aux_zones_admin(self):
        c = self.client_for("agent1")
        for url in ("/api/users/", "/api/agents/", "/api/fonctions/"):
            self.assertEqual(c.get(url).status_code, 403, url)
        self.assertEqual(c.put("/api/settings/", {"embassy_name": "X"}, format="json").status_code, 403)
        self.assertEqual(c.get("/api/settings/").status_code, 200)  # lecture ouverte (impression)

    def test_suppression_reservee_a_l_admin(self):
        self.assertEqual(self.client_for("agent1").delete(f"/api/requerants/{self.req.id}/").status_code, 403)
        self.assertEqual(self.client_for("boss").delete(f"/api/requerants/{self.req.id}/").status_code, 204)

    def test_admin_gere_les_comptes(self):
        c = self.client_for("boss")
        r = c.post("/api/users/", {"username": "ag2", "password": PW, "role": "AGENT"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        uid = next(u["id"] for u in r.data if u["username"] == "ag2")
        self.assertEqual(c.post("/api/users/", {"username": "ag2", "password": PW}, format="json").status_code, 400)
        self.assertEqual(c.post("/api/users/", {"username": "ag3", "password": "123"}, format="json").status_code, 400)
        r = c.patch(f"/api/users/{uid}/", {"active": False}, format="json")
        self.assertFalse(r.data["active"])
        self.assertEqual(c.delete(f"/api/users/{self.admin.id}/").status_code, 400)  # pas soi-même


class MetierTests(Base):
    def test_creation_requerant_et_code(self):
        c = self.client_for("agent1")
        r = c.post("/api/requerants/", {
            "nom": "Kabongo", "prenom": "Marie", "sexe": "F", "lieu_naissance": "Matadi",
            "date_naissance": "1990-01-01", "etat_civil": "Celibataire", "nationalite_requerant": "Congolaise",
            "telephone": "+351911111111", "pays_requerant": "Espagne"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.data["code"], f"REQ-{r.data['id']:06d}")
        self.assertEqual(c.get("/api/requerants/?q=kabongo").data["count"], 1)
        self.assertEqual(c.get(f"/api/requerants/?q=REQ-{r.data['id']:06d}").data["count"], 1)

    def test_date_naissance_future_refusee(self):
        r = self.client_for("agent1").post("/api/requerants/", {
            "nom": "A", "prenom": "B", "sexe": "M", "lieu_naissance": "X", "date_naissance": "2999-01-01",
            "etat_civil": "Celibataire", "nationalite_requerant": "C", "telephone": "1"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_octroi_immediat_puis_fiche(self):
        c = self.client_for("agent1")
        body = {"nom_du_demandeur": self.req.id, "type_document": self.doc.id,
                "motif_de_demande": "Nouveau", "servir": True}
        r = c.post("/api/demandes/", body, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertTrue(r.data["delivred"])
        self.assertTrue(r.data["reference"].startswith("DOC-"))
        f = c.get(f"/api/demandes/{r.data['id']}/fiche/")
        self.assertEqual(f.status_code, 200)
        self.assertEqual(f.data["demande"]["requerant"]["nom"], "Mbuyi")
        self.assertIn("embassy_name", f.data["settings"])

    def test_demande_en_attente_puis_servie(self):
        c = self.client_for("agent1")
        r = c.post("/api/demandes/", {"nom_du_demandeur": self.req.id, "type_document": self.doc.id,
                                      "motif_de_demande": "Perte"}, format="json")
        self.assertFalse(r.data["delivred"])
        self.assertEqual(c.get("/api/demandes/?delivred=false").data["count"], 1)
        r2 = c.post(f"/api/demandes/{r.data['id']}/servir/")
        self.assertTrue(r2.data["delivred"])
        self.assertEqual(c.get("/api/demandes/?delivred=false").data["count"], 0)

    def test_tableau_de_bord(self):
        c = self.client_for("agent1")
        c.post("/api/demandes/", {"nom_du_demandeur": self.req.id, "type_document": self.doc.id,
                                  "motif_de_demande": "Nouveau", "servir": True}, format="json")
        c.post("/api/demandes/", {"nom_du_demandeur": self.req.id, "type_document": self.doc.id,
                                  "motif_de_demande": "Perte"}, format="json")
        d = c.get("/api/dashboard/").data
        self.assertEqual(d["kpis"], {"requerants": 1, "demandes": 2, "servies": 1, "en_attente": 1})
        self.assertEqual(d["par_pays"][0], {"pays": "Portugal", "n": 1})
        self.assertEqual(len(d["par_mois"]), 12)
        self.assertEqual(len(d["dernieres_servies"]), 1)

    def test_document_deja_demande_non_supprimable(self):
        DemandeDocumentsModel.objects.create(nom_du_demandeur=self.req, type_document=self.doc,
                                             date_demande=timezone.localdate(), motif_de_demande="Nouveau")
        r = self.client_for("boss").delete(f"/api/documents/{self.doc.id}/")
        self.assertEqual(r.status_code, 400)

    def test_fonction_utilisee_non_supprimable(self):
        f = FonctionModel.objects.create(libelle="Chef")
        c = self.client_for("boss")
        r = c.post("/api/agents/", {"matricule": "A1", "nom": "N", "prenom": "P", "sexe": "M",
                                    "date_naissance": "1985-01-01", "fonction": f.id}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.data["statut"], "ACTIF")
        self.assertEqual(c.delete(f"/api/fonctions/{f.id}/").status_code, 400)


class ParametresTests(Base):
    def test_reglages_signataire(self):
        c = self.client_for("boss")
        r = c.put("/api/settings/", {"ambassador_feminin": False, "signature_note": "X"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertFalse(r.data["ambassador_feminin"])
        self.assertEqual(r.data["signature_note"], "X")

    def test_document_avec_corps_et_validite(self):
        c = self.client_for("agent1")
        r = c.post("/api/documents/", {"designation": "Carte consulaire", "rendu": "CARTE", "validite_annees": 2}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        did = r.data["id"]
        r = c.post("/api/documents/", {"designation": "Attestation", "corps": "Texte {nom_complet}", "mention": "M"}, format="json")
        self.assertEqual(r.data["rendu"], "ATTESTATION")
        d = c.post("/api/demandes/", {"nom_du_demandeur": self.req.id, "type_document": did,
                                      "motif_de_demande": "Nouveau", "servir": True}, format="json").data
        self.assertIsNotNone(d["date_expiration"])
        self.assertEqual(c.get(f"/api/demandes/{d['id']}/fiche/").data["demande"]["date_expiration"], d["date_expiration"])


class MissionTests(Base):
    def setUp(self):
        super().setUp()
        f = FonctionModel.objects.create(libelle="Ambassadeur")
        from agents.models import AgentModel
        self.collegue = AgentModel.objects.create(matricule="678.535", nom="TSHIALA", postnom="TSHISHIKU", prenom="Fanny",
                                                  sexe="F", date_naissance="1970-01-01", fonction=f, taxe="T1", numero_sante="S1")
        self.ordre = DocumentModel.objects.create(designation="Ordre de mission", beneficiaire="AGENT",
                                                  corps="{agent_nom} {mission_trajet}")
        self.mission = {"trajet": "Lisbonne – Casablanca – Kinshasa", "motif": "Suivi des dossiers", "duree": "30 jours",
                        "frais": "A charge du Trésor Public", "pays": "Portugal"}

    def post(self, c, **extra):
        body = {"agent": self.collegue.id, "type_document": self.ordre.id, "motif_de_demande": "Autre",
                "mission": self.mission, "servir": True}
        body.update(extra)
        return c.post("/api/demandes/", body, format="json")

    def test_un_agent_octroie_un_ordre_de_mission_a_un_collegue(self):
        c = self.client_for("agent1")  # simple agent, pas administrateur
        r = self.post(c)
        self.assertEqual(r.status_code, 201, r.content)
        self.assertTrue(r.data["delivred"])
        self.assertIsNone(r.data["nom_du_demandeur"])
        self.assertEqual(r.data["requerant_code"], "678.535")
        f = c.get(f"/api/demandes/{r.data['id']}/fiche/").data["demande"]
        self.assertEqual(f["beneficiaire_agent"]["nom"], "TSHIALA")
        self.assertNotIn("taxe", f["beneficiaire_agent"])
        self.assertEqual(f["mission"]["trajet"], self.mission["trajet"])
        self.assertIsNone(f["requerant"])

    def test_mission_incomplete_ou_sans_agent_refusee(self):
        c = self.client_for("agent1")
        self.assertEqual(self.post(c, mission={"trajet": "X"}).status_code, 400)
        self.assertEqual(self.post(c, agent=None).status_code, 400)

    def test_document_requerant_exige_un_requerant(self):
        c = self.client_for("agent1")
        r = c.post("/api/demandes/", {"agent": self.collegue.id, "type_document": self.doc.id,
                                      "motif_de_demande": "Nouveau"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_annuaire_ouvert_aux_agents_sans_donnees_sensibles(self):
        c = self.client_for("agent1")
        self.assertEqual(c.get("/api/agents/").status_code, 403)
        r = c.get("/api/agents/annuaire/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data[0]["matricule"], "678.535")
        self.assertNotIn("taxe", r.data[0])

    def test_tableau_de_bord_et_agent_protege(self):
        c = self.client_for("agent1")
        self.post(c)
        d = c.get("/api/dashboard/").data
        self.assertEqual(d["dernieres_servies"][0]["code"], "678.535")
        self.assertEqual(self.client_for("boss").delete(f"/api/agents/{self.collegue.id}/").status_code, 400)
