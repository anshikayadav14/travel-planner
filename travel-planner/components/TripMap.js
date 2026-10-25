"use client";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const COLORS = ["#0d9488", "#6366f1", "#f59e0b", "#e11d48", "#0ea5e9", "#8b5cf6", "#16a34a"];

function numberIcon(n, color) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function foodIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#ea580c;color:#fff;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">🍴</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function timeIcon(text, color) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#fff;color:${color};border:1.5px solid ${color};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.2);transform:translate(-50%,-50%)">🚗 ${text}</div>`,
    iconSize: [0, 0],
  });
}

function formatTime(sec) {
  const mins = Math.max(1, Math.round(sec / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function formatKm(meters) {
  return `${(meters / 1000).toFixed(1)} km`;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function TripMap({ stops, restaurants, destination }) {
  const [selected, setSelected] = useState("all");
  const [routes, setRoutes] = useState({});
  const [showFood, setShowFood] = useState(true);

  // clean the AI data: keep only stops with real numbers
  const valid = useMemo(
    () =>
      (stops || [])
        .map((s) => ({ ...s, day: Number(s.day), lat: Number(s.lat), lng: Number(s.lng) }))
        .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng) && s.lat !== 0 && s.lng !== 0),
    [stops]
  );

  // same cleaning for restaurants
  const food = useMemo(
    () =>
      (restaurants || [])
        .map((r) => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) }))
        .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) && r.lat !== 0 && r.lng !== 0),
    [restaurants]
  );

  const byDay = useMemo(() => {
    const g = {};
    valid.forEach((s) => (g[s.day] = [...(g[s.day] || []), s]));
    return g;
  }, [valid]);

  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  const dayLink = (d) => {
    const pts = byDay[d];
    const name = (p) => `${p.name}, ${destination}`;
    const base = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(name(pts[0]))}&destination=${encodeURIComponent(name(pts[pts.length - 1]))}`;
    const mid = pts.slice(1, -1).map(name).join("|");
    return mid ? `${base}&waypoints=${encodeURIComponent(mid)}` : base;
  };

  // ask OSRM for the road path + time/distance of each leg, per day
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const out = {};
      for (const d of days) {
        const pts = byDay[d];
        if (pts.length < 2) continue;
        const coords = pts.map((p) => `${p.lng},${p.lat}`).join(";");
        try {
          const r = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
          );
          const j = await r.json();
          const route = j.routes?.[0];
          if (route) {
            out[d] = {
              line: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
              legs: route.legs.map((l) => ({ sec: l.duration, m: l.distance })),
            };
          }
        } catch {}
      }
      if (!cancelled) setRoutes(out);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [byDay]);

  if (!valid.length) return null;

  const shownDays = selected === "all" ? days : [selected];
  const fitPoints = [
    ...shownDays.flatMap((d) => byDay[d].map((p) => [p.lat, p.lng])),
    ...(showFood && selected === "all" ? food.map((r) => [r.lat, r.lng]) : []),
  ];

  return (
    <section>
      <h2 className="mb-3 text-2xl font-semibold">Route map</h2>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {["all", ...days].map((d) => (
          <button
            key={d}
            onClick={() => setSelected(d)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              selected === d
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-500"
            }`}
          >
            {d === "all" ? "All days" : `Day ${d}`}
          </button>
        ))}

        {food.length > 0 && (
          <button
            onClick={() => setShowFood((v) => !v)}
            className={`ml-auto rounded-full border px-3 py-1 text-sm transition ${
              showFood
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-orange-400"
            }`}
          >
            🍴 Food {showFood ? "on" : "off"}
          </button>
        )}
      </div>

      <MapContainer
        center={[fitPoints[0][0], fitPoints[0][1]]}
        zoom={11}
        className="z-0 h-[420px] w-full rounded-2xl"
      >
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, OpenStreetMap contributors"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />
        <FitBounds points={fitPoints} />

        {shownDays.map((d) => {
          const color = COLORS[(d - 1) % COLORS.length];
          const pts = byDay[d];
          const info = routes[d];
          return (
            <div key={d}>
              <Polyline
                positions={info?.line || pts.map((p) => [p.lat, p.lng])}
                pathOptions={{ color, weight: 4, dashArray: info ? undefined : "8 8" }}
              />

              {/* time pill between each pair of stops */}
              {info?.legs?.map(
                (leg, i) =>
                  pts[i + 1] && (
                    <Marker
                      key={`t-${d}-${i}`}
                      position={[
                        (pts[i].lat + pts[i + 1].lat) / 2,
                        (pts[i].lng + pts[i + 1].lng) / 2,
                      ]}
                      icon={timeIcon(formatTime(leg.sec), color)}
                      interactive={false}
                    />
                  )
              )}

              {pts.map((p, i) => {
                const leg = i > 0 ? info?.legs?.[i - 1] : null;
                return (
                  <Marker key={`${d}-${i}`} position={[p.lat, p.lng]} icon={numberIcon(i + 1, color)}>
                    <Popup>
                      <b>{p.name}</b>
                      <br />
                      Day {d}, stop {i + 1}
                      {leg && (
                        <>
                          <br />
                          🚗 {formatTime(leg.sec)} · {formatKm(leg.m)} from previous stop
                        </>
                      )}
                    </Popup>
                  </Marker>
                );
              })}
            </div>
          );
        })}

        {/* food pins */}
        {showFood &&
          food.map((r, i) => (
            <Marker key={`food-${i}`} position={[r.lat, r.lng]} icon={foodIcon()}>
              <Popup>
                <b>{r.name}</b>
                <br />
                Try: {r.dish}
                <br />
                {r.priceRange}
                <br />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " restaurant " + destination)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps ↗
                </a>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      <div className="mt-3 flex flex-wrap gap-3">
        {shownDays
          .filter((d) => byDay[d].length >= 2)
          .map((d) => (
            <a
              key={d}
              href={dayLink(d)}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-teal-600 hover:underline"
            >
              Open Day {d} in Google Maps ↗
            </a>
          ))}
      </div>

      {/* travel summary */}
      <div className="mt-4 space-y-3">
        {shownDays.map((d) => {
          const info = routes[d];
          const pts = byDay[d];
          if (!info?.legs?.length) return null;
          const totalSec = info.legs.reduce((a, l) => a + l.sec, 0);
          const totalM = info.legs.reduce((a, l) => a + l.m, 0);
          return (
            <div key={d} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">
                Day {d} · 🚗 {formatTime(totalSec)} driving · {formatKm(totalM)}
              </p>
              <div className="mt-2 space-y-1">
                {info.legs.map((leg, i) =>
                  pts[i + 1] ? (
                    <p key={i} className="text-xs text-slate-500">
                      {i + 1}. {pts[i].name} → {i + 2}. {pts[i + 1].name}:{" "}
                      <span className="font-medium text-slate-700">
                        {formatTime(leg.sec)} · {formatKm(leg.m)}
                      </span>
                    </p>
                  ) : null
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Pin positions are AI estimates. Travel times are driving estimates without traffic; walking or
        public transport will differ. Check exact locations and times in Google Maps before you travel.
      </p>
    </section>
  );
}