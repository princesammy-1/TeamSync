import { useContext } from "react";
import { PresenceContext } from "../context/PresenceContext";

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be used within a PresenceProvider");
  return ctx;
}
