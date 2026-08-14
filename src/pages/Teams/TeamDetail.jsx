import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiUsers,
  FiTrash2,
  FiCheckCircle,
  FiActivity,
  FiMail,
  FiUserX,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import AvatarStack from "../../components/ui/AvatarStack";
import Tabs from "../../components/ui/Tabs";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { usePresence } from "../../hooks/usePresence";
import { can, ROLE_LABELS } from "../../constants/roles";
import { TASK_STATUS, TASK_STATUS_META, PRIORITY_META } from "../../constants/tasks";
import { cn } from "../../utils/cn";
import { formatDate, relativeTime } from "../../utils/formatDate";
import { pluralize } from "../../utils/format";

const TEAM_EMOJIS = ["👥", "⚙️", "✨", "📣", "🔬", "🎨", "🚀", "🧠"];
const TEAM_COLORS = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

export default function TeamDetail() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { presenceOf } = usePresence();
  const {
    loading,
    teams,
    members,
    tasks,
    membersOfTeam,
    updateTeam,
    deleteTeam,
    addMembersToTeam,
    removeMemberFromTeam,
    inviteMember,
  } = useWorkspace();

  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const team = teams.find((t) => t.id === teamId);
  const teamMembers = useMemo(() => (team ? membersOfTeam(team.id) : []), [team, membersOfTeam]);
  const teamTasks = useMemo(() => tasks.filter((t) => t.teamId === teamId), [tasks, teamId]);

  if (loading) {
    return <div className="space-y-4"><div className="h-6 w-40 animate-pulse rounded bg-surface-2" /><div className="h-40 animate-pulse rounded-xl bg-surface" /></div>;
  }

  if (!team) {
    return (
      <EmptyState
        icon={<FiUsers size={22} />}
        title="Team not found"
        description="This team may have been deleted, or the link is wrong."
        action={<Button onClick={() => navigate("/app/teams")}>Back to teams</Button>}
      />
    );
  }

  const isAdmin = can(currentUser?.role, "manageMembers");
  const isOwner = currentUser?.role === "owner";

  const openCount = teamTasks.filter((t) => t.status !== TASK_STATUS.DONE).length;
  const doneCount = teamTasks.filter((t) => t.status === TASK_STATUS.DONE).length;

  const tabs = [
    { value: "overview", label: "Overview", icon: <FiActivity size={14} /> },
    { value: "members", label: "Members", icon: <FiUsers size={14} />, count: teamMembers.length },
    { value: "settings", label: "Settings", icon: <FiCheckCircle size={14} /> },
  ];

  const handleDelete = async () => {
    setDeleting(true);
    await deleteTeam(currentUser.id, team.id);
    setDeleting(false);
    setDeleteOpen(false);
    toast({ type: "success", title: "Team deleted", message: `"${team.name}" was removed.` });
    navigate("/app/teams");
  };

  const handleInvite = async (input) => {
    const invited = await inviteMember(currentUser.id, { ...input, teamIds: [team.id] });
    setInviteOpen(false);
    toast({ type: "success", title: "Invitation sent", message: `An invite is on its way to ${invited.name}.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/app/teams" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-mute transition hover:text-ink">
          <FiArrowLeft size={13} /> All teams
        </Link>
      </div>

      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-xl", team.color)}>
              {team.emoji}
            </span>
            {team.name}
          </span>
        }
        subtitle={`${team.description || "No description yet."} · Created ${formatDate(team.createdAt)}`}
        actions={
          <>
            {isAdmin && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
                  <FiMail size={14} /> Invite
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
                  <FiPlus size={15} /> Add members
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
              </>
            )}
            {isOwner && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <FiTrash2 size={14} /> Delete
              </Button>
            )}
          </>
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <h3 className="text-sm font-semibold text-ink">Stats</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-2/50 p-3">
                <p className="text-xs text-ink-mute">Members</p>
                <p className="mt-1 text-xl font-bold text-ink">{teamMembers.length}</p>
              </div>
              <div className="rounded-lg bg-surface-2/50 p-3">
                <p className="text-xs text-ink-mute">Open tasks</p>
                <p className="mt-1 text-xl font-bold text-sky-300">{openCount}</p>
              </div>
              <div className="rounded-lg bg-surface-2/50 p-3">
                <p className="text-xs text-ink-mute">Completed</p>
                <p className="mt-1 text-xl font-bold text-emerald-300">{doneCount}</p>
              </div>
              <div className="rounded-lg bg-surface-2/50 p-3">
                <p className="text-xs text-ink-mute">Team tasks</p>
                <p className="mt-1 text-xl font-bold text-brand-300">{teamTasks.length}</p>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Recent tasks</h3>
              <Link to="/app/tasks" className="text-xs font-medium text-brand-300 hover:text-brand-200">
                Open board
              </Link>
            </div>

            {teamTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-mute">No tasks in this team yet.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {teamTasks.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", TASK_STATUS_META[t.status].dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{t.title}</p>
                      <p className="text-xs text-ink-mute">
                        {TASK_STATUS_META[t.status].label} · {PRIORITY_META[t.priority].label}
                        {t.dueDate ? ` · ${relativeTime(t.dueDate)}` : ""}
                      </p>
                    </div>
                    <AvatarStack users={t.assigneeIds.map((id) => members.find((m) => m.id === id)).filter(Boolean)} max={3} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="lg:col-span-3">
            <h3 className="mb-3 text-sm font-semibold text-ink">Members</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-2/40 p-3">
                  <Avatar name={m.name} size="md" presence={presenceOf(m.id)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                    <p className="truncate text-xs text-ink-mute">{m.title}</p>
                  </div>
                  <Badge variant="default" className="capitalize">{m.role}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "members" && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {teamMembers.length} {pluralize(teamMembers.length, "member")}
            </h3>
            {isAdmin && (
              <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
                <FiPlus size={15} /> Add members
              </Button>
            )}
          </div>

          <ul className="divide-y divide-border-subtle">
            {teamMembers.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <Avatar name={m.name} size="md" presence={presenceOf(m.id)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{m.name}</p>
                  <p className="text-xs text-ink-mute">{m.email}</p>
                </div>
                <Badge variant="brand" className="capitalize">{ROLE_LABELS[m.role]}</Badge>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-ink-mute hover:text-rose-400"
                    onClick={async () => {
                      await removeMemberFromTeam(team.id, m.id);
                      toast({ type: "info", title: "Member removed", message: `${m.name} was removed from ${team.name}.` });
                    }}
                  >
                    <FiUserX size={15} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "settings" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold text-ink">Team details</h3>
            <p className="text-xs text-ink-mute">Update how this team looks and is described.</p>
            <Button
              className="mt-4"
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              Edit team
            </Button>
          </Card>

          {isOwner && (
            <Card className="border-rose-500/30">
              <h3 className="text-sm font-semibold text-rose-300">Danger zone</h3>
              <p className="mt-1 text-xs text-ink-mute">
                Deleting a team removes its memberships and all of its tasks. This can't be undone.
              </p>
              <Button className="mt-4" variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <FiTrash2 size={14} /> Delete this team
              </Button>
            </Card>
          )}
        </div>
      )}

      {editOpen && (
        <EditTeamModal
          team={team}
          onClose={() => setEditOpen(false)}
          onSave={async (patch) => {
            const updated = await updateTeam(currentUser.id, team.id, patch);
            setEditOpen(false);
            toast({ type: "success", title: "Team updated" });
            return updated;
          }}
        />
      )}

      {addOpen && (
        <AddMembersModal
          members={members}
          teamMembers={teamMembers}
          onClose={() => setAddOpen(false)}
          onAdd={async (ids) => {
            await addMembersToTeam(team.id, ids);
            setAddOpen(false);
            toast({ type: "success", title: "Members added", message: `Added to ${team.name}.` });
          }}
        />
      )}

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${team.name}"?`}
        description="All memberships and tasks belonging to this team will be permanently removed. You can't undo this action."
        confirmLabel="Delete team"
      />
    </div>
  );
}

function EditTeamModal({ team, onClose, onSave }) {
  const [form, setForm] = useState({
    name: team.name,
    description: team.description,
    emoji: team.emoji,
    color: team.color,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (form.name.trim().length < 2) {
      setError("Team name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit team"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}
        <Input label="Team name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Icon & color</p>
          <div className="flex flex-wrap items-center gap-2">
            {TEAM_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                className={cn("flex h-9 w-9 items-center justify-center rounded-lg border text-base", form.emoji === e ? "border-brand-500 bg-brand-500/15" : "border-border bg-surface")}
              >
                {e}
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-border-subtle" />
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={cn("h-6 w-6 rounded-full bg-gradient-to-br", c, form.color === c && "ring-2 ring-brand-400 ring-offset-2 ring-offset-elevated")}
                aria-label="Pick color"
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddMembersModal({ members, teamMembers, onClose, onAdd }) {
  const teamIds = new Set(teamMembers.map((m) => m.id));
  const available = members.filter((m) => !teamIds.has(m.id));
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Modal
      open
      onClose={onClose}
      title="Add members"
      description="Choose people to add to this team."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            disabled={selected.length === 0}
            onClick={async () => {
              setSaving(true);
              await onAdd(selected);
            }}
          >
            Add {selected.length || ""} member{selected.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      {available.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-mute">Everyone is already in this team.</p>
      ) : (
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {available.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-surface-2">
              <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} className="h-4 w-4 accent-[var(--color-brand-500)]" />
              <Avatar name={m.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{m.name}</p>
                <p className="text-xs text-ink-mute">{m.title}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}

function InviteModal({ onClose, onInvite }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onInvite({ ...form, role: "guest", teamIds: [] });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite someone"
      description="They'll get an email with a link to join this team."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Send invite</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}
        <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jordan Lee" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jordan@company.com" />
      </div>
    </Modal>
  );
}
