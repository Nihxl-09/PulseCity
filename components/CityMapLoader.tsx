"use client";

import dynamic from "next/dynamic";

const CityMap = dynamic(() => import("./CityMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[460px] place-items-center rounded-b-2xl bg-slate-900 text-sm text-slate-400 sm:h-[560px]">
      Loading interactive city map…
    </div>
  ),
});

type Props = {
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

export default function CityMapLoader(props: Props) {
  return <CityMap {...props} />;
}