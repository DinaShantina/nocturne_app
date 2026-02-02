"use client"

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';

interface Stamp {
  id: string; city: string; country: string; venue: string; 
  color: string; image?: string; lat?: number; lng?: number; 
  date: string; category?: string;
}

// Added onCitySelect to the interface
interface NocturneMapProps {
  stamps: Stamp[];
  onSelectLocation: () => void;
  onCitySelect: (country: string, city: string) => void;
}

const createCityIcon = (count: number, color: string, image?: string) => {
  const glowSize = Math.min(15 + (count * 5), 40);
  
  return L.divIcon({
    className: 'city-hub-icon',
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
        ${image 
          ? `<img src="${image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; opacity: 0.7;" />` 
          : `<img src="/logo.png" style="width: 50%; height: 50%; object-fit: contain; opacity: 0.2; filter: grayscale(100%);" />`
        }
        <div style="
          position: absolute; bottom: -5px; right: -5px;
          background: white; color: black; font-family: monospace;
          font-weight: 900; font-size: 8px; padding: 2px 4px;
          border-radius: 4px; border: 1px solid black;
        ">
          ${count.toString().padStart(2, '0')}
        </div>
      </div>
    `,
    iconSize: [45, 45],
    iconAnchor: [22, 22],
  });
};

// Added onCitySelect here 
export default function NocturneMap({ stamps, onSelectLocation, onCitySelect }: NocturneMapProps) {
  // Group stamps by City
  const cityHubs = stamps.reduce((acc, stamp) => {
    if (!stamp.lat || !stamp.lng) return acc;
    const key = `${stamp.city.toUpperCase()}`;
    if (!acc[key]) {
      acc[key] = { 
        city: stamp.city, 
        country: stamp.country, // Added country here so we can pass it to the filter
        lat: stamp.lat, 
        lng: stamp.lng, 
        items: [], 
        color: stamp.color 
      };
    }
    acc[key].items.push(stamp);
    return acc;
  }, {} as Record<string, { city: string, country: string, lat: number, lng: number, items: Stamp[], color: string }>);

  return (
    <div className="h-[500px] w-full rounded-[40px] overflow-hidden border border-white/10 relative shadow-2xl">
      <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: '#050505' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {Object.values(cityHubs).map((hub) => (
          <Marker key={hub.city} position={[hub.lat, hub.lng]} icon={createCityIcon(hub.items.length, hub.color, hub.items[0].image)}>
            <Popup className="nocturne-popup">
              <div className="w-48 max-h-80 flex flex-col bg-zinc-900 text-white font-mono p-1">
                <div className="mb-3 border-b border-white/10 pb-2">
                  <p className="text-[10px] text-teal-400 font-black tracking-widest uppercase">{hub.city}</p>
                  <p className="text-[8px] text-white/40 uppercase">{hub.items.length} STAMPS COLLECTED</p>
                </div>
                
                <div className="max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-2 mb-4">
                  {hub.items.map(item => (
                    <div key={item.id} className="text-[9px] border-l-2 border-teal-500/30 pl-2 py-1">
                      <p className="font-black text-white uppercase leading-none">{item.venue}</p>
                      <p className="text-white/40 text-[7px]">{item.date.replace(/-/g, '.')} • {item.category || 'EVENT'}</p>
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
        .nocturne-popup .leaflet-popup-content-wrapper { background: #09090b !important; color: white !important; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px !important; }
        .nocturne-popup .leaflet-popup-tip { background: #09090b !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(45, 212, 191, 0.3); }
      `}</style>
    </div>
  );
}