/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { users as seedUsers } from "../data/users";

export const PresenceContext = createContext(null);

const STATUSES = ["online", "away", "busy", "offline"];

export function PresenceProvider({ children }) {
  const [presence, setPresenceState] = useState(() => {
    const map = {};
    seedUsers.forEach((u) => {
      map[u.id] = u.presence || "offline";
    });
    return map;
  });

  useEffect(() => {
    // Simulated drift: every ~22s one online member flips to away, then back.
    const onlineIds = seedUsers
      .filter((u) => u.presence === "online" || u.presence === "busy")
      .map((u) => u.id);

    const interval = window.setInterval(() => {
      setPresenceState((prev) => {
        const id = onlineIds[Math.floor(Math.random() * onlineIds.length)];
        if (!id || !prev[id]) return prev;
        const next = { ...prev };
        next[id] = prev[id] === "away" ? "online" : "away";
        return next;
      });
    }, 22000);

    return () => window.clearInterval(interval);
  }, []);

  const setPresence = useCallback((userId, status) => {
    setPresenceState((prev) => ({ ...prev, [userId]: status }));
  }, []);

  const presenceOf = useCallback((userId) => presence[userId] || "offline", [presence]);

  const onlineCount = useMemo(
    () => Object.values(presence).filter((s) => s === "online" || s === "busy").length,
    [presence],
  );

  const value = useMemo(
    () => ({ presence, presenceOf, setPresence, onlineCount }),
    [presence, presenceOf, setPresence, onlineCount],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export const PRESENCE_STATUSES = STATUSES;
