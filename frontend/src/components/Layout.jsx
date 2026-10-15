import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api, getUser, isAdmin } from "../api";
import useIdle from "../useIdle.js";
import useSettings from "../useSettings.js";
import * as Ic from "./Icons.jsx";

const GROUPS = [
  { key: "req", label: "Gestion des requérants", icon: Ic.Users, items: [
    { to: "/requerants/nouveau", label: "Ajouter requérant" },
    { to: "/requerants", label: "Grille de données", end: true },
  ] },
  { key: "doc", label: "Gestion documents", icon: Ic.File, items: [
    { to: "/documents", label: "Ajouter document" },
    { to: "/octroi", label: "Octroi document" },
  ] },
];

const link = ({ isActive }) =>
  "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-medium " +
  (isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white");

function Logo({ s }) {
  return (
    <div className="flex items-center gap-3">
      {s?.logo
        ? <img src={s.logo} alt="" className="h-10 w-10 rounded bg-white object-contain p-0.5" />
        : <div className="flex h-10 w-10 items-center justify-center rounded bg-gold font-display text-lg font-extrabold text-navy" aria-hidden="true">RDC</div>}
      <div className="min-w-0 leading-tight">
        <p className="truncate font-display text-sm font-bold text-white">{s?.embassy_name || "Ambassade"}</p>
        <p className="truncate text-xs text-white/70">{s?.city}</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const s = useSettings();
  const user = getUser();
  const admin = isAdmin();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState({});

  const logout = async (expired) => {
    try { await api("/logout/", { method: "POST" }); } catch { /* session déjà fermée */ }
    localStorage.clear();
    if (expired === true) sessionStorage.setItem("expired", "1");
    nav("/login", { replace: true });
  };
  const [warn, stay] = useIdle(s?.session_minutes || 10, () => logout(true));

  useEffect(() => { setOpen(false); }, [pathname]);
  // Le groupe qui contient la page courante reste ouvert
  const isOpen = (g) => groups[g.key] ?? g.items.some((i) => pathname === i.to || pathname.startsWith(i.to + "/") || (i.to === "/requerants" && /^\/requerants\/\d+/.test(pathname)));
//SIDEBAR --------------------------------------------------------------------------------------------------------
  const sidebar = (
    <nav aria-label="Navigation principale" className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 px-1 pt-1"><Logo s={s} /></div>
      <NavLink to="/" end className={link}><Ic.Home /> Dashboard</NavLink>
      {GROUPS.map((g) => {
        const o = isOpen(g);
        return (
          <div key={g.key}>
            <button type="button" aria-expanded={o} onClick={() => setGroups({ ...groups, [g.key]: !o })}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
              <g.icon /> <span className="flex-1 text-left">{g.label}</span>
              <Ic.Chevron className={"h-4 w-4 transition-transform " + (o ? "rotate-180" : "")} />
            </button>
            {o && (
              <ul className="ml-5 mt-1 space-y-1 border-l border-white/20 pl-2">
                {g.items.map((i) => <li key={i.to}><NavLink to={i.to} end={i.end} className={link}>{i.label}</NavLink></li>)}
              </ul>
            )}
          </div>
        );
      })}
      {admin && <NavLink to="/agents" className={link}><Ic.Badge /> Gestion des agents</NavLink>}
      {admin && <NavLink to="/parametres" className={link}><Ic.Cog /> Paramètre</NavLink>}
      <div className="mt-auto border-t border-white/15 pt-3">
        <p className="truncate px-3 text-sm text-white">{user?.name}</p>
        <p className="px-3 pb-2 text-xs text-white/60">{admin ? "Administrateur" : "Agent"}</p>
        <button type="button" onClick={() => logout()} className="flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
          <Ic.Logout /> Se déconnecter
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto bg-navy lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy px-4 py-2 lg:hidden">
        <Logo s={s} />
        <button type="button" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)} className="rounded-md p-2 text-white hover:bg-white/10"><Ic.Menu /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-navy">
            <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="absolute right-2 top-2 rounded-md p-2 text-white hover:bg-white/10"><Ic.Close /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <div className="h-1 bg-gradient-to-r from-sky via-gold to-flag" aria-hidden="true" />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-8 md:py-8"><Outlet /></main>
        <footer className="border-t bg-white px-4 py-4 text-center text-sm text-slate-600">
          © 2026 {s?.embassy_name || "Ambassade"}. Tous droits réservés.
        </footer>
      </div>

      {warn && (
        <div role="alertdialog" aria-label="Session sur le point d'expirer" className="fixed bottom-4 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-lg">
          <p className="text-sm font-medium text-amber-900">Votre session va expirer dans moins d'une minute par manque d'activité.</p>
          <button type="button" className="btn mt-3" onClick={stay}>Rester connecté</button>
        </div>
      )}
    </div>
  );
}
