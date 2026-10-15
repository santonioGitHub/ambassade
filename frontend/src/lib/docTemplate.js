// Variables utilisables dans le texte d'un document : {nom_complet}, {pere}, etc.
export const VARIABLES = [
  ["nom_complet", "Prénom NOM POSTNOM du requérant"], ["nom", "Nom"], ["postnom", "Postnom"], ["prenom", "Prénom"],
  ["civilite", "Monsieur / Madame"], ["le_nomme", "le nommé / la nommée"], ["ne", "né / née"], ["fils", "fils / fille"],
  ["lieu_naissance", "Lieu de naissance"], ["date_naissance", "Date de naissance (jj/mm/aaaa)"], ["nationalite", "Nationalité"],
  ["etat_civil", "État civil"], ["profession", "Profession"], ["adresse", "Adresse de résidence"],
  ["pere", "NOM POSTNOM Prénom du père"], ["mere", "NOM POSTNOM Prénom de la mère"], ["code", "Code requérant"],
  ["reference", "Référence du document"], ["document", "Nom du document"], ["motif", "Motif de la demande"],
  ["age", "Âge en années à la date d'octroi (ex. 27)"], ["date_demande", "Date de la demande"], ["signataire", "Nom du signataire"], ["fonction_signataire", "Fonction du signataire"],
  ["soussigne", "soussigné / soussignée"], ["ambassade", "Nom de l'ambassade"], ["ville", "Ville"],
];

// Variables des documents « mission de service » (délivrés à un agent de l'ambassade).
export const VARIABLES_AGENT = [
  ["agent_nom", "Nom de l'agent"], ["agent_postnom", "Postnom"], ["agent_prenom", "Prénom"], ["agent_matricule", "Matricule"],
  ["nom_complet", "Prénom NOM POSTNOM"], ["grade", "Fonction / grade de l'agent"], ["autorise", "autorisé / autorisée"],
  ["age", "Âge en années à la date d'octroi"], ["mission_pays", "Pays"], ["mission_trajet", "Trajet"],
  ["mission_motif", "Motif de la mission"], ["mission_duree", "Durée"], ["mission_frais", "Frais"],
  ["reference", "Référence du document"], ["document", "Nom du document"], ["date_demande", "Date de la demande"],
  ["signataire", "Nom du signataire"], ["fonction_signataire", "Fonction du signataire"], ["soussigne", "soussigné / soussignée"],
  ["ambassade", "Nom de l'ambassade"], ["ville", "Ville"],
];

// Texte utilisé quand un document n'a pas encore de texte propre.
export const CORPS_PAR_DEFAUT = `Je {soussigne} {signataire}, {fonction_signataire} de l'{ambassade} ;

Certifie que, selon les documents d'état civil ou d'identité présentés par {le_nomme} **{nom_complet}** {ne} à {lieu_naissance}, le {date_naissance} ; {fils} de {pere} (père) et {mere} (mère) ; de nationalité {nationalite} ; résidant à {adresse}, a introduit auprès de nos services une demande de « {document} » (motif : {motif}), enregistrée le {date_demande} sous la référence {reference}.

En foi de quoi, le présent lui est donné pour servir ce que de droit.`;

const j = (...p) => p.filter(Boolean).join(" ");
export const dShort = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR") : "");
export const dLong = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");

// Âge en années complètes à la date d'octroi (anniversaire pas encore passé → un an de moins).
export function ageAt(naissance, ref) {
  if (!naissance) return "";
  const n = new Date(naissance + "T00:00:00");
  const d = ref ? new Date(ref + "T00:00:00") : new Date();
  let age = d.getFullYear() - n.getFullYear();
  if (d.getMonth() < n.getMonth() || (d.getMonth() === n.getMonth() && d.getDate() < n.getDate())) age -= 1;
  return age >= 0 ? String(age) : "";
}

