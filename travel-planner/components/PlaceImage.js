"use client";
import { useEffect, useState } from "react";

const cache = {};

export default function PlaceImage({ name, destination, fallback = null, className = "h-36" }) {
  const key = `${name}|${destination}`;
  const [src, setSrc] = useState(cache[key] || null);

  useEffect(() => {
    if (key in cache) {
      setSrc(cache[key]);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const q = encodeURIComponent(`${name} ${destination}`);
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=600&format=json&origin=*`;
        const res = await fetch(url);
        const json = await res.json();
        const page = json.query && Object.values(json.query.pages)[0];
        cache[key] = page?.thumbnail?.source || null;
      } catch {
        cache[key] = null;
      }
      if (!cancelled) setSrc(cache[key]);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [key, name, destination]);

  if (src) {
    return (
      <div>
        <img
          src={src}
          alt={name}
          draggable={false}
          className={`w-full rounded-2xl object-cover ${className}`}
        />
        <p className="mt-1 text-[10px] text-slate-400">Photo: Wikipedia</p>
      </div>
    );
  }
  return fallback ? <div className="text-7xl">{fallback}</div> : null;
}