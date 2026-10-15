import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import * as Ic from "../components/Icons.jsx";
import DocumentPaper from "../components/DocumentPaper.jsx";

export default function Imprimer() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { api(`/demandes/${id}/fiche/`).then(setD).catch((e) => setErr(e.message)); }, [id]);

  if (err) return <main className="p-6"><p role="alert" className="text-flag">{err}</p><Link to="/octroi" className="text-sky underline">Retour</Link></main>;
  if (!d) return <main className="p-6">Chargement…</main>;
  const { demande: m, settings: s } = d;
  const carte = m.document.rendu === "CARTE";

  return (
    <div className="min-h-screen bg-slate-300 print:bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-navy px-4 py-3 text-white print:hidden">
        <Link to="/octroi" className="text-sm underline">← Retour à l'octroi</Link>
        <div className="flex flex-wrap items-center gap-3">
          {!m.delivred && <span className="rounded bg-gold px-2 py-1 text-xs font-semibold text-navy">Demande en attente : document non délivré</span>}
          <span className="text-xs text-white/70">{carte ? "Recto et verso sur une page A4" : "Page A4 · désactivez « En-têtes et pieds de page » dans la fenêtre d'impression"}</span>
          <button type="button" className="btn" onClick={() => window.print()}><Ic.Print /> Imprimer</button>
        </div>
      </div>
      <DocumentPaper m={m} s={s} />
    </div>
  );
}
