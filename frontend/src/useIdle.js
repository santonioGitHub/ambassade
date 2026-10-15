import { useEffect, useRef, useState } from "react";
import { api } from "./api";

// Déconnecte après `minutes` d'inactivité ; avertit 1 minute avant.
export default function useIdle(minutes, onExpire) {
  const [warn, setWarn] = useState(false);
  const last = useRef(Date.now());
  useEffect(() => {
    const reset = () => { last.current = Date.now(); };
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    const tick = setInterval(() => {
      const idle = Date.now() - last.current;
      if (idle >= minutes * 60000) onExpire();
      else setWarn(minutes > 1 && idle >= (minutes - 1) * 60000);
    }, 1000);
    // Maintient la session côté serveur tant que la personne est active
    const every = Math.max(30000, Math.min(4 * 60000, (minutes * 60000) / 2));
    const beat = setInterval(() => { if (Date.now() - last.current < every) api("/meta/").catch(() => {}); }, every);
    return () => { events.forEach((e) => window.removeEventListener(e, reset)); clearInterval(tick); clearInterval(beat); };
  }, [minutes]);
  const stay = () => { last.current = Date.now(); setWarn(false); api("/meta/").catch(() => {}); };
  return [warn, stay];
}
