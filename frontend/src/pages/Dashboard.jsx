import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import WorldMap from "../components/WorldMap.jsx";
import { Msg, PageHeader, Tag, fdate } from "../components/ui.jsx";

const COLORS = ["#0F6BC8", "#F2C200", "#C8102E", "#0B2447", "#5BA4E6", "#8A6D00", "#6B7C93", "#2E9E6B"];

const Kpi = ({ label, value, tone }) => (
  <div className="card border-t-4" style={{ borderTopColor: tone }}>
    <p className="text-sm text-slate-600">{label}</p>
    <p className="mt-1 font-display text-3xl font-extrabold tabular-nums md:text-4xl">{value}</p>
  </div>
);

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api("/dashboard/").then(setD).catch((e) => setErr({ ok: false, t: e.message })); }, []);
  if (err) return <Msg m={err} />;
  if (!d) return <p className="card">Chargement…</p>;
  const k = d.kpis;

  return (
    <div className="space-y-5">
      <PageHeader title="Tableau de bord" sub="Vue d'ensemble de l'activité de l'ambassade." />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Kpi label="Requérants" value={k.requerants} tone="#0F6BC8" />
        <Kpi label="Documents demandés" value={k.demandes} tone="#0B2447" />
        <Kpi label="Documents servis" value={k.servies} tone="#2E9E6B" />
        <Kpi label="Demandes en attente" value={k.en_attente} tone="#F2C200" />
      </div>

      <section className="card" aria-labelledby="h-carte">
        <h2 id="h-carte" className="mb-3 font-display text-lg font-bold">Requérants par pays</h2>
        <WorldMap data={d.par_pays} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card" aria-labelledby="h-pie">
          <h2 id="h-pie" className="mb-3 font-display text-lg font-bold">Demandes par type de document</h2>
          {d.par_document.length === 0 ? <p className="text-sm text-slate-500">Aucune demande pour le moment.</p> : (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={d.par_document} dataKey="n" nameKey="document" innerRadius="45%" outerRadius="75%" paddingAngle={2}>
                    {d.par_document.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="h-bar">
          <h2 id="h-bar" className="mb-3 font-display text-lg font-bold">Demandes et documents servis, 12 derniers mois</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={d.par_mois}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} width={30} />
                <Tooltip />
                <Legend />
                <Bar dataKey="demandes" name="Demandes" fill="#0B2447" radius={[3, 3, 0, 0]} />
                <Bar dataKey="servies" name="Servies" fill="#0F6BC8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card" aria-labelledby="h-last">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="h-last" className="font-display text-lg font-bold">Dernières demandes servies</h2>
          <Link to="/octroi" className="text-sm font-medium text-sky underline">Octroyer un document</Link>
        </div>
        {d.dernieres_servies.length === 0 ? <p className="text-sm text-slate-500">Aucun document servi pour le moment.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b"><tr>{["Référence", "Requérant", "Document", "Motif", "Servi le", "Agent", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {d.dernieres_servies.map((r) => (
                  <tr key={r.id}>
                    <td className="td font-mono text-xs">{r.reference}</td>
                    <td className="td"><span className="font-medium">{r.requerant}</span><br /><span className="text-xs text-slate-500">{r.code}</span></td>
                    <td className="td">{r.document}</td>
                    <td className="td"><Tag tone="blue">{r.motif}</Tag></td>
                    <td className="td whitespace-nowrap">{fdate(r.date)}</td>
                    <td className="td">{r.agent}</td>
                    <td className="td"><Link to={`/demandes/${r.id}/imprimer`} className="text-sky underline">Réimprimer</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
