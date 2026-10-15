// Mise en page imprimable des documents : lettre A4 à en-tête (modèle 2026) et carte consulaire recto/verso.
// Styles volontairement en ligne / CSS local : le rendu ne dépend pas de Tailwind.
import { adresseDe, buildVars, dLong, dShort, renderCorps } from "../lib/docTemplate.js";

const NAVY = "#0A2463", GOLD = "#E0B01E", RED = "#C8102E", SKY = "#1F6FCB";

const CSS = `
@page { size: A4; margin: 0; }
.dp-sheet { box-sizing: border-box; width: 210mm; min-height: 297mm; margin: 24px auto; background: #fff; color: #000;
  box-shadow: 0 2px 14px rgba(0,0,0,.25); display: flex; flex-direction: column; padding: 11mm 15mm 0; font-family: "Times New Roman", Times, "Source Serif 4 Variable", serif; }
.dp-sans { font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; }
.dp-body p { margin: 0 0 3.2mm; text-align: justify; font-size: 11.5pt; line-height: 1.5; white-space: pre-line; }
.dp-cards { width: 210mm; margin: 24px auto; display: flex; flex-wrap: wrap; justify-content: center; gap: 10mm; padding: 10mm; background: #fff; box-sizing: border-box; box-shadow: 0 2px 14px rgba(0,0,0,.25); }
@media print {
  .dp-sheet, .dp-cards { margin: 0; box-shadow: none; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
@media (max-width: 800px) { .dp-sheet, .dp-cards { width: 100%; } }
`;

export const PaperStyle = () => <style>{CSS}</style>;

function Lettre({ m, s }) {
  const blocks = renderCorps(m.document.corps, buildVars(m, s));
  const header = s.header_image || "/entete.png";
  // Signature : par défaut l'ambassadeur ; un ordre de mission peut être signé par une autre personne (ex. chargé d'affaires a.i.)
  const ms = m.mission || {};
  const sig = ms.signataire_nom
    ? { nom: ms.signataire_nom, fonction: ms.signataire_fonction, grade: ms.signataire_grade }
    : { nom: s.ambassador_name, fonction: "", grade: s.signature_note };
  const [l1, ...l2] = (s.address || "").split(/,\s*/);
  return (
    <article className="dp-sheet" aria-label={m.document_nom}>
      <header style={{ marginBottom: "12mm" }}>
        <img src={header} alt={s.embassy_name} style={{ height: "30mm", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }} />
      </header>

      <h1 className="dp-sans" style={{ textAlign: "center", fontSize: "13.5pt", fontWeight: 700, textDecoration: "underline", textTransform: "uppercase", margin: "0 0 11mm" }}>{m.document_nom}</h1>

      <div className="dp-body">
        {blocks.map((b, i) => (
          <p key={i} style={b.italic ? { fontStyle: "italic" } : undefined}>
            {b.parts.map((p, k) => (p.b ? <strong key={k}>{p.t}</strong> : <span key={k}>{p.t}</span>))}
          </p>
        ))}
      </div>

      <p className="dp-sans" style={{ textAlign: "right", margin: "16mm 4mm 0 0", fontSize: "11.5pt" }}>{s.city}, le {dLong(m.delivered_at || m.date_demande)}</p>

      <div style={{ margin: "10mm 0 0 auto", width: "88mm", textAlign: "center" }}>
        {sig.fonction && <p className="dp-sans" style={{ margin: 0, fontSize: "10.5pt" }}>{sig.fonction}</p>}
        <div style={{ height: "22mm" }} aria-hidden="true" />
        <p style={{ margin: 0, fontWeight: 700, fontSize: "12pt", textDecoration: "underline" }}>{sig.nom}</p>
        {sig.grade && <p className="dp-sans" style={{ margin: "1mm 0 0", fontSize: "10.5pt" }}>{sig.grade}</p>}
        {m.document.mention && <p className="dp-sans" style={{ margin: "5mm 0 0", fontSize: "10.5pt", textAlign: "left", paddingLeft: "6mm" }}>{m.document.mention}</p>}
      </div>

      <footer style={{ marginTop: "auto", paddingBottom: "8mm" }}>
        {s.footer_text && <p className="dp-sans" style={{ textAlign: "center", fontSize: "8.5pt", margin: "0 0 3mm" }}>{s.footer_text}</p>}
        <p className="dp-sans" style={{ display: "flex", justifyContent: "space-between", margin: "0 0 2mm", fontSize: "8.5pt" }}>
          <span>{m.beneficiaire === "AGENT" ? "Matricule" : "N° requérant"} : <strong>{m.requerant_code}</strong></span>
          <span>Réf. : {m.reference}</span>
        </p>
        <img src="/bande.png" alt="" style={{ width: "100%", height: "1.6mm", display: "block", objectFit: "fill" }} />
        <div className="dp-sans" style={{ display: "flex", justifyContent: "space-between", gap: "8mm", marginTop: "1.5mm", padding: "0 6mm 0 22mm", fontSize: "8pt", lineHeight: 1.35 }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{l1}{l2.map((x, i) => <div key={i}>{x}</div>)}</div>
          <div>{s.phone && <div>Tel. {s.phone}</div>}{s.email && <div>Email: {s.email}</div>}</div>
        </div>
      </footer>
    </article>
  );
}

/* ---------- Carte consulaire ---------- */
const card = { position: "relative", width: "88mm", height: "124mm", borderRadius: "5mm", overflow: "hidden", background: "linear-gradient(180deg,#fff 0%,#EEF2F9 100%)", boxShadow: "0 0 0 .2mm #cfd6e4", fontFamily: "Calibri, Carlito, 'Segoe UI', Arial, sans-serif", color: NAVY, breakInside: "avoid" };

const Wave = ({ flip }) => (
  <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: "absolute", left: 0, width: "100%", height: "15mm", ...(flip ? { bottom: 0 } : { top: "24mm" }), transform: flip ? "none" : "scaleY(-1)" }} aria-hidden="true">
    <path d="M0 8 C30 2 60 4 100 0 V20 H0Z" fill={NAVY} />
    <path d="M0 8 C30 2 60 4 100 0" fill="none" stroke={GOLD} strokeWidth="1.1" />
    <path d="M40 4.6 C65 3.6 85 1.4 100 -1" fill="none" stroke={RED} strokeWidth="1.1" />
  </svg>
);

