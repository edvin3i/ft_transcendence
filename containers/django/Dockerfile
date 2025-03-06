FROM python:3.12-alpine


COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ADD ../../srcs/backend/transa /app
COPY containers/django/entrypoint.sh /tmp/entrypoint.sh

RUN uv sync --no-cache

ENTRYPOINT [ "sh", "/tmp/entrypoint.sh" ]

# CMD [ "uv", "run", "gunicorn", "-b", "0.0.0.0:8000", "transa.wsgi" ]
# CMD ["uv", "run", "python3", "manage.py", "runserver", "0.0.0.0:8000"]
CMD ["sh", "-c", "if [ \"$DJANGO_MODE\" = \"dev\" ]; then exec uv run python3 manage.py runserver 0.0.0.0:8000; else exec uv run gunicorn -b 0.0.0.0:8000 transa.wsgi:application; fi"]
