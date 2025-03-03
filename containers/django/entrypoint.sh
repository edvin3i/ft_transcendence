#!/bin/sh

echo "⚡️ Waiting for database..."
until nc -z -v -w30 $DB_HOST $DB_PORT
do
  echo "Waiting for database connection..."
  sleep 1
done
echo "✅ Database is up!"

echo "⚡️ Make migrations..."
uv run python manage.py makemigrations

echo "⚡️ Applying migrations..."
uv run python manage.py migrate

echo "⚡️ Creating Django SuperUser..."
uv run python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="$DJANGO_SUPERUSER_NAME").exists():
    User.objects.create_superuser("$DJANGO_SUPERUSER_NAME", "$DJANGO_SUPERUSER_EMAIL", "$DJANGO_SUPERUSER_PASSWORD")
    print("✅ Superuser created.")
else:
    print("✅ Superuser already exists.")
EOF
# uv run python manage.py createsuperuser --no-input

echo "  Collecting static files..."
uv run python manage.py collectstatic

echo "🚀 Starting Gunicorn..."
exec "$@"