export const TASK_STATUS = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
};

export const TASK_STATUS_META = {
  [TASK_STATUS.BACKLOG]: { label: "Backlog", dot: "bg-slate-500", chip: "bg-slate-500/10 text-slate-300 border-slate-500/30" },
  [TASK_STATUS.TODO]: { label: "To do", dot: "bg-sky-400", chip: "bg-sky-500/10 text-sky-300 border-sky-500/30" },
  [TASK_STATUS.IN_PROGRESS]: { label: "In progress", dot: "bg-amber-400", chip: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
  [TASK_STATUS.IN_REVIEW]: { label: "In review", dot: "bg-violet-400", chip: "bg-violet-500/10 text-violet-300 border-violet-500/30" },
  [TASK_STATUS.DONE]: { label: "Done", dot: "bg-emerald-400", chip: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
};

export const TASK_STATUS_ORDER = [
  TASK_STATUS.BACKLOG,
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.IN_REVIEW,
  TASK_STATUS.DONE,
];

export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

export const PRIORITY_META = {
  [TASK_PRIORITY.URGENT]: { label: "Urgent", color: "text-rose-400", chip: "bg-rose-500/10 text-rose-300 border-rose-500/30", rank: 4 },
  [TASK_PRIORITY.HIGH]: { label: "High", color: "text-orange-400", chip: "bg-orange-500/10 text-orange-300 border-orange-500/30", rank: 3 },
  [TASK_PRIORITY.MEDIUM]: { label: "Medium", color: "text-sky-400", chip: "bg-sky-500/10 text-sky-300 border-sky-500/30", rank: 2 },
  [TASK_PRIORITY.LOW]: { label: "Low", color: "text-slate-400", chip: "bg-slate-500/10 text-slate-300 border-slate-500/30", rank: 1 },
};

export const TASK_PRIORITY_ORDER = [
  TASK_PRIORITY.URGENT,
  TASK_PRIORITY.HIGH,
  TASK_PRIORITY.MEDIUM,
  TASK_PRIORITY.LOW,
];
