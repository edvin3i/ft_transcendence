#!/bin/sh

VENV_PATH="/app/.venv"
PYTHON="$VENV_PATH/bin/python"
GUNICORN="$VENV_PATH/bin/gunicorn"
DAPHNE="$VENV_PATH/bin/daphne"

echo "⚙️ Using Python from: $PYTHON"
echo "⚙️ Using Gunicorn from: $GUNICORN"
echo "⚙️ Using Daphne from: $DAPHNE"

echo "⚡️ Waiting for database..."
until nc -z -v -w30 "$DB_HOST" "$DB_PORT"
do
  echo "Waiting for database connection..."
  sleep 1
done
echo "✅ Database is up!"

echo "⚡️ Running migrations..."
$PYTHON manage.py makemigrations uprofiles
$PYTHON manage.py makemigrations chat
$PYTHON manage.py makemigrations game
$PYTHON manage.py makemigrations friends
$PYTHON manage.py makemigrations tournaments
$PYTHON manage.py makemigrations
$PYTHON manage.py migrate --noinput

MIGRATION_CHECK=$($PYTHON manage.py showmigrations uprofiles | grep '\[ \]')
if [ ! -z "$MIGRATION_CHECK" ]; then
  echo "❌ Warning: Some uprofiles migrations may not have applied correctly"
  echo "$MIGRATION_CHECK"
else
  echo "✅ All uprofiles migrations applied successfully"
fi

echo "⚡️ Creating Django SuperUser..."
$PYTHON manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="$DJANGO_SUPERUSER_NAME").exists():
    User.objects.create_superuser("$DJANGO_SUPERUSER_NAME", "$DJANGO_SUPERUSER_EMAIL", "$DJANGO_SUPERUSER_PASSWORD")
    print("✅ Superuser created.")
else:
    print("✅ Superuser already exists.")
EOF

echo "🧹 Collecting static files..."
$PYTHON manage.py collectstatic --no-input

echo "🚀 Starting Gunicorn and Daphne..."

# Lance Gunicorn pour les requêtes HTTP (port 8000)
$GUNICORN -b 0.0.0.0:8000 transa.wsgi:application &

# Lance Daphne pour WebSockets (port 8001)
exec $DAPHNE -b 0.0.0.0 -p 8001 transa.asgi:application

