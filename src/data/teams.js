import { daysAgo } from "./helpers";

export const workspace = {
  id: "ws1",
  name: "Aurora Labs",
  slug: "aurora-labs",
  plan: "Pro",
  seats: { used: 10, limit: 25 },
  storage: { used: 38.4, limit: 200, unit: "GB" },
  inviteCode: "AURORA-TS-2026",
  created: daysAgo(320),
  company: "Aurora Labs Inc.",
  email: "team@auroralabs.io",
};

export const teams = [
  {
    id: "t1",
    name: "Product & Design",
    description: "Discovery, UX research, and product strategy.",
    color: "from-violet-500 to-fuchsia-500",
    emoji: "✨",
    memberIds: ["u2", "u4", "u5", "u6", "u7"],
    createdAt: daysAgo(300),
  },
  {
    id: "t2",
    name: "Engineering",
    description: "Architecture, implementation, and shipping.",
    color: "from-sky-500 to-blue-600",
    emoji: "⚙️",
    memberIds: ["u3", "u5", "u6", "u9"],
    createdAt: daysAgo(290),
  },
  {
    id: "t3",
    name: "Marketing",
    description: "Brand, growth, and go-to-market.",
    color: "from-emerald-500 to-teal-600",
    emoji: "📣",
    memberIds: ["u2", "u8"],
    createdAt: daysAgo(180),
  },
  {
    id: "t4",
    name: "Research",
    description: "Market intelligence and user research.",
    color: "from-amber-500 to-orange-600",
    emoji: "🔬",
    memberIds: ["u2", "u7", "u10"],
    createdAt: daysAgo(120),
  },
];
