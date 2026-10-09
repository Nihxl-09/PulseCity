"use client";

import { useEffect, useMemo, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

maplibregl.setWorkerUrl(
  new URL("../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href
);

type CrisisMapProps = {
  selectedZoneId: string;
  impact: number;
  crisisName: string;
  crisisColor: string;
  onSelectZone: (zoneId: string) => void;
  language: "en" | "kn" | "hi";
  showRiskAreas: boolean;
  showServicePoints: boolean;
  routeFromZoneId: string;
  routeToZoneId: string;
};

const zones = [
  {
    id: "ward-1",
    name: "North Quarter",
    center: [77.5946, 12.985] as [number, number],
    ring: [
      [77.585, 12.990],
      [77.598, 12.993],
      [77.605, 12.985],
      [77.594, 12.978],
      [77.585, 12.990],
    ],
  },
  {
    id: "ward-2",
    name: "Market District",
    center: [77.603, 12.975] as [number, number],
    ring: [
      [77.596, 12.981],
      [77.610, 12.984],
      [77.616, 12.976],
      [77.605, 12.969],
      [77.596, 12.981],
    ],
  },
  {
    id: "ward-3",
    name: "Riverside",
    center: [77.617, 12.987] as [number, number],
    ring: [
      [77.609, 12.993],
      [77.623, 12.997],
      [77.628, 12.988],
      [77.617, 12.981],
      [77.609, 12.993],
    ],
  },
  {
    id: "ward-4",
    name: "South Quarter",
    center: [77.594, 12.959] as [number, number],
    ring: [
      [77.586, 12.966],
      [77.600, 12.967],
      [77.605, 12.957],
      [77.594, 12.951],
      [77.586, 12.966],
    ],
  },
  {
    id: "ward-5",
    name: "Industrial Zone",
    center: [77.616, 12.959] as [number, number],
    ring: [
      [77.608, 12.966],
      [77.622, 12.968],
      [77.628, 12.958],
      [77.616, 12.951],
      [77.608, 12.966],
    ],
  },
];

const hospitals: Array<{ name: string; coordinates: [number, number] }> = [
  { name: "Central Medical Centre", coordinates: [77.611, 12.969] },
  { name: "North Response Hospital", coordinates: [77.590, 12.985] },
];

const shelters: Array<{ name: string; coordinates: [number, number] }> = [
  { name: "Civic Shelter", coordinates: [77.589, 12.974] },
  { name: "Community Safe Centre", coordinates: [77.619, 12.973] },
  { name: "South Support Centre", coordinates: [77.605, 12.951] },
];

export default function CityMap({
  selectedZoneId,
  impact,
  crisisName,
  crisisColor,
  onSelectZone,
  language,
  showRiskAreas,
  showServicePoints,
  routeFromZoneId,
  routeToZoneId,
}: CrisisMapProps) {
  const mapNames = useMemo<Record<string, string>>(
    (): Record<string, string> => language === "kn"
      ? {
          "North Quarter": "ಉತ್ತರ ವಲಯ",
          "Market District": "ಮಾರುಕಟ್ಟೆ ವಲಯ",
          Riverside: "ನದಿತೀರ",
          "South Quarter": "ದಕ್ಷಿಣ ವಲಯ",
          "Industrial Zone": "ಕೈಗಾರಿಕಾ ವಲಯ",
          "Central Medical Centre": "ಕೇಂದ್ರ ವೈದ್ಯಕೀಯ ಕೇಂದ್ರ",
          "North Response Hospital": "ಉತ್ತರ ಪ್ರತಿಕ್ರಿಯೆ ಆಸ್ಪತ್ರೆ",
          "Civic Shelter": "ನಾಗರಿಕ ಆಶ್ರಯ",
          "Community Safe Centre": "ಸಮುದಾಯ ಸುರಕ್ಷಿತ ಕೇಂದ್ರ",
          "South Support Centre": "ದಕ್ಷಿಣ ಸಹಾಯ ಕೇಂದ್ರ",
        }
      : language === "hi"
        ? {
            "North Quarter": "उत्तर क्षेत्र",
            "Market District": "बाज़ार क्षेत्र",
            Riverside: "नदी किनारा",
            "South Quarter": "दक्षिण क्षेत्र",
            "Industrial Zone": "औद्योगिक क्षेत्र",
            "Central Medical Centre": "केंद्रीय चिकित्सा केंद्र",
            "North Response Hospital": "उत्तर प्रतिक्रिया अस्पताल",
            "Civic Shelter": "नागरिक आश्रय",
            "Community Safe Centre": "सामुदायिक सुरक्षित केंद्र",
            "South Support Centre": "दक्षिण सहायता केंद्र",
          }
        : {},
    [language]
  );
  const mapLabels = {
    scenario: language === "kn" ? "ಸನ್ನಿವೇಶ" : language === "hi" ? "परिदृश्य" : "scenario",
    impact: language === "kn" ? "ಪ್ರದೇಶದ ಪರಿಣಾಮ" : language === "hi" ? "क्षेत्र प्रभाव" : "Area impact",
    medical: language === "kn" ? "ವೈದ್ಯಕೀಯ" : language === "hi" ? "चिकित्सा" : "Medical",
    shelter: language === "kn" ? "ಆಶ್ರಯ" : language === "hi" ? "आश्रय" : "Shelter",
    route: language === "kn"
      ? "ಉದಾಹರಣೆಯ ಮಾರ್ಗ · ರಸ್ತೆ ಮಾರ್ಗದರ್ಶನವಲ್ಲ"
      : language === "hi"
        ? "उदाहरण मार्ग · सड़क मार्गदर्शन नहीं"
        : "Illustrative route · not road guidance",
  };
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectCallbackRef = useRef(onSelectZone);

  useEffect(() => {
    selectCallbackRef.current = onSelectZone;
  }, [onSelectZone]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          openstreetmap: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "openstreetmap",
            type: "raster",
            source: "openstreetmap",
          },
        ],
      },
      center: [77.603, 12.975],
      zoom: 13.4,
      pitch: 20,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));

    map.on("load", () => {
      map.addSource("pulse-zones", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: zones.map((zone) => ({
            type: "Feature" as const,
            properties: { id: zone.id, name: mapNames[zone.name] ?? zone.name },
            geometry: {
              type: "Polygon" as const,
              coordinates: [zone.ring],
            },
          })),
        },
      });

      map.addLayer({
        id: "pulse-zone-fills",
        type: "fill",
        source: "pulse-zones",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            crisisColor,
            "#f97316",
          ],
          "fill-opacity": 0.27,
        },
      });

      map.addLayer({
        id: "pulse-zone-outlines",
        type: "line",
        source: "pulse-zones",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            "#f8fafc",
            crisisColor,
          ],
          "line-width": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            3,
            1.5,
          ],
        },
      });

      map.addLayer({
        id: "pulse-zone-labels",
        type: "symbol",
        source: "pulse-zones",
        layout: {
          "symbol-placement": "point",
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#f2f5f4",
          "text-halo-color": "#101820",
          "text-halo-width": 1.7,
        },
      });

      map.addSource("pulse-services", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            ...hospitals.map((place) => ({
              type: "Feature" as const,
              properties: { kind: "hospital", name: mapNames[place.name] ?? place.name },
              geometry: { type: "Point" as const, coordinates: place.coordinates },
            })),
            ...shelters.map((place) => ({
              type: "Feature" as const,
              properties: { kind: "shelter", name: mapNames[place.name] ?? place.name },
              geometry: { type: "Point" as const, coordinates: place.coordinates },
            })),
          ],
        },
      });

      map.addLayer({
        id: "pulse-service-points",
        type: "circle",
        source: "pulse-services",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match",
            ["get", "kind"],
            "hospital",
            "#f06f62",
            "#63c994",
          ],
          "circle-stroke-color": "#101820",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: "pulse-service-labels",
        type: "symbol",
        source: "pulse-services",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#f2f5f4",
          "text-halo-color": "#101820",
          "text-halo-width": 1.5,
        },
      });

      map.addSource("pulse-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "pulse-route-line",
        type: "line",
        source: "pulse-route",
        paint: {
          "line-color": "#f6c85f",
          "line-width": 4,
          "line-dasharray": [2, 1.5],
        },
      });

      map.on("click", "pulse-zone-fills", (event) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id;

        if (typeof id === "string") {
          selectCallbackRef.current(id);
        }
      });

      map.on("mouseenter", "pulse-zone-fills", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "pulse-zone-fills", () => {
        map.getCanvas().style.cursor = "";
      });

    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Initialize the map once; changing scenario styles are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateLayers = () => {
      if (!map.getLayer("pulse-zone-fills")) return;

      map.setPaintProperty("pulse-zone-fills", "fill-color", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        crisisColor,
        "#f97316",
      ]);

      map.setPaintProperty("pulse-zone-fills", "fill-opacity", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        Math.max(0.2, Math.min(0.55, impact / 180)),
        0.2,
      ]);

      map.setPaintProperty("pulse-zone-outlines", "line-color", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        "#f8fafc",
        crisisColor,
      ]);
      const zoneSource = map.getSource("pulse-zones") as maplibregl.GeoJSONSource | undefined;
      zoneSource?.setData({
        type: "FeatureCollection",
        features: zones.map((zone) => ({
          type: "Feature" as const,
          properties: { id: zone.id, name: mapNames[zone.name] ?? zone.name },
          geometry: { type: "Polygon" as const, coordinates: [zone.ring] },
        })),
      });
      const serviceSource = map.getSource("pulse-services") as maplibregl.GeoJSONSource | undefined;
      serviceSource?.setData({
        type: "FeatureCollection",
        features: [
          ...hospitals.map((place) => ({
            type: "Feature" as const,
            properties: { kind: "hospital", name: mapNames[place.name] ?? place.name },
            geometry: { type: "Point" as const, coordinates: place.coordinates },
          })),
          ...shelters.map((place) => ({
            type: "Feature" as const,
            properties: { kind: "shelter", name: mapNames[place.name] ?? place.name },
            geometry: { type: "Point" as const, coordinates: place.coordinates },
          })),
        ],
      });

      map.setLayoutProperty(
        "pulse-zone-fills",
        "visibility",
        showRiskAreas ? "visible" : "none"
      );
      map.setLayoutProperty(
        "pulse-zone-outlines",
        "visibility",
        showRiskAreas ? "visible" : "none"
      );
      map.setLayoutProperty(
        "pulse-zone-labels",
        "visibility",
        showRiskAreas ? "visible" : "none"
      );
      map.setLayoutProperty(
        "pulse-service-points",
        "visibility",
        showServicePoints ? "visible" : "none"
      );
      map.setLayoutProperty(
        "pulse-service-labels",
        "visibility",
        showServicePoints ? "visible" : "none"
      );

      const routeStart = zones.find((zone) => zone.id === routeFromZoneId);
      const routeEnd = zones.find((zone) => zone.id === routeToZoneId);
      const routeSource = map.getSource("pulse-route") as maplibregl.GeoJSONSource | undefined;
      if (routeSource) {
        routeSource.setData({
          type: "FeatureCollection",
          features:
            routeStart && routeEnd && routeStart.id !== routeEnd.id
              ? [{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: [routeStart.center, routeEnd.center],
                  },
                }]
              : [],
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateLayers();
    } else {
      map.once("load", updateLayers);
    }
  }, [
    selectedZoneId,
    impact,
    crisisName,
    crisisColor,
    showRiskAreas,
    showServicePoints,
    routeFromZoneId,
    routeToZoneId,
    language,
    mapNames,
  ]);

  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-b-2xl bg-slate-900 sm:h-[560px]">
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
        <p className="font-bold">{crisisName} {mapLabels.scenario}</p>
        <p className="mt-1 text-slate-300">{mapLabels.impact}: {Math.round(impact)}%</p>
      </div>

      {showServicePoints && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex gap-3 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-400" />{mapLabels.medical}</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rotate-45 bg-emerald-400" />{mapLabels.shelter}</span>
        </div>
      )}
      {routeFromZoneId && routeToZoneId && routeFromZoneId !== routeToZoneId && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
          {mapLabels.route}
        </div>
      )}
    </div>
  );
}