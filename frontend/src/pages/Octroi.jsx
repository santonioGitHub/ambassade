import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import * as Ic from "../components/Icons.jsx";
import { Field, Msg, PageHeader, Tag, fdate, today } from "../components/ui.jsx";
import useSettings from "../useSettings.js";

const MOTIFS = ["Nouveau", "Renouvellement", "Perte", "Autre"];
const MISSION0 = { pays: "Portugal", trajet: "", motif: "", duree: "", frais: "A charge du Trésor Public", signataire_nom: "", signataire_fonction: "", signataire_grade: "" };

export default function Octroi() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const s = useSettings();
  const [docs, setDocs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [req, setReq] = useState(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState([]);
  const [f, setF] = useState({ type_document: "", motif_de_demande: "Nouveau", date_demande: today(), agent: "" });
  const [mission, setMission] = useState(MISSION0);
  const [autreSignataire, setAutreSignataire] = useState(false);
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const doc = docs.find((d) => String(d.id) === String(f.type_document));
  const pourAgent = doc?.beneficiaire === "AGENT";

  const loadPending = () => api("/demandes/?delivred=false&page_size=50").then((d) => setPending(d.results)).catch(() => {});
  useEffect(() => {
    api("/documents/").then(setDocs).catch((e) => setMsg({ ok: false, t: e.message }));
    api("/agents/annuaire/").then(setAgents).catch(() => {});
    loadPending();
    const id = params.get("requerant");
    if (id) api(`/requerants/${id}/`).then(setReq).catch(() => setMsg({ ok: false, t: "Requérant introuvable." }));
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(() => api("/requerants/?page_size=8&q=" + encodeURIComponent(q.trim())).then((d) => setFound(d.results)).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [q]);

  const setM = (k) => (e) => setMission({ ...mission, [k]: e.target.value });

  const create = async (servir) => {
    setBusy(true); setMsg(null);
    try {
      const body = { type_document: f.type_document, date_demande: f.date_demande, servir };
      if (pourAgent) {
        const m = { ...mission };
        if (!autreSignataire) { m.signataire_nom = ""; m.signataire_fonction = ""; m.signataire_grade = ""; }
        Object.assign(body, { agent: f.agent, motif_de_demande: "Autre", mission: m });
      } else {
        Object.assign(body, { nom_du_demandeur: req.id, motif_de_demande: f.motif_de_demande });
      }
      const d = await api("/demandes/", { method: "POST", body });
      if (servir) nav(`/demandes/${d.id}/imprimer`);
      else { setMsg({ ok: true, t: `Demande ${d.reference} enregistrée, en attente.` }); loadPending(); }
    } catch (x) { setMsg({ ok: false, t: x.message }); } finally { setBusy(false); }
  };

  const servir = async (d) => {
    try { await api(`/demandes/${d.id}/servir/`, { method: "POST" }); nav(`/demandes/${d.id}/imprimer`); }
    catch (x) { setMsg({ ok: false, t: x.message }); }
  };

  const ready = f.type_document && f.date_demande &&
    (pourAgent ? f.agent && mission.trajet.trim() && mission.motif.trim() && mission.duree.trim() : req);

  return (
    <div>
      <PageHeader title="Octroi de document" sub="Choisissez le document, puis son bénéficiaire : un requérant enregistré ou, pour une mission de service, un agent." />
      <Msg m={msg} onClose={() => setMsg(null)} />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-4" aria-labelledby="h-doc">
          <h2 id="h-doc" className="font-display text-lg font-bold">1. Document</h2>
          <Field label="Document *">
            <select className="inp" value={f.type_document} onChange={(e) => setF({ ...f, type_document: e.target.value })}>
              <option value="">— Choisir un document —</option>
              {docs.map((d) => <option key={d.id} value={d.id}>{d.designation}{d.beneficiaire === "AGENT" ? " (agent)" : ""}</option>)}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {!pourAgent && (
              <Field label="Motif *">
                <select className="inp" value={f.motif_de_demande} onChange={(e) => setF({ ...f, motif_de_demande: e.target.value })}>{MOTIFS.map((m) => <option key={m}>{m}</option>)}</select>
              </Field>
            )}
            <Field label="Date de la demande *"><input className="inp" type="date" max={today()} value={f.date_demande} onChange={(e) => setF({ ...f, date_demande: e.target.value })} /></Field>
          </div>
          {docs.length === 0 && <p className="text-sm text-slate-600">Le catalogue est vide : <Link to="/documents" className="text-sky underline">ajoutez un document</Link>.</p>}
        </section>

        {pourAgent ? (
          <section className="card space-y-4" aria-labelledby="h-ag">
            <h2 id="h-ag" className="font-display text-lg font-bold">2. Agent bénéficiaire</h2>
            <Field label="Agent *">
              <select className="inp" value={f.agent} onChange={(e) => setF({ ...f, agent: e.target.value })}>
                <option value="">— Choisir un agent —</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.nom_complet} · {a.matricule} · {a.fonction}</option>)}
              </select>
            </Field>
            {f.agent && (() => { const a = agents.find((x) => String(x.id) === String(f.agent)); return a && (
              <dl className="rounded-md border border-sky/40 bg-sky-light p-3 text-sm">
                <dt className="text-xs uppercase tracking-wide text-slate-600">Matricule</dt><dd className="font-mono font-semibold">{a.matricule}</dd>
                <dt className="mt-2 text-xs uppercase tracking-wide text-slate-600">Grade</dt><dd className="font-semibold">{a.fonction}</dd>
              </dl>); })()}
          </section>
        ) : (
          <section className="card space-y-4" aria-labelledby="h-req">
            <h2 id="h-req" className="font-display text-lg font-bold">2. Requérant</h2>
            {req ? (
              <div className="rounded-md border border-sky/40 bg-sky-light p-3">
                <div className="flex items-start gap-3">
                  {req.image_url ? <img src={req.image_url} alt="" className="h-16 w-14 rounded object-cover" /> : null}
                  <dl className="min-w-0 flex-1 text-sm">
                    <dt className="text-xs uppercase tracking-wide text-slate-600">Code</dt>
                    <dd className="font-mono font-semibold">{req.code}</dd>
                    <dt className="mt-2 text-xs uppercase tracking-wide text-slate-600">Nom</dt>
                    <dd className="font-semibold">{req.nom_complet}</dd>
                  </dl>
                  <button type="button" className="text-sm text-sky-dark underline" onClick={() => { setReq(null); setQ(""); }}>Changer</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Ic.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="inp pl-9" type="search" aria-label="Rechercher un requérant" placeholder="Nom ou code (REQ-000012)…" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                {found.length > 0 && (
                  <ul className="mt-2 divide-y rounded-md border">
                    {found.map((r) => (
                      <li key={r.id}>
                        <button type="button" className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50" onClick={() => { setReq(r); setFound([]); }}>
                          <span className="font-medium">{r.nom_complet}</span><span className="font-mono text-xs text-slate-500">{r.code}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {q.trim().length >= 2 && found.length === 0 && (
                  <p className="mt-2 text-sm text-slate-600">Aucun résultat. <Link to="/requerants/nouveau" className="text-sky underline">Enregistrer ce requérant</Link></p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {pourAgent && (
        <section className="card mt-5 space-y-4" aria-labelledby="h-mis">
          <h2 id="h-mis" className="font-display text-lg font-bold">3. Mission</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Pays (d'affectation)"><input className="inp" maxLength={200} value={mission.pays} onChange={setM("pays")} /></Field>
            <Field label="Durée *" hint="Ex. : 30 jours"><input className="inp" maxLength={200} value={mission.duree} onChange={setM("duree")} /></Field>
            <Field label="Trajet *" hint="Ex. : Lisbonne – Casablanca – Kinshasa" className="md:col-span-2"><input className="inp" maxLength={200} value={mission.trajet} onChange={setM("trajet")} /></Field>
            <Field label="Motif *" hint="Ex. : Suivi des dossiers administratifs" className="md:col-span-2"><input className="inp" maxLength={200} value={mission.motif} onChange={setM("motif")} /></Field>
            <Field label="Frais" className="md:col-span-2"><input className="inp" maxLength={200} value={mission.frais} onChange={setM("frais")} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4" checked={autreSignataire} onChange={(e) => setAutreSignataire(e.target.checked)} />
            Signé par une autre personne que {s?.ambassador_name || "l'ambassadeur"} (ex. chargé d'affaires a.i.)
          </label>
          {autreSignataire && (
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Qualité" hint="Ex. : Chargé d'Affaires a.i"><input className="inp" maxLength={200} value={mission.signataire_fonction} onChange={setM("signataire_fonction")} /></Field>
              <Field label="Nom *"><input className="inp" maxLength={200} value={mission.signataire_nom} onChange={setM("signataire_nom")} /></Field>
              <Field label="Grade" hint="Ex. : Ministre Conseiller"><input className="inp" maxLength={200} value={mission.signataire_grade} onChange={setM("signataire_grade")} /></Field>
            </div>
          )}
        </section>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn" disabled={!ready || busy || (pourAgent && autreSignataire && !mission.signataire_nom.trim())} onClick={() => create(true)}><Ic.Print /> Générer le document</button>
        <button type="button" className="btn-ghost" disabled={!ready || busy || (pourAgent && autreSignataire && !mission.signataire_nom.trim())} onClick={() => create(false)}>Enregistrer en attente</button>
      </div>

      <section className="card mt-5" aria-labelledby="h-pend">
        <h2 id="h-pend" className="mb-3 font-display text-lg font-bold">Demandes en attente ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-sm text-slate-500">Aucune demande en attente.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="border-b"><tr>{["Référence", "Bénéficiaire", "Document", "Motif", "Demandée le", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {pending.map((d) => (
                  <tr key={d.id}>
                    <td className="td font-mono text-xs">{d.reference}</td>
                    <td className="td"><span className="font-medium">{d.requerant_nom}</span><br /><span className="text-xs text-slate-500">{d.requerant_code}</span></td>
                    <td className="td">{d.document_nom}</td>
                    <td className="td"><Tag tone="amber">{d.beneficiaire === "AGENT" ? "Mission" : d.motif_de_demande}</Tag></td>
                    <td className="td whitespace-nowrap">{fdate(d.date_demande)}</td>
                    <td className="td"><button type="button" className="btn !min-h-0 py-1.5" onClick={() => servir(d)}>Octroyer</button></td>
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
