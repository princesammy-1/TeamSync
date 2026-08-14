import { useMemo, useState } from "react";
import {
  FiSave,
  FiCopy,
  FiUserPlus,
  FiShield,
  FiUserX,
  FiRefreshCw,
  FiLock,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Tabs from "../../components/ui/Tabs";
import Toggle from "../../components/ui/Toggle";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import Modal from "../../components/ui/Modal";
import Progress from "../../components/ui/Progress";
import EmptyState from "../../components/ui/EmptyState";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { usePresence } from "../../hooks/usePresence";
import { can, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLES } from "../../constants/roles";
import { relativeTime } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

const AUDIT_ACTIONS = new Set([
  "member.invited",
  "member.joined",
  "member.removed",
  "role.changed",
  "invite.sent",
  "workspace.updated",
  "team.created",
  "team.updated",
  "team.deleted",
  "login",
  "logout",
]);

export default function Settings() {
  const { currentUser } = useAuth();
  const { loading } = useWorkspace();
  const [tab, setTab] = useState("general");

  if (loading || !currentUser) return <PageSkeleton />;

  const tabs = [
    { value: "general", label: "General" },
    { value: "members", label: "Members & roles" },
    { value: "notifications", label: "Notifications" },
    { value: "security", label: "Security" },
    { value: "audit", label: "Audit log" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure your workspace and account." />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "general" && <GeneralTab />}
      {tab === "members" && <MembersTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "security" && <SecurityTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

/* ---------------- General ---------------- */

function GeneralTab() {
  const { workspace, updateWorkspace } = useWorkspace();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(() => ({
    name: workspace?.name || "",
    company: workspace?.company || "",
    email: workspace?.email || "",
  }));
  const [saving, setSaving] = useState(false);

  const seatsPct = ((workspace?.seats?.used || 0) / (workspace?.seats?.limit || 1)) * 100;
  const storagePct = ((workspace?.storage?.used || 0) / (workspace?.storage?.limit || 1)) * 100;

  const save = async () => {
    setSaving(true);
    await updateWorkspace(currentUser.id, form);
    setSaving(false);
    toast({ type: "success", title: "Workspace updated" });
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`https://teamsync.io/join/${workspace?.inviteCode}`);
      toast({ type: "success", title: "Invite link copied" });
    } catch {
      toast({ type: "info", title: "Invite code", message: workspace?.inviteCode });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-sm font-semibold text-ink">Workspace details</h2>
        <p className="text-xs text-ink-mute">These details are shown to your team.</p>

        <div className="mt-4 space-y-4">
          <Input label="Workspace name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
          <Input label="Contact email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Button onClick={save} loading={saving}><FiSave size={14} /> Save changes</Button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Plan</h2>
            <Badge variant="brand">{workspace?.plan}</Badge>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-ink-soft">Seats</span>
                <span className="text-ink-mute">{workspace?.seats?.used} / {workspace?.seats?.limit}</span>
              </div>
              <Progress value={seatsPct} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-ink-soft">Storage</span>
                <span className="text-ink-mute">{workspace?.storage?.used} {workspace?.storage?.unit} / {workspace?.storage?.limit} {workspace?.storage?.unit}</span>
              </div>
              <Progress value={storagePct} barClassName="bg-emerald-500" />
            </div>
            <p className="text-xs text-ink-mute">
              You're on the Pro plan. Upgrade anytime to unlock 500 seats and 1TB of storage.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">Invite link</h2>
          <p className="text-xs text-ink-mute">Share this link to let anyone join your workspace.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-brand-300">
              teamsync.io/join/{workspace?.inviteCode}
            </code>
            <Button variant="secondary" size="sm" onClick={copyInvite}>
              <FiCopy size={13} /> Copy
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Members & roles ---------------- */

function MembersTab() {
  const { members, teams, changeRole, removeMember, inviteMember } = useWorkspace();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { presenceOf } = usePresence();
  const [inviteOpen, setInviteOpen] = useState(false);

  const canManage = can(currentUser.role, "manageMembers");

  const changeRoleFor = async (member, role) => {
    if (!canManage) return;
    if (member.role === ROLES.OWNER) return;
    await changeRole(currentUser.id, member.id, role);
    toast({ type: "success", title: "Role updated", message: `${member.name} is now ${ROLE_LABELS[role]}.` });
  };

  const remove = async (member) => {
    if (!canManage) return;
    await removeMember(currentUser.id, member.id);
    toast({ type: "info", title: "Member removed", message: `${member.name} was removed from the workspace.` });
  };

  return (
    <div className="space-y-4">
      <Card className="border-brand-500/20 bg-brand-500/[0.03]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
            <FiShield size={15} />
          </span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <div key={role}>
                <p className="text-sm font-semibold capitalize text-ink">{label}</p>
                <p className="text-xs leading-snug text-ink-mute">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{members.length} members</h2>
          {canManage && (
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <FiUserPlus size={14} /> Invite member
            </Button>
          )}
        </div>

        <ul className="divide-y divide-border-subtle">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.name} size="md" presence={presenceOf(m.id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {m.name}
                  {m.id === currentUser.id && <span className="text-xs font-normal text-ink-mute"> (you)</span>}
                  {m.pending && <Badge variant="warning" className="ml-2">Pending</Badge>}
                </p>
                <p className="truncate text-xs text-ink-mute">{m.email} · {m.title}</p>
              </div>

              <Badge variant="brand" className="hidden capitalize sm:inline-flex">
                {ROLE_LABELS[m.role]}
              </Badge>

              {canManage && m.role !== ROLES.OWNER && (
                <Select
                  value={m.role}
                  onChange={(e) => changeRoleFor(m, e.target.value)}
                  options={Object.values(ROLES)
                    .filter((r) => r !== ROLES.OWNER)
                    .map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                  className="w-32"
                />
              )}

              {canManage && m.role !== ROLES.OWNER && m.id !== currentUser.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-ink-mute hover:text-rose-400"
                  onClick={() => remove(m)}
                  aria-label={`Remove ${m.name}`}
                >
                  <FiUserX size={15} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {inviteOpen && (
        <InviteMemberModal
          teams={teams}
          onClose={() => setInviteOpen(false)}
          onInvite={async (data) => {
            const invited = await inviteMember(currentUser.id, data);
            setInviteOpen(false);
            toast({ type: "success", title: "Invite sent", message: `An invitation is on its way to ${invited.name}.` });
          }}
        />
      )}
    </div>
  );
}

function InviteMemberModal({ teams, onClose, onInvite }) {
  const [form, setForm] = useState({ name: "", email: "", role: ROLES.MEMBER, teamIds: [] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleTeam = (id) =>
    setForm((f) => ({ ...f, teamIds: f.teamIds.includes(id) ? f.teamIds.filter((x) => x !== id) : [...f.teamIds, id] }));

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onInvite(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite a member"
      description="Choose their role and teams. They'll receive an email invite."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}><FiUserPlus size={14} /> Send invite</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}
        <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jordan Lee" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jordan@company.com" />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          options={Object.values(ROLES)
            .filter((r) => r !== ROLES.OWNER)
            .map((r) => ({ value: r, label: `${ROLE_LABELS[r]} — ${ROLE_DESCRIPTIONS[r].split(".")[0]}.` }))}
        />

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">Teams</p>
          <div className="flex flex-wrap gap-1.5">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTeam(t.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  form.teamIds.includes(t.id)
                    ? "border-brand-500/60 bg-brand-500/15 text-brand-300"
                    : "border-border bg-surface-2/50 text-ink-soft hover:border-ink-mute/40",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Notifications ---------------- */

function NotificationsTab() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    taskAssigned: true,
    meetingInvites: true,
    mentions: true,
    weeklyDigest: false,
    desktop: true,
    email: true,
  });

  const set = (key) => (value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    toast({ type: "success", title: "Preference saved" });
  };

  const rows = [
    { key: "taskAssigned", title: "Task assignments", desc: "Notify me when I'm assigned a task." },
    { key: "meetingInvites", title: "Meeting invitations", desc: "Alert me when someone invites me to a call." },
    { key: "mentions", title: "Mentions", desc: "When someone mentions me in chat or comments." },
    { key: "weeklyDigest", title: "Weekly digest", desc: "A Monday summary of workspace activity." },
  ];

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink">What to notify you about</h2>
      <p className="text-xs text-ink-mute">Choose which events get your attention.</p>

      <div className="mt-4 divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{row.title}</p>
              <p className="text-xs text-ink-mute">{row.desc}</p>
            </div>
            <Toggle checked={prefs[row.key]} onChange={set(row.key)} label={row.title} />
          </div>
        ))}
      </div>

      <div className="mt-2 border-t border-border-subtle pt-4">
        <h3 className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Channels</h3>
        <div className="mt-3 divide-y divide-border-subtle">
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">In-app notifications</p>
              <p className="text-xs text-ink-mute">Show toasts and badge counts in the app.</p>
            </div>
            <Toggle checked={prefs.desktop} onChange={set("desktop")} label="In-app notifications" />
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">Email notifications</p>
              <p className="text-xs text-ink-mute">Send important updates to your inbox.</p>
            </div>
            <Toggle checked={prefs.email} onChange={set("email")} label="Email notifications" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Security ---------------- */

function SecurityTab() {
  const { toast } = useToast();
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const changePassword = async () => {
    if (pwd.next.length < 8) {
      toast({ type: "error", title: "Password too short", message: "Use at least 8 characters." });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast({ type: "error", title: "Passwords don't match" });
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setPwd({ current: "", next: "", confirm: "" });
    toast({ type: "success", title: "Password changed", message: "Your password was updated. Please use it next time you sign in." });
  };

  const sessions = useMemo(() => [
    { id: "s1", device: "Chrome on Windows", location: "Lisbon, PT", current: true },
    { id: "s2", device: "Safari on iPhone", location: "Lisbon, PT", current: false },
    { id: "s3", device: "Firefox on MacBook", location: "Lisbon, PT", current: false },
  ], []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><FiLock size={14} /> Change password</h2>
        <p className="text-xs text-ink-mute">Use a unique password you don't reuse elsewhere.</p>

        <div className="mt-4 space-y-4">
          <Input label="Current password" type="password" value={pwd.current} onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))} autoComplete="current-password" />
          <Input label="New password" type="password" value={pwd.next} onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))} autoComplete="new-password" />
          <Input label="Confirm new password" type="password" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" />
          <Button onClick={changePassword} loading={saving}><FiSave size={14} /> Update password</Button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Two-factor authentication</h2>
              <p className="text-xs text-ink-mute">Add an extra layer of security to your account.</p>
            </div>
            <Toggle
              checked={twoFactor}
              onChange={(v) => {
                setTwoFactor(v);
                toast({ type: "success", title: v ? "2FA enabled" : "2FA disabled" });
              }}
              label="Two-factor authentication"
            />
          </div>
        </Card>

        <Card padded={false} className="overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Active sessions</h2>
          </div>
          <ul className="divide-y divide-border-subtle">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {s.device} {s.current && <span className="text-xs text-emerald-400">· this device</span>}
                  </p>
                  <p className="text-xs text-ink-mute">{s.location}</p>
                </div>
                {!s.current && (
                  <Button variant="ghost" size="xs" onClick={() => toast({ type: "info", title: "Session signed out" })}>
                    Sign out
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Audit log ---------------- */

function AuditTab() {
  const { activities, loadActivities } = useWorkspace();
  const { userById } = useWorkspace();
  const { toast } = useToast();

  const audit = activities.filter((a) => AUDIT_ACTIONS.has(a.action));

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Security audit log</h2>
        <Button
          variant="ghost"
          size="xs"
          onClick={async () => {
            await loadActivities();
            toast({ type: "info", title: "Audit log refreshed" });
          }}
        >
          <FiRefreshCw size={12} /> Refresh
        </Button>
      </div>

      {audit.length === 0 ? (
        <EmptyState title="No audit events yet" description="Member and security events will appear here." className="border-0" />
      ) : (
        <div className="scrollbar-slim overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] tracking-wide text-ink-mute uppercase">
                <th className="px-4 py-2.5 font-semibold">Member</th>
                <th className="px-4 py-2.5 font-semibold">Action</th>
                <th className="px-4 py-2.5 font-semibold">Target</th>
                <th className="px-4 py-2.5 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {audit.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-surface-2/40">
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">{userById(a.actorId)?.name || "System"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{a.action.replaceAll(".", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{a.target?.name}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-ink-mute">{relativeTime(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
