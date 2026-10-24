"use client";
import { useState } from "react";

const popular = ["Goa", "Manali", "Jaipur", "Bali", "Paris"];

export default function Home() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState(3);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTrip(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, budget, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setTrip(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

  const card = "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm";

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* soft background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-200 via-sky-200 to-indigo-200 opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-6 py-20">
        <div className="text-center">
          <span className="inline-block rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-teal-700">
            ✦ AI Travel Planner
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
            Your next trip,
            <br />
            <span className="text-teal-600">planned in seconds.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-slate-500">
            Pick a destination and budget. Get places to visit, where to eat,
            and a day-by-day plan.
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 px-4 py-3.5 font-medium text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? "Planning your trip…" : "Generate my trip →"}
          </button>
        </form>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {trip && (
          <div className="mt-10 space-y-8">
            <p className="text-lg text-slate-600">{trip.summary}</p>

            <section>
              <h2 className="mb-3 text-2xl font-semibold">Day by day</h2>
              <div className="space-y-4">
                {trip.itinerary?.map((d) => (
                  <div key={d.day} className={card}>
                    <p className="text-sm font-medium text-teal-600">
                      Day {d.day}
                    </p>
                    <h3 className="text-lg font-semibold">{d.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">
                      <b>Morning:</b> {d.morning}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      <b>Afternoon:</b> {d.afternoon}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      <b>Evening:</b> {d.evening}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold">Places to visit</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {trip.places?.map((p) => (
                  <div key={p.name} className={card}>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {p.description}
                    </p>
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
                    <p className="text-sm font-medium text-teal-600">
                      {s.tier}
                    </p>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      ₹{Number(s.pricePerNight).toLocaleString("en-IN")} / night
                      (est.)
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold">
                Budget breakdown (est.)
              </h2>
              <div className={card}>
                {Object.entries(trip.budgetBreakdown || {}).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between py-1 text-sm capitalize"
                  >
                    <span>{k}</span>
                    <span>₹{Number(v).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {!trip && (
          <div className="mt-10 grid grid-cols-3 gap-4 text-center text-sm text-slate-500">
            <div>🗺️<br />Day-by-day plan</div>
            <div>🍜<br />Local food picks</div>
            <div>💰<br />Price comparison</div>
          </div>
        )}
      </div>
    </main>
  );
}