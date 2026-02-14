"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
});

export default function Map() {
  return (
    <div className="w-full h-screen">
      <LeafletMap />
    </div>
  );
}