# Ambassade de la RDC au Portugal — Octroi de documents officiels

React 18 + Tailwind CSS 3 (Vite) pour l'interface, Django 5 + Django REST Framework pour l'API, SQLite pour la base.

## Démarrage

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows : .venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations accounts core agents requerants documents
python manage.py migrate
python manage.py seed            # crée le compte « admin » (mot de passe affiché une seule fois), des fonctions et types de documents
# python manage.py seed --demo   # facultatif : 40 requérants et des demandes fictives pour voir les graphiques
python manage.py runserver       # http://localhost:8000

# 2. Frontend (autre terminal)
cd frontend
npm install
npm run dev                      # http://localhost:5173  (le proxy Vite relaie /api et /media vers Django)
```

Tests de l'API : `python manage.py test`.

## Fonctionnement

- **Connexion uniquement** : aucune inscription. L'administrateur crée les comptes dans *Paramètre → Utilisateurs*.
- **Rôles** : *Administrateur* (tout) ; *Agent* (dashboard, requérants, documents, octroi). Seuls les administrateurs accèdent à *Gestion des agents* et *Paramètre*, et suppriment des enregistrements.
- **Session** : déconnexion automatique après inactivité (10 min par défaut, réglable dans *Paramètre → Session*), avec avertissement une minute avant.
- **Dashboard** : requérants, documents demandés, servis, demandes en attente ; carte des requérants par pays (champ `pays_requerant`), camembert par type de document, barres sur 12 mois, tableau des dernières demandes servies.
- **Octroi document** : on cherche le requérant (nom ou code `REQ-000012`) ; son code et son nom s'affichent ; on choisit le document dans la liste, le motif et la date. « Générer le document » crée la demande, la marque servie et ouvre la page imprimable (A4) ; « Enregistrer en attente » la met dans les demandes en attente, qu'on octroie plus tard.
- **Document imprimé** : en-tête, texte, photo, sceau/image du document, signataire et pied de page viennent de *Paramètre → Ambassade*.

## Écarts avec les modèles fournis

- Le champ `nationalite_requerant` était défini deux fois : une seule définition conservée. Les libellés « Nationalité » des champs d'adresse sont corrigés. Le nom `avanue_requerant` est conservé tel quel.
- Partenaire, père, mère et postnom sont facultatifs (un célibataire n'a pas de partenaire). Prénoms : 50 caractères au lieu de 20.
- `upload_to` : `requerants/`, `agents/`, `documents/` au lieu de `media/` (qui donnait `media/media/…`). L'image d'un document est facultative.
- Ajouts : `AgentModel.statut` (Actif, En congé, Suspendu, Inactif) ; `DemandeDocumentsModel.delivered_at` et `delivered_by` ; les types de documents déjà demandés et les fonctions attribuées ne peuvent pas être supprimés.
- `delivred` (orthographe d'origine) est conservé.

## Limites connues

- La carte du monde est une silhouette simplifiée dessinée dans `frontend/src/geo.js`. Les pays hors de la liste y apparaissent seulement dans le classement. Pour une carte précise, remplacez `LAND` par des polygones tirés d'un GeoJSON Natural Earth.
- En production : `DEBUG=0`, `SECRET_KEY` et `ALLOWED_HOSTS` en variables d'environnement, `npm run build`, et `/media` servi par le serveur web.
