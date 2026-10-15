export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
};
export const isAdmin = () => getUser()?.role === "ADMIN";

const token = () => localStorage.getItem("token");

// Transforme les erreurs DRF ({champ: ["msg"]}) en phrase lisible.
function message(d, status) {
  if (d.detail) return d.detail;
  const parts = Object.entries(d).map(([k, v]) => `${k} : ${[].concat(v).join(" ")}`);
  return parts.length ? parts.join(" · ") : "Erreur " + status;
}

async function handle(r, hadToken) {
  if (r.status === 401 && hadToken) {
    localStorage.clear();
    sessionStorage.setItem("expired", "1");
    window.location.href = "/login";
  }
  if (r.status === 204) return {};
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(message(d, r.status));
  return d;
}

const auth = () => (token() ? { Authorization: "Token " + token() } : {});

export async function api(path, { method = "GET", body } = {}) {
  const r = await fetch("/api" + path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json", ...auth() },
  });
  return handle(r, !!token());
}

// Formulaire avec fichier : pas de Content-Type, le navigateur ajoute le bon en-tête multipart.
export async function send(path, method, formData) {
  const r = await fetch("/api" + path, { method, body: formData, headers: auth() });
  return handle(r, !!token());
}

// Construit un FormData en ignorant les valeurs vides et les fichiers non choisis.
export function toFormData(values, { keepEmpty = false } = {}) {
  const fd = new FormData();
  Object.entries(values).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v instanceof File) fd.append(k, v);
    else if (v !== "" || keepEmpty) fd.append(k, v);
  });
  return fd;
}
