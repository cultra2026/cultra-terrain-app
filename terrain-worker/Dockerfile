FROM ghcr.io/osgeo/gdal:ubuntu-small-latest

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    liblaszip-dev \
    pdal \
    pdal-python \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN python3 -m pip install \
    --break-system-packages \
    --no-cache-dir \
    -r requirements.txt

COPY app ./app

EXPOSE 8080

CMD [
  "python3",
  "-m",
  "uvicorn",
  "app.main:app",
  "--host",
  "0.0.0.0",
  "--port",
  "8080"
]
