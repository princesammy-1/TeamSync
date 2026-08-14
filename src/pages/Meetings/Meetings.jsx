import { useState } from "react";
import { FiVideo, FiPlus, FiUsers, FiClock } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import AvatarStack from "../../components/ui/AvatarStack";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import EmptyState from "../../components/ui/EmptyState";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { usePresence } from "../../hooks/usePresence";
import { meetingRoomPath } from "../../constants/routes";
import { formatDate, formatTime, isToday } from "../../utils/formatDate";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

export default function Meetings() {
  const { meetings, loading, members, createMeeting, joinMeeting } = useWorkspace();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { presenceOf } = usePresence();
  const navigate = useNavigate();

  const [scheduleOpen, setScheduleOpen] = useState(false);

  const live = meetings.filter((m) => m.status === "live");
  const upcoming = meetings
    .filter((m) => m.status === "upcoming")
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const past = meetings
    .filter((m) => m.status === "ended")
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  const join = async (meeting) => {
    await joinMeeting(meeting.id);
    toast({ type: "success", title: "Joining meeting", message: `You're in "${meeting.title}".` });
    navigate(meetingRoomPath(meeting.id));
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        subtitle="Jump into a call or schedule one for later."
        actions={
          <Button size="sm" onClick={() => setScheduleOpen(true)}>
            <FiPlus size={15} /> Schedule meeting
          </Button>
        }
      />

      {live.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <h2 className="text-sm font-semibold text-ink">Happening now</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {live.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                members={members}
                presenceOf={presenceOf}
                onJoin={() => join(m)}
                live
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<FiVideo size={22} />}
            title="No upcoming meetings"
            description="Schedule one to get your team on the same page."
            action={<Button onClick={() => setScheduleOpen(true)}><FiPlus size={15} /> Schedule meeting</Button>}
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                members={members}
                presenceOf={presenceOf}
                onJoin={() => join(m)}
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Past</h2>
          <div className="space-y-2">
            {past.slice(0, 6).map((m) => (
              <MeetingCard key={m.id} meeting={m} members={members} presenceOf={presenceOf} past />
            ))}
          </div>
        </section>
      )}

      {scheduleOpen && (
        <ScheduleMeetingModal
          members={members}
          onClose={() => setScheduleOpen(false)}
          onSchedule={async (data) => {
            const meeting = await createMeeting(currentUser.id, data);
            setScheduleOpen(false);
            toast({ type: "success", title: "Meeting scheduled", message: `"${meeting.title}" is on the calendar.` });
            return meeting;
          }}
        />
      )}
    </div>
  );
}

function MeetingCard({ meeting, members, presenceOf, onJoin, live, past }) {
  const attendees = meeting.attendeeIds.map((id) => members.find((m) => m.id === id)).filter(Boolean);
  const host = members.find((m) => m.id === meeting.hostId);

  const dateLabel = isToday(meeting.startTime)
    ? `Today · ${formatTime(meeting.startTime)}`
    : `${formatDate(meeting.startTime, { weekday: "short", month: "short", day: "numeric" })} · ${formatTime(meeting.startTime)}`;

  return (
    <Card
      className={cn(
        "flex items-center gap-4 transition-colors",
        live && "border-emerald-500/40 bg-emerald-500/[0.04]",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
        <FiVideo size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-ink">{meeting.title}</h3>
          {live && <Badge variant="success">Live</Badge>}
          {meeting.recurring && <Badge variant="brand">Recurring</Badge>}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-mute">
          <FiClock size={12} /> {dateLabel} · {meeting.durationMin}m
        </p>
        <div className="mt-2 flex items-center justify-between">
          <AvatarStack users={attendees} max={4} size="xs" presenceMap={Object.fromEntries(attendees.map((a) => [a.id, presenceOf(a.id)]))} />
          {host && <span className="text-[11px] text-ink-mute">Hosted by {host.name}</span>}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        {live && onJoin && (
          <Button size="sm" onClick={onJoin}>Join now</Button>
        )}
        {!live && !past && onJoin && (
          <Button size="sm" variant="secondary" onClick={onJoin}>Join room</Button>
        )}
        {past && (
          <Button size="xs" variant="ghost" disabled>
            Ended
          </Button>
        )}
        <span className="flex items-center justify-end gap-1 text-[11px] text-ink-mute">
          <FiUsers size={11} /> {attendees.length}
        </span>
      </div>
    </Card>
  );
}

function ScheduleMeetingModal({ members, onClose, onSchedule }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: defaultDate,
    time: "10:00",
    durationMin: 30,
    attendeeIds: [],
    recurring: false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleAttendee = (id) =>
    setForm((f) => ({
      ...f,
      attendeeIds: f.attendeeIds.includes(id) ? f.attendeeIds.filter((x) => x !== id) : [...f.attendeeIds, id],
    }));

  const submit = async () => {
    if (form.title.trim().length < 3) {
      setError("Give the meeting a title (at least 3 characters).");
      return;
    }
    if (form.attendeeIds.length === 0) {
      setError("Add at least one attendee.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const [h, m] = form.time.split(":").map(Number);
      const start = new Date(`${form.date}T${form.time}:00`);
      start.setHours(h, m, 0, 0);
      await onSchedule({
        title: form.title.trim(),
        description: form.description.trim(),
        startTime: start.toISOString(),
        durationMin: Number(form.durationMin),
        attendeeIds: form.attendeeIds,
        recurring: form.recurring,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Schedule a meeting"
      description="Invite your team and pick a time that works."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Schedule meeting</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}

        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Sprint planning"
          autoFocus
        />

        <Textarea
          label="Agenda"
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What should everyone prepare?"
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="Time" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
          <Select
            label="Duration"
            value={form.durationMin}
            onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
            options={[15, 20, 30, 45, 60, 90, 120].map((d) => ({ value: d, label: `${d} min` }))}
          />
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <Toggle checked={form.recurring} onChange={(v) => setForm((f) => ({ ...f, recurring: v }))} label="Recurring" />
              Recurring
            </label>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Attendees <span className="text-ink-mute">({form.attendeeIds.length})</span>
          </p>
          <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border bg-surface p-2">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleAttendee(m.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition",
                  form.attendeeIds.includes(m.id)
                    ? "border-brand-500/60 bg-brand-500/15 text-brand-300"
                    : "border-border bg-surface-2/50 text-ink-soft hover:border-ink-mute/40",
                )}
              >
                <AvatarStack users={[m]} max={1} size="xs" />
                {m.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
