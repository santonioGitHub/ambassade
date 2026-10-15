import { useEffect, useState } from "react";
import { api } from "./api";

let cache = null;
const listeners = new Set();
export const setSettingsCache = (v) => { cache = v; listeners.forEach((f) => f(v)); };

export default function useSettings() {
  const [s, setS] = useState(cache);
  useEffect(() => {
    listeners.add(setS);
    if (!cache) api("/settings/").then(setSettingsCache).catch(() => {});
    return () => listeners.delete(setS);
  }, []);
  return s;
}
