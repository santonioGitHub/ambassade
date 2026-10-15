import { useEffect, useRef, useState } from "react";
import { api, getUser, send, toFormData } from "../api";
import { Field, Modal, Msg, PageHeader, Tag } from "../components/ui.jsx";
import { setSettingsCache } from "../useSettings.js";

const TABS = [["ambassade", "Ambassade"], ["securite", "Session"], ["utilisateurs", "Utilisateurs"]];

function Ambassade({ onMsg }) {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const file = useRef(null);
  const hfile = useRef(null);
  useEffect(() => { api("/settings/").then(setS).catch((e) => onMsg({ ok: false, t: e.message })); }, []);
  if (!s) return <p className="card">Chargement…</p>;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const d = await api("/settings/", { method: "PUT", body: s }); setS(d); setSettingsCache(d); onMsg({ ok: true, t: "Paramètres enregistrés." }); }
    catch (x) { onMsg({ ok: false, t: x.message }); } finally { setBusy(false); }
  };
  const logo = async (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    try { const d = await send("/settings/logo/", "POST", toFormData({ logo: f })); setS(d); setSettingsCache(d); onMsg({ ok: true, t: "Logo enregistré." }); }
    catch (x) { onMsg({ ok: false, t: x.message }); }
  };
  const headerImg = async (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    try { const d = await send("/settings/logo/?kind=header", "POST", toFormData({ logo: f })); setS(d); setSettingsCache(d); onMsg({ ok: true, t: "En-tête des documents enregistré." }); }
    catch (x) { onMsg({ ok: false, t: x.message }); }
  };
  const rmHeader = async () => {
    try { const d = await api("/settings/logo/?kind=header", { method: "DELETE" }); setS(d); setSettingsCache(d); onMsg({ ok: true, t: "En-tête remplacé par celui par défaut." }); }
    catch (x) { onMsg({ ok: false, t: x.message }); }
  };
  const rmLogo = async () => {
    try { const d = await api("/settings/logo/", { method: "DELETE" }); setS(d); setSettingsCache(d); onMsg({ ok: true, t: "Logo supprimé." }); }
    catch (x) { onMsg({ ok: false, t: x.message }); }
  };
  return (
    <form onSubmit={save} className="space-y-5">
      <section className="card space-y-4">
        <h2 className="font-display text-lg font-bold">Identité</h2>
        <div className="flex flex-wrap items-center gap-4">
          {s.logo ? <img src={s.logo} alt="Logo actuel" className="h-16 w-16 rounded border object-contain p-1" /> : <div className="flex h-16 w-16 items-center justify-center rounded bg-sky-light text-xs text-sky-dark">Aucun logo</div>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => file.current?.click()}>{s.logo ? "Changer le logo" : "Choisir un logo"}</button>
            {s.logo && <button type="button" className="btn-ghost" onClick={rmLogo}>Supprimer</button>}
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={logo} />
          </div>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-sm font-medium">En-tête des documents (logo + nom de l'ambassade)</p>
          <p className="mb-2 text-xs text-slate-500">Image PNG ou JPG, de préférence large (ex. 633 × 237). Par défaut : l'en-tête du modèle de document 2026.</p>
          <img src={s.header_image || "/entete.png"} alt="En-tête actuel" className="mb-2 h-16 object-contain" />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => hfile.current?.click()}>Remplacer l'en-tête</button>
            {s.header_image && <button type="button" className="btn-ghost" onClick={rmHeader}>Revenir à l'en-tête par défaut</button>}
            <input ref={hfile} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={headerImg} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom de l'ambassade *"><input className="inp" required value={s.embassy_name} onChange={set("embassy_name")} /></Field>
          <Field label="Ligne pays (en-tête des documents)"><input className="inp" value={s.country_line} onChange={set("country_line")} /></Field>
          <Field label="Ville"><input className="inp" value={s.city} onChange={set("city")} /></Field>
          <Field label="Adresse"><input className="inp" value={s.address} onChange={set("address")} /></Field>
          <Field label="Téléphone"><input className="inp" value={s.phone} onChange={set("phone")} /></Field>
          <Field label="E-mail"><input className="inp" type="email" value={s.email} onChange={set("email")} /></Field>
        </div>
      </section>
      <section className="card space-y-4">
        <h2 className="font-display text-lg font-bold">Signature des documents</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom du signataire" hint="Tel qu'il apparaît sous la signature."><input className="inp" value={s.ambassador_name} onChange={set("ambassador_name")} /></Field>
          <Field label="Fonction (dans le texte)" hint="Ex. : Ambassadeur extraordinaire et plénipotentiaire"><input className="inp" value={s.ambassador_title} onChange={set("ambassador_title")} /></Field>
          <Field label="Ligne sous le nom" hint="Ex. : Embaixadora Extraordinária e Plenipotenciária"><input className="inp" value={s.signature_note} onChange={set("signature_note")} /></Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4" checked={!!s.ambassador_feminin} onChange={(e) => setS({ ...s, ambassador_feminin: e.target.checked })} /> Signataire féminin (« je soussignée »)</label>
          <Field label="Pied de page" className="md:col-span-2"><input className="inp" value={s.footer_text} onChange={set("footer_text")} /></Field>
        </div>
      </section>
      <button className="btn" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}

function Securite({ onMsg }) {
  const [m, setM] = useState("");
  useEffect(() => { api("/settings/").then((s) => setM(s.session_minutes)).catch(() => {}); }, []);
  const save = async (e) => {
    e.preventDefault();
    try { const d = await api("/settings/", { method: "PUT", body: { session_minutes: Number(m) } }); setSettingsCache(d); onMsg({ ok: true, t: "Durée de session enregistrée. Elle s'applique aux prochaines connexions." }); }
    catch (x) { onMsg({ ok: false, t: x.message }); }
  };
  return (
    <form onSubmit={save} className="card max-w-md space-y-4">
      <h2 className="font-display text-lg font-bold">Expiration de session</h2>
      <Field label="Déconnexion automatique après (minutes d'inactivité)" hint="Entre 2 et 240.">
        <input className="inp" type="number" min={2} max={240} required value={m} onChange={(e) => setM(e.target.value)} />
      </Field>
      <button className="btn">Enregistrer</button>
    </form>
  );
}

function UserModal({ u, agents, onClose, onSaved }) {
  const [v, setV] = useState({ username: u?.username || "", first_name: u?.first_name || "", last_name: u?.last_name || "", email: u?.email || "", role: u?.role || "AGENT", agent: u?.agent || "", password: "", active: u ? u.active : true });
  const [err, setErr] = useState(null);
  const self = u && u.id === getUser()?.id;
  const submit = async (e) => {
    e.preventDefault(); setErr(null);
    const body = { ...v, agent: v.agent || null };
    if (!body.password) delete body.password;
    try {
      if (u) { delete body.username; await api(`/users/${u.id}/`, { method: "PATCH", body }); }
      else await api("/users/", { method: "POST", body });
      onSaved(u ? "Compte modifié." : "Compte créé.");
    } catch (x) { setErr({ ok: false, t: x.message }); }
  };
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal title={u ? `Compte « ${u.username} »` : "Nouveau compte"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Msg m={err} />
        {!u && <Field label="Identifiant *"><input className="inp" required autoComplete="off" value={v.username} onChange={set("username")} /></Field>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom"><input className="inp" value={v.first_name} onChange={set("first_name")} /></Field>
          <Field label="Nom"><input className="inp" value={v.last_name} onChange={set("last_name")} /></Field>
        </div>
        <Field label="E-mail"><input className="inp" type="email" value={v.email} onChange={set("email")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rôle *"><select className="inp" value={v.role} disabled={self} onChange={set("role")}><option value="AGENT">Agent</option><option value="ADMIN">Administrateur</option></select></Field>
          <Field label="Agent lié"><select className="inp" value={v.agent} onChange={set("agent")}><option value="">— Aucun —</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.nom} {a.prenom}</option>)}</select></Field>
        </div>
        <Field label={u ? "Nouveau mot de passe" : "Mot de passe *"} hint={u ? "Laissez vide pour ne pas le changer. Le changer ferme les sessions ouvertes." : "8 caractères minimum."}>
          <input className="inp" type="password" autoComplete="new-password" required={!u} minLength={8} value={v.password} onChange={set("password")} />
        </Field>
        {u && !self && (
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Compte actif (peut se connecter)</label>
        )}
        <div className="flex gap-3"><button className="btn">Enregistrer</button><button type="button" className="btn-ghost" onClick={onClose}>Annuler</button></div>
      </form>
    </Modal>
  );
}

function Utilisateurs({ onMsg }) {
  const [list, setList] = useState(null);
  const [agents, setAgents] = useState([]);
  const [modal, setModal] = useState(null);
  const load = () => api("/users/").then(setList).catch((e) => onMsg({ ok: false, t: e.message }));
  useEffect(() => { load(); api("/agents/").then(setAgents).catch(() => {}); }, []);
  const del = async (u) => {
    if (!window.confirm(`Supprimer le compte « ${u.username} » ?`)) return;
    try { await api(`/users/${u.id}/`, { method: "DELETE" }); onMsg({ ok: true, t: "Compte supprimé." }); load(); } catch (x) { onMsg({ ok: false, t: x.message }); }
  };
  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Comptes utilisateurs</h2>
        <button type="button" className="btn" onClick={() => setModal({})}>Nouveau compte</button>
      </div>
      {!list ? <p>Chargement…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b"><tr>{["Identifiant", "Nom", "Rôle", "État", "Actions"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {list.map((u) => (
                <tr key={u.id}>
                  <td className="td font-medium">{u.username}</td><td className="td">{u.name}</td>
                  <td className="td"><Tag tone={u.role === "ADMIN" ? "blue" : "grey"}>{u.role === "ADMIN" ? "Administrateur" : "Agent"}</Tag></td>
                  <td className="td"><Tag tone={u.active ? "green" : "red"}>{u.active ? "Actif" : "Désactivé"}</Tag></td>
                  <td className="td"><div className="flex gap-3 whitespace-nowrap">
                    <button type="button" className="text-sky underline" onClick={() => setModal({ u })}>Modifier</button>
                    {u.id !== getUser()?.id && <button type="button" className="text-flag underline" onClick={() => del(u)}>Supprimer</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && <UserModal u={modal.u} agents={agents} onClose={() => setModal(null)} onSaved={(t) => { setModal(null); onMsg({ ok: true, t }); load(); }} />}
    </div>
  );
}

export default function Parametres() {
  const [tab, setTab] = useState("ambassade");
  const [msg, setMsg] = useState(null);
  return (
    <div>
      <PageHeader title="Paramètre" sub="Configuration de l'application, réservée à l'administrateur." />
      <div role="tablist" aria-label="Rubriques" className="mb-5 flex gap-1 overflow-x-auto border-b">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => { setTab(k); setMsg(null); }}
            className={"whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold " + (tab === k ? "border-sky text-sky-dark" : "border-transparent text-slate-600 hover:text-ink")}>{l}</button>
        ))}
      </div>
      <Msg m={msg} onClose={() => setMsg(null)} />
      {tab === "ambassade" && <Ambassade onMsg={setMsg} />}
      {tab === "securite" && <Securite onMsg={setMsg} />}
      {tab === "utilisateurs" && <Utilisateurs onMsg={setMsg} />}
    </div>
  );
}
