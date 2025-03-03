FROM python:3.12-alpine


COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ADD ../../srcs/backend/djback /app
COPY containers/django/entrypoint.sh /tmp/entrypoint.sh

RUN uv sync 

ENTRYPOINT [ "sh", "/tmp/entrypoint.sh" ]

CMD [ "uv", "run", "gunicorn", "-b", "0.0.0.0:8000", "djback.wsgi" ]
# CMD ["uv", "run", "python3", "manage.py", "runserver", "0.0.0.0:8000"]
