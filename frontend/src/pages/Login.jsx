import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, getUser } from "../api";
import { Field, Msg } from "../components/ui.jsx";

export default function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [brand, setBrand] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem("expired")) {
      sessionStorage.removeItem("expired");
      setMsg({ ok: false, t: "Votre session a expiré. Reconnectez-vous." });
    }
    api("/branding/").then(setBrand).catch(() => {});
  }, []);
  if (getUser() && localStorage.getItem("token")) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    localStorage.clear(); // un ancien jeton ne doit pas gêner la connexion
    try {
      const d = await api("/login/", { method: "POST", body: f });
      localStorage.setItem("token", d.token);
      localStorage.setItem("user", JSON.stringify(d.user));
      nav("/", { replace: true });
    } catch (x) {
      setMsg({ ok: false, t: x.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-navy">
      <div className="h-1 bg-gradient-to-r from-sky via-gold to-flag" aria-hidden="true" />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center text-white">
            {brand?.logo
              ? <img src={brand.logo} alt="" className="mx-auto mb-3 h-16 w-16 rounded bg-white object-contain p-1" />
              : <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded bg-gold font-display text-2xl font-extrabold text-navy" aria-hidden="true">RDC</div>}
            <h1 className="font-display text-2xl font-extrabold leading-tight">{brand?.embassy_name || "Ambassade"}</h1>
            <p className="mt-1 text-sm text-white/70">Octroi de documents officiels</p>
          </div>
          <form onSubmit={submit} className="card space-y-4" noValidate>
            <Msg m={msg} />
            <Field label="Identifiant"><input className="inp" autoComplete="username" autoFocus required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
            <Field label="Mot de passe"><input className="inp" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            <button className="btn w-full" disabled={busy || !f.username || !f.password}>{busy ? "Connexion…" : "Se connecter"}</button>
            <p className="text-center text-xs text-slate-500">Les comptes sont créés par l'administrateur.</p>
          </form>
        </div>
      </div>
    </main>
  );
}
