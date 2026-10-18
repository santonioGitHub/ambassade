#!/usr/bin/env bash
# Build Render du backend Django
set -o errexit

pip install -r requirements.txt
python manage.py migrate --no-input
# Crée l'admin (mot de passe = variable ADMIN_PASSWORD), les types de documents et des données fictives.
python manage.py seed --demo
