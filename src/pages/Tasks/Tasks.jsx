import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiPlus, FiSearch, FiList, FiGrid, FiMoreHorizontal, FiTrash2, FiEdit2 } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import AvatarStack from "../../components/ui/AvatarStack";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Dropdown from "../../components/ui/Dropdown";
import Tabs from "../../components/ui/Tabs";
import EmptyState from "../../components/ui/EmptyState";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import {
  TASK_STATUS,
  TASK_STATUS_META,
  TASK_STATUS_ORDER,
  TASK_PRIORITY,
  PRIORITY_META,
  TASK_PRIORITY_ORDER,
} from "../../constants/tasks";
import { cn } from "../../utils/cn";
import { formatDate, relativeTime, isPast } from "../../utils/formatDate";

export default function Tasks() {
  const { currentUser } = useAuth();
  const { tasks, loading, teams, members, createTask, updateTask, deleteTask, moveTask } = useWorkspace();
  const { toast } = useToast();

  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (teamFilter !== "all" && t.teamId !== teamFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (q && !`${t.title} ${t.description} ${t.tags?.join(" ") || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, search, teamFilter, priorityFilter]);

  const [order, setOrder] = useState({});
  useEffect(() => {
    const next = {};
    TASK_STATUS_ORDER.forEach((status) => {
      next[status] = filtered
        .filter((t) => t.status === status)
        .sort((a, b) => {
          const rankDiff = PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank;
          if (rankDiff !== 0) return rankDiff;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .map((t) => t.id);
    });
    setOrder(next);
  }, [filtered]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const taskById = (id) => tasks.find((t) => t.id === id);

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const fromStatus = String(active.data.current?.status);
    const isOverCard = over.data.current?.type === "card";
    const toStatus = isOverCard ? String(over.data.current.status) : String(over.id);

    setOrder((prev) => {
      const source = [...(prev[fromStatus] || [])];
      const fromIndex = source.indexOf(active.id);
      if (fromIndex === -1) return prev;
      const [moved] = source.splice(fromIndex, 1);

      const target = [...(prev[toStatus] || [])];
      let insertAt = target.length;
      if (isOverCard) {
        const overIndex = target.indexOf(over.id);
        if (overIndex !== -1) {
          insertAt = overIndex;
          if (fromStatus === toStatus && fromIndex < insertAt) insertAt -= 1;
        }
      }
      target.splice(insertAt, 0, moved);

      return { ...prev, [fromStatus]: source, [toStatus]: target };
    });

    if (fromStatus !== toStatus) {
      moveTask(currentUser.id, active.id, toStatus);
    }
  };

  const openCreate = (status = TASK_STATUS.TODO) => {
    setEditingTask({ status });
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    if (data.id) {
      const updated = await updateTask(currentUser.id, data.id, data);
      toast({ type: "success", title: "Task updated" });
      return updated;
    }
    const created = await createTask(currentUser.id, data);
    toast({ type: "success", title: "Task created", message: `"${created.title}" added to the board.` });
    return created;
  };

  const handleDelete = async () => {
    await deleteTask(currentUser.id, confirmDelete.id);
    setConfirmDelete(null);
    toast({ type: "success", title: "Task deleted" });
  };

  const teamOptions = [
    { value: "all", label: "All teams" },
    ...teams.map((t) => ({ value: t.id, label: t.name })),
  ];

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Plan the work, then watch it move."
        actions={
          <Button size="sm" onClick={() => openCreate()}>
            <FiPlus size={15} /> New task
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          tabs={[
            { value: "board", label: "Board", icon: <FiGrid size={14} /> },
            { value: "list", label: "List", icon: <FiList size={14} />, count: filtered.length },
          ]}
          active={view}
          onChange={setView}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <FiSearch size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="h-8.5 w-full sm:w-48"
            />
          </div>
          <Select
            options={teamOptions}
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-8.5 w-full sm:w-40"
          />
          <Select
            options={[
              { value: "all", label: "All priorities" },
              ...TASK_PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_META[p].label })),
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8.5 w-full sm:w-40"
          />
        </div>
      </div>

      {view === "board" ? (
        <Board
          order={order}
          taskById={taskById}
          teams={teams}
          members={members}
          onDragEnd={onDragEnd}
          sensors={sensors}
          onOpenCreate={openCreate}
          onOpenEdit={openEdit}
          onDelete={(t) => setConfirmDelete(t)}
        />
      ) : (
        <ListView
          tasks={filtered}
          members={members}
          onEdit={openEdit}
          onDelete={(t) => setConfirmDelete(t)}
          onMove={(task, status) => moveTask(currentUser.id, task.id, status)}
        />
      )}

      {modalOpen && (
        <TaskModal
          task={editingTask}
          teams={teams}
          members={members}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      <ConfirmTaskDelete
        task={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ---------------- Board ---------------- */

function Board({ order, taskById, teams, members, onDragEnd, sensors, onOpenCreate, onOpenEdit, onDelete }) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="scrollbar-slim flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            taskIds={order[status] || []}
            taskById={taskById}
            teams={teams}
            members={members}
            onOpenCreate={() => onOpenCreate(status)}
            onOpenEdit={onOpenEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({ status, taskIds, taskById, teams, members, onOpenCreate, onOpenEdit, onDelete }) {
  const meta = TASK_STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-surface/60 transition-colors",
        isOver ? "border-brand-500/60 bg-brand-500/[0.04]" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
        <h3 className="text-sm font-semibold text-ink">{meta.label}</h3>
        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-ink-mute">
          {taskIds.length}
        </span>
        <button
          onClick={onOpenCreate}
          className="ml-auto rounded-md p-1 text-ink-mute transition hover:bg-surface-2 hover:text-ink"
          aria-label={`Add task to ${meta.label}`}
        >
          <FiPlus size={15} />
        </button>
      </div>

      <div className="scrollbar-slim max-h-[calc(100vh-320px)] min-h-24 flex-1 space-y-2 overflow-y-auto px-2.5 pb-2.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-ink-mute">
              Drop tasks here
            </div>
          )}
          {taskIds.map((id) => {
            const task = taskById(id);
            if (!task) return null;
            return (
              <SortableCard
                key={task.id}
                task={task}
                teams={teams}
                members={members}
                onEdit={() => onOpenEdit(task)}
                onDelete={() => onDelete(task)}
              />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableCard({ task, teams, members, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "card", status: task.status, statusOfCard: task.status },
  });

  const assignees = task.assigneeIds.map((id) => members.find((m) => m.id === id)).filter(Boolean);
  const overdue = task.dueDate && isPast(task.dueDate) && task.status !== TASK_STATUS.DONE;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "group cursor-grab rounded-lg border bg-surface p-3 shadow-sm transition-colors hover:border-ink-mute/30 active:cursor-grabbing",
        isDragging ? "z-10 border-brand-500 shadow-xl shadow-black/40 opacity-90" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-snug font-medium text-ink">{task.title}</p>
        <Dropdown
          trigger={
            <button
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-ink-mute opacity-0 transition group-hover:opacity-100 hover:bg-surface-2 hover:text-ink"
              aria-label="Task actions"
            >
              <FiMoreHorizontal size={15} />
            </button>
          }
        >
          <Dropdown.Item icon={<FiEdit2 size={14} />} onClick={onEdit}>Edit task</Dropdown.Item>
          <Dropdown.Item destructive icon={<FiTrash2 size={14} />} onClick={onDelete}>Delete task</Dropdown.Item>
        </Dropdown>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-ink-mute">{task.description}</p>
      )}

      {task.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-mute">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", PRIORITY_META[task.priority].color)}>
          <span className="text-xs">▲</span>
          {PRIORITY_META[task.priority].label}
        </span>

        {task.dueDate && (
          <span className={cn("text-[11px]", overdue ? "font-semibold text-rose-400" : "text-ink-mute")}>
            {overdue ? "Overdue · " : ""}{relativeTime(task.dueDate)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <AvatarStack users={assignees} max={3} size="xs" />
        {task.teamId && (
          <span className="max-w-20 truncate text-[10px] text-ink-mute">
            #{teams.find((t) => t.id === task.teamId)?.name || ""}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------------- List view ---------------- */

function ListView({ tasks: items, members, onEdit, onDelete, onMove }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FiList size={22} />}
        title="No tasks match"
        description="Try adjusting your filters, or create a new task."
      />
    );
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <ul className="divide-y divide-border-subtle">
        {items
          .slice()
          .sort((a, b) => {
            const sa = TASK_STATUS_ORDER.indexOf(a.status);
            const sb = TASK_STATUS_ORDER.indexOf(b.status);
            return sa - sb;
          })
          .map((task) => {
            const assignees = task.assigneeIds.map((id) => members.find((m) => m.id === id)).filter(Boolean);
            const overdue = task.dueDate && isPast(task.dueDate) && task.status !== TASK_STATUS.DONE;

            return (
              <li key={task.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/40">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", TASK_STATUS_META[task.status].dot)} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                  <p className="text-xs text-ink-mute">
                    {PRIORITY_META[task.priority].label}
                    {task.dueDate && (
                      <>
                        {" · "}
                        <span className={overdue ? "font-medium text-rose-400" : ""}>
                          {overdue ? "overdue" : formatDate(task.dueDate)}
                        </span>
                      </>
                    )}
                    {task.tags?.length ? ` · ${task.tags.join(", ")}` : ""}
                  </p>
                </div>

                <span className={cn("hidden rounded-md border px-1.5 py-0.5 text-[11px] sm:inline-flex", TASK_STATUS_META[task.status].chip)}>
                  {TASK_STATUS_META[task.status].label}
                </span>

                <AvatarStack users={assignees} max={3} size="xs" className="hidden sm:flex" />

                <Dropdown
                  trigger={
                    <button className="rounded-md p-1.5 text-ink-mute transition hover:bg-surface-2 hover:text-ink" aria-label="Task actions">
                      <FiMoreHorizontal size={15} />
                    </button>
                  }
                >
                  <Dropdown.Label>Move to</Dropdown.Label>
                  {TASK_STATUS_ORDER.map((s) => (
                    <Dropdown.Item
                      key={s}
                      onClick={() => onMove(task, s)}
                      className={cn("pl-3", task.status === s && "text-brand-300")}
                    >
                      {TASK_STATUS_META[s].label}
                    </Dropdown.Item>
                  ))}
                  <Dropdown.Separator />
                  <Dropdown.Item icon={<FiEdit2 size={14} />} onClick={() => onEdit(task)}>Edit</Dropdown.Item>
                  <Dropdown.Item destructive icon={<FiTrash2 size={14} />} onClick={() => onDelete(task)}>Delete</Dropdown.Item>
                </Dropdown>
              </li>
            );
          })}
      </ul>
    </Card>
  );
}

/* ---------------- Task modal ---------------- */

function TaskModal({ task, teams, members, onClose, onSave }) {
  const isEdit = Boolean(task?.id);
  const [form, setForm] = useState(() => ({
    id: task?.id,
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || TASK_STATUS.TODO,
    priority: task?.priority || TASK_PRIORITY.MEDIUM,
    teamId: task?.teamId || "",
    assigneeIds: task?.assigneeIds || [],
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
    tags: task?.tags?.join(", ") || "",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleAssignee = (id) =>
    setForm((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id) ? f.assigneeIds.filter((x) => x !== id) : [...f.assigneeIds, id],
    }));

  const submit = async () => {
    if (form.title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        teamId: form.teamId || null,
        dueDate: form.dueDate ? new Date(`${form.dueDate}T09:00:00`).toISOString() : null,
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
      title={isEdit ? "Edit task" : "Create task"}
      description={isEdit ? "Fine-tune the details of this task." : "Add a task to the board."}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{isEdit ? "Save changes" : "Create task"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}

        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="What needs to be done?"
          autoFocus
        />

        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Add context, links, or acceptance criteria…"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            options={TASK_STATUS_ORDER.map((s) => ({ value: s, label: TASK_STATUS_META[s].label }))}
          />
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            options={TASK_PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
          />
          <Select
            label="Team"
            value={form.teamId}
            onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
            options={[{ value: "", label: "No team" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
          />
          <Input
            label="Due date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Assignees <span className="text-ink-mute">({form.assigneeIds.length})</span>
          </p>
          <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border bg-surface p-2">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleAssignee(m.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition",
                  form.assigneeIds.includes(m.id)
                    ? "border-brand-500/60 bg-brand-500/15 text-brand-300"
                    : "border-border bg-surface-2/50 text-ink-soft hover:border-ink-mute/40",
                )}
              >
                <Avatar name={m.name} size="xs" />
                {m.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Tags"
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="design, ux, security… (comma separated)"
        />
      </div>
    </Modal>
  );
}

/* ---------------- Delete confirm ---------------- */

function ConfirmTaskDelete({ task, onClose, onConfirm }) {
  return (
    <Modal
      open={Boolean(task)}
      onClose={onClose}
      title="Delete task?"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete task</Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-soft">
        “<span className="font-medium text-ink">{task?.title}</span>” will be permanently removed from the board.
      </p>
    </Modal>
  );
}
