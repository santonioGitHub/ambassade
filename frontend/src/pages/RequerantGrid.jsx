import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, isAdmin } from "../api";
import * as Ic from "../components/Icons.jsx";
import { Msg, PageHeader, Pagination, Tag, fdate } from "../components/ui.jsx";

const SIZE = 20;

export default function RequerantGrid() {
  const [q, setQ] = useState("");
  const [sexe, setSexe] = useState("");
  const [page, setPage] = useState(1);
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState(null);
  const admin = isAdmin();

  const load = () => {
    const p = new URLSearchParams({ page, page_size: SIZE });
    if (q.trim()) p.set("q", q.trim());
    if (sexe) p.set("sexe", sexe);
    api("/requerants/?" + p).then(setD).catch((e) => setMsg({ ok: false, t: e.message }));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, sexe, page]);
  useEffect(() => { setPage(1); }, [q, sexe]);

  const del = async (r) => {
    if (!window.confirm(`Supprimer ${r.nom_complet} (${r.code}) ? Ses demandes de documents seront aussi supprimées.`)) return;
    try { await api(`/requerants/${r.id}/`, { method: "DELETE" }); setMsg({ ok: true, t: "Requérant supprimé." }); load(); }
    catch (e) { setMsg({ ok: false, t: e.message }); }
  };

  return (
    <div>
      <PageHeader title="Grille de données" sub="Tous les requérants enregistrés.">
        <Link to="/requerants/nouveau" className="btn"><Ic.Plus /> Ajouter un requérant</Link>
      </PageHeader>
      <Msg m={msg} onClose={() => setMsg(null)} />
      <div className="card">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Ic.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="inp pl-9" type="search" placeholder="Nom, code (REQ-000012), téléphone, pays…" aria-label="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="inp w-auto" aria-label="Filtrer par sexe" value={sexe} onChange={(e) => setSexe(e.target.value)}>
            <option value="">Tous les sexes</option><option value="M">Masculin</option><option value="F">Féminin</option>
          </select>
        </div>
        {!d ? <p>Chargement…</p> : d.results.length === 0 ? <p className="py-6 text-center text-slate-500">Aucun requérant trouvé.</p> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="border-b"><tr>{["Code", "Requérant", "Sexe", "Naissance", "Nationalité", "Pays", "Téléphone", "Actions"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {d.results.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="td font-mono text-xs">{r.code}</td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          {r.image_url ? <img src={r.image_url} alt="" className="h-9 w-8 rounded object-cover" /> : <span className="flex h-9 w-8 items-center justify-center rounded bg-sky-light text-xs font-bold text-sky-dark" aria-hidden="true">{(r.nom[0] || "") + (r.prenom[0] || "")}</span>}
                          <span className="font-medium">{r.nom_complet}</span>
                        </div>
                      </td>
                      <td className="td"><Tag tone="blue">{r.sexe === "M" ? "M" : "F"}</Tag></td>
                      <td className="td whitespace-nowrap">{fdate(r.date_naissance)}</td>
                      <td className="td">{r.nationalite_requerant}</td>
                      <td className="td">{r.pays_requerant || "—"}</td>
                      <td className="td whitespace-nowrap">{r.telephone}</td>
                      <td className="td">
                        <div className="flex flex-wrap gap-3 whitespace-nowrap">
                          <Link to={`/octroi?requerant=${r.id}`} className="text-sky underline">Octroyer</Link>
                          <Link to={`/requerants/${r.id}/modifier`} className="text-sky underline">Modifier</Link>
                          {admin && <button type="button" className="text-flag underline" onClick={() => del(r)}>Supprimer</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} count={d.count} size={SIZE} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
