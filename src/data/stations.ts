export interface MarineStation {
  id: string;
  stationName: string;
  coordinates: [number, number];
  fallbackTemperatureC: number;
  fallbackWaveHeightM: number;
}

export const MARINE_STATIONS: MarineStation[] = [
  {
    id: "caribe-altamar-01",
    stationName: "Caribe - Altamar 01",
    coordinates: [-73.2, 13.6],
    fallbackTemperatureC: 29.4,
    fallbackWaveHeightM: 2.8,
  },
  {
    id: "guajira-altamar-02",
    stationName: "La Guajira - Altamar 02",
    coordinates: [-71.6, 13.4],
    fallbackTemperatureC: 30.1,
    fallbackWaveHeightM: 3.9,
  },
  {
    id: "pacifico-col-altamar-03",
    stationName: "Pacifico Colombiano - Altamar 03",
    coordinates: [-79.8, 4.2],
    fallbackTemperatureC: 27.3,
    fallbackWaveHeightM: 2.4,
  },
  {
    id: "pacifico-ecu-altamar-04",
    stationName: "Pacifico Ecuatoriano - Altamar 04",
    coordinates: [-82.4, -1.1],
    fallbackTemperatureC: 26.4,
    fallbackWaveHeightM: 3.1,
  },
  {
    id: "galapagos-altamar-05",
    stationName: "Galapagos - Altamar 05",
    coordinates: [-90.95, -0.6],
    fallbackTemperatureC: 23.8,
    fallbackWaveHeightM: 3.6,
  },
  {
    id: "panama-altamar-06",
    stationName: "Golfo de Panama - Altamar 06",
    coordinates: [-79.5, 6.6],
    fallbackTemperatureC: 28.6,
    fallbackWaveHeightM: 2.0,
  },
  {
    id: "pacifico-central-07",
    stationName: "Pacifico Central - Altamar 07",
    coordinates: [-108.0, 6.0],
    fallbackTemperatureC: 27.7,
    fallbackWaveHeightM: 2.7,
  },
  {
    id: "pacifico-sur-08",
    stationName: "Pacifico Sur - Altamar 08",
    coordinates: [-95.0, -18.0],
    fallbackTemperatureC: 21.5,
    fallbackWaveHeightM: 4.1,
  },
  {
    id: "atlantico-central-09",
    stationName: "Atlantico Central - Altamar 09",
    coordinates: [-38.0, 12.0],
    fallbackTemperatureC: 27.1,
    fallbackWaveHeightM: 2.9,
  },
  {
    id: "atlantico-norte-10",
    stationName: "Atlantico Norte - Altamar 10",
    coordinates: [-32.0, 40.0],
    fallbackTemperatureC: 18.4,
    fallbackWaveHeightM: 4.6,
  },
  {
    id: "okinawa-altamar-11",
    stationName: "Okinawa - Altamar 11",
    coordinates: [128.6, 25.4],
    fallbackTemperatureC: 30.7,
    fallbackWaveHeightM: 4.2,
  },
  {
    id: "cape-town-altamar-12",
    stationName: "Cape Town - Altamar 12",
    coordinates: [17.4, -35.2],
    fallbackTemperatureC: 18.9,
    fallbackWaveHeightM: 3.4,
  },
];
