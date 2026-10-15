import { useEffect, useState } from "react";
import { api, send, toFormData } from "../api";
import * as Ic from "../components/Icons.jsx";
import { Field, Modal, Msg, PageHeader, STATUT, Tag, fdate } from "../components/ui.jsx";

const EMPTY = { matricule: "", nom: "", postnom: "", prenom: "", sexe: "M", date_naissance: "", fonction: "", taxe: "N/A", numero_sante: "N/A", statut: "ACTIF" };

function AgentModal({ agent, fonctions, onClose, onSaved }) {
  const [v, setV] = useState(agent ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, agent[k] ?? ""])) : EMPTY);
  const [img, setImg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      await send(agent ? `/agents/${agent.id}/` : "/agents/", agent ? "PATCH" : "POST", toFormData({ ...v, image: img }, { keepEmpty: !!agent }));
      onSaved(agent ? "Agent modifié." : "Agent ajouté.");
    } catch (x) { setErr({ ok: false, t: x.message }); } finally { setBusy(false); }
  };
  return (
    <Modal title={agent ? "Modifier l'agent" : "Nouvel agent"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <Msg m={err} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Matricule *"><input className="inp" required maxLength={150} value={v.matricule} onChange={set("matricule")} /></Field>
          <Field label="Fonction *">
            <select className="inp" required value={v.fonction} onChange={set("fonction")}>
              <option value="">— Choisir —</option>{fonctions.map((f) => <option key={f.id} value={f.id}>{f.libelle}</option>)}
            </select>
          </Field>
          <Field label="Nom *"><input className="inp" required maxLength={50} value={v.nom} onChange={set("nom")} /></Field>
          <Field label="Postnom"><input className="inp" maxLength={50} value={v.postnom} onChange={set("postnom")} /></Field>
          <Field label="Prénom *"><input className="inp" required maxLength={20} value={v.prenom} onChange={set("prenom")} /></Field>
          <Field label="Sexe *"><select className="inp" value={v.sexe} onChange={set("sexe")}><option value="M">Masculin</option><option value="F">Féminin</option></select></Field>
          <Field label="Date de naissance *"><input className="inp" type="date" required value={v.date_naissance} onChange={set("date_naissance")} /></Field>
          <Field label="Statut *">
            <select className="inp" value={v.statut} onChange={set("statut")}>{Object.entries(STATUT).map(([k, [, l]]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
          <Field label="Taxe"><input className="inp" maxLength={20} value={v.taxe} onChange={set("taxe")} /></Field>
          <Field label="N° santé"><input className="inp" maxLength={20} value={v.numero_sante} onChange={set("numero_sante")} /></Field>
          <Field label="Photo" className="sm:col-span-2"><input type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-light file:px-3 file:py-2 file:font-semibold file:text-sky-dark" onChange={(e) => setImg(e.target.files?.[0] || null)} /></Field>
        </div>
        <div className="flex gap-3">
          <button className="btn" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
        </div>
      </form>
    </Modal>
  );
}

function FonctionsModal({ fonctions, onClose, onChanged }) {
  const [v, setV] = useState({ libelle: "", description: "" });
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState(null);
  const save = async (e) => {
    e.preventDefault(); setErr(null);
    try {
      await api(edit ? `/fonctions/${edit.id}/` : "/fonctions/", { method: edit ? "PATCH" : "POST", body: v });
      setV({ libelle: "", description: "" }); setEdit(null); onChanged();
    } catch (x) { setErr({ ok: false, t: x.message }); }
  };
  const del = async (f) => {
    if (!window.confirm(`Supprimer la fonction « ${f.libelle} » ?`)) return;
    try { await api(`/fonctions/${f.id}/`, { method: "DELETE" }); onChanged(); } catch (x) { setErr({ ok: false, t: x.message }); }
  };
  return (
    <Modal title="Fonctions" onClose={onClose}>
      <Msg m={err} />
      <form onSubmit={save} className="mb-4 space-y-3">
        <Field label="Libellé *"><input className="inp" required maxLength={30} value={v.libelle} onChange={(e) => setV({ ...v, libelle: e.target.value })} /></Field>
        <Field label="Description"><input className="inp" maxLength={150} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
        <div className="flex gap-3">
          <button className="btn">{edit ? "Enregistrer" : "Ajouter la fonction"}</button>
          {edit && <button type="button" className="btn-ghost" onClick={() => { setEdit(null); setV({ libelle: "", description: "" }); }}>Annuler</button>}
        </div>
      </form>
      <ul className="divide-y rounded-md border">
        {fonctions.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <div className="min-w-0"><p className="font-medium">{f.libelle}</p><p className="truncate text-xs text-slate-500">{f.description} · {f.agents} agent{f.agents > 1 ? "s" : ""}</p></div>
            <div className="flex gap-3"><button type="button" className="text-sky underline" onClick={() => { setEdit(f); setV({ libelle: f.libelle, description: f.description }); }}>Modifier</button><button type="button" className="text-flag underline" onClick={() => del(f)}>Supprimer</button></div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export default function Agents() {
  const [agents, setAgents] = useState(null);
  const [fonctions, setFonctions] = useState([]);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [modal, setModal] = useState(null); // {type:'agent', agent?} | {type:'fonctions'}
  const [msg, setMsg] = useState(null);

  const loadF = () => api("/fonctions/").then(setFonctions).catch(() => {});
  const load = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (statut) p.set("statut", statut);
    api("/agents/?" + p).then(setAgents).catch((e) => setMsg({ ok: false, t: e.message }));
  };
  useEffect(() => { loadF(); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, statut]);

  const del = async (a) => {
    if (!window.confirm(`Supprimer l'agent ${a.nom} ${a.prenom} (${a.matricule}) ?`)) return;
    try { await api(`/agents/${a.id}/`, { method: "DELETE" }); setMsg({ ok: true, t: "Agent supprimé." }); load(); } catch (x) { setMsg({ ok: false, t: x.message }); }
  };

  return (
    <div>
      <PageHeader title="Gestion des agents" sub="Le personnel de l'ambassade.">
        <button type="button" className="btn-ghost" onClick={() => setModal({ type: "fonctions" })}>Fonctions</button>
        <button type="button" className="btn" onClick={() => setModal({ type: "agent" })}><Ic.Plus /> Nouvel agent</button>
      </PageHeader>
      <Msg m={msg} onClose={() => setMsg(null)} />
      <div className="card">
        <div className="mb-4 flex flex-wrap gap-3">
          <input className="inp min-w-[14rem] flex-1" type="search" aria-label="Rechercher un agent" placeholder="Nom ou matricule…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="inp w-auto" aria-label="Filtrer par statut" value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous les statuts</option>{Object.entries(STATUT).map(([k, [, l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        {!agents ? <p>Chargement…</p> : agents.length === 0 ? <p className="py-6 text-center text-slate-500">Aucun agent. Ajoutez le premier avec « Nouvel agent ».</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b"><tr>{["Matricule", "Agent", "Fonction", "Naissance", "Statut", "Actions"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {agents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="td font-mono text-xs">{a.matricule}</td>
                    <td className="td"><div className="flex items-center gap-2">
                      {a.image_url ? <img src={a.image_url} alt="" className="h-9 w-8 rounded object-cover" /> : <span className="flex h-9 w-8 items-center justify-center rounded bg-sky-light text-xs font-bold text-sky-dark" aria-hidden="true">{a.nom[0]}{a.prenom[0]}</span>}
                      <span className="font-medium">{[a.nom, a.postnom, a.prenom].filter(Boolean).join(" ")}</span></div></td>
                    <td className="td">{a.fonction_libelle}</td>
                    <td className="td whitespace-nowrap">{fdate(a.date_naissance)}</td>
                    <td className="td"><Tag tone={STATUT[a.statut][0]}>{STATUT[a.statut][1]}</Tag></td>
                    <td className="td"><div className="flex gap-3 whitespace-nowrap">
                      <button type="button" className="text-sky underline" onClick={() => setModal({ type: "agent", agent: a })}>Modifier</button>
                      <button type="button" className="text-flag underline" onClick={() => del(a)}>Supprimer</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal?.type === "agent" && <AgentModal agent={modal.agent} fonctions={fonctions} onClose={() => setModal(null)} onSaved={(t) => { setModal(null); setMsg({ ok: true, t }); load(); }} />}
      {modal?.type === "fonctions" && <FonctionsModal fonctions={fonctions} onClose={() => setModal(null)} onChanged={() => { loadF(); load(); }} />}
    </div>
  );
}
