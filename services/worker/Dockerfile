FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg clamav && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 studentvoice
WORKDIR /app
COPY pyproject.toml ./
COPY studentvoice_worker ./studentvoice_worker
RUN pip install --no-cache-dir .
USER studentvoice
ENTRYPOINT ["studentvoice-worker"]
