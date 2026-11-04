FROM python:3.12-slim
RUN pip install --no-cache-dir uv
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN uv pip install --system --no-cache -r /app/requirements.txt
COPY backend /app/backend
COPY runner.py /app/runner.py
ENV OTEL_SDK_DISABLED=true
