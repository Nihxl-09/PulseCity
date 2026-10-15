"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  showGeographicBasemap: boolean;
  routeFromZoneId: string;
  routeToZoneId: string;
};

const zones = [
  {
    id: "ward-1",
    name: "North Quarter",
    center: [77.5946, 12.985] as [number, number],
  },
  {
    id: "ward-2",
    name: "Market District",
    center: [77.603, 12.975] as [number, number],
  },
  {
    id: "ward-3",
    name: "Riverside",
    center: [77.617, 12.987] as [number, number],
  },
  {
    id: "ward-4",
    name: "South Quarter",
    center: [77.594, 12.959] as [number, number],
  },
  {
    id: "ward-5",
    name: "Industrial Zone",
    center: [77.616, 12.959] as [number, number],
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

const fictionalWaterways: number[][][][] = [
  [[
    [77.578, 12.999], [77.582, 12.999], [77.582, 12.989],
    [77.579, 12.982], [77.578, 12.976], [77.578, 12.999],
  ]],
  [[
    [77.621, 12.999], [77.635, 12.999], [77.635, 12.991],
    [77.629, 12.991], [77.625, 12.995], [77.621, 12.999],
  ]],
  [[
    [77.632, 12.956], [77.635, 12.952], [77.635, 12.946],
    [77.627, 12.946], [77.63, 12.951], [77.632, 12.956],
  ]],
  [[
    [77.618, 12.974], [77.62, 12.974], [77.62, 12.972],
    [77.618, 12.972], [77.618, 12.974],
  ]],
];

const fictionalParks: number[][][][] = [
  [[
    [77.583, 12.997], [77.608, 12.997], [77.607, 12.99],
    [77.59, 12.99], [77.583, 12.994], [77.583, 12.997],
  ]],
  [[
    [77.609, 12.997], [77.62, 12.997], [77.62, 12.99],
    [77.613, 12.989], [77.608, 12.992], [77.609, 12.997],
  ]],
  [[
    [77.58, 12.963], [77.586, 12.967], [77.589, 12.961],
    [77.584, 12.954], [77.58, 12.955], [77.58, 12.963],
  ]],
  [[
    [77.601, 12.964], [77.606, 12.965], [77.607, 12.961],
    [77.603, 12.958], [77.6, 12.96], [77.601, 12.964],
  ]],
  [[
    [77.624, 12.984], [77.631, 12.984], [77.632, 12.975],
    [77.628, 12.97], [77.624, 12.974], [77.624, 12.984],
  ]],
  [[
    [77.59, 12.951], [77.607, 12.951], [77.61, 12.947],
    [77.59, 12.947], [77.59, 12.951],
  ]],
  [[
    [77.613, 12.956], [77.623, 12.957], [77.625, 12.95],
    [77.614, 12.95], [77.613, 12.956],
  ]],
];

const fictionalBuildings: Array<[number, number, number, number]> = [
  [77.583, 12.993, 77.586, 12.996], [77.587, 12.993, 77.591, 12.996],
  [77.594, 12.993, 77.598, 12.996], [77.6, 12.993, 77.604, 12.996],
  [77.614, 12.993, 77.618, 12.996], [77.622, 12.993, 77.626, 12.996],
  [77.629, 12.993, 77.633, 12.996], [77.583, 12.984, 77.587, 12.987],
  [77.59, 12.984, 77.594, 12.987], [77.598, 12.984, 77.602, 12.987],
  [77.605, 12.984, 77.609, 12.987], [77.615, 12.984, 77.619, 12.987],
  [77.622, 12.984, 77.626, 12.987], [77.63, 12.984, 77.633, 12.987],
  [77.583, 12.972, 77.587, 12.975], [77.59, 12.972, 77.594, 12.975],
  [77.598, 12.972, 77.602, 12.975], [77.605, 12.972, 77.609, 12.975],
  [77.615, 12.972, 77.619, 12.975], [77.622, 12.972, 77.626, 12.975],
  [77.63, 12.972, 77.633, 12.975], [77.583, 12.96, 77.587, 12.963],
  [77.59, 12.96, 77.594, 12.963], [77.598, 12.96, 77.602, 12.963],
  [77.605, 12.96, 77.609, 12.963], [77.615, 12.96, 77.619, 12.963],
  [77.622, 12.96, 77.626, 12.963], [77.63, 12.96, 77.633, 12.963],
  [77.583, 12.95, 77.587, 12.953], [77.598, 12.95, 77.602, 12.953],
  [77.605, 12.95, 77.609, 12.953], [77.615, 12.95, 77.619, 12.953],
  [77.622, 12.95, 77.626, 12.953],
];

const fictionalRoads: number[][][] = [
  [[77.58, 12.989], [77.59, 12.989], [77.602, 12.989], [77.614, 12.989], [77.626, 12.989], [77.634, 12.989]],
  [[77.58, 12.978], [77.59, 12.978], [77.602, 12.978], [77.614, 12.978], [77.626, 12.978], [77.634, 12.978]],
  [[77.58, 12.966], [77.59, 12.966], [77.602, 12.966], [77.614, 12.966], [77.626, 12.966], [77.634, 12.966]],
  [[77.58, 12.954], [77.59, 12.954], [77.602, 12.954], [77.614, 12.954], [77.626, 12.954], [77.634, 12.954]],
  [[77.59, 12.999], [77.59, 12.989], [77.592, 12.978], [77.59, 12.966], [77.591, 12.954], [77.591, 12.947]],
  [[77.602, 12.999], [77.602, 12.989], [77.603, 12.978], [77.602, 12.966], [77.602, 12.954], [77.602, 12.947]],
  [[77.614, 12.999], [77.614, 12.989], [77.614, 12.978], [77.614, 12.966], [77.614, 12.954], [77.614, 12.947]],
  [[77.626, 12.999], [77.626, 12.989], [77.626, 12.978], [77.626, 12.966], [77.626, 12.954], [77.626, 12.947]],
  [[77.581, 12.978], [77.588, 12.981], [77.594, 12.978], [77.59, 12.973]],
  [[77.592, 12.989], [77.594, 12.982], [77.601, 12.978]],
  [[77.604, 12.978], [77.61, 12.976], [77.614, 12.978]],
  [[77.614, 12.989], [77.616, 12.982], [77.626, 12.978]],
  [[77.602, 12.966], [77.598, 12.96], [77.591, 12.954]],
  [[77.614, 12.966], [77.62, 12.96], [77.626, 12.954]],
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
  showGeographicBasemap,
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
    mode: showGeographicBasemap
      ? language === "kn" ? "ಬೆಂಗಳೂರು ಆಧಾರ ನಕ್ಷೆ" : language === "hi" ? "बेंगलुरु आधार मानचित्र" : "Bengaluru basemap"
      : language === "kn" ? "ಕಲ್ಪಿತ ಕಮಾಂಡ್ ನಕ್ಷೆ" : language === "hi" ? "काल्पनिक कमांड मानचित्र" : "Fictional command map",
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
  const [basemapUnavailable, setBasemapUnavailable] = useState(false);
  const [basemapRetry, setBasemapRetry] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const basemapLabels = {
    unavailable: language === "kn"
      ? "ಮೂಲ ನಕ್ಷೆ ಲಭ್ಯವಿಲ್ಲ"
      : language === "hi"
        ? "आधार मानचित्र उपलब्ध नहीं है"
        : "Basemap unavailable",
    fallback: language === "kn"
      ? "ಅನುಕರಿಸಿದ ಪ್ರದೇಶಗಳು ಇನ್ನೂ ಸಂವಾದಾತ್ಮಕವಾಗಿವೆ."
      : language === "hi"
        ? "सिम्युलेटेड क्षेत्र अब भी उपयोग किए जा सकते हैं।"
        : "Simulated areas remain interactive.",
    retry: language === "kn"
      ? "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ"
      : language === "hi"
        ? "फिर प्रयास करें"
        : "Retry map",
  };

  useEffect(() => {
    selectCallbackRef.current = onSelectZone;
  }, [onSelectZone]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [{
          id: "pulse-background",
          type: "background",
          paint: { "background-color": "#111b20" },
        }],
      },
      center: [77.603, 12.975],
      zoom: 13.4,
      minZoom: 10.5,
      maxZoom: 16,
      pitch: 0,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));
    map.on("error", (event) => {
      if (
        map.getSource("openstreetmap") &&
        event.error.message.includes("tile.openstreetmap.org/")
      ) {
        setBasemapUnavailable(true);
      }
    });

    map.on("load", () => {
      setMapReady(true);
      map.addSource("pulse-landcover", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            ...fictionalWaterways.map((coordinates, index) => ({
              type: "Feature" as const,
              properties: { kind: "water", id: `water-${index}` },
              geometry: { type: "Polygon" as const, coordinates },
            })),
            ...fictionalParks.map((coordinates, index) => ({
              type: "Feature" as const,
              properties: { kind: "park", id: `park-${index}` },
              geometry: { type: "Polygon" as const, coordinates },
            })),
          ],
        },
      });
      map.addLayer({
        id: "pulse-water",
        type: "fill",
        source: "pulse-landcover",
        filter: ["==", ["get", "kind"], "water"],
        paint: {
          "fill-color": "#163f50",
          "fill-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "pulse-parks",
        type: "fill",
        source: "pulse-landcover",
        filter: ["==", ["get", "kind"], "park"],
        paint: {
          "fill-color": "#244438",
          "fill-opacity": 0.94,
        },
      });

      map.addSource("pulse-buildings", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: fictionalBuildings.map(([minLng, minLat, maxLng, maxLat], index) => ({
            type: "Feature" as const,
            properties: { kind: index % 7 === 0 ? "landmark" : "building" },
            geometry: {
              type: "Polygon" as const,
              coordinates: [[
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ]],
            },
          })),
        },
      });
      map.addLayer({
        id: "pulse-building-fills",
        type: "fill",
        source: "pulse-buildings",
        paint: {
          "fill-color": [
            "match",
            ["get", "kind"],
            "landmark",
            "#34444a",
            "#29383e",
          ],
          "fill-opacity": 0.98,
        },
      });
      map.addLayer({
        id: "pulse-building-outlines",
        type: "line",
        source: "pulse-buildings",
        paint: {
          "line-color": "#405158",
          "line-width": 0.65,
          "line-opacity": 0.75,
        },
      });

      map.addSource("pulse-streets", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: fictionalRoads.map((coordinates, index) => ({
            type: "Feature" as const,
            properties: { kind: index < 8 ? "main" : "local" },
            geometry: { type: "LineString" as const, coordinates },
          })),
        },
      });
      map.addLayer({
        id: "pulse-street-casings",
        type: "line",
        source: "pulse-streets",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#17272c",
          "line-width": [
            "match",
            ["get", "kind"],
            "main",
            16,
            10,
          ],
        },
      });
      map.addLayer({
        id: "pulse-street-surfaces",
        type: "line",
        source: "pulse-streets",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#35474b",
          "line-width": [
            "match",
            ["get", "kind"],
            "main",
            12,
            7,
          ],
        },
      });

      map.addSource("pulse-roundabout", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: [77.5885, 12.978],
            },
          }],
        },
      });
      map.addLayer({
        id: "pulse-roundabout-road",
        type: "circle",
        source: "pulse-roundabout",
        paint: {
          "circle-radius": 34,
          "circle-color": "#35474b",
          "circle-stroke-color": "#17272c",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "pulse-roundabout-island",
        type: "circle",
        source: "pulse-roundabout",
        paint: {
          "circle-radius": 20,
          "circle-color": "#244438",
          "circle-stroke-color": "#35474b",
          "circle-stroke-width": 5,
        },
      });

      map.addSource("pulse-zones", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: zones.map((zone) => ({
            type: "Feature" as const,
            properties: { id: zone.id, name: mapNames[zone.name] ?? zone.name },
            geometry: { type: "Point" as const, coordinates: zone.center },
          })),
        },
      });
      map.addLayer({
        id: "pulse-zone-fills",
        type: "circle",
        source: "pulse-zones",
        paint: {
          "circle-color": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            crisisColor,
            "#d18468",
          ],
          "circle-radius": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            48,
            42,
          ],
          "circle-opacity": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            Math.max(0.28, Math.min(0.44, impact / 220)),
            0.24,
          ],
        },
      });

      map.addLayer({
        id: "pulse-zone-outlines",
        type: "circle",
        source: "pulse-zones",
        paint: {
          "circle-color": "rgba(0, 0, 0, 0)",
          "circle-stroke-color": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            "#f5c99f",
            "#e3a17f",
          ],
          "circle-radius": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            48,
            42,
          ],
          "circle-stroke-width": [
            "case",
            ["==", ["get", "id"], selectedZoneId],
            3,
            2,
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
          "text-size": ["interpolate", ["linear"], ["zoom"], 12, 9, 13.2, 11],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#f0e9dc",
          "text-halo-color": "#172228",
          "text-halo-width": 1.5,
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
          "circle-stroke-color": "#18262b",
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: "pulse-service-labels",
        type: "symbol",
        source: "pulse-services",
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 12, 8, 13.2, 10],
          "text-offset": [0, 1.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#e4e8e4",
          "text-halo-color": "#172228",
          "text-halo-width": 1.5,
        },
      });

      map.addSource("pulse-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "pulse-route-casing",
        type: "line",
        source: "pulse-route",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": "#101a1e",
          "line-width": 7,
          "line-opacity": 0.92,
        },
      });
      map.addLayer({
        id: "pulse-route-line",
        type: "line",
        source: "pulse-route",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": "#49c3d5",
          "line-width": 3,
          "line-dasharray": [1.5, 1.5],
        },
      });
      map.addLayer({
        id: "pulse-route-points",
        type: "circle",
        source: "pulse-route",
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#49c3d5",
          "circle-stroke-color": "#101a1e",
          "circle-stroke-width": 2,
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

      const fitCityBounds = () => {
        const isCompact = map.getContainer().clientWidth < 480;
        map.fitBounds(
          [
            [77.578, 12.948],
            [77.635, 12.999],
          ],
          {
            padding: isCompact
              ? { top: 60, right: 60, bottom: 60, left: 60 }
              : { top: 64, right: 48, bottom: 48, left: 48 },
            maxZoom: isCompact ? 12.6 : 13.2,
            duration: 0,
          }
        );
      };
      map.on("resize", fitCityBounds);
      fitCityBounds();

    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Initialize the map once; changing scenario styles are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const fictionalLayers = [
      "pulse-water",
      "pulse-parks",
      "pulse-building-fills",
      "pulse-building-outlines",
      "pulse-street-casings",
      "pulse-street-surfaces",
      "pulse-roundabout-road",
      "pulse-roundabout-island",
    ];

    for (const layerId of fictionalLayers) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          "visibility",
          showGeographicBasemap ? "none" : "visible"
        );
      }
    }

    if (!showGeographicBasemap) {
      if (map.getLayer("openstreetmap")) map.removeLayer("openstreetmap");
      if (map.getSource("openstreetmap")) map.removeSource("openstreetmap");
      return;
    }

    if (basemapRetry > 0) {
      if (map.getLayer("openstreetmap")) map.removeLayer("openstreetmap");
      if (map.getSource("openstreetmap")) map.removeSource("openstreetmap");
    }

    if (!map.getSource("openstreetmap")) {
      map.addSource("openstreetmap", {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      });
    }
    if (!map.getLayer("openstreetmap")) {
      map.addLayer(
        {
          id: "openstreetmap",
          type: "raster",
          source: "openstreetmap",
        },
        "pulse-water"
      );
    }
  }, [basemapRetry, mapReady, showGeographicBasemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateLayers = () => {
      if (!map.getLayer("pulse-zone-fills")) return;

      map.setPaintProperty("pulse-zone-fills", "circle-color", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        crisisColor,
        "#d18468",
      ]);
      map.setPaintProperty("pulse-zone-fills", "circle-opacity", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        Math.max(0.28, Math.min(0.44, impact / 220)),
        0.24,
      ]);

      map.setPaintProperty("pulse-zone-fills", "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        48,
        42,
      ]);

      map.setPaintProperty("pulse-zone-outlines", "circle-stroke-color", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        "#f5c99f",
        "#e3a17f",
      ]);
      map.setPaintProperty("pulse-zone-outlines", "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        48,
        42,
      ]);
      map.setPaintProperty("pulse-zone-outlines", "circle-stroke-width", [
        "case",
        ["==", ["get", "id"], selectedZoneId],
        3,
        2,
      ]);
      const zoneSource = map.getSource("pulse-zones") as maplibregl.GeoJSONSource | undefined;
      zoneSource?.setData({
        type: "FeatureCollection",
        features: zones.map((zone) => ({
          type: "Feature" as const,
          properties: { id: zone.id, name: mapNames[zone.name] ?? zone.name },
          geometry: { type: "Point" as const, coordinates: zone.center },
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
                }, {
                  type: "Feature",
                  properties: { kind: "start" },
                  geometry: {
                    type: "Point",
                    coordinates: routeStart.center,
                  },
                }, {
                  type: "Feature",
                  properties: { kind: "end" },
                  geometry: {
                    type: "Point",
                    coordinates: routeEnd.center,
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
    showGeographicBasemap,
    routeFromZoneId,
    routeToZoneId,
    language,
    mapNames,
  ]);

  return (
    <div className={`pulse-city-map relative h-[420px] w-full overflow-hidden rounded-b-2xl bg-slate-900 sm:h-[640px] ${showGeographicBasemap ? "is-geographic" : "is-fictional"}`}>
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {basemapUnavailable && showGeographicBasemap && (
        <div className="pulse-map-fallback" role="status" aria-live="polite">
          <div>
            <strong>{basemapLabels.unavailable}</strong>
            <p>{basemapLabels.fallback}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBasemapUnavailable(false);
              setBasemapRetry((value) => value + 1);
            }}
          >
            {basemapLabels.retry}
          </button>
        </div>
      )}

      <div className="pulse-map-overlay pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">{mapLabels.mode}</p>
        <p className="font-bold">{crisisName} {mapLabels.scenario}</p>
        <p className="mt-1 text-slate-300">{mapLabels.impact}: {Math.round(impact)}%</p>
      </div>

      {showServicePoints && (
        <div className="pulse-map-overlay pulse-map-legend pointer-events-none absolute bottom-4 left-4 z-10 flex gap-3 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-400" />{mapLabels.medical}</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rotate-45 bg-emerald-400" />{mapLabels.shelter}</span>
        </div>
      )}
      {routeFromZoneId && routeToZoneId && routeFromZoneId !== routeToZoneId && (
        <div className="pulse-map-overlay pulse-map-route-notice pointer-events-none absolute bottom-4 right-4 z-10 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
          {mapLabels.route}
        </div>
      )}
    </div>
  );
}