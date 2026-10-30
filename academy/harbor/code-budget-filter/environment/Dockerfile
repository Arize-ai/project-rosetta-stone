FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends bash curl git procps && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY budget_filter.py README.md products.json /app/
