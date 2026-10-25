export default function PrintableTrip({ trip, destination, days }) {
  if (!trip) return null;

  const maps = (q) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

  return (
    <div className="hidden p-8 text-sm text-black print:block">
      <h1 className="text-2xl font-bold">
        {days}-day trip to {destination}
      </h1>
      <p className="mt-2">{trip.summary}</p>

      <h2 className="mt-6 text-lg font-bold">Day by day</h2>
      {trip.itinerary?.map((d) => (
        <div key={d.day} className="mt-3 break-inside-avoid">
          <p className="font-semibold">
            Day {d.day}: {d.title}
          </p>
          <p>Morning: {d.morning}</p>
          <p>Afternoon: {d.afternoon}</p>
          <p>Evening: {d.evening}</p>
        </div>
      ))}

      <h2 className="mt-6 text-lg font-bold">Places to visit</h2>
      {trip.places?.map((p) => (
        <div key={p.name} className="mt-2 break-inside-avoid">
          <p className="font-semibold">{p.name}</p>
          <p>{p.description}</p>
          <p className="text-xs">{maps(`${p.name} ${destination}`)}</p>
        </div>
      ))}

      <h2 className="mt-6 text-lg font-bold">Where to eat</h2>
      {trip.restaurants?.map((r) => (
        <div key={r.name} className="mt-2 break-inside-avoid">
          <p className="font-semibold">
            {r.name} ({r.priceRange})
          </p>
          <p>Try: {r.dish}</p>
          <p className="text-xs">{maps(`${r.name} restaurant ${destination}`)}</p>
        </div>
      ))}

      <h2 className="mt-6 text-lg font-bold">Where to stay (estimates)</h2>
      {trip.stays?.map((s) => (
        <p key={s.tier} className="mt-1">
          {s.tier}: {s.name}, about ₹{Number(s.pricePerNight).toLocaleString("en-IN")} per night
        </p>
      ))}

      <h2 className="mt-6 text-lg font-bold">Budget breakdown (estimates)</h2>
      {Object.entries(trip.budgetBreakdown || {}).map(([k, v]) => (
        <p key={k} className="capitalize">
          {k}: ₹{Number(v).toLocaleString("en-IN")}
        </p>
      ))}

      <p className="mt-8 text-xs text-gray-500">
        Prices and locations are AI estimates. Please verify before you travel.
      </p>
    </div>
  );
}