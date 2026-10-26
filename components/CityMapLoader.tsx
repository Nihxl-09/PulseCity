"use client";

import dynamic from "next/dynamic";

const CityMap = dynamic(() => import("./CityMap"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto grid aspect-square w-full max-w-[640px] place-items-center rounded-b-2xl bg-slate-900 text-sm text-slate-400">
      Loading interactive city map…
    </div>
  ),
});

type Props = {
  language: "en" | "kn" | "hi";
};

export default function CityMapLoader(props: Props) {
  return <CityMap {...props} />;
}