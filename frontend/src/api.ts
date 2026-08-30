const WORKER_URL =
  import.meta.env.VITE_TERRAIN_WORKER_URL ||
  "http://localhost:8080";

export async function workerHealth() {
  const response = await fetch(
    `${WORKER_URL}/health`
  );

  if (!response.ok) {
    throw new Error(
      "Terrain Worker indisponível."
    );
  }

  return response.json();
}

export async function inspectGeoTiff(
  file: File
) {
  const form = new FormData();

  form.append("file", file);

  const response = await fetch(
    `${WORKER_URL}/terrain/geotiff/inspect`,
    {
      method: "POST",
      body: form
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json();
}

export async function inspectLaz(
  file: File
) {
  const form = new FormData();

  form.append("file", file);

  const response = await fetch(
    `${WORKER_URL}/lidar/inspect`,
    {
      method: "POST",
      body: form
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json();
}

export async function analyseLidar(
  lazFile: File,
  terrainFile?: File
) {
  const form = new FormData();

  form.append(
    "laz",
    lazFile
  );

  if (terrainFile) {
    form.append(
      "terrain",
      terrainFile
    );
  }

  const response = await fetch(
    `${WORKER_URL}/analysis/lidar-terrain`,
    {
      method: "POST",
      body: form
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json();
}