export function adresseDe(r) {
  return (r.adresse || "").trim() || j(r.avanue_requerant, r.numero_av_requerant, r.quartier_requerant, r.province_requerant, r.pays_requerant);
}

function buildVarsAgent(m, s) {
  const a = m.beneficiaire_agent;
  const f = a.sexe === "F";
  const ms = m.mission || {};
  return {
    agent_nom: a.nom.toUpperCase(), agent_postnom: (a.postnom || "").toUpperCase(), agent_prenom: a.prenom,
    agent_matricule: a.matricule, grade: a.fonction_libelle, autorise: f ? "autorisée" : "autorisé",
    nom_complet: j(a.prenom, a.nom.toUpperCase(), (a.postnom || "").toUpperCase()), code: a.matricule,
    age: ageAt(a.date_naissance, m.delivered_at),
    mission_pays: ms.pays || "", mission_trajet: ms.trajet || "", mission_motif: ms.motif || "",
    mission_duree: ms.duree || "", mission_frais: ms.frais || "",
    reference: m.reference, document: m.document_nom, date_demande: dShort(m.date_demande),
    signataire: s.ambassador_name || "…", fonction_signataire: s.ambassador_title || "",
    soussigne: s.ambassador_feminin ? "soussignée" : "soussigné", ambassade: s.embassy_name, ville: s.city,
  };
}

export function buildVars(m, s) {
  if (m.beneficiaire_agent) return buildVarsAgent(m, s);
  const r = m.requerant;
  const f = r.sexe === "F";
  const parent = (n, p, pr) => j(n && n.toUpperCase(), p && p.toUpperCase(), pr) || "—";
  return {
    nom_complet: j(r.prenom, r.nom.toUpperCase(), (r.postnom || "").toUpperCase()),
    nom: r.nom.toUpperCase(), postnom: (r.postnom || "").toUpperCase(), prenom: r.prenom,
    civilite: f ? "Madame" : "Monsieur", le_nomme: f ? "la nommée" : "le nommé", ne: f ? "née" : "né", fils: f ? "fille" : "fils",
    lieu_naissance: r.lieu_naissance, date_naissance: dShort(r.date_naissance),
    nationalite: (r.nationalite_requerant || "").toLowerCase(), etat_civil: (r.etat_civil || "").toLowerCase(),
    profession: r.profession || "", adresse: adresseDe(r) || "—",
    pere: parent(r.nom_pere, r.postnom_pere, r.prenom_pere), mere: parent(r.nom_mere, r.postnom_mere, r.prenom_mere),
    code: r.code, reference: m.reference, document: m.document_nom, motif: (m.motif_de_demande || "").toLowerCase(),
    date_demande: dShort(m.date_demande), age: ageAt(r.date_naissance, m.delivered_at),
    signataire: s.ambassador_name || "…", fonction_signataire: s.ambassador_title || "",
    soussigne: s.ambassador_feminin ? "soussignée" : "soussigné", ambassade: s.embassy_name, ville: s.city,
  };
}

// Texte → paragraphes ; « > » en début de paragraphe = italique ; **gras** ; variable inconnue laissée telle quelle.
export function renderCorps(text, vars) {
  const src = (text || "").trim() || CORPS_PAR_DEFAUT;
  return src.split(/\n\s*\n/).map((raw) => {
    let t = raw.trim();
    const italic = t.startsWith(">");
    if (italic) t = t.replace(/^>\s?/gm, "");
    t = t.replace(/\{(\w+)\}/g, (all, k) => (k in vars ? vars[k] : all));
    const parts = [];
    let last = 0;
    for (const mt of t.matchAll(/\*\*(.+?)\*\*/g)) {
      if (mt.index > last) parts.push({ t: t.slice(last, mt.index), b: false });
      parts.push({ t: mt[1], b: true });
      last = mt.index + mt[0].length;
    }
    if (last < t.length) parts.push({ t: t.slice(last), b: false });
    return { italic, parts };
  });
}
