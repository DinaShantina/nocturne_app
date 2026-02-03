/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useActionState, useEffect, useState, useMemo, useRef } from "react";
import { submitEvent } from "./actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { calculateTotalTravel } from "./utils/geoUtils";
// Firebase Imports
import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

const NocturneMap = dynamic(() => import("./components/NocturneMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-zinc-900 animate-pulse rounded-2xl flex items-center justify-center font-mono text-xs uppercase text-white/20">
      Booting Map...
    </div>
  ),
});

const ThemeToggle = dynamic(() => import("./components/ThemeToggle"), {
  ssr: false,
});

// --- FIXED CALENDAR COMPONENT ---
const NocturneCalendar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const GENRE_COLORS = {
    TECHNO: "#ff4d4d", // Neon Red
    HOUSE: "#00f2ff", // Nocturne Teal
    AMBIENT: "#bc13fe", // Deep Purple
    RAVE: "#adff2f", // Acid Green
    INDUSTRIAL: "#555555", // Dark Grey
  };

  return (
    <div
      className="relative w-full group"
      onClick={() => inputRef.current?.showPicker()} // Programmatically open native picker
    >
      <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono cursor-pointer flex justify-between items-center group-hover:border-teal-500 transition-colors">
        <span className={value ? "text-white" : "text-gray-500"}>
          {value ? value.replace(/-/g, ".") : "SELECT DATE"}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="text-teal-500"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      <input
        ref={inputRef}
        type="date"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

interface Stamp {
  id: string;
  city: string;
  country: string;
  venue: string;
  activity: string;
  date: string;
  color: string;
  points: number;
  image?: string;
  lat?: number;
  lng?: number;
  category?: string;
  createdAt?:
    | {
        seconds: number;
        nanoseconds: number;
      }
    | any; // 'any' handles the transition from Firestore Timestamp to local Date
}

const CATEGORIES = [
  "RAVE", // For the heavy nights (Techno/Electronic)
  "ART", // Galleries, Exhibitions, Street Art
  "JAZZ", // Live music, Jazz bars
  "DINING", // Underground restaurants, late-night spots
  "LOUNGE", // Chill bars, rooftops
  "CINEMA", // Indie movies, open-air screenings
  "FESTIVAL", // Large scale multi-day events
  "CONCERT", // Live bands, gigs
];

const GENRE_COLORS = {
  RAVE: "#ff4d4d", // Neon Red
  ART: "#bc13fe", // Electric Purple
  JAZZ: "#ffb700", // Amber/Gold
  DINING: "#00f2ff", // Nocturne Teal
  LOUNGE: "#4ade80", // Soft Green
  CINEMA: "#f472b6", // Rose Pink
  FESTIVAL: "#ffffff", // Bright White
  CONCERT: "#3b82f6", // Deep Blue
};

export default function Home() {
  const [state, formAction, isPending] = useActionState(submitEvent, null);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [mounted, setMounted] = useState(false);

  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [view, setView] = useState<"passport" | "map">("passport");
  const [filter, setFilter] = useState<string>("ALL");
  const [imageUploaded, setImageUploaded] = useState(false);
  const [editImageUploaded, setEditImageUploaded] = useState(false);
  const [createDate, setCreateDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [editDate, setEditDate] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [showRedactConfirm, setShowRedactConfirm] = useState(false);
  const [activeCityFilters, setActiveCityFilters] = useState<
    Record<string, string[]>
  >({});
  const [showForm, setShowForm] = useState(false);
  const [countrySortOrder, setCountrySortOrder] = useState<"ALPHA" | "RECENT">(
    "ALPHA",
  );
  const [showSidebar, setShowSidebar] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const totalDistance = useMemo(() => {
    if (!stamps || stamps.length === 0) return 0;
    return calculateTotalTravel(stamps);
  }, [stamps]);

  const toggleCityFilter = (country: string, city: string) => {
    setActiveCityFilters((prev) => {
      const currentForCountry = prev[country] || [];
      const isAlreadySelected = currentForCountry.includes(city.toUpperCase());

      return {
        ...prev,
        // If already selected, clear it (Go back to ALL).
        // If not, set it as the ONLY selected city.
        [country]: isAlreadySelected ? [] : [city.toUpperCase()],
      };
    });
  };
  const detectLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }
    // const normalizedCountry = (countryName: string) => {
    //   if (!countryName) return "";
    //   const name = countryName.trim();
    //   // This merges North Macedonia into your existing Macedonia list
    //   if (name === "North Macedonia") return "Macedonia";
    //   return name;
    // };
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        // Reverse Geocode to get City, Country, and Venue suggestion
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        );
        const data = await res.json();

        // Update form values directly using refs or state
        const form = formRef.current;
        if (form) {
          (form.querySelector('input[name="city"]') as HTMLInputElement).value =
            (data.city || data.locality || "").toUpperCase();
          // This ensures that even if normalizeCountryName fails, you have a string to work with
          const rawCountry = data.countryName || "";
          const normalizedCountry = normalizeCountryName(rawCountry) || "";

          (
            form.querySelector('input[name="country"]') as HTMLInputElement
          ).value = normalizedCountry.toUpperCase();
          // Suggest nearest landmark/venue if available
          if (data.lookupSource === "coordinates" && data.locality) {
            (
              form.querySelector('input[name="venue"]') as HTMLInputElement
            ).placeholder = `SUGGESTION: ${data.locality.toUpperCase()}`;
          }
        }
      } catch (error) {
        console.error("Location error:", error);
      } finally {
        setIsLocating(false);
      }
    });
  };
  useEffect(() => {
    setMounted(true);
    const q = query(collection(db, "stamps"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Stamp[];
      setStamps(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedStamp(null);
        setIsEditing(false);
        setShowDeleteConfirm(null);
        setGalleryIndex(null); // Added this line
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const normalizeCountryName = (countryName: any) => {
    // If countryName is null, undefined, or not a string, return empty string
    if (!countryName || typeof countryName !== "string") return "";

    const name = countryName.trim();

    // Logic for merging the regions
    if (name === "North Macedonia") {
      return "Macedonia";
    }

    return name;
  };

  // --- Stats Logic ---
  const totalStamps = stamps.length;
  const uniqueCities = useMemo(
    () => new Set(stamps.map((s) => s.city.toUpperCase())).size,
    [stamps],
  );

  const handleCreateStamp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    // 1. Prepare variables first
    let imageUrl = "";
    let lat = 0;
    let lng = 0;
    const file = formData.get("image") as File;

    // Normalize the country right away
    const rawCountry = (formData.get("country") as string) || "";
    const finalCountry = normalizeCountryName(rawCountry).toUpperCase();

    try {
      // 2. Upload Image
      if (file && file.name && file.size > 0) {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const storageRef = ref(storage, `stamps/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, compressedFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // 3. Get Coordinates (Geocoding)
      try {
        const result = await submitEvent(null, formData);
        if (result?.success) {
          lat = result.lat || 0;
          lng = result.lng || 0;
        }
      } catch (fetchErr) {
        console.warn("Geocoding failed");
      }

      // 4. Save to Firestore (ONLY ONCE, at the bottom after we have the data)
      const docRef = await addDoc(collection(db, "stamps"), {
        city: ((formData.get("city") as string) || "").toUpperCase(),
        country: finalCountry,
        venue: ((formData.get("venue") as string) || "").toUpperCase(),
        activity: (formData.get("activity") as string) || "",
        category: (formData.get("category") as string) || "",
        date: createDate,
        image: imageUrl,
        lat: lat,
        lng: lng,
        color: ["#22d3ee", "#818cf8", "#f472b6", "#fbbf24", "#34d399"][
          Math.floor(Math.random() * 5)
        ],
        points: Math.floor(Math.random() * 41) + 10,
        createdAt: serverTimestamp(),
      });

      // 5. Success Logic
      const newStamp = {
        id: docRef.id,
        venue: formData.get("venue"),
        createdAt: Date.now(),
      };

      formElement.reset();
      setImageUploaded(false);
      setCreateDate(new Date().toISOString().split("T")[0]);
      setShowForm(false);

      setTimeout(() => {
        const element = document.getElementById(`stamp-${newStamp.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);

      return newStamp;
    } catch (error: unknown) {
      console.error("Stamp creation failed:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStamp) return;

    // 1. Define 'f' FIRST so you can use it
    const f = new FormData(e.currentTarget);

    // 2. Now you can safely normalize the country
    const rawCountry = String(f.get("country") || "");
    const finalCountry = normalizeCountryName(rawCountry).toUpperCase();

    const fileInput = editFormRef.current?.querySelector(
      'input[name="newImage"]',
    ) as HTMLInputElement;
    let file = fileInput?.files?.[0];
    let imageUrl = selectedStamp.image || "";

    try {
      if (file && file.size > 0) {
        file = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
        });
        const storageRef = ref(storage, `stamps/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      await updateDoc(doc(db, "stamps", selectedStamp.id), {
        city: String(f.get("city")).toUpperCase(),
        country: finalCountry, // Using the normalized name
        venue: String(f.get("venue")).toUpperCase(),
        activity: String(f.get("activity")),
        category: String(f.get("category")),
        date: editDate || selectedStamp.date,
        image: imageUrl,
      });

      setIsEditing(false);
      setSelectedStamp(null);
      setEditImageUploaded(false);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // Use 'filter' here because that is what your buttons are changing
  const filteredStamps = stamps.filter(
    (stamp) =>
      filter === "ALL" ||
      stamp.category?.toUpperCase() === filter.toUpperCase(),
  );

  const groupedStamps = useMemo(() => {
    // 1. Group the stamps
    const groups = filteredStamps.reduce(
      (acc, stamp) => {
        const country = stamp.country?.toUpperCase() || "WORLDWIDE";
        if (!acc[country]) acc[country] = [];
        acc[country].push(stamp);
        return acc;
      },
      {} as Record<string, typeof stamps>,
    );

    // 2. Define the country order
    let sortedCountryNames: string[] = [];

    if (countrySortOrder === "ALPHA") {
      // Alphabetical: A -> Z
      sortedCountryNames = Object.keys(groups).sort((a, b) =>
        a.localeCompare(b),
      );
    } else {
      // Recent: Look at the newest stamp in each country and sort countries by that
      sortedCountryNames = Object.keys(groups).sort((a, b) => {
        const newestA = Math.max(
          ...groups[a].map((s) => new Date(s.date || 0).getTime()),
        );
        const newestB = Math.max(
          ...groups[b].map((s) => new Date(s.date || 0).getTime()),
        );
        return newestB - newestA; // Newest country first
      });
    }

    // 3. Reconstruct the object in order
    const orderedGroups: Record<string, typeof stamps> = {};
    sortedCountryNames.forEach((name) => {
      // Inside each country, we still want the newest stamp first
      orderedGroups[name] = [...groups[name]].sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
      );
    });

    return orderedGroups;
  }, [filteredStamps, countrySortOrder]);

  const nextImage = () => {
    if (galleryIndex !== null) {
      setGalleryIndex((galleryIndex + 1) % stamps.length);
    }
  };

  const prevImage = () => {
    if (galleryIndex !== null) {
      setGalleryIndex((galleryIndex - 1 + stamps.length) % stamps.length);
    }
  };
  const handleDeleteImage = async () => {
    if (!selectedStamp) return;

    try {
      const stampRef = doc(db, "stamps", selectedStamp.id);
      await updateDoc(stampRef, {
        image: "", // This triggers the logo fallback in your UI
      });

      // Update local state so the logo appears instantly in the modal
      setSelectedStamp({ ...selectedStamp, image: "" });
      setEditImageUploaded(false);

      // Reset the file input field
      const fileInput = editFormRef.current?.querySelector(
        'input[name="newImage"]',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Redaction failed:", err);
    }
  };

  const handleMapCitySelect = (country: string, city: string) => {
    // 1. Switch View
    setView("passport");

    // 2. Set the Filter (Single Select)
    setActiveCityFilters((prev) => ({
      ...prev,
      [country]: [city.toUpperCase()],
    }));

    // 3. Wait for React to render the Passport view, then scroll
    setTimeout(() => {
      const sectionId = `section-${country.toLowerCase()}`;
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200); // Increased delay slightly to ensure DOM is ready
  };

  // Add this listener to your useEffect
  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 400) setShowScroll(true);
      else setShowScroll(false);
    };
    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const stats = CATEGORIES.map((cat) => {
    const count = stamps.filter((s) => s.category === cat).length;
    const percentage = stamps.length > 0 ? (count / stamps.length) * 100 : 0;
    return { label: cat, percentage, color: GENRE_COLORS[cat] };
  }).filter((stat) => stat.percentage > 0); // Only show categories the user has visited

  const getRank = (count: number) => {
    if (count >= 50) return { name: "GHOST", color: "#ffffff", level: "05" };
    if (count >= 30)
      return { name: "OPERATIVE", color: "#ff4d4d", level: "04" };
    if (count >= 15) return { name: "VANGUARD", color: "#bc13fe", level: "03" };
    if (count >= 5) return { name: "RESIDENT", color: "#00f2ff", level: "02" };
    return { name: "INITIATE", color: "#71717a", level: "01" };
  };

  const currentRank = getRank(stamps.length);

  const getRankData = (count: number) => {
    if (count >= 50)
      return {
        title: "Ghost",
        level: "V",
        color: "text-white shadow-[0_0_10px_#fff]",
      };
    if (count >= 30)
      return { title: "Operative", level: "IV", color: "text-red-500" };
    if (count >= 15)
      return { title: "Vanguard", level: "III", color: "text-purple-500" };
    if (count >= 5)
      return { title: "Resident", level: "II", color: "text-teal-500" };
    return { title: "Initiate", level: "I", color: "text-zinc-500" };
  };

  const rank = getRankData(stamps.length);

  if (!mounted) return null;

  return (
    <>
      {/* 2. SLIDE-OUT SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 h-full z-[9999] transition-all duration-500
    /* Adaptive Background & Borders */
    bg-transparent 
    md:bg-purple-100 md:dark:bg-zinc-950 
    md:border-r border-purple-300/50 dark:border-white/10
    
    ${galleryIndex !== null ? "-translate-x-full" : ""} 
    ${
      showSidebar
        ? "w-80 translate-x-0 bg-purple-100 dark:bg-zinc-950 shadow-2xl md:shadow-none"
        : "w-80 -translate-x-[calc(100%-64px)]"
    }`}
      >
        {/* PEEK AREA (The floating part on mobile) */}
        {!showSidebar && (
          <div
            className="absolute right-0 top-0 w-[64px] h-full flex flex-col items-center py-8 gap-6 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setShowSidebar(true)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-purple-600 p-[2px] shadow-lg">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Profile"
                  width={24}
                  height={24}
                  className="opacity-80"
                />
              </div>
            </div>

            {/* Hide the line on mobile to keep it extra clean */}
            <div className="hidden md:block h-[1px] w-4 bg-white/10" />

            <p className="text-[9px] font-mono text-zinc-400 md:text-zinc-500 [writing-mode:vertical-lr] uppercase tracking-widest drop-shadow-md">
              Dashboard
            </p>
          </div>
        )}

        {/* FULL CONTENT (Visible when open) */}
        <div
          className={`flex-1 flex flex-col p-8 transition-opacity duration-300 ${showSidebar ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {/* Profile Header */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 p-2">
                <Image
                  src="/logo.png"
                  alt="User"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-black italic uppercase tracking-widest text-purple-950 dark:text-white">
                  {rank.title} Curator
                </p>
                <p className="text-[9px] font-mono text-purple-500/80 uppercase font-bold tracking-tight">
                  Access Level {rank.level}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-zinc-600 hover:text-white transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* STATS GRID */}
          <div className="space-y-12">
            {/* Primary Stat */}
            <div className="space-y-2">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Lifetime Exploration
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl md:text-3xl font-black italic uppercase tracking-tighter text-purple-950 dark:text-white leading-none">
                  {totalDistance.toLocaleString()}
                </h3>
                <span className="text-[9px] md:text-[10px] font-mono text-zinc-600 tracking-tighter">
                  KM
                </span>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 -mt-2.5">
              <div className="space-y-1">
                <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
                  Stamps
                </p>
                <p className="text-2xl font-black italic uppercase tracking-tighter text-purple-950 dark:text-white">
                  {stamps.length.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="space-y-1 border-l border-white/5 pl-4">
                <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
                  Cities Visited
                </p>
                <p className="text-2xl font-black italic uppercase tracking-tighter text-purple-950 dark:text-white">
                  {uniqueCities.toString().padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="px-6 py-8 space-y-6 -mt-4">
              <h3 className="text-[10px] font-mono text-zinc-500 tracking-[0.3em] uppercase">
                Cultural DNA
              </h3>

              <div className="space-y-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-mono text-purple-900/60 dark:text-white/70 uppercase">
                        {stat.label}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {Math.round(stat.percentage)}%
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-[2px] w-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${stat.percentage}%`,
                          backgroundColor: stat.color,
                          boxShadow: `0 0 8px ${stat.color}`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                {stamps.length === 0 && (
                  <p className="text-[10px] font-mono text-zinc-600 italic">
                    Awaiting data input...
                  </p>
                )}
              </div>
            </div>

            {/* New Cultural Rank Badge */}
            <div className="px-6 py-4 border-y border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">
                  Clearance Level
                </span>
                <span className="text-[9px] font-mono text-purple-800/50 dark:text-zinc-500">
                  {currentRank.level}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Ranking Glow Indicator */}
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: currentRank.color,
                    // We keep the dynamic color glow, but it will look more vibrant
                    // now that the background isn't pure black.
                    boxShadow: `0 0 12px ${currentRank.color}`,
                  }}
                />
                <h2 className="text-sm font-mono tracking-[0.2em] text-purple-950 dark:text-white uppercase italic">
                  {currentRank.name}
                </h2>
              </div>
              <div className="mt-2 w-full max-w-[100px]">
                <div className="flex justify-between text-[7px] font-mono text-zinc-600 mb-1 uppercase">
                  <span>Progress</span>
                  <span>{stamps.length} Stamps</span>
                </div>
                <div className="h-[1px] w-full bg-white/5 relative">
                  <div
                    className="absolute h-full bg-purple-900/30 dark:bg-white/40 transition-all duration-700"
                    style={{
                      // Example: If 15 is the next milestone
                      width: `${Math.min((stamps.length / 15) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-500 flex flex-col items-center w-full">
        {/* Full width container to handle background colors properly */}
        <div className="w-full flex flex-col items-center px-4">
          <header className="flex flex-col items-center mb-8 mt-16 w-full max-w-4xl relative">
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32 transition-all duration-500 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-xl dark:bg-transparent dark:shadow-none">
                {/* Option A: Using Tailwind's class-based swap (Ensure this is in your JSX) */}
                <div className="relative w-full h-full">
                  {/* Light Logo: Hidden when 'dark' class is present on a parent */}
                  <div className="dark:opacity-0 opacity-100 transition-opacity duration-500 absolute inset-0 p-2">
                    <Image
                      src="/logo_light.png"
                      alt="Nocturne Logo Light"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Dark Logo: Visible ONLY when 'dark' class is present */}
                  <div className="opacity-0 dark:opacity-100 transition-opacity duration-500 absolute inset-0">
                    <Image
                      src="/logo.png"
                      alt="Nocturne Logo Dark"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-[0.4em] uppercase italic">
              Nocturne
            </h1>
            <p className="text-[10px] font-mono text-teal-500 mt-2 tracking-[0.3em] uppercase">
              Cultural Passport
            </p>

            <div className="flex gap-8 mt-8 border-t border-black/5 dark:border-white/5 pt-8">
              <div className="text-center">
                <p className="text-[9px] font-mono text-black/30 dark:text-white/30 tracking-[0.2em] mb-1">
                  TOTAL STAMPS
                </p>
                <p className="text-2xl font-black italic">
                  {totalStamps.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="w-[1px] h-10 bg-black/10 dark:bg-white/10"></div>
              <div className="text-center">
                <p className="text-[9px] font-mono text-black/30 dark:text-white/30 tracking-[0.2em] mb-1">
                  CITIES VISITED
                </p>
                <p className="text-2xl font-black italic">
                  {uniqueCities.toString().padStart(2, "0")}
                </p>
              </div>
            </div>

            {/* Toggle Positioned relative to header */}
            <div className="absolute -top-4 right-0 md:right-4">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-col items-center mb-12">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-10 py-4 rounded-2xl bg-white text-black dark:bg-zinc-900 dark:text-white border border-black/10 dark:border-white/10 font-black italic uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl"
              >
                + Issue New Stamp
              </button>
            ) : (
              <div className="w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-[10px] font-mono opacity-50 hover:opacity-100"
                  >
                    CLOSE [X]
                  </button>
                </div>
                {/* Entry Form */}
                <form
                  ref={formRef}
                  action={formAction}
                  onSubmit={(e) => handleCreateStamp(e)}
                  className="w-full max-w-md space-y-4 mx-auto mb-12 relative z-10 p-8 rounded-[2.5rem] 
                        bg-purple-50/50 border-purple-200 shadow-[0_20px_50px_rgba(147,51,234,0.1)] 
                        dark:bg-white/3 dark:border-white/10 dark:shadow-none transition-all duration-500 border"
                >
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={detectLocation}
                      className="w-full py-2 rounded-xl text-[9px] font-mono uppercase tracking-[0.2em] transition-all
                            border border-purple-400 text-purple-600 hover:bg-purple-100
                            dark:border-teal-500/30 dark:text-teal-500 dark:hover:bg-teal-500/10"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLocating
                          ? "Scanning Environment..."
                          : "📍 Detect Location"}
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        name="city"
                        placeholder="CITY"
                        required
                        className="rounded-xl px-4 py-3 text-xs font-mono uppercase outline-none transition-all border
                              bg-white border-purple-200 text-purple-900 placeholder:text-purple-300
                              dark:bg-black/60 dark:border-white/10 dark:text-white dark:placeholder:text-white dark:focus:border-teal-500"
                      />
                      <input
                        name="country"
                        placeholder="COUNTRY"
                        required
                        className="rounded-xl px-4 py-3 text-xs font-mono uppercase outline-none transition-all border
                              bg-white border-purple-200 text-purple-900 placeholder:text-purple-300
                              dark:bg-black/60 dark:border-white/10 dark:text-white dark:placeholder:text-white dark:focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      name="category"
                      className="rounded-xl px-4 py-3 text-xs font-mono uppercase outline-none border transition-all
                            bg-white border-purple-200 text-purple-900
                            dark:bg-black/60 dark:border-white/10 dark:text-white"
                    >
                      <option value="">NO CATEGORY</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <NocturneCalendar
                      value={createDate}
                      onChange={setCreateDate}
                    />
                  </div>

                  <input
                    name="venue"
                    placeholder="VENUE"
                    required
                    className="w-full rounded-xl px-4 py-3 text-xs font-mono uppercase outline-none border transition-all
                          bg-white border-purple-200 text-purple-900 placeholder:text-purple-300
                          dark:bg-black/60 dark:border-white/10 dark:text-white dark:placeholder:text-white dark:focus:border-teal-500"
                  />

                  <input
                    name="activity"
                    placeholder="ACTIVITY"
                    required
                    className="w-full rounded-xl px-4 py-3 text-xs font-mono outline-none border transition-all
                          bg-white border-purple-200 text-purple-900 placeholder:text-purple-300
                          dark:bg-black/60 dark:border-white/10 dark:text-white dark:placeholder:text-white dark:focus:border-teal-500"
                  />

                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={(e) =>
                          setImageUploaded(!!e.target.files?.length)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={`w-full border border-dashed rounded-xl py-4 text-center text-[10px] font-mono flex items-center justify-center gap-2 uppercase transition-all
                    ${
                      imageUploaded
                        ? "border-purple-500 text-purple-600 bg-purple-50 dark:border-teal-500 dark:text-teal-500 dark:bg-transparent"
                        : "border-purple-200 text-purple-300 bg-white dark:border-white/10 dark:text-white dark:bg-black/40"
                    }`}
                      >
                        {imageUploaded
                          ? "Evidence Attached"
                          : "Upload Evidence"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-4 font-black rounded-2xl text-xs uppercase transition-all shadow-xl
                          bg-purple-600 text-white hover:bg-purple-700
                          dark:bg-white dark:text-black dark:hover:bg-teal-400"
                  >
                    {isPending ? "STAMPING..." : "ISSUE STAMP"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Filter Section */}
          <div className="w-full max-w-5xl mb-12 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-6 py-2 rounded-full text-[10px] font-black border transition-all 
              ${
                filter === "ALL"
                  ? "bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-black dark:border-white"
                  : "border-black/10 text-black/40 dark:border-white/10 dark:text-white/40 hover:border-black/30 dark:hover:border-white/30"
              }`}
            >
              ALL STAMPS
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-6 py-2 rounded-full text-[10px] font-black border transition-all 
                    ${
                      filter === c
                        ? "bg-teal-500 text-white dark:text-black border-teal-500"
                        : "border-black/10 text-black/40 dark:border-white/10 dark:text-white/40 hover:border-black/30 dark:hover:border-white/30"
                    }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Passport Grid */}
          <div className="w-full max-w-7xl mb-20">
            {view === "passport" && (
              <div className="flex justify-center gap-4 mb-12">
                <button
                  onClick={() => setCountrySortOrder("ALPHA")}
                  className={`px-6 py-2 rounded-xl text-[10px] font-mono tracking-widest transition-all border ${
                    countrySortOrder === "ALPHA"
                      ? "bg-purple-600 text-white border-purple-600 dark:bg-teal-500 dark:text-black dark:border-teal-500 shadow-lg"
                      : "bg-transparent border-black/10 text-black/40 dark:border-white/10 dark:text-white/40"
                  }`}
                >
                  A-Z ORDER
                </button>
                <button
                  onClick={() => setCountrySortOrder("RECENT")}
                  className={`px-6 py-2 rounded-xl text-[10px] font-mono tracking-widest transition-all border ${
                    countrySortOrder === "RECENT"
                      ? "bg-purple-600 text-white border-purple-600 dark:bg-teal-500 dark:text-black dark:border-teal-500 shadow-lg"
                      : "bg-transparent border-black/10 text-black/40 dark:border-white/10 dark:text-white/40"
                  }`}
                >
                  LAST VISITED
                </button>
              </div>
            )}
            {view === "passport" ? (
              <>
                {Object.entries(groupedStamps).map(([country, items]) => {
                  const uniqueCitiesInCountry = Array.from(
                    new Set(items.map((s) => s.city.toUpperCase())),
                  );
                  const currentFilters = activeCityFilters[country] || [];
                  const filteredItems = items.filter(
                    (s) =>
                      currentFilters.length === 0 ||
                      currentFilters.includes(s.city.toUpperCase()),
                  );

                  return (
                    /* ADD THE ID HERE FOR SCROLLING */
                    <section
                      id={`section-${country.toLowerCase()}`}
                      key={country}
                      className="mb-24 relative isolate scroll-mt-24"
                    >
                      <div className="flex flex-col mb-10 px-8">
                        <div className="flex justify-between items-end w-full">
                          {/* 1. Country Header with integrated Stamp Counter */}
                          <div className="flex justify-between items-end w-full border-b border-purple-200/20 dark:border-white/5 pb-6">
                            <div className="flex flex-col">
                              <h2 className="text-4xl font-black italic uppercase text-purple-600/30 dark:text-white/10 tracking-tighter leading-none">
                                {country}
                              </h2>
                              <div className="flex items-center gap-3 mt-2">
                                <p className="text-[10px] font-mono text-teal-500 tracking-[0.3em] uppercase">
                                  Territory Registered
                                </p>
                                <span className="w-1 h-1 rounded-full bg-teal-500/40"></span>
                                <p className="text-[10px] font-mono text-purple-500 dark:text-teal-400 font-bold tracking-[0.1em]">
                                  {filteredItems.length
                                    .toString()
                                    .padStart(2, "0")}{" "}
                                  STAMPS
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4 mb-1">
                              <button
                                onClick={() =>
                                  scrollRefs.current[country]?.scrollBy({
                                    left: -300,
                                    behavior: "smooth",
                                  })
                                }
                                className="p-3 rounded-full border border-purple-200 dark:border-white/10 hover:border-purple-500 dark:hover:border-teal-500 text-purple-300 dark:text-white/30 transition-all active:scale-90"
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path d="M15 18l-6-6 6-6" />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  scrollRefs.current[country]?.scrollBy({
                                    left: 300,
                                    behavior: "smooth",
                                  })
                                }
                                className="p-3 rounded-full border border-purple-200 dark:border-white/10 hover:border-purple-500 dark:hover:border-teal-500 text-purple-300 dark:text-white/30 transition-all active:scale-90"
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* REPLACE THE OLD CITY FILTERS UI WITH THIS BLOCK */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {/* "ALL" Button */}
                          <button
                            onClick={() =>
                              setActiveCityFilters((prev) => ({
                                ...prev,
                                [country]: [],
                              }))
                            }
                            className={`px-4 py-1.5 rounded-full text-[9px] font-mono font-bold tracking-[0.2em] uppercase transition-all duration-300 border
                  ${
                    currentFilters.length === 0
                      ? "bg-purple-600 border-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] dark:bg-teal-500 dark:border-teal-500 dark:text-black dark:shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                      : "bg-transparent border-purple-200 text-purple-400 dark:border-white/10 dark:text-white/30 hover:border-purple-400"
                  }`}
                          >
                            ALL
                          </button>

                          {/* City Specific Buttons */}
                          {uniqueCitiesInCountry.map((city) => {
                            const isActive = currentFilters.includes(city);
                            return (
                              <button
                                key={city}
                                onClick={() => toggleCityFilter(country, city)}
                                className={`px-4 py-1.5 rounded-full text-[9px] font-mono font-bold tracking-[0.2em] uppercase transition-all duration-300 border
                      ${
                        isActive
                          ? "bg-purple-600 border-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] dark:bg-teal-500 dark:border-teal-500 dark:text-black dark:shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                          : "bg-transparent border-purple-200 text-purple-400 dark:border-white/10 dark:text-white/30 hover:border-purple-400"
                      }`}
                              >
                                {city}
                              </button>
                            );
                          })}
                        </div>
                        {/* END OF REPLACED BLOCK */}
                      </div>

                      <div
                        ref={(el) => {
                          scrollRefs.current[country] = el;
                        }}
                        className="flex overflow-x-auto pt-10 gap-12 pb-12 px-10 no-scrollbar scroll-smooth min-h-[300px]"
                      >
                        {filteredItems.map((s) => {
                          // 1. Logic for the "Just Issued" badge
                          const stampTime = s.createdAt?.seconds
                            ? s.createdAt.seconds * 1000
                            : s.createdAt;
                          const isJustIssued =
                            stampTime && Date.now() - stampTime < 60000;

                          return (
                            <div
                              key={s.id}
                              id={`stamp-${s.id}`} // <--- Target for the auto-scroll
                              onClick={() => {
                                setSelectedStamp(s);
                                setEditDate(s.date);
                                setIsEditing(false);
                              }}
                              className={`
                                    flex-none w-[45vw] h-[45vw] max-w-[200px] max-h-[200px]    
                                    md:w-64 md:h-64   
                                    group/stamp relative rounded-full flex items-center justify-center cursor-pointer 
                                    transition-all duration-500 hover:scale-110 active:scale-95 shadow-2xl 
                                    ${isJustIssued ? "z-[100]" : "z-10 hover:z-50"}
                                  `}
                            >
                              {/* 2. The Badge UI */}
                              {isJustIssued && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-[100] bg-teal-500 text-black text-[10px] font-black px-4 py-1 rounded-full animate-bounce shadow-[0_0_15px_rgba(45,212,191,0.5)] border-2 border-black whitespace-nowrap">
                                  JUST ISSUED
                                </div>
                              )}

                              <div
                                className="absolute inset-0 rounded-full border-[3px] md:border-[6px]"
                                style={{ borderColor: s.color }}
                              ></div>
                              <div className="absolute inset-[6px] rounded-full overflow-hidden z-0 bg-zinc-500 dark:bg-zinc-950">
                                {s.image && (
                                  <Image
                                    src={s.image}
                                    alt={s.venue}
                                    fill
                                    className="object-cover grayscale group-hover/stamp:grayscale-0 transition-all duration-700"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/20 dark:bg-transparent group-hover/stamp:bg-black/10 transition-colors" />
                              </div>

                              <div className="relative z-10 text-center px-4 md:px-6">
                                <p className="text-sm md:text-xl font-black uppercase italic text-white drop-shadow-md leading-tight">
                                  {s.venue}
                                </p>
                                <p className="text-[8px] md:text-[10px] font-mono text-white/60">
                                  {s.city}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </>
            ) : (
              <NocturneMap
                stamps={filteredStamps}
                onSelectLocation={() => setView("passport")}
                onCitySelect={handleMapCitySelect}
              />
            )}
          </div>

          {/* MODAL & LIGHTBOX */}
          {selectedStamp && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative">
                <button
                  onClick={() => setSelectedStamp(null)}
                  className="absolute top-6 right-6 z-50 text-white/40 hover:text-white transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>

                {!isEditing ? (
                  <div className="flex flex-col">
                    <div className="relative h-64 w-full bg-black overflow-hidden group/zoom">
                      {selectedStamp.image ? (
                        <>
                          <Image
                            src={selectedStamp.image}
                            alt={selectedStamp.venue}
                            fill
                            unoptimized
                            className={`object-cover transition-all duration-500 ${showRedactConfirm ? "blur-md scale-110 brightness-50" : "opacity-80 group-hover/zoom:opacity-100"}`}
                            onClick={() => {
                              if (!showRedactConfirm) {
                                // Find the index of the current stamp in the full stamps array
                                const index = stamps.findIndex(
                                  (s) => s.id === selectedStamp.id,
                                );
                                setGalleryIndex(index !== -1 ? index : 0);
                              }
                            }}
                          />

                          {!showRedactConfirm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowRedactConfirm(true);
                              }}
                              className="absolute top-6 left-6 z-50 p-2.5 bg-zinc-900/80 hover:bg-red-600 backdrop-blur-md border border-white/10 rounded-full text-white/40 hover:text-white transition-all opacity-0 group-hover/zoom:opacity-100 flex items-center gap-2 pr-4 shadow-xl"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                              <span className="text-[8px] font-black uppercase tracking-widest">
                                Redact Evidence
                              </span>
                            </button>
                          )}

                          {showRedactConfirm && (
                            <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                              <p className="text-[10px] font-black text-white tracking-[0.3em] uppercase mb-4 drop-shadow-md">
                                Confirm Redaction?
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    handleDeleteImage();
                                    setShowRedactConfirm(false);
                                  }}
                                  className="px-6 py-2 bg-white text-black text-[9px] font-black uppercase rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                >
                                  Yes, Delete
                                </button>
                                <button
                                  onClick={() => setShowRedactConfirm(false)}
                                  className="px-6 py-2 bg-black/40 text-white/60 text-[9px] font-black uppercase rounded-full border border-white/10 hover:bg-white/10 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <Image
                            src="/logo.png"
                            alt="Nocturne Logo"
                            width={96}
                            height={96}
                            priority
                            className="object-cover relative z-10 dark:invert-0 invert transition-all duration-500"
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent pointer-events-none"></div>
                    </div>
                    <div className="p-10 -mt-12 relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-teal-500 text-black text-[9px] font-black rounded-full uppercase tracking-widest">
                          {selectedStamp.category || "GENERAL"}
                        </span>
                        <span className="text-[10px] font-mono text-white/40">
                          {selectedStamp.date.replace(/-/g, ".")}
                        </span>
                      </div>
                      <h2
                        className="text-4xl font-black uppercase italic tracking-tighter mb-2"
                        style={{ color: selectedStamp.color }}
                      >
                        {selectedStamp.venue}
                      </h2>
                      <p className="text-sm font-mono text-white/60 mb-6 uppercase tracking-widest">
                        {selectedStamp.city}, {selectedStamp.country}
                      </p>
                      <div className="bg-white/5 border border-white/5 p-6 rounded-2xl mb-8">
                        <p className="text-xs font-mono leading-relaxed text-white/80 italic">
                          &quot;{selectedStamp.activity}&quot;
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex-1 py-4 bg-white text-black font-black rounded-2xl text-[10px] uppercase hover:bg-teal-400 transition-all"
                        >
                          Edit Entry
                        </button>
                        <button
                          onClick={() => setSelectedStamp(null)}
                          className="px-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/5 transition-all text-white/40"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 pt-16">
                    {" "}
                    {/* Increased padding for the close button */}
                    <h2 className="text-xl font-black uppercase tracking-widest mb-8 text-teal-400 italic">
                      Modify Log
                    </h2>
                    <form
                      ref={editFormRef}
                      onSubmit={handleUpdate}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          name="city"
                          defaultValue={selectedStamp.city}
                          placeholder="CITY"
                          required
                          className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono uppercase outline-none focus:border-teal-500"
                        />
                        <input
                          name="country"
                          defaultValue={selectedStamp.country}
                          placeholder="COUNTRY"
                          required
                          className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono uppercase outline-none focus:border-teal-500"
                        />
                      </div>
                      <input
                        name="venue"
                        defaultValue={selectedStamp.venue}
                        placeholder="VENUE"
                        required
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono uppercase outline-none focus:border-teal-500"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-mono text-zinc-500 tracking-[0.2em] uppercase">
                            Event Signature
                          </label>
                          <select
                            name="category"
                            defaultValue={selectedStamp.category}
                            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono uppercase outline-none focus:border-teal-500 transition-colors cursor-pointer"
                          >
                            <option value="">UNCATEGORIZED</option>
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <NocturneCalendar
                          value={editDate || selectedStamp.date}
                          onChange={setEditDate}
                        />
                      </div>
                      <textarea
                        name="activity"
                        defaultValue={selectedStamp.activity}
                        rows={3}
                        placeholder="ACTIVITY"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-teal-500"
                      />

                      <div className="relative">
                        <input
                          type="file"
                          name="newImage"
                          accept="image/*"
                          onChange={(e) =>
                            setEditImageUploaded(!!e.target.files?.length)
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div
                          className={`w-full bg-black/40 border border-dashed rounded-xl py-4 text-center text-[10px] font-mono flex items-center justify-center gap-2 uppercase ${editImageUploaded ? "border-teal-500 text-teal-500" : "border-white/10 text-gray-500"}`}
                        >
                          {editImageUploaded
                            ? "New Evidence Ready"
                            : "Change Image (Optional)"}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-6">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(selectedStamp.id)}
                          className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-4 text-[10px] font-black uppercase bg-white text-black rounded-2xl hover:bg-teal-400 transition-colors shadow-lg"
                        >
                          Save Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 py-4 text-[10px] font-black uppercase border border-white/10 rounded-2xl hover:bg-white/5 transition-colors text-white/40"
                        >
                          Back
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FULLSCREEN GALLERY LIGHTBOX */}
          {galleryIndex !== null && (
            <div className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-300">
              {/* Navigation HUD */}
              <button
                onClick={() => setGalleryIndex(null)}
                className="absolute top-10 right-10 z-[310] text-white/40 hover:text-white transition-colors"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <button
                onClick={prevImage}
                className="absolute left-6 md:left-12 p-4 text-white/20 hover:text-teal-400 transition-all z-[310]"
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-6 md:right-12 p-4 text-white/20 hover:text-teal-400 transition-all z-[310]"
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {/* Image Container */}
              <div className="relative w-[90vw] h-[80vh] flex items-center justify-center">
                {stamps[galleryIndex]?.image ? (
                  <Image
                    src={stamps[galleryIndex].image!}
                    alt="Gallery"
                    fill
                    unoptimized
                    className="object-contain animate-in zoom-in-95 duration-500"
                  />
                ) : (
                  <div className="text-zinc-800 text-6xl font-black italic opacity-20">
                    NO IMAGE DATA
                  </div>
                )}
              </div>

              {/* Nocturne HUD */}
              <div className="absolute bottom-12 left-12 text-left pointer-events-none">
                <p className="text-teal-500 font-mono text-[10px] tracking-[0.5em] uppercase mb-2">
                  Evidence Log #{galleryIndex + 1}
                </p>
                <h3 className="text-4xl font-black italic uppercase text-white tracking-tighter">
                  {stamps[galleryIndex]?.venue}
                </h3>
                <p className="text-white/40 font-mono text-xs uppercase">
                  {stamps[galleryIndex]?.city}
                  {stamps[galleryIndex]?.date.replace(/-/g, ".")}
                </p>
              </div>

              <div className="absolute bottom-12 right-12 text-white/10 font-mono text-[10px] uppercase">
                {galleryIndex + 1} / {stamps.length}
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-md">
              <div className="bg-zinc-900 border border-red-500/20 p-10 rounded-[40px] text-center max-w-xs">
                <h2 className="text-xl font-black uppercase mb-2">
                  Delete Stamp?
                </h2>
                <p className="text-[10px] font-mono text-white/40 mb-8 tracking-tighter">
                  This action cannot be undone.
                </p>
                <div className="flex flex-col gap-2 mt-8">
                  <button
                    onClick={async () => {
                      await deleteDoc(doc(db, "stamps", showDeleteConfirm));
                      setShowDeleteConfirm(null);
                      setSelectedStamp(null);
                    }}
                    className="w-full py-4 bg-red-500 text-white font-black rounded-2xl text-[10px] uppercase"
                  >
                    Permanent Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="w-full py-4 bg-white/5 text-gray-400 font-black rounded-2xl text-[10px] uppercase border border-white/10"
                  >
                    Keep Entry
                  </button>
                </div>
              </div>
            </div>
          )}

          <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-2xl border border-white/10 px-10 py-5 rounded-full flex gap-12 z-[999]">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`flex items-center gap-2 px-4 py-2 transition-all active:scale-95 rounded-full border
                /* Adaptive Colors */
                bg-purple-200/50 dark:bg-zinc-900 
                border-purple-300/50 dark:border-white/10 
                hover:border-purple-500 dark:hover:border-teal-500`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-purple-600 dark:text-teal-500"
              >
                {/* Dynamic icon change: X when open, Burger when closed */}
                {showSidebar ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
              <span className="text-[10px] font-black uppercase italic tracking-widest text-purple-950 dark:text-white">
                {showSidebar ? "Close" : "Dashboard"}
              </span>
            </button>
            <button
              onClick={() => setView("passport")}
              className={`text-[10px] font-black tracking-widest transition-all ${view === "passport" ? "text-teal-400 scale-110" : "text-gray-500 hover:text-white"}`}
            >
              PASSPORT
            </button>
            <button
              onClick={() => {
                setView("map");
                // This scrolls the window down so the map is centered
                setTimeout(() => {
                  window.scrollTo({ top: 600, behavior: "smooth" });
                }, 100);
              }}
              className={`text-[10px] font-black tracking-widest transition-all ${view === "map" ? "text-teal-400 scale-110" : "text-gray-500 hover:text-white"}`}
            >
              GLOBAL MAP
            </button>
          </nav>
        </div>
      </main>
      {/* SCROLL TO TOP BUTTON */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-[80] group flex flex-col items-center gap-2 transition-all duration-500 
        ${showScroll ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}
      >
        {/* The Label (Appears on hover) */}
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity">
          Top
        </span>

        {/* The Arrow Circle */}
        <div className="w-12 h-12 rounded-full border border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-center group-hover:border-teal-500/50 group-hover:bg-zinc-900 transition-all active:scale-90">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-zinc-500 group-hover:text-teal-500 transition-colors"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </div>
      </button>
    </>
  );
}
