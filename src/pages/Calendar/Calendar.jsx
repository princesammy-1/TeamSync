import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus, FiTrash2, FiCalendar, FiClock } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import EmptyState from "../../components/ui/EmptyState";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useToast } from "../../hooks/useToast";
import { addDays, addMonths, formatTime, isToday, startOfMonth, toISODate } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EVENT_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "focus", label: "Focus block" },
  { value: "event", label: "Event" },
  { value: "webinar", label: "Webinar" },
  { value: "deadline", label: "Deadline" },
];

const TYPE_STYLE = {
  meeting: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  focus: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  event: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  webinar: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  deadline: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function Calendar() {
  const { events, loading, createEvent, updateEvent, deleteEvent, teams } = useWorkspace();
  const { toast } = useToast();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [modal, setModal] = useState(null);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const key = toISODate(e.startTime);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const offset = (first.getDay() + 6) % 7;
    const start = addDays(first, -offset);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month]);

  const selectedKey = toISODate(selectedDate);
  const selectedEvents = eventsByDay[selectedKey] || [];

  if (loading) return <PageSkeleton />;

  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const openCreate = (date = selectedDate) => {
    setModal({ mode: "create", date: toISODate(date) });
  };

  const openEdit = (event) => {
    setModal({ mode: "edit", event });
  };

  const saveEvent = async (data) => {
    if (modal.mode === "edit") {
      await updateEvent(modal.event.id, data);
      toast({ type: "success", title: "Event updated" });
    } else {
      await createEvent(data);
      toast({ type: "success", title: "Event added", message: `"${data.title}" is on the calendar.` });
    }
    setModal(null);
  };

  const removeEvent = async (id) => {
    await deleteEvent(id);
    setModal(null);
    toast({ type: "success", title: "Event deleted" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Meetings, focus time, and deadlines in one view."
        actions={
          <Button size="sm" onClick={() => openCreate()}>
            <FiPlus size={15} /> New event
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <h2 className="text-base font-semibold text-ink">{monthLabel}</h2>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setMonth(new Date())}>Today</Button>
              <button
                onClick={() => setMonth((m) => addMonths(m, -1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-soft transition hover:text-ink"
                aria-label="Previous month"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                onClick={() => setMonth((m) => addMonths(m, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-soft transition hover:text-ink"
                aria-label="Next month"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-border-subtle">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold tracking-wide text-ink-mute uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day) => {
              const key = toISODate(day);
              const dayEvents = eventsByDay[key] || [];
              const inMonth = day.getMonth() === month.getMonth();
              const today = isToday(day);
              const selected = toISODate(day) === selectedKey;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex min-h-20 flex-col items-start gap-1 border-b border-r border-border-subtle p-1.5 text-left transition-colors last:border-r-0 hover:bg-surface-2/50",
                    !inMonth && "bg-canvas/40",
                    today && "bg-brand-500/[0.05]",
                    selected && "ring-1 ring-inset ring-brand-500/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      today ? "bg-brand-600 text-white" : inMonth ? "text-ink-soft" : "text-ink-mute/50",
                    )}
                  >
                    {day.getDate()}
                  </span>

                  <div className="w-full space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEdit(e);
                        }}
                        className={cn(
                          "block w-full truncate rounded border px-1 py-0.5 text-[10px] font-medium",
                          TYPE_STYLE[e.type] || TYPE_STYLE.event,
                        )}
                      >
                        {e.type === "deadline" ? "◆ " : ""}{e.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="block px-1 text-[10px] text-ink-mute">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              <button
                onClick={() => openCreate()}
                className="rounded-md p-1.5 text-ink-mute transition hover:bg-surface-2 hover:text-ink"
                aria-label="Add event on selected day"
              >
                <FiPlus size={16} />
              </button>
            </div>

            {selectedEvents.length === 0 ? (
              <EmptyState
                icon={<FiCalendar size={20} />}
                title="No events"
                description="A quiet day. Add an event or enjoy the focus time."
                className="py-8"
              />
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((e) => (
                  <li key={e.id} className="rounded-lg border border-border-subtle bg-surface-2/40 p-3">
                    <button onClick={() => openEdit(e)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-2">
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize", TYPE_STYLE[e.type])}>
                          {e.type}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-ink-mute">
                          <FiClock size={11} /> {formatTime(e.startTime)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-ink">{e.title}</p>
                      {e.description && <p className="mt-0.5 text-xs text-ink-mute">{e.description}</p>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-ink">Upcoming</h3>
            <ul className="space-y-2">
              {events
                .filter((e) => new Date(e.startTime) >= new Date())
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                .slice(0, 5)
                .map((e) => (
                  <li key={e.id} className="flex items-center gap-2.5">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", TYPE_STYLE[e.type].split(" ")[0])} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{e.title}</p>
                      <p className="text-xs text-ink-mute">
                        {new Date(e.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                        · {formatTime(e.startTime)}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </div>

      {modal && (
        <EventModal
          mode={modal.mode}
          initial={modal.event}
          date={modal.date}
          teams={teams}
          onClose={() => setModal(null)}
          onSave={saveEvent}
          onDelete={removeEvent}
        />
      )}
    </div>
  );
}

function EventModal({ mode, initial, date, teams, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    id: initial?.id,
    title: initial?.title || "",
    description: initial?.description || "",
    date: initial ? toISODate(initial.startTime) : date || toISODate(new Date()),
    startTime: initial ? formatTime(initial.startTime) : "09:00",
    endTime: initial ? formatTime(initial.endTime || initial.startTime) : "10:00",
    type: initial?.type || "meeting",
    teamId: initial?.teamId || "",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (form.title.trim().length < 2) {
      setError("Give the event a title (at least 2 characters).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const start = new Date(`${form.date}T${form.startTime}:00`);
      const end = new Date(`${form.date}T${form.endTime}:00`);
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: form.type,
        teamId: form.teamId || null,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "edit" ? "Edit event" : "Add event"}
      description={mode === "edit" ? "Update the details of this calendar item." : "Block out time on your calendar."}
      footer={
        <>
          {mode === "edit" && (
            <Button variant="danger" className="mr-auto" onClick={() => onDelete(form.id)}>
              <FiTrash2 size={14} /> Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{mode === "edit" ? "Save changes" : "Add event"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}

        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Design review"
          autoFocus
        />

        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional details…"
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="Start" type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
          <Input label="End" type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            options={EVENT_TYPES}
          />
          <Select
            label="Team"
            value={form.teamId}
            onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
            options={[{ value: "", label: "No team" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
          />
        </div>
      </div>
    </Modal>
  );
}
