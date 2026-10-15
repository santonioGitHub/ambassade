import { LAND, locate } from "../geo.js";

const W = 360, H = 150, TOP = 80; // latitudes affichées : 80° N → −70° S
const x = (lon) => lon + 180;
const y = (lat) => TOP - lat;

export default function WorldMap({ data }) {
  const placed = {};
  const unplaced = [];
  data.forEach((d) => {
    const g = locate(d.pays);
    if (!g) return unplaced.push(d);
    placed[g.name] = { ...g, n: (placed[g.name]?.n || 0) + d.n };
  });
  const pts = Object.values(placed).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...pts.map((p) => p.n));
  const total = data.reduce((s, d) => s + d.n, 0);
  const rank = [...pts.map((p) => ({ pays: p.name, n: p.n })), ...unplaced].sort((a, b) => b.n - a.n);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
      <figure>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-md bg-sky-light" role="img"
          aria-label={`Carte des requérants par pays : ${rank.slice(0, 5).map((r) => `${r.pays} ${r.n}`).join(", ") || "aucune donnée"}`}>
          {LAND.map((poly, i) => (
            <polygon key={i} points={poly.map(([lo, la]) => `${x(lo)},${y(la)}`).join(" ")} fill="#FFFFFF" stroke="#9DB4D3" strokeWidth="0.35" strokeLinejoin="round" />
          ))}
          {pts.map((p) => (
            <circle key={p.name} cx={x(p.lon)} cy={y(p.lat)} r={2 + 7 * Math.sqrt(p.n / max)} fill="#0F6BC8" fillOpacity="0.7" stroke="#0B2447" strokeWidth="0.6">
              <title>{`${p.name} : ${p.n} requérant${p.n > 1 ? "s" : ""}`}</title>
            </circle>
          ))}
        </svg>
        <figcaption className="mt-1 text-xs text-slate-500">Carte simplifiée · la taille des cercles croît avec le nombre de requérants.</figcaption>
      </figure>
      <ol className="space-y-1.5 text-sm" aria-label="Classement par pays">
        {rank.length === 0 && <li className="text-slate-500">Aucun requérant enregistré.</li>}
        {rank.slice(0, 8).map((r) => (
          <li key={r.pays}>
            <div className="flex justify-between gap-2"><span className="truncate">{r.pays}</span><span className="font-semibold tabular-nums">{r.n}</span></div>
            <div className="h-1.5 rounded bg-slate-200"><div className="h-1.5 rounded bg-sky" style={{ width: `${(r.n / (rank[0]?.n || 1)) * 100}%` }} /></div>
          </li>
        ))}
        {rank.length > 8 && <li className="text-xs text-slate-500">+ {rank.length - 8} autres · total {total}</li>}
        {unplaced.length > 0 && <li className="pt-1 text-xs text-slate-500">{unplaced.reduce((s, u) => s + u.n, 0)} requérant(s) dont le pays n'a pas pu être placé sur la carte.</li>}
      </ol>
    </div>
  );
}
