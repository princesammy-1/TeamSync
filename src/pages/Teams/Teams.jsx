import { useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiUsers, FiArrowRight } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import AvatarStack from "../../components/ui/AvatarStack";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { usePresence } from "../../hooks/usePresence";
import { can } from "../../constants/roles";
import { TASK_STATUS } from "../../constants/tasks";
import { teamDetailPath } from "../../constants/routes";
import { cn } from "../../utils/cn";

const TEAM_EMOJIS = ["👥", "⚙️", "✨", "📣", "🔬", "🎨", "🚀", "🧠"];
const TEAM_COLORS = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

export default function Teams() {
  const { teams, loading, members, tasks, membersOfTeam, createTeam } = useWorkspace();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { presenceOf } = usePresence();

  const [createOpen, setCreateOpen] = useState(false);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Organize your people around the work that matters."
        actions={
          <>
            {can(currentUser?.role, "createTeam") && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <FiPlus size={15} /> New team
              </Button>
            )}
          </>
        }
      />

      {teams.length === 0 ? (
        <EmptyState
          icon={<FiUsers size={22} />}
          title="No teams yet"
          description="Create your first team to bring people together around shared work."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <FiPlus size={15} /> Create a team
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const teamMembers = membersOfTeam(team.id);
            const openCount = tasks.filter((t) => t.teamId === team.id && t.status !== TASK_STATUS.DONE).length;

            return (
              <Card key={team.id} padded={false} className="overflow-hidden transition-colors hover:border-ink-mute/30">
                <div className={cn("h-16 bg-gradient-to-br", team.color)}>
                  <span className="flex h-full w-full items-end p-4 text-2xl">{team.emoji}</span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink">{team.name}</h3>
                    <Badge variant="default">{openCount} open</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-mute">{team.description || "No description yet."}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <AvatarStack
                      users={teamMembers}
                      max={4}
                      presenceMap={Object.fromEntries(teamMembers.map((m) => [m.id, presenceOf(m.id)]))}
                    />
                    <Link
                      to={teamDetailPath(team.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-300 transition hover:text-brand-200"
                    >
                      Open <FiArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateTeamModal
          members={members}
          onClose={() => setCreateOpen(false)}
          onCreated={(team) => {
            setCreateOpen(false);
            toast({ type: "success", title: "Team created", message: `"${team.name}" is ready to go.` });
          }}
          onCreate={createTeam}
          actorId={currentUser.id}
          canCreate={can(currentUser?.role, "createTeam")}
        />
      )}
    </div>
  );
}

function CreateTeamModal({ members, onClose, onCreated, onCreate, actorId, canCreate }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    emoji: TEAM_EMOJIS[0],
    color: TEAM_COLORS[0],
    memberIds: [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((m) => m !== id) : [...f.memberIds, id],
    }));
  };

  const submit = async () => {
    if (!canCreate) {
      setError("You don't have permission to create teams.");
      return;
    }
    if (form.name.trim().length < 2) {
      setError("Give your team a name (at least 2 characters).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const team = await onCreate(actorId, form);
      onCreated(team);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Create a new team"
      description="Bring people together around a shared mission."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create team</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>
        )}

        <Input
          label="Team name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Design, Mobile, Growth…"
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What does this team own?"
          rows={2}
        />

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Icon & color</p>
          <div className="flex flex-wrap items-center gap-2">
            {TEAM_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border text-base transition",
                  form.emoji === e ? "border-brand-500 bg-brand-500/15" : "border-border bg-surface hover:border-ink-mute/40",
                )}
              >
                {e}
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-border-subtle" />
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={cn(
                  "h-6 w-6 rounded-full bg-gradient-to-br transition",
                  c,
                  form.color === c ? "ring-2 ring-brand-400 ring-offset-2 ring-offset-elevated" : "",
                )}
                aria-label="Pick color"
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Initial members <span className="text-ink-mute">({form.memberIds.length} selected)</span>
          </p>
          <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border bg-surface p-1.5">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={form.memberIds.includes(m.id)}
                  onChange={() => toggleMember(m.id)}
                  className="h-4 w-4 accent-[var(--color-brand-500)]"
                />
                <span className="text-sm font-medium text-ink">{m.name}</span>
                <span className="ml-auto text-xs text-ink-mute">{m.title}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
