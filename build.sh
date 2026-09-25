#!/usr/bin/env bash
# Exit on error
set -o errexit

# Actualizar pip e instalar dependencias de Python
pip install --upgrade pip
pip install -r requirements.txt

# Recopilar archivos estáticos para WhiteNoise
python manage.py collectstatic --no-input

# Aplicar migraciones a la base de datos PostgreSQL
python manage.py migrate
