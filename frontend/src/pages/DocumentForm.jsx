import { useEffect, useState } from "react";
import { api, isAdmin, send, toFormData } from "../api";
import * as Ic from "../components/Icons.jsx";
import { Field, Msg, PageHeader } from "../components/ui.jsx";
import { CORPS_PAR_DEFAUT, VARIABLES, VARIABLES_AGENT } from "../lib/docTemplate.js";

const EMPTY = { designation: "", description: "", beneficiaire: "REQUERANT", rendu: "ATTESTATION", corps: "", mention: "", validite_annees: "" };

export default function DocumentForm() {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null); // document en cours de modification
  const [v, setV] = useState(EMPTY);
  const [img, setImg] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const admin = isAdmin();

  const load = () => api("/documents/").then(setList).catch((e) => setMsg({ ok: false, t: e.message }));
  useEffect(() => { load(); }, []);

  const reset = () => { setEdit(null); setV(EMPTY); setImg(null); };
  const startEdit = (d) => { setEdit(d); setV({ designation: d.designation, description: d.description, beneficiaire: d.beneficiaire, rendu: d.rendu, corps: d.corps, mention: d.mention, validite_annees: d.validite_annees ?? "" }); setImg(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await send(edit ? `/documents/${edit.id}/` : "/documents/", edit ? "PATCH" : "POST", toFormData({ ...v, image: img }, { keepEmpty: !!edit }));
      setMsg({ ok: true, t: edit ? "Document modifié." : "Document ajouté au catalogue." });
      reset(); load();
    } catch (x) { setMsg({ ok: false, t: x.message }); } finally { setBusy(false); }
  };

  const del = async (d) => {
    if (!window.confirm(`Supprimer « ${d.designation} » du catalogue ?`)) return;
    try { await api(`/documents/${d.id}/`, { method: "DELETE" }); setMsg({ ok: true, t: "Document supprimé." }); load(); }
    catch (x) { setMsg({ ok: false, t: x.message }); }
  };

  return (
    <div>
      <PageHeader title="Ajouter un document" sub="Le catalogue des documents que l'ambassade peut octroyer." />
      <Msg m={msg} onClose={() => setMsg(null)} />
      <form onSubmit={submit} className="card mb-6 space-y-4">
        <h2 className="font-display text-lg font-bold">{edit ? `Modifier « ${edit.designation} »` : "Nouveau document"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Désignation *"><input className="inp" required maxLength={100} value={v.designation} onChange={(e) => setV({ ...v, designation: e.target.value })} /></Field>
          <Field label="Image (modèle, sceau)" hint="Facultative. Elle apparaît sur le document imprimé.">
            <input type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-light file:px-3 file:py-2 file:font-semibold file:text-sky-dark" onChange={(e) => setImg(e.target.files?.[0] || null)} />
          </Field>
          <Field label="Description" className="md:col-span-2"><textarea className="inp" rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
          <Field label="Délivré à *" hint="« Agent » : ordre de mission ou autre document de service pour un collègue.">
            <select className="inp" value={v.beneficiaire} onChange={(e) => setV({ ...v, beneficiaire: e.target.value, rendu: e.target.value === "AGENT" ? "ATTESTATION" : v.rendu })}>
              <option value="REQUERANT">Un requérant</option>
              <option value="AGENT">Un agent de l'ambassade (mission de service)</option>
            </select>
          </Field>
          <Field label="Modèle d'impression *">
            <select className="inp" value={v.rendu} disabled={v.beneficiaire === "AGENT"} onChange={(e) => setV({ ...v, rendu: e.target.value })}>
              <option value="ATTESTATION">Attestation : lettre A4 sur papier à en-tête</option>
              <option value="CARTE">Carte consulaire : recto / verso</option>
            </select>
          </Field>
          {v.rendu === "CARTE" ? (
            <Field label="Validité (années)" hint="Sert à calculer la date d'expiration de la carte.">
              <input className="inp" type="number" min={1} max={50} value={v.validite_annees} onChange={(e) => setV({ ...v, validite_annees: e.target.value })} />
            </Field>
          ) : (
            <Field label="Mention sous la signature" hint="Facultative, ex. : Agir en qualité d'Officier d'état civil.">
              <input className="inp" maxLength={150} value={v.mention} onChange={(e) => setV({ ...v, mention: e.target.value })} />
            </Field>
          )}
          {v.rendu === "ATTESTATION" && (
            <div className="md:col-span-2">
              <Field label="Texte du document" hint="Laissez vide pour utiliser le texte standard. Une ligne vide sépare les paragraphes ; « > » en début de paragraphe = italique ; **mot** = gras.">
                <textarea className="inp font-mono" rows={10} maxLength={4000} placeholder={CORPS_PAR_DEFAUT} value={v.corps} onChange={(e) => setV({ ...v, corps: e.target.value })} />
              </Field>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer font-medium text-sky-dark">Variables disponibles (remplacées par les données du requérant)</summary>
                <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {(v.beneficiaire === "AGENT" ? VARIABLES_AGENT : VARIABLES).map(([k, l]) => <li key={k}><code className="rounded bg-slate-100 px-1">{"{" + k + "}"}</code> <span className="text-slate-600">{l}</span></li>)}
                </ul>
              </details>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button className="btn" disabled={busy}>{busy ? "Enregistrement…" : edit ? "Enregistrer" : "Ajouter le document"}</button>
          {edit && <button type="button" className="btn-ghost" onClick={reset}>Annuler</button>}
        </div>
      </form>

      <h2 className="mb-3 font-display text-lg font-bold">Catalogue ({list.length})</h2>
      {list.length === 0 ? <p className="card text-slate-500">Aucun document pour le moment.</p> : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => (
            <li key={d.id} className="card flex gap-3">
              {d.image_url ? <img src={d.image_url} alt="" className="h-16 w-16 shrink-0 rounded object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-sky-light text-sky-dark" aria-hidden="true"><Ic.File /></div>}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{d.designation}</p>
                {d.description && <p className="line-clamp-2 text-sm text-slate-600">{d.description}</p>}
                <p className="mt-1 text-xs text-slate-500">{d.demandes} demande{d.demandes > 1 ? "s" : ""}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <button type="button" className="text-sky underline" onClick={() => startEdit(d)}>Modifier</button>
                  {admin && <button type="button" className="text-flag underline" onClick={() => del(d)}>Supprimer</button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