const Ico = ({ d }) => (
  <span style={{ flex: "none", width: "6.4mm", height: "6.4mm", borderRadius: "1.2mm", background: NAVY, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
    <svg viewBox="0 0 24 24" width="4mm" height="4mm" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
  </span>
);
const IPERS = <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-4 3-6 7-6s7 2 7 6" /></>;
const ICAL = <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>;
const IID = <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M14 10h4M14 14h4M6 16c.7-1.5 1.8-2 3-2s2.3.5 3 2" /></>;
const IGLASS = <><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" /></>;
const IHOME = <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></>;
const IPHONE = <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />;

const Row = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "2.2mm", padding: "1.3mm 0", borderBottom: ".2mm solid #D3DAE8" }}>
    <Ico d={icon} />
    <span style={{ fontSize: "6pt", fontWeight: 700, textTransform: "uppercase", width: "17.5mm", flex: "none", lineHeight: 1.15 }}>{label}</span>
    <span style={{ fontSize: "7pt", fontWeight: 800, textTransform: "uppercase", flex: 1, textAlign: "right", overflowWrap: "anywhere", color: "#0A2D7A", lineHeight: 1.15 }}>{value || "—"}</span>
  </div>
);

const Star = ({ x, y, r }) => (
  <polygon fill={GOLD} points={Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`; }).join(" ")} />
);

function CarteRecto({ m, s }) {
  const r = m.requerant;
  return (
    <section style={card} aria-label="Carte consulaire, recto">
      <div style={{ background: NAVY, height: "34mm", position: "relative", color: "#fff" }}>
        <svg viewBox="0 0 40 20" style={{ position: "absolute", left: "3mm", top: "1.5mm", width: "16mm", height: "8mm" }} aria-hidden="true"><Star x={9} y={11} r={6} /><Star x={19} y={5} r={3.4} /></svg>
        <div style={{ position: "absolute", left: "4mm", top: "6mm", width: "16mm", height: "16mm", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <img src="/emblem.png" alt="" style={{ width: "15mm", height: "15mm", objectFit: "contain" }} />
        </div>
        <div style={{ position: "absolute", left: "24mm", right: "3mm", top: "5mm", textAlign: "center" }}>
          <div style={{ fontSize: "9.5pt", fontWeight: 800, lineHeight: 1.15, textTransform: "uppercase" }}>Ambassade de la<br />République Démocratique<br />du Congo</div>
          <div style={{ height: ".5mm", margin: "1.2mm 0", background: `linear-gradient(90deg,${SKY} 33%,${GOLD} 33% 66%,${RED} 66%)` }} />
          <div style={{ fontSize: "7.5pt", color: GOLD, fontWeight: 700, textTransform: "uppercase" }}>En Portugal</div>
        </div>
      </div>
      <Wave />
      <div style={{ position: "absolute", top: "38mm", left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: "15pt", fontWeight: 900, letterSpacing: ".2mm", textTransform: "uppercase" }}>Carte consulaire</div>
        <div style={{ height: ".5mm", width: "50mm", margin: "1mm auto 0", background: `linear-gradient(90deg,${SKY} 33%,${GOLD} 33% 66%,${RED} 66%)` }} />
      </div>
      <div style={{ position: "absolute", top: "52mm", left: "4mm", right: "4mm", display: "flex", gap: "2.5mm" }}>
        <div style={{ flex: "none", width: "24mm", height: "33mm", borderRadius: "1.5mm", border: `.3mm solid ${SKY}`, background: "#D9DCE3", overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          {r.image_url ? <img src={r.image_url} alt={`Photo de ${r.nom}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <svg viewBox="0 0 24 24" width="22mm" height="30mm" fill="#B4B9C4" aria-hidden="true"><circle cx="12" cy="8" r="4.5" /><path d="M3 24c0-6 4-9 9-9s9 3 9 9z" /></svg>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Row icon={IPERS} label="Nom" value={`${r.nom} ${r.postnom || ""}`.trim()} />
          <Row icon={IPERS} label="Prénom" value={r.prenom} />
          <Row icon={ICAL} label="Date de naissance" value={dShort(r.date_naissance)} />
          <Row icon={IID} label="Numéro de carte" value={m.reference} />
          <Row icon={ICAL} label="Date de délivrance" value={dShort(m.delivered_at || m.date_demande)} />
          <Row icon={IGLASS} label="Date d'expiration" value={dShort(m.date_expiration)} />
        </div>
      </div>
      <Wave flip />
    </section>
  );
}

