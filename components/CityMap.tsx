"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

type CrisisMapProps = {
  language: "en" | "kn" | "hi";
};

const mapBounds = L.latLngBounds(
  [12.80, 74.79],
  [12.94, 74.90]
);

const mapExtent = [
  [12.80, 74.79],
  [12.80, 74.90],
  [12.94, 74.90],
  [12.94, 74.79],
  [12.80, 74.79],
] as L.LatLngExpression[];

const maskExtent = [
  [12.35, 74.2],
  [12.35, 75.5],
  [13.45, 75.5],
  [13.45, 74.2],
  [12.35, 74.2],
] as L.LatLngExpression[];

export default function CityMap({ language }: CrisisMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const mapLabels = {
    unavailable: language === "kn"
      ? "ನಕ್ಷೆಯ ಟೈಲ್‌ಗಳು ಲಭ್ಯವಿಲ್ಲ"
      : language === "hi" ? "मानचित्र टाइलें उपलब्ध नहीं" : "Map tiles unavailable",
    fallback: language === "kn"
      ? "OpenStreetMap ಟೈಲ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಇಂಟರ್ನೆಟ್ ಅಗತ್ಯವಿದೆ."
      : language === "hi" ? "OpenStreetMap टाइलों के लिए इंटरनेट आवश्यक है." : "OpenStreetMap tiles need an internet connection.",
    retry: language === "kn" ? "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ" : language === "hi" ? "फिर कोशिश करें" : "Retry tiles",
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [12.87, 74.843],
      zoom: 14.5,
      minZoom: 13.5,
      maxZoom: 19,
      maxBounds: mapBounds,
      maxBoundsViscosity: 1,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      attributionControl: true,
      zoomControl: false,
    });
    const tileLayer = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        minZoom: 11,
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      }
    );

    tileLayer.on("tileerror", () => setTilesUnavailable(true));
    tileLayer.addTo(map);

    L.polygon([maskExtent, mapExtent], {
      stroke: false,
      fillColor: "#0c1217",
      fillOpacity: 0.76,
      interactive: false,
      fillRule: "evenodd",
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    map.whenReady(() => map.invalidateSize());

    return () => {
      map.remove();
      tileLayerRef.current = null;
    };
  }, []);

  return (
    <div className="pulse-city-map is-geographic relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-b-2xl bg-slate-900">
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {tilesUnavailable && (
        <div className="pulse-map-fallback" role="status" aria-live="polite">
          <div>
            <strong>{mapLabels.unavailable}</strong>
            <p>{mapLabels.fallback}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTilesUnavailable(false);
              tileLayerRef.current?.redraw();
            }}
          >
            {mapLabels.retry}
          </button>
        </div>
      )}
    </div>
  );
}
