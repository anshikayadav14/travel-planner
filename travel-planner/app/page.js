"use client";
import { useState, useRef, useEffect } from "react";
import PlaceImage from "@/components/PlaceImage";
import dynamic from "next/dynamic";
const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

const popular = ["Goa", "Manali", "Jaipur", "Bali", "Paris"];

export default function Home() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState(3);

  const [stage, setStage] = useState("form"); // form | swipe | result
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // swipe animation state
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState(0); // -1 skip, 1 like
  const startX = useRef(0);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, budget, days }),
      });
      const data = await res.json();
      if (!res.ok || !data.cards?.length) throw new Error(data.error || "Something went wrong");
      setCards(data.cards);
      setIndex(0);
      setLiked([]);
      setTrip(null);
      setStage("swipe");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function swipe(dir) {
    if (exit !== 0 || index >= cards.length) return;
    setExit(dir);
    setTimeout(() => {
      if (dir === 1) setLiked((l) => [...l, cards[index]]);
      setIndex((i) => i + 1);
      setDragX(0);
      setExit(0);
    }, 250);
  }

  async function buildTrip() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          budget,
          days,
          liked: liked.map((c) => c.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setTrip(data);
      setStage("result");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function reset() {
    setStage("form");
    setTrip(null);
    setCards([]);
    setLiked([]);
    setError("");
  }

  // arrow keys
  useEffect(() => {
    if (stage !== "swipe") return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") swipe(1);
      if (e.key === "ArrowLeft") swipe(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";
  const card = "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm";
  const primaryBtn =
    "w-full rounded-xl bg-teal-600 px-4 py-3.5 font-medium text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-60";

  const current = cards[index];
  const x = exit ? exit * 500 : dragX;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-200 via-sky-200 to-indigo-200 opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-6 py-16">
        <div className="text-center">
          <span className="inline-block rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-teal-700">
            ✦ AI Travel Planner
          </span>
        </div>

        {/* ---------- STAGE 1: FORM ---------- */}
        {stage === "form" && (
          <>
            <div className="mt-6 text-center">
              <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
                Your next trip,
                <br />
                <span className="text-teal-600">built by your taste.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-md text-slate-500">
                Pick a destination, swipe through ideas, and get a plan made only
                from what you love.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-12 space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Destination
                </label>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to? e.g. Goa"
                  className={input}
                  required
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {popular.map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setDestination(p)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="25000"
                    className={input}
                    required
                  />
                </div>
                <div className="w-28">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className={input}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "Finding ideas…" : "Start swiping →"}
              </button>
            </form>

            <div className="mt-10 grid grid-cols-3 gap-4 text-center text-sm text-slate-500">
              <div>👆<br />Swipe to choose</div>
              <div>🗺️<br />Day-by-day plan</div>
              <div>💰<br />Budget estimate</div>
            </div>
          </>
        )}

        {/* ---------- STAGE 2: SWIPE ---------- */}
        {stage === "swipe" && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                {Math.min(index + 1, cards.length)} / {cards.length}
              </span>
              <span>♥ {liked.length} liked</span>
            </div>

            {current ? (
              <>
                <div className="relative mx-auto h-[500px] max-w-sm">
                  {/* faint card behind */}
                  <div className="absolute inset-0 scale-95 rounded-3xl border border-slate-100 bg-white opacity-70 shadow-md" />

                  <div
                    onPointerDown={(e) => {
                      startX.current = e.clientX;
                      setDragging(true);
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (dragging) setDragX(e.clientX - startX.current);
                    }}
                    onPointerUp={() => {
                      setDragging(false);
                      if (dragX > 100) swipe(1);
                      else if (dragX < -100) swipe(-1);
                      else setDragX(0);
                    }}
                    style={{
                      transform: `translateX(${x}px) rotate(${x / 20}deg)`,
                      transition: dragging ? "none" : "transform 0.25s ease",
                    }}
                    className="absolute inset-0 cursor-grab touch-none select-none rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/70"
                  >
                    <span
                      style={{ opacity: Math.min(Math.max(x, 0) / 100, 1) }}
                      className="absolute left-5 top-5 -rotate-12 rounded-lg border-2 border-emerald-500 px-3 py-1 font-bold text-emerald-500"
                    >
                      LIKE
                    </span>
                    <span
                      style={{ opacity: Math.min(Math.max(-x, 0) / 100, 1) }}
                      className="absolute right-5 top-5 rotate-12 rounded-lg border-2 border-rose-500 px-3 py-1 font-bold text-rose-500"
                    >
                      SKIP
                    </span>

                    <div className="mt-4">
                    <PlaceImage name={current.name} destination={destination} fallback={current.emoji} />
                    </div>
                    <span className="mt-6 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-medium capitalize text-teal-700">
                      {current.category}
                    </span>
                    {current.type === "hidden gem" && (
                    <span className="ml-2 mt-6 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    💎 Local gem
                    </span>
                     )}
                    <h2 className="mt-3 text-2xl font-semibold">{current.name}</h2>
                    <p className="mt-3 text-slate-500">{current.blurb}</p>
                    <p className="mt-6 text-sm font-medium text-slate-700">
                      {current.estCost
                        ? `≈ ₹${Number(current.estCost).toLocaleString("en-IN")} per person`
                        : "Free"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6">
                  <button
                    onClick={() => swipe(-1)}
                    className="h-16 w-16 rounded-full border border-slate-200 bg-white text-2xl text-rose-500 shadow-md transition hover:scale-105"
                    aria-label="Skip"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => swipe(1)}
                    className="h-16 w-16 rounded-full border border-slate-200 bg-white text-2xl text-emerald-500 shadow-md transition hover:scale-105"
                    aria-label="Like"
                  >
                    ♥
                  </button>
                </div>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Drag the card, tap a button, or use ← → keys
                </p>
              </>
            ) : (
              <div className={`${card} text-center`}>
                <p className="text-5xl">🎉</p>
                <h2 className="mt-3 text-xl font-semibold">All done!</h2>
                <p className="mt-1 text-slate-500">
                  You liked {liked.length} of {cards.length}.
                </p>
              </div>
            )}

            {liked.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {liked.map((c) => (
                  <span
                    key={c.name}
                    className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm"
                  >
                    {c.emoji} {c.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={buildTrip}
                disabled={loading || liked.length === 0}
                className={primaryBtn}
              >
                {loading
                  ? "Building your trip…"
                  : liked.length === 0
                  ? "Like at least one place"
                  : `Build my trip (${liked.length} picks) →`}
              </button>
              <button
                onClick={reset}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                ← Start over
              </button>
            </div>
          </div>
        )}

        {/* ---------- STAGE 3: RESULT ---------- */}
        {stage === "result" && trip && (
          <div className="mt-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-semibold">Your {destination} trip</h2>
              <button
                onClick={reset}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 hover:border-teal-500"
              >
                Plan another
              </button>
            </div>

            <p className="text-lg text-slate-600">{trip.summary}</p>
            <TripMap stops={trip.stops} restaurants={trip.restaurants} destination={destination} />

            <div className="flex flex-wrap gap-2">
              {liked.map((c) => (
                <span
                  key={c.name}
                  className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm"
                >
                  {c.emoji} {c.name}
                </span>
              ))}
            </div>

            <section>
              <h2 className="mb-3 text-2xl font-semibold">Day by day</h2>
              <div className="space-y-4">
                {trip.itinerary?.map((d) => (
                  <div key={d.day} className={card}>
                    <p className="text-sm font-medium text-teal-600">Day {d.day}</p>
                    <h3 className="text-lg font-semibold">{d.title}</h3>
                    <p className="mt-3 text-sm text-slate-600"><b>Morning:</b> {d.morning}</p>
                    <p className="mt-1 text-sm text-slate-600"><b>Afternoon:</b> {d.afternoon}</p>
                    <p className="mt-1 text-sm text-slate-600"><b>Evening:</b> {d.evening}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold">Places to visit</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {trip.places?.map((p) => (
                  <div key={p.name} className={card}>
                  <PlaceImage name={p.name} destination={destination} />
                  <h3 className="mt-2 font-semibold">{p.name}</h3>
                   <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                    <a
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + destination)}`}
    target="_blank"
    rel="noreferrer"
    className="mt-3 inline-block text-sm font-medium text-teal-600 hover:underline"
  >
    Open in Google Maps ↗
  </a>
</div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold">Where to eat</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {trip.restaurants?.map((r) => (
                  <div key={r.name} className={card}>
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">Try: {r.dish}</p>
                    <p className="text-sm text-slate-400">{r.priceRange}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold">Where to stay</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {trip.stays?.map((s) => (
                  <div key={s.tier} className={card}>
                    <p className="text-sm font-medium text-teal-600">{s.tier}</p>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      ₹{Number(s.pricePerNight).toLocaleString("en-IN")} / night (est.)
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold">Budget breakdown (est.)</h2>
              <div className={card}>
                {Object.entries(trip.budgetBreakdown || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 text-sm capitalize">
                    <span>{k}</span>
                    <span>₹{Number(v).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>
        )}
      </div>
    </main>
  );
}