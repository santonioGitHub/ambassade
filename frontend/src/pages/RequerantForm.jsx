import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, send, toFormData } from "../api";
import { Field, Msg, PageHeader, today } from "../components/ui.jsx";

const EMPTY = {
  nom: "", postnom: "", prenom: "", sexe: "M", date_naissance: "", lieu_naissance: "", nationalite_requerant: "Congolaise",
  etat_civil: "Celibataire", profession: "", telephone: "", email: "",
  nom_partenaire: "", postnom_partenaire: "", prenom_partenaire: "", nationalite_partenaire: "",
  nom_pere: "", postnom_pere: "", prenom_pere: "", nationalite_pere: "",
  nom_mere: "", postnom_mere: "", prenom_mere: "", nationalite_mere: "",
  avanue_requerant: "", numero_av_requerant: "", quartier_requerant: "", province_requerant: "", pays_requerant: "", adresse: "",
};

const Section = ({ title, children }) => (
  <fieldset className="card space-y-4">
    <legend className="px-1 font-display text-lg font-bold">{title}</legend>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  </fieldset>
);

export default function RequerantForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [v, setV] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [current, setCurrent] = useState(null);
  const [msg, setMsg] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const top = useRef(null);

  useEffect(() => {
    setDone(null); setPhoto(null);
    if (!id) { setV(EMPTY); setCurrent(null); return; }
    api(`/requerants/${id}/`).then((r) => {
      setCurrent(r);
      setV(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, r[k] ?? ""])));
    }).catch((e) => setMsg({ ok: false, t: e.message }));
  }, [id]);

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const in_ = (k, props = {}) => <input className="inp" value={v[k]} onChange={set(k)} {...props} />;
  const married = v.etat_civil !== "Celibataire";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const fd = toFormData({ ...v, image: photo }, { keepEmpty: !!id });
      const r = await send(id ? `/requerants/${id}/` : "/requerants/", id ? "PATCH" : "POST", fd);
      if (id) { setMsg({ ok: true, t: "Modifications enregistrées." }); setCurrent(r); setPhoto(null); }
      else { setDone(r); setV(EMPTY); setPhoto(null); }
      top.current?.scrollIntoView({ behavior: "smooth" });
    } catch (x) {
      setMsg({ ok: false, t: x.message });
      top.current?.scrollIntoView({ behavior: "smooth" });
    } finally { setBusy(false); }
  };

  return (
    <div ref={top}>
      <PageHeader title={id ? "Modifier le requérant" : "Ajouter un requérant"}
        sub={id && current ? `${current.code} · ${current.nom_complet}` : "Les champs marqués * sont obligatoires."}>
        <Link to="/requerants" className="btn-ghost">Retour à la grille</Link>
      </PageHeader>
      <Msg m={msg} onClose={() => setMsg(null)} />
      {done && (
        <div role="status" className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-semibold">Requérant enregistré : {done.nom_complet}</p>
          <p className="mt-1 text-sm">Code attribué : <strong className="font-mono">{done.code}</strong></p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => nav(`/octroi?requerant=${done.id}`)}>Octroyer un document</button>
            <button type="button" className="btn-ghost" onClick={() => setDone(null)}>Ajouter un autre requérant</button>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <Section title="Identité">
          <Field label="Nom *">{in_("nom", { required: true, maxLength: 50 })}</Field>
          <Field label="Postnom">{in_("postnom", { maxLength: 50 })}</Field>
          <Field label="Prénom *">{in_("prenom", { required: true, maxLength: 50 })}</Field>
          <Field label="Sexe *">
            <select className="inp" value={v.sexe} onChange={set("sexe")}><option value="M">Masculin</option><option value="F">Féminin</option></select>
          </Field>
          <Field label="Date de naissance *">{in_("date_naissance", { type: "date", required: true, max: today() })}</Field>
          <Field label="Lieu de naissance *">{in_("lieu_naissance", { required: true, maxLength: 50 })}</Field>
          <Field label="Nationalité *">{in_("nationalite_requerant", { required: true, maxLength: 30 })}</Field>
          <Field label="État civil *">
            <select className="inp" value={v.etat_civil} onChange={set("etat_civil")}>
              <option>Celibataire</option><option>Marié(e)</option><option>Divorcé(e)</option>
            </select>
          </Field>
          <Field label="Profession">{in_("profession", { maxLength: 60 })}</Field>
          <Field label="Photo" hint="JPG, PNG ou WEBP, 3 Mo maximum." className="sm:col-span-2">
            <div className="flex items-center gap-3">
              {(photo || current?.image_url) && <img src={photo ? URL.createObjectURL(photo) : current.image_url} alt="Aperçu" className="h-16 w-14 rounded object-cover" />}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-light file:px-3 file:py-2 file:font-semibold file:text-sky-dark" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            </div>
          </Field>
        </Section>

        <Section title="Contact">
          <Field label="Téléphone *">{in_("telephone", { required: true, type: "tel", maxLength: 30 })}</Field>
          <Field label="E-mail">{in_("email", { type: "email", maxLength: 80 })}</Field>
        </Section>

        <Section title="Adresse">
          <Field label="Avenue / rue">{in_("avanue_requerant", { maxLength: 60 })}</Field>
          <Field label="Numéro">{in_("numero_av_requerant", { maxLength: 30 })}</Field>
          <Field label="Quartier">{in_("quartier_requerant", { maxLength: 60 })}</Field>
          <Field label="Province / région">{in_("province_requerant", { maxLength: 60 })}</Field>
          <Field label="Pays de résidence" hint="Utilisé pour la carte du tableau de bord.">{in_("pays_requerant", { maxLength: 60 })}</Field>
          <Field label="Adresse complète" className="sm:col-span-2 lg:col-span-3">
            <textarea className="inp" rows={2} maxLength={200} value={v.adresse} onChange={set("adresse")} />
          </Field>
        </Section>

        {married && (
          <Section title="Partenaire">
            <Field label="Nom">{in_("nom_partenaire", { maxLength: 50 })}</Field>
            <Field label="Postnom">{in_("postnom_partenaire", { maxLength: 50 })}</Field>
            <Field label="Prénom">{in_("prenom_partenaire", { maxLength: 50 })}</Field>
            <Field label="Nationalité">{in_("nationalite_partenaire", { maxLength: 100 })}</Field>
          </Section>
        )}

        <Section title="Père">
          <Field label="Nom">{in_("nom_pere", { maxLength: 50 })}</Field>
          <Field label="Postnom">{in_("postnom_pere", { maxLength: 50 })}</Field>
          <Field label="Prénom">{in_("prenom_pere", { maxLength: 50 })}</Field>
          <Field label="Nationalité">{in_("nationalite_pere", { maxLength: 100 })}</Field>
        </Section>
        <Section title="Mère">
          <Field label="Nom">{in_("nom_mere", { maxLength: 50 })}</Field>
          <Field label="Postnom">{in_("postnom_mere", { maxLength: 50 })}</Field>
          <Field label="Prénom">{in_("prenom_mere", { maxLength: 50 })}</Field>
          <Field label="Nationalité">{in_("nationalite_mere", { maxLength: 100 })}</Field>
        </Section>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-3 border-t bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          <button className="btn" disabled={busy}>{busy ? "Enregistrement…" : id ? "Enregistrer les modifications" : "Enregistrer le requérant"}</button>
          <Link to="/requerants" className="btn-ghost">Annuler</Link>
        </div>
      </form>
    </div>
  );
}
