"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { Geolocation } from "@capacitor/geolocation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getValidCoordinates } from "@/lib/utils";

interface Stamp {
  id: string;
  city: string;
  country: string;
  venue: string;
  color: string;
  image?: string;
  lat?: number;
  lng?: number;
  date: string;
  category?: string;
}

interface NocturneMapProps {
  stamps: Stamp[];
  onSelectLocation?: () => void;
  onCitySelect: (country: string, city: string) => void;
}

// 1. Helper function for the glowing city icons
const createCityIcon = (count: number, color: string, image?: string) => {
  const glowSize = Math.min(15 + count * 5, 40);

  return L.divIcon({
    className: "city-hub-icon",
    html: `
      <div style="
        width: 45px; height: 45px; 
        border: 3px solid ${color}; 
        border-radius: 50%; 
        background: black; 
        box-shadow: 0 0 ${glowSize}px ${color}aa;
        display: flex; align-items: center; justify-content: center;
        position: relative;
      ">
        ${
          image
            ? `<img src="${image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; opacity: 0.7;" />`
            : `<div style="width: 50%; height: 50%; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>`
        }
        <div style="
          position: absolute; bottom: -5px; right: -5px;
          background: white; color: black; font-family: monospace;
          font-weight: 900; font-size: 8px; padding: 2px 4px;
          border-radius: 4px; border: 1px solid black;
        ">
          ${count.toString().padStart(2, "0")}
        </div>
      </div>
    `,
    iconSize: [45, 45],
    iconAnchor: [22, 22],
  });
};

// 2. Helper component to move the camera to the user
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 12);
    }
  }, [position, map]);
  return null;
}

export default function NocturneMap({
  stamps,
  onCitySelect,
}: NocturneMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  // 🚀 Hybrid GPS Logic (Web + Native)
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Try native Capacitor first (for Android/iOS)
        const permissions = await Geolocation.requestPermissions().catch(
          () => null,
        );

        if (permissions && permissions.location === "granted") {
          const coordinates = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
          });
          setUserLocation([
            coordinates.coords.latitude,
            coordinates.coords.longitude,
          ]);
        } else {
          // 🌐 Web Fallback for Laptop/Browser
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.error("Web GPS Failed", err),
            { enableHighAccuracy: true },
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Final fallback if the above fails
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
          (err) => console.error("Final GPS Fallback Failed", err),
        );
      }
    };
    fetchLocation();
  }, []);

  // Organize stamps into City Hubs
  const cityHubs = stamps.reduce(
    (acc, stamp) => {
      const [lng, lat] = getValidCoordinates(stamp);
      if (lat === 0 && lng === 0) return acc;

      const key = `${stamp.city.toUpperCase().trim()}`;
      if (!acc[key]) {
        acc[key] = {
          city: stamp.city,
          country: stamp.country,
          lat: lat,
          lng: lng,
          items: [],
          color: stamp.color,
        };
      }
      acc[key].items.push(stamp);
      return acc;
    },
    {} as Record<
      string,
      {
        city: string;
        country: string;
        lat: number;
        lng: number;
        items: Stamp[];
        color: string;
      }
    >,
  );
  function CustomZoomControls() {
    const map = useMap();
    return (
      <div className="absolute bottom-6 right-6 z-1000 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          className="w-12 h-12 bg-black/90 border border-white/20 text-teal-400 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-2xl backdrop-blur-md active:scale-90 transition-all border-b-4 border-b-teal-500/30"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          className="w-12 h-12 bg-black/90 border border-white/20 text-teal-400 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-2xl backdrop-blur-md active:scale-90 transition-all border-b-4 border-b-teal-500/30"
        >
          −
        </button>
      </div>
    );
  }
  return (
    <div className="h-125 w-full rounded-[40px] overflow-hidden border border-white/10 relative shadow-2xl">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", background: "#050505" }}
        zoomControl={false}
      >
        <CustomZoomControls />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {/* 🚀 Recenter map when GPS fixes */}
        {userLocation && <RecenterMap position={userLocation} />}

        {/* 🚀 Blue User Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: "user-marker",
              html: `<div style="width:14px; height:14px; background:#3b82f6; border:2px solid white; border-radius:50%; box-shadow:0 0 15px #3b82f6;"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}
          />
        )}

        {/* City Hub Markers */}
        {Object.values(cityHubs).map((hub) => (
          <Marker
            key={hub.city}
            position={[hub.lat, hub.lng]}
            icon={createCityIcon(
              hub.items.length,
              hub.color,
              hub.items[0].image,
            )}
          >
            <Popup className="nocturne-popup">
              <div className="w-48 max-h-80 flex flex-col bg-zinc-900 text-white font-mono p-1">
                <div className="mb-3 border-b border-white/10 pb-2">
                  <p className="text-[10px] text-teal-400 font-black tracking-widest uppercase">
                    {hub.city}
                  </p>
                  <p className="text-[8px] text-white/40 uppercase">
                    {hub.items.length} STAMPS COLLECTED
                  </p>
                </div>
                <div className="max-h-32 overflow-y-auto flex flex-col gap-2 mb-4">
                  {hub.items.map((item) => (
                    <div
                      key={item.id}
                      className="text-[9px] border-l-2 border-teal-500/30 pl-2 py-1"
                    >
                      <p className="font-black text-white uppercase leading-none">
                        {item.venue}
                      </p>
                      <p className="text-white/40 text-[7px]">
                        {item.date.replace(/-/g, ".")} •{" "}
                        {item.category || "EVENT"}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onCitySelect(hub.country, hub.city)}
                  className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-black text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all active:scale-95"
                >
                  Open City in Passport
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style jsx global>{`
        .nocturne-popup .leaflet-popup-content-wrapper {
          background: #09090b !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .nocturne-popup .leaflet-popup-tip {
          background: #09090b !important;
        }
        .nocturne-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
      `}</style>
    </div>
  );
}
