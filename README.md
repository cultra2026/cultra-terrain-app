# CULTRA Terrain GIS

Aplicação GIS para análise de terreno.

## Tecnologias

Frontend:

- React
- TypeScript
- Vite
- Leaflet
- GeoTIFF.js
- JSZip

Backend:

- Python
- FastAPI
- GDAL
- PDAL
- LAS/LAZ
- laspy
- lazrs

## Funcionalidades

- MDT GeoTIFF
- LAZ
- LAS
- mapa 2D
- análise altimétrica
- declive
- distância
- azimute
- perfil de rota
- cenários
- KML
- KMZ
- processamento local
- Terrain Worker

## Instalação

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Worker
Noutra consola:
```bash
cd terrain-worker
docker compose up --build
```

URLs
Frontend:
http://localhost:5173
Worker:
http://localhost:8080
Health:
http://localhost:8080/health

---

# Executar no teu `animated-broccoli...github.dev`

No terminal do Codespace:

```bash
mkdir -p CULTRA
cd CULTRA
```

Depois cria as pastas:
```bash
mkdir -p frontend/src
mkdir -p terrain-worker/app
mkdir -p .devcontainer
mkdir -p .github/workflows
```

Coloca os ficheiros acima nos respetivos locais.
Depois:
```bash
cd frontend
npm install
```

E:
```bash
npm run dev -- --host 0.0.0.0
```

Abre a porta 5173 no Codespace.

## Para ativar PDAL/GDAL
Noutra consola:
```bash
cd CULTRA/terrain-worker
docker compose up --build
```

Depois testa:
```bash
curl http://localhost:8080/health
```

Deverás receber:
```json
{
  "status": "ONLINE",
  "service": "CULTRA Terrain Worker"
}
```

## O ponto mais importante para os teus MDT
Com este código, o carregamento do GeoTIFF não depende de:
`GeoTIFF.fromArrayBuffer(...)`
num objeto GeoTIFF obtido através de default.
Usa:
```ts
import { fromArrayBuffer } from "geotiff";

const tiff = await fromArrayBuffer(buffer);
```
Isto elimina precisamente a classe de erro:
`GeoTIFF.fromArrayBuffer is not a function`
E a aplicação passa a poder:
GeoTIFF → leitura raster → elevação → amostragem → rota → declive → perfil → azimute.
O LAZ segue outro caminho:
LAZ → FastAPI → PDAL → informação da nuvem → cruzamento MDT/LiDAR.
# cultra-terrain-app
