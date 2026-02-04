"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";

// Fix for default marker icons in Leaflet + Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LocationPicker({
  initialPos,
  onLocationSelect,
}: {
  initialPos: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<[number, number]>(initialPos);

  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      },
    });
    return null;
  }

  return (
    <div className="h-48 w-full rounded-xl overflow-hidden border border-white/10 mt-2">
      <MapContainer
        center={initialPos[0] !== 0 ? initialPos : [15.5733, 73.7412]}
        zoom={initialPos[0] !== 0 ? 12 : 2}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Marker position={position} icon={icon} />
        <MapEvents />
      </MapContainer>
    </div>
  );
}
