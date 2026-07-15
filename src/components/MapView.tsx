import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { AlertFilter, MarineAlert } from "../types/marine";
import { TEMPERATURE_THRESHOLDS, WAVE_THRESHOLDS, evaluateMarinePoint } from "../domain/alerts";
import { fetchMarineConditions } from "../data/openMeteo";

const SOURCE_ID = "marine-alerts-source";
const GLOBAL_FIELD_SOURCE_ID = "global-marine-field-source";
const TEMP_FIELD_LAYER_ID = "global-temp-layer";
const WAVE_FIELD_LAYER_ID = "global-wave-layer";
const LAND_MASK_LAYER_ID = "global-land-mask-layer";
const COAST_SURF_LAYER_ID = "coast-surf-layer";
const LAYER_ID = "marine-alerts-layer";
const USER_LOCATION_RADIUS_KM = 100;
const GRID_STEP_DEGREES = 2;
const ALERT_BASE_RADIUS_EXPRESSION: maplibregl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["get", "waveHeightM"],
  0.5,
  6,
  2.5,
  8,
  5,
  10,
];

interface MapViewProps {
  alerts: MarineAlert[];
  selectedPointId: string | null;
  filter: AlertFilter;
  onPointSelect: (pointId: string) => void;
  fieldTimeMs: number;
}

function getBoundsFromRadius(
  center: [number, number],
  radiusKm: number,
): [[number, number], [number, number]] {
  const [lng, lat] = center;
  const latDelta = radiusKm / 111;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const safeCos = Math.max(0.15, Math.abs(cosLat));
  const lngDelta = radiusKm / (111 * safeCos);

  return [
    [lng - lngDelta, lat - latDelta],
    [lng + lngDelta, lat + latDelta],
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function setLayerVisibility(map: Map, layerId: string, isVisible: boolean) {
  if (!map.getLayer(layerId)) {
    return;
  }

  map.setLayoutProperty(layerId, "visibility", isVisible ? "visible" : "none");
}

type CurrentMode = "current1" | "counter2" | "counter3";

function getFlowVector(
  lng: number,
  lat: number,
  timeSec: number,
  mode: CurrentMode,
): [number, number] {
  const baseU =
    Math.sin(lat * 0.2 + timeSec * 0.05) +
    0.6 * Math.cos(lng * 0.13 - timeSec * 0.03) +
    0.35 * Math.sin((lng + lat) * 0.08 + timeSec * 0.07);
  const baseV =
    Math.cos(lng * 0.18 - timeSec * 0.04) -
    0.5 * Math.sin(lat * 0.15 + timeSec * 0.05) +
    0.35 * Math.cos((lng - lat) * 0.09 - timeSec * 0.06);

  if (mode === "counter2") {
    return [
      -baseU * 0.95 + 0.35 * Math.cos((lng - lat) * 0.07 + timeSec * 0.09),
      -baseV * 0.85 + 0.35 * Math.sin((lng + lat) * 0.06 - timeSec * 0.08),
    ];
  }

  if (mode === "counter3") {
    return [
      baseV * 0.9 + 0.5 * Math.sin(lat * 0.22 - timeSec * 0.06),
      -baseU * 0.9 + 0.5 * Math.cos(lng * 0.2 + timeSec * 0.05),
    ];
  }

  return [baseU, baseV];
}

interface MarineFieldProperties {
  seaTemperatureC: number;
  waveHeightM: number;
  wavePhase: number;
}

type MarineFieldFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  properties: MarineFieldProperties;
};

function getMarineFieldCell(
  west: number,
  south: number,
  timestampMs: number,
): MarineFieldFeature {
  const east = west + GRID_STEP_DEGREES;
  const north = south + GRID_STEP_DEGREES;
  const lng = west + GRID_STEP_DEGREES / 2;
  const lat = south + GRID_STEP_DEGREES / 2;
  const time = timestampMs / 1000;

  const equatorHeat = Math.cos((Math.abs(lat) / 75) * Math.PI * 0.8);
  const waveBand = Math.sin(lng * 0.11 + lat * 0.07 + time * 0.9);
  const swellPulse = Math.sin(lng * 0.04 - lat * 0.08 - time * 1.35);

  const date = new Date(timestampMs);
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const localHour = ((utcHour + lng / 15) % 24 + 24) % 24;
  const diurnal = Math.cos(((localHour - 15) / 24) * Math.PI * 2);

  const seaTemperatureC = clamp(
    14 + equatorHeat * 14 + diurnal * 3.2,
    10,
    34,
  );

  const waveHeightM = clamp(
    0.4 + ((waveBand + 1) / 2) * 3.8 + ((swellPulse + 1) / 2) * 1.4,
    0.4,
    5.8,
  );
  const wavePhase = (Math.sin(lng * 0.12 - lat * 0.06 + time * 1.7) + 1) / 2;

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    },
    properties: {
      seaTemperatureC,
      waveHeightM,
      wavePhase,
    },
  };
}

