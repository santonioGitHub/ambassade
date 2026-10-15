import { useEffect } from "react";
import { Close } from "./Icons.jsx";

export const Field = ({ label, error, hint, children, className = "" }) => (
  <label className={"block text-sm font-medium " + className}>
    {label}
    <div className="mt-1">{children}</div>
    {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    {error && <span className="mt-1 block text-xs font-normal text-flag">{error}</span>}
  </label>
);

export const Msg = ({ m, onClose }) =>
  m ? (
    <div role={m.ok ? "status" : "alert"}
      className={"mb-4 flex items-start justify-between gap-3 rounded-md border p-3 text-sm " + (m.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900")}>
      <span>{m.t}</span>
      {onClose && <button type="button" onClick={onClose} className="shrink-0 underline">Fermer</button>}
    </div>
  ) : null;

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={"max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white shadow-xl sm:rounded-xl " + (wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-3">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-md p-2 hover:bg-slate-100"><Close /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Pagination({ page, count, size, onPage }) {
  const pages = Math.max(1, Math.ceil(count / size));
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-slate-600">{count} résultat{count > 1 ? "s" : ""} · page {page} / {pages}</span>
      <div className="flex gap-2">
        <button type="button" className="btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Précédent</button>
        <button type="button" className="btn-ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Suivant</button>
      </div>
    </div>
  );
}

export const PageHeader = ({ title, sub, children }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-slate-600">{sub}</p>}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const TONES = {
  green: "bg-emerald-100 text-emerald-900", blue: "bg-sky-light text-sky-dark", amber: "bg-amber-100 text-amber-900",
  grey: "bg-slate-200 text-slate-800", red: "bg-red-100 text-red-900",
};
export const Tag = ({ tone = "grey", children }) => (
  <span className={"inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold " + TONES[tone]}>{children}</span>
);

export const STATUT = {
  ACTIF: ["green", "Actif"], CONGE: ["blue", "En congé"], SUSPENDU: ["amber", "Suspendu"], INACTIF: ["grey", "Inactif"],
};

export const fdate = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR") : "—");
export const today = () => new Date().toISOString().slice(0, 10);