const Big = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "3mm", padding: "2.6mm 0", borderBottom: ".2mm solid #D3DAE8" }}>
    <span style={{ flex: "none", width: "10mm", height: "10mm", borderRadius: "2mm", background: NAVY, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 24 24" width="6.4mm" height="6.4mm" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
    </span>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "6.4pt", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "9pt", fontWeight: 800, textTransform: "uppercase", overflowWrap: "anywhere", color: "#0A2D7A" }}>{value || "—"}</div>
    </div>
  </div>
);

function CarteVerso({ m, s }) {
  const r = m.requerant;
  const pere = [r.nom_pere, r.postnom_pere, r.prenom_pere].filter(Boolean).join(" ");
  const mere = [r.nom_mere, r.postnom_mere, r.prenom_mere].filter(Boolean).join(" ");
  return (
    <section style={card} aria-label="Carte consulaire, verso">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "16mm" }} aria-hidden="true">
        <path d="M0 0H100V3C70 10 40 14 0 11Z" fill={NAVY} /><path d="M0 11C40 14 70 10 100 3" fill="none" stroke={GOLD} strokeWidth=".9" /><path d="M30 12.8C60 11 80 6 100 2" fill="none" stroke={RED} strokeWidth=".9" />
      </svg>
      <div style={{ position: "absolute", top: "24mm", left: "6mm", right: "6mm" }}>
        <Big icon={IHOME} label="Adresse" value={adresseDe(r)} />
        <Big icon={IPERS} label="Nom du père" value={pere} />
        <Big icon={IPERS} label="Nom de la mère" value={mere} />
        <div style={{ marginTop: "4mm", display: "flex", alignItems: "center", gap: "3mm", padding: "2.4mm 3mm", border: `.3mm solid ${SKY}`, borderRadius: "2mm", background: "#E3EDFA" }}>
          <span style={{ flex: "none", width: "10mm", height: "10mm", borderRadius: "2mm", background: NAVY, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width="6.4mm" height="6.4mm" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{IPHONE}</svg>
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "7pt", fontWeight: 800, textTransform: "uppercase" }}>Contact de l'ambassade</div>
            <div style={{ fontSize: "8pt", fontWeight: 700, color: "#0A2D7A", overflowWrap: "anywhere" }}>{[s.phone, s.email].filter(Boolean).join(" · ") || "—"}</div>
          </div>
        </div>
      </div>
      <Wave flip />
    </section>
  );
}

export default function DocumentPaper({ m, s }) {
  return (
    <>
      <PaperStyle />
      {m.document.rendu === "CARTE" && m.requerant
        ? <div className="dp-cards"><CarteRecto m={m} s={s} /><CarteVerso m={m} s={s} /></div>
        : <Lettre m={m} s={s} />}
    </>
  );
}
