import { useMemo, useState } from "react";
import {
  FiMapPin,
  FiCalendar,
  FiSave,
  FiCheckCircle,
  FiClock,
  FiUsers,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import Tabs from "../../components/ui/Tabs";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../hooks/useWorkspace";
import { usePresence } from "../../hooks/usePresence";
import { useToast } from "../../hooks/useToast";
import { ROLE_LABELS } from "../../constants/roles";
import { TASK_STATUS } from "../../constants/tasks";
import { formatDate } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

const PRESENCE_OPTIONS = [
  { value: "online", label: "Available", dot: "bg-emerald-400" },
  { value: "busy", label: "Busy", dot: "bg-amber-400" },
  { value: "away", label: "Away", dot: "bg-slate-400" },
  { value: "offline", label: "Offline", dot: "bg-slate-600" },
];

export default function Profile() {
  const { currentUser, updateCurrentUser } = useAuth();
  const { loading, tasks, teams, updateMember } = useWorkspace();
  const { presenceOf, setPresence } = usePresence();
  const { toast } = useToast();

  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    name: currentUser?.name || "",
    title: currentUser?.title || "",
    bio: currentUser?.bio || "",
    location: currentUser?.location || "",
    statusMessage: currentUser?.statusMessage || "",
  }));

  const myTeams = useMemo(
    () => teams.filter((t) => t.memberIds.includes(currentUser?.id)),
    [teams, currentUser],
  );

  const myOpenTasks = tasks.filter(
    (t) => t.status !== TASK_STATUS.DONE && t.assigneeIds.includes(currentUser?.id),
  ).length;
  const myDoneTasks = tasks.filter(
    (t) => t.status === TASK_STATUS.DONE && t.assigneeIds.includes(currentUser?.id),
  ).length;

  if (loading || !currentUser) return <PageSkeleton />;

  const presence = presenceOf(currentUser.id);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateMember(currentUser.id, form);
      updateCurrentUser(form);
      toast({ type: "success", title: "Profile updated" });
    } catch (err) {
      toast({ type: "error", title: "Couldn't save", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const changePresence = async (value) => {
    setPresence(currentUser.id, value);
    await updateMember(currentUser.id, { presence: value });
    toast({ type: "info", title: "Status updated", message: `You're now ${PRESENCE_OPTIONS.find((p) => p.value === value)?.label.toLowerCase()}.` });
  };

  const tabs = [
    { value: "profile", label: "Profile" },
    { value: "activity", label: "My work" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your identity and presence in the workspace." />

      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand-900/60 via-brand-700/30 to-sky-900/40" />
        <div className="relative flex flex-col items-start gap-5 pt-14 sm:flex-row sm:items-end">
          <Avatar name={currentUser.name} size="xl" presence={presence} className="rounded-full border-4 border-surface" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{currentUser.name}</h1>
              <Badge variant="brand" className="capitalize">{ROLE_LABELS[currentUser.role]}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{currentUser.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-mute">
              <span className="inline-flex items-center gap-1.5"><FiMapPin size={12} /> {currentUser.location || "No location"}</span>
              <span className="inline-flex items-center gap-1.5"><FiCalendar size={12} /> Joined {formatDate(currentUser.joinedAt)}</span>
              <span className="inline-flex items-center gap-1.5"><FiUsers size={12} /> {myTeams.length} teams</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {PRESENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => changePresence(opt.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                    presence === opt.value
                      ? "border-brand-500/60 bg-brand-500/15 text-brand-300"
                      : "border-border bg-surface-2/50 text-ink-soft hover:border-ink-mute/40",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", opt.dot)} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "profile" && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">About you</h2>
            <Button size="sm" onClick={saveProfile} loading={saving}>
              <FiSave size={14} /> Save changes
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Job title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="City, Country" />
            <Input
              label="Status message"
              value={form.statusMessage || ""}
              onChange={(e) => setForm((f) => ({ ...f, statusMessage: e.target.value }))}
              placeholder="What are you up to?"
            />
            <div className="sm:col-span-2">
              <Textarea label="Bio" rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="A sentence or two about you…" />
            </div>
          </div>

          <div className="mt-5 border-t border-border-subtle pt-4">
            <p className="text-[11px] font-semibold tracking-wide text-ink-mute uppercase">Email</p>
            <p className="mt-1 text-sm text-ink-soft">{currentUser.email}</p>
            <p className="mt-3 text-[11px] font-semibold tracking-wide text-ink-mute uppercase">Role</p>
            <Badge variant="brand" className="mt-1 capitalize">{ROLE_LABELS[currentUser.role]}</Badge>
          </div>
        </Card>
      )}

      {tab === "activity" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
              <FiClock size={17} />
            </span>
            <p className="mt-3 text-2xl font-bold text-ink">{myOpenTasks}</p>
            <p className="text-xs text-ink-mute">Open tasks assigned to you</p>
          </Card>
          <Card>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
              <FiCheckCircle size={17} />
            </span>
            <p className="mt-3 text-2xl font-bold text-ink">{myDoneTasks}</p>
            <p className="text-xs text-ink-mute">Tasks completed</p>
          </Card>
          <Card>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
              <FiUsers size={17} />
            </span>
            <p className="mt-3 text-2xl font-bold text-ink">{myTeams.length}</p>
            <p className="text-xs text-ink-mute">Teams you're part of</p>
          </Card>
        </div>
      )}
    </div>
  );
}
