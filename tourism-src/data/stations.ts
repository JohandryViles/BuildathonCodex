export interface MarineStation {
  id: string;
  stationName: string;
  coordinates: [number, number];
  fallbackTemperatureC: number;
  fallbackWaveHeightM: number;
}

export const MARINE_STATIONS: MarineStation[] = [
  {
    id: "manta-puerto",
    stationName: "Puerto de Manta",
    coordinates: [-80.725, -0.944],
    fallbackTemperatureC: 26.8,
    fallbackWaveHeightM: 1.6,
  },
  {
    id: "playa-murcielago",
    stationName: "Playa Murcielago",
    coordinates: [-80.739, -0.937],
    fallbackTemperatureC: 27.1,
    fallbackWaveHeightM: 2.1,
  },
  {
    id: "tarqui",
    stationName: "Tarqui",
    coordinates: [-80.703, -0.957],
    fallbackTemperatureC: 27.4,
    fallbackWaveHeightM: 1.9,
  },
  {
    id: "san-mateo",
    stationName: "San Mateo",
    coordinates: [-80.811, -0.974],
    fallbackTemperatureC: 26.6,
    fallbackWaveHeightM: 2.9,
  },
  {
    id: "santa-marianita",
    stationName: "Santa Marianita",
    coordinates: [-80.851, -1.012],
    fallbackTemperatureC: 26.2,
    fallbackWaveHeightM: 3.2,
  },
  {
    id: "jaramijo",
    stationName: "Jaramijo",
    coordinates: [-80.634, -0.946],
    fallbackTemperatureC: 27.5,
    fallbackWaveHeightM: 1.8,
  },
  {
    id: "pacoche",
    stationName: "Pacoche",
    coordinates: [-80.881, -1.069],
    fallbackTemperatureC: 25.9,
    fallbackWaveHeightM: 2.4,
  },
];