function createGlobalMarineField(
  timestampMs: number,
): FeatureCollection<Polygon, MarineFieldProperties> {
  const features: MarineFieldFeature[] = [];

  for (let lat = -72; lat < 72; lat += GRID_STEP_DEGREES) {
    for (let lng = -180; lng < 180; lng += GRID_STEP_DEGREES) {
      features.push(getMarineFieldCell(lng, lat, timestampMs));
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

function toGeoJson(alerts: MarineAlert[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: alerts.map((alert) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: alert.coordinates,
      },
      properties: {
        pointId: alert.pointId,
        stationName: alert.stationName,
        level: alert.level,
        message: alert.message,
        seaTemperatureC: alert.seaTemperatureC,
        waveHeightM: alert.waveHeightM,
        updatedAt: alert.updatedAt,
      },
    })),
  };
}

export function MapView({
  alerts,
  selectedPointId,
  filter,
  onPointSelect,
  fieldTimeMs,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const flowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onPointSelectRef = useRef(onPointSelect);
  const alertsRef = useRef(alerts);
  const fieldTimeRef = useRef(fieldTimeMs);
  const waveAnimationFrameRef = useRef<number | null>(null);

  alertsRef.current = alerts;
  fieldTimeRef.current = fieldTimeMs;
  const [mapReady, setMapReady] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showWave, setShowWave] = useState(true);
  const [showFlow, setShowFlow] = useState(true);
  const [currentMode, setCurrentMode] = useState<CurrentMode>("current1");
  const [showStations, setShowStations] = useState(true);

  onPointSelectRef.current = onPointSelect;

  const geoJsonData = useMemo(() => toGeoJson(alerts), [alerts]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-75.2, 9.7],
      zoom: 5,
      minZoom: 3,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 140, unit: "metric" }), "bottom-left");
    const geolocateControl = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true,
      showAccuracyCircle: true,
    });
    map.addControl(geolocateControl, "top-right");

    geolocateControl.on("geolocate", (event) => {
      const userCenter: [number, number] = [
        event.coords.longitude,
        event.coords.latitude,
      ];
      const bounds = getBoundsFromRadius(userCenter, USER_LOCATION_RADIUS_KM);

      map.fitBounds(bounds, {
        padding: 48,
        duration: 900,
        maxZoom: 8,
      });
    });

    map.on("load", () => {
      const layerAnchorId = map.getLayer("countries-boundary")
        ? "countries-boundary"
        : undefined;

      map.addSource(GLOBAL_FIELD_SOURCE_ID, {
        type: "geojson",
        data: createGlobalMarineField(fieldTimeRef.current),
      });

      map.addLayer(
        {
          id: WAVE_FIELD_LAYER_ID,
          type: "fill",
          source: GLOBAL_FIELD_SOURCE_ID,
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "waveHeightM"],
              0.4,
              "#bfdbfe",
              1.8,
              "#60a5fa",
              2.8,
              "#3b82f6",
              4,
              "#1d4ed8",
              5.8,
              "#1e3a8a",
            ],
            "fill-opacity": 0.45,
            "fill-antialias": false,
          },
        },
        layerAnchorId,
      );

      map.addLayer(
        {
          id: TEMP_FIELD_LAYER_ID,
          type: "fill",
          source: GLOBAL_FIELD_SOURCE_ID,
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "seaTemperatureC"],
              10,
              "#2563eb",
              16,
              "#22d3ee",
              21,
              "#34d399",
              25,
              "#facc15",
              29,
              "#f97316",
              32,
              "#ef4444",
              34,
              "#b91c1c",
            ],
            "fill-opacity": 0.72,
            "fill-antialias": false,
          },
        },
        layerAnchorId,
      );

      const countriesFillColor = map.getPaintProperty("countries-fill", "fill-color");
      if (countriesFillColor && map.getSource("maplibre")) {
        map.addLayer(
          {
            id: LAND_MASK_LAYER_ID,
            type: "fill",
            source: "maplibre",
            "source-layer": "countries",
            paint: {
              "fill-color": countriesFillColor as maplibregl.ExpressionSpecification,
              "fill-opacity": 1,
            },
          },
          layerAnchorId,
        );

        map.addLayer(
          {
            id: COAST_SURF_LAYER_ID,
            type: "line",
            source: "maplibre",
            "source-layer": "countries",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#e0f2fe",
              "line-width": 0.8,
              "line-opacity": 0.14,
              "line-blur": 0.4,
              "line-dasharray": [1.2, 1.6],
            },
          },
          layerAnchorId,
        );
      }

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: toGeoJson([]),
      });

      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-color": [
            "match",
            ["get", "level"],
            "danger",
            "#ef4444",
            "warning",
            "#f97316",
            "watch",
            "#f59e0b",
            "#10b981",
          ],
          "circle-radius": ALERT_BASE_RADIUS_EXPRESSION,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0f172a",
          "circle-opacity": 0.9,
        },
      });

      const animateWave = (time: number) => {
        if (map.getLayer(WAVE_FIELD_LAYER_ID)) {
          const animatedOpacity = 0.38 + 0.12 * (Math.sin(time / 980) + 1) / 2;
          map.setPaintProperty(WAVE_FIELD_LAYER_ID, "fill-opacity", animatedOpacity);
        }
        if (map.getLayer(COAST_SURF_LAYER_ID)) {
          const coastPulse = 0.08 + 0.24 * (Math.sin(time / 620) + 1) / 2;
          map.setPaintProperty(COAST_SURF_LAYER_ID, "line-opacity", coastPulse);
          map.setPaintProperty(COAST_SURF_LAYER_ID, "line-width", 0.5 + coastPulse * 3.2);
          map.setPaintProperty(COAST_SURF_LAYER_ID, "line-dasharray", [
            1 + coastPulse * 3,
            1.8,
          ]);
        }

        waveAnimationFrameRef.current = requestAnimationFrame(animateWave);
      };

      waveAnimationFrameRef.current = requestAnimationFrame(animateWave);

      map.on("click", LAYER_ID, (event) => {
        const feature = event.features?.[0];

        if (!feature || feature.geometry.type !== "Point") {
          return;
        }

        const pointId = String(feature.properties?.pointId ?? "");
        const stationName = String(feature.properties?.stationName ?? "Estacion");
        const message = String(feature.properties?.message ?? "Sin datos");
        const temperature = Number(feature.properties?.seaTemperatureC ?? 0);
        const waveHeight = Number(feature.properties?.waveHeightM ?? 0);

        if (pointId) {
          onPointSelectRef.current(pointId);
        }

        new maplibregl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setHTML(
            `<strong>${stationName}</strong><br/>` +
              `${message}<br/>` +
              `Temp: ${temperature.toFixed(1)} C<br/>` +
              `Oleaje: ${waveHeight.toFixed(1)} m`,
          )
          .addTo(map);
      });

      map.on("mouseenter", LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      const seaLevelLabel = (level: string) => {
        if (level === "danger") return "Peligro";
        if (level === "warning") return "Alerta";
        if (level === "watch") return "Vigilancia";
        return "Estable";
      };

      map.on("click", (event) => {
        const stationHit = map.queryRenderedFeatures(event.point, {
          layers: [LAYER_ID],
        });
        if (stationHit.length > 0) {
          return;
        }

        const landHit = map.queryRenderedFeatures(event.point, {
          layers: [LAND_MASK_LAYER_ID, "countries-fill"].filter((id) =>
            map.getLayer(id),
          ),
        });

        const lngLat = event.lngLat;
        const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(lngLat)
          .addTo(map);

        if (landHit.length > 0) {
          popup.setHTML(
            "<strong>Punto en tierra</strong><br/>Selecciona un punto en el mar para ver sus condiciones.",
          );
          return;
        }

        popup.setHTML(
          `<strong>Consultando el mar...</strong><br/>` +
            `Lat ${lngLat.lat.toFixed(2)}, Lng ${lngLat.lng.toFixed(2)}`,
        );

        fetchMarineConditions(lngLat.lng, lngLat.lat, fieldTimeRef.current)
          .then((conditions) => {
            if (
              conditions.waveHeightM === null &&
              conditions.seaTemperatureC === null
            ) {
              popup.setHTML(
                "<strong>Sin datos marinos</strong><br/>Este punto no tiene cobertura del modelo marino.",
              );
              return;
            }

            const temp = conditions.seaTemperatureC ?? 0;
            const wave = conditions.waveHeightM ?? 0;
            const evaluated = evaluateMarinePoint({
              id: "sea-click",
              stationName: "Punto seleccionado",
              coordinates: [lngLat.lng, lngLat.lat],
              seaTemperatureC: temp,
              waveHeightM: wave,
              updatedAt: conditions.updatedAt,
            });

            const period =
              conditions.wavePeriodS !== null
                ? `${conditions.wavePeriodS.toFixed(1)} s`
                : "n/d";
            const direction =
              conditions.waveDirectionDeg !== null
                ? `${Math.round(conditions.waveDirectionDeg)} grados`
                : "n/d";

            popup.setHTML(
              `<strong>Punto marino</strong><br/>` +
                `Estado: ${seaLevelLabel(evaluated.level)}<br/>` +
                `Temp: ${temp.toFixed(1)} C<br/>` +
                `Oleaje: ${wave.toFixed(1)} m<br/>` +
                `Periodo: ${period}<br/>` +
                `Direccion: ${direction}`,
            );
          })
          .catch(() => {
            popup.setHTML(
              "<strong>Error</strong><br/>No se pudieron obtener las condiciones marinas.",
            );
          });
      });

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      if (waveAnimationFrameRef.current !== null) {
        cancelAnimationFrame(waveAnimationFrameRef.current);
        waveAnimationFrameRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) {
      return;
    }

    const source = map.getSource(GLOBAL_FIELD_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!source) {
      return;
    }

    source.setData(createGlobalMarineField(fieldTimeMs));
  }, [mapReady, fieldTimeMs]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData(geoJsonData as FeatureCollection<Point>);

    if (filter === "all") {
      map.setFilter(LAYER_ID, null);
    } else {
      map.setFilter(LAYER_ID, ["==", ["get", "level"], filter]);
    }

    map.setPaintProperty(LAYER_ID, "circle-radius", [
      "case",
      ["==", ["get", "pointId"], selectedPointId ?? ""],
      [
        "+",
        ALERT_BASE_RADIUS_EXPRESSION,
        3,
      ],
      ALERT_BASE_RADIUS_EXPRESSION,
    ]);
  }, [geoJsonData, filter, selectedPointId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    setLayerVisibility(map, TEMP_FIELD_LAYER_ID, showTemperature);
    setLayerVisibility(map, WAVE_FIELD_LAYER_ID, showWave);
    setLayerVisibility(map, COAST_SURF_LAYER_ID, showWave);
    setLayerVisibility(map, LAYER_ID, showStations);
    setLayerVisibility(map, LAND_MASK_LAYER_ID, showTemperature || showWave);
  }, [showTemperature, showWave, showStations]);

  useEffect(() => {
    const map = mapRef.current;
    const canvas = flowCanvasRef.current;
    if (!mapReady || !map || !canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = map.getContainer().getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    if (!showFlow) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    interface FlowParticle {
      lng: number;
      lat: number;
      age: number;
      maxAge: number;
    }

    const landLayers = [LAND_MASK_LAYER_ID, "countries-fill"].filter((id) =>
      map.getLayer(id),
    );

    const isOcean = (lng: number, lat: number) => {
      if (landLayers.length === 0) {
        return true;
      }
      const projected = map.project([lng, lat]);
      return map.queryRenderedFeatures(projected, { layers: landLayers }).length === 0;
    };

    const respawn = (particle: FlowParticle, randomizeAge: boolean) => {
      const bounds = map.getBounds();
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = bounds.getSouth();
      const north = bounds.getNorth();

      let lng = west + Math.random() * (east - west);
      let lat = south + Math.random() * (north - south);

      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (isOcean(lng, lat)) {
          break;
        }
        lng = west + Math.random() * (east - west);
        lat = south + Math.random() * (north - south);
      }

      particle.lng = lng;
      particle.lat = lat;
      particle.maxAge = 45 + Math.random() * 75;
      particle.age = randomizeAge ? Math.random() * particle.maxAge : 0;
    };

    const particleCount = Math.min(
      2200,
      Math.max(350, Math.floor((width * height) / 750)),
    );
    const particles: FlowParticle[] = [];
    for (let i = 0; i < particleCount; i += 1) {
      const particle: FlowParticle = { lng: 0, lat: 0, age: 0, maxAge: 0 };
      respawn(particle, true);
      particles.push(particle);
    }

    let rafId = 0;
    let lastTime = performance.now();
    const baseSpeedPx = 60;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const timeSec = now / 1000;

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.075)";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(176, 190, 210, 0.42)";
      ctx.beginPath();

      const coastHits: Array<[number, number, number, number]> = [];
      for (const particle of particles) {
        const start = map.project([particle.lng, particle.lat]);
        const [fu, fv] = getFlowVector(particle.lng, particle.lat, timeSec, currentMode);
        const magnitude = Math.hypot(fu, fv) || 0.0001;
        const probe = map.project([
          particle.lng + (fu / magnitude) * 0.5,
          particle.lat + (fv / magnitude) * 0.5,
        ]);

        let dx = probe.x - start.x;
        let dy = probe.y - start.y;
        const dl = Math.hypot(dx, dy) || 0.0001;
        dx /= dl;
        dy /= dl;

        const speedPx = baseSpeedPx * (0.4 + Math.min(1.4, magnitude)) * dt;
        const nextX = start.x + dx * speedPx;
        const nextY = start.y + dy * speedPx;
        const nextLngLat = map.unproject([nextX, nextY]);
        const hitsLand = !isOcean(nextLngLat.lng, nextLngLat.lat);

        if (hitsLand) {
          coastHits.push([start.x, start.y, dx, dy]);
          respawn(particle, false);
          continue;
        }

        ctx.moveTo(start.x, start.y);
        ctx.lineTo(nextX, nextY);

        particle.lng = nextLngLat.lng;
        particle.lat = nextLngLat.lat;
        particle.age += 1;

        if (
          particle.age > particle.maxAge ||
          nextX < 0 ||
          nextY < 0 ||
          nextX > width ||
          nextY > height
        ) {
          respawn(particle, false);
        }
      }

      ctx.stroke();
      if (coastHits.length > 0) {
        ctx.beginPath();
        for (const [x, y, dx, dy] of coastHits) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + dx * 4.5, y + dy * 4.5);
        }
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "rgba(226, 242, 255, 0.62)";
        ctx.stroke();
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    const clearCanvas = () => {
      ctx.clearRect(0, 0, width, height);
    };

    map.on("movestart", clearCanvas);
    map.on("resize", resize);

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(map.getContainer());

    return () => {
      cancelAnimationFrame(rafId);
      map.off("movestart", clearCanvas);
      map.off("resize", resize);
      resizeObserver.disconnect();
      ctx.clearRect(0, 0, width, height);
    };
  }, [mapReady, showFlow, currentMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPointId) {
      return;
    }

    const selected = alertsRef.current.find(
      (alert) => alert.pointId === selectedPointId,
    );
    if (!selected) {
      return;
    }

    map.flyTo({
      center: selected.coordinates,
      zoom: Math.max(map.getZoom(), 6.5),
      essential: true,
    });
  }, [selectedPointId]);

  return (
    <div className="map-wrapper">
      <div className="map-root" ref={mapContainerRef} />
      <canvas className="flow-canvas" ref={flowCanvasRef} aria-hidden="true" />
      <section
        className={`map-overlay-panel${isPanelOpen ? "" : " collapsed"}`}
        aria-label="Capas de visualizacion marina"
      >
        <button
          type="button"
          className="overlay-panel-header"
          aria-expanded={isPanelOpen}
          onClick={() => setIsPanelOpen((open) => !open)}
        >
          <span>Visualizacion del mar</span>
          <span className="overlay-panel-chevron" aria-hidden="true">
            {isPanelOpen ? "\u2212" : "+"}
          </span>
        </button>

        {isPanelOpen && (
          <div className="overlay-panel-body">
            <label className="overlay-toggle">
              <input
                type="checkbox"
                checked={showTemperature}
                onChange={(event) => setShowTemperature(event.target.checked)}
              />
              Temperatura del mar
            </label>

            <label className="overlay-toggle">
              <input
                type="checkbox"
                checked={showWave}
                onChange={(event) => setShowWave(event.target.checked)}
              />
              Oleaje animado
            </label>

            <label className="overlay-toggle">
              <input
                type="checkbox"
                checked={showFlow}
                onChange={(event) => setShowFlow(event.target.checked)}
              />
              Corrientes (estelas)
            </label>
            <div className="overlay-current-mode" role="radiogroup" aria-label="Modo de corriente">
              <label>
                <input
                  type="radio"
                  name="current-mode"
                  value="current1"
                  checked={currentMode === "current1"}
                  onChange={() => setCurrentMode("current1")}
                />
                Corriente 1
              </label>
              <label>
                <input
                  type="radio"
                  name="current-mode"
                  value="counter2"
                  checked={currentMode === "counter2"}
                  onChange={() => setCurrentMode("counter2")}
                />
                Contracorriente 2
              </label>
              <label>
                <input
                  type="radio"
                  name="current-mode"
                  value="counter3"
                  checked={currentMode === "counter3"}
                  onChange={() => setCurrentMode("counter3")}
                />
                Contracorriente 3
              </label>
            </div>

            <label className="overlay-toggle">
              <input
                type="checkbox"
                checked={showStations}
                onChange={(event) => setShowStations(event.target.checked)}
              />
              Estaciones y alertas
            </label>
          </div>
        )}
      </section>
      <aside className="map-scale-legend" aria-label="Rangos informativos de mar">
        <span className="legend-title">Temp (C):</span>
        <span className="legend-chip">
          <span className="legend-dot temp-low" aria-hidden="true" />
          <small>&lt;= {TEMPERATURE_THRESHOLDS.lowWarning}</small>
        </span>
        <span className="legend-chip">
          <span className="legend-dot temp-high" aria-hidden="true" />
          <small>&gt;= {TEMPERATURE_THRESHOLDS.highWarning}</small>
        </span>
        <span className="legend-chip">
          <span className="legend-dot temp-anomaly" aria-hidden="true" />
          <small>&gt;= {TEMPERATURE_THRESHOLDS.highDanger}</small>
        </span>
        <span className="legend-sep" aria-hidden="true">|</span>
        <span className="legend-title">Oleaje (m):</span>
        <span className="legend-chip">
          <span className="legend-dot wave-watch" aria-hidden="true" />
          <small>&gt;= {WAVE_THRESHOLDS.watch}</small>
        </span>
        <span className="legend-chip">
          <span className="legend-dot wave-warning" aria-hidden="true" />
          <small>&gt;= {WAVE_THRESHOLDS.warning}</small>
        </span>
        <span className="legend-chip">
          <span className="legend-dot wave-danger" aria-hidden="true" />
          <small>&gt;= {WAVE_THRESHOLDS.danger}</small>
        </span>
      </aside>
    </div>
  );
}
