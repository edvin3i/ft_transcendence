FROM python:3.12-alpine


COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ADD ../../srcs/backend/django /app

CMD [ "python", "main.py" ]