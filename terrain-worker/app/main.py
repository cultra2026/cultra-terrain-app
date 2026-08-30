import math

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Cultra Terrain Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def generate_terrain(
    width: int = 28,
    height: int = 18,
    seed: int = 42,
    roughness: float = 0.8,
    moisture_bias: float = 0.15,
    temperature_bias: float = 0.1,
):
    terrain = []
    for y in range(height):
        row = []
        for x in range(width):
            nx = x / max(width, 1)
            ny = y / max(height, 1)
            base = math.sin((x + seed) * 0.5) * 0.6 + math.cos((y - seed) * 0.7) * 0.5
            ridge = math.sin((nx * 18 + seed) * 3.14) * roughness
            moisture = clamp((math.cos((x + seed) * 0.35) + math.sin((y + seed) * 0.42) + 2) / 4 + moisture_bias, 0, 1)
            temperature = clamp((1 - ny) * 0.7 + math.sin((x + seed) * 0.2) * 0.15 + temperature_bias, 0, 1)
            elevation = clamp(base + ridge + (ny - 0.5) * 1.2, 0, 1)
            water = clamp(1 - elevation + moisture * 0.35, 0, 1)
            vegetation = clamp(elevation * 0.7 + moisture * 0.9 - temperature * 0.2, 0, 1)

            if elevation < 0.25:
                biome = "ocean"
            elif elevation < 0.4:
                biome = "shore"
            elif elevation < 0.7 and moisture > 0.6:
                biome = "forest"
            elif elevation < 0.7 and moisture < 0.35:
                biome = "savanna"
            elif elevation > 0.75:
                biome = "mountain"
            elif temperature < 0.3:
                biome = "tundra"
            elif moisture > 0.7:
                biome = "wetlands"
            else:
                biome = "plains"

            row.append(
                {
                    "x": x,
                    "y": y,
                    "elevation": round(elevation, 6),
                    "moisture": round(moisture, 6),
                    "temperature": round(temperature, 6),
                    "water": round(water, 6),
                    "vegetation": round(vegetation, 6),
                    "biome": biome,
                }
            )
        terrain.append(row)
    return terrain


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/terrain")
def terrain_status(
    width: int = Query(28, ge=1, le=128),
    height: int = Query(18, ge=1, le=128),
    seed: int = Query(42, ge=1, le=1000),
    roughness: float = Query(0.8, ge=0.0, le=2.0),
    moisture_bias: float = Query(0.15, ge=-1.0, le=1.0),
    temperature_bias: float = Query(0.1, ge=-1.0, le=1.0),
):
    return {
        "width": width,
        "height": height,
        "seed": seed,
        "roughness": roughness,
        "moisture_bias": moisture_bias,
        "temperature_bias": temperature_bias,
        "map": generate_terrain(
            width=width,
            height=height,
            seed=seed,
            roughness=roughness,
            moisture_bias=moisture_bias,
            temperature_bias=temperature_bias,
        ),
    }
