"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  onSelectLocation: () => void;
  onCitySelect: (country: string, city: string) => void;
}

// 1. Move this OUTSIDE or keep it as a plain function (No Hooks inside here!)
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

export default function NocturneMap({
  stamps,
  // onSelectLocation,
  onCitySelect,
}: NocturneMapProps) {
  // 2. All Hooks (useState, useMemo) go HERE, at the top of the component.

  const cityHubs = stamps.reduce(
    (acc, stamp) => {
      // FIX: Instead of checking stamp.lat/lng directly, get normalized coords
      // Leaflet uses [lat, lng], so we destructure accordingly
      const [lng, lat] = getValidCoordinates(stamp);

      // If we still have 0,0 and no fallback, skip it
      if (lat === 0 && lng === 0) return acc;

      const key = `${stamp.city.toUpperCase().trim()}`;

      if (!acc[key]) {
        acc[key] = {
          city: stamp.city,
          country: stamp.country,
          lat: lat, // Use the valid lat
          lng: lng, // Use the valid lng
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

  return (
    <div className="h-125 w-full rounded-[40px] overflow-hidden border border-white/10 relative shadow-2xl">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", background: "#050505" }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

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
        /* The main popup box */
        .nocturne-popup .leaflet-popup-content-wrapper {
          background: #09090b !important;
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }

        /* The little triangle pointing to the city */
        .nocturne-popup .leaflet-popup-tip {
          background: #09090b !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        /* Remove default Leaflet padding around your content */
        .nocturne-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }

        /* Style the close button if it's visible */
        .nocturne-popup .leaflet-popup-close-button {
          color: white !important;
          padding: 8px !important;
        }
      `}</style>
      ;
    </div>
  );
}
