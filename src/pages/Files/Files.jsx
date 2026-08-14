import { useMemo, useState } from "react";
import {
  FiUpload,
  FiFile,
  FiFileText,
  FiImage,
  FiVideo,
  FiArchive,
  FiCode,
  FiGrid,
  FiSearch,
  FiDownload,
  FiTrash2,
  FiEye,
  FiFolder,
  FiMoreHorizontal,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Dropdown from "../../components/ui/Dropdown";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { formatBytes, titleCase } from "../../utils/format";
import { formatDate, relativeTime } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

const KIND_META = {
  pdf: { icon: FiFileText, color: "bg-rose-500/15 text-rose-300" },
  doc: { icon: FiFileText, color: "bg-sky-500/15 text-sky-300" },
  image: { icon: FiImage, color: "bg-emerald-500/15 text-emerald-300" },
  sheet: { icon: FiGrid, color: "bg-emerald-500/15 text-emerald-300" },
  video: { icon: FiVideo, color: "bg-violet-500/15 text-violet-300" },
  zip: { icon: FiArchive, color: "bg-amber-500/15 text-amber-300" },
  code: { icon: FiCode, color: "bg-sky-500/15 text-sky-300" },
  other: { icon: FiFile, color: "bg-slate-500/15 text-slate-300" },
};

const FILE_KINDS = ["pdf", "doc", "image", "sheet", "video", "zip", "code", "other"];

export default function Files() {
  const { files, loading, teams, members, uploadFile, deleteFile } = useWorkspace();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      if (kindFilter !== "all" && f.kind !== kindFilter) return false;
      if (teamFilter !== "all" && f.teamId !== teamFilter) return false;
      if (q && !`${f.name} ${f.kind}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [files, search, kindFilter, teamFilter]);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (loading) return <PageSkeleton />;

  const download = (file) => {
    toast({ type: "info", title: "Download started", message: `${file.name} is being prepared.` });
  };

  const remove = async () => {
    await deleteFile(currentUser.id, confirmDelete.id);
    setConfirmDelete(null);
    toast({ type: "success", title: "File deleted" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        subtitle={`${files.length} files · ${formatBytes(totalSize)} used`}
        actions={
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <FiUpload size={15} /> Upload
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <FiSearch size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="h-8.5 pl-9"
          />
        </div>

        <Select
          options={[{ value: "all", label: "All types" }, ...FILE_KINDS.map((k) => ({ value: k, label: titleCase(k) }))]}
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="h-8.5 sm:w-40"
        />

        <Select
          options={[{ value: "all", label: "All teams" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="h-8.5 sm:w-44"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FiFolder size={22} />}
          title={files.length === 0 ? "No files yet" : "No files match"}
          description={
            files.length === 0
              ? "Upload your first file to start sharing with your team."
              : "Try a different search or filter."
          }
          action={
            files.length === 0 && (
              <Button onClick={() => setUploadOpen(true)}>
                <FiUpload size={15} /> Upload a file
              </Button>
            )
          }
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-border-subtle">
            {filtered.map((file) => {
              const meta = KIND_META[file.kind] || KIND_META.other;
              const Icon = meta.icon;
              const uploader = members.find((m) => m.id === file.uploadedById);
              const team = teams.find((t) => t.id === file.teamId);

              return (
                <li key={file.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/40">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", meta.color)}>
                    <Icon size={18} />
                  </span>

                  <button onClick={() => setPreviewFile(file)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-ink transition hover:text-brand-300">{file.name}</p>
                    <p className="text-xs text-ink-mute">
                      {formatBytes(file.size)} · {titleCase(file.kind)} · {relativeTime(file.createdAt)}
                    </p>
                  </button>

                  <span className="hidden items-center gap-2 md:flex">
                    <Avatar name={uploader?.name} size="xs" />
                    <span className="max-w-28 truncate text-xs text-ink-mute">{uploader?.name}</span>
                  </span>

                  {team && <Badge variant="default" className="hidden lg:inline-flex">{team.name}</Badge>}

                  <span className="hidden w-14 text-right text-xs text-ink-mute lg:block">{file.downloads} DLs</span>

                  <Dropdown
                    trigger={
                      <button className="rounded-md p-1.5 text-ink-mute transition hover:bg-surface-2 hover:text-ink" aria-label="File actions">
                        <FiMoreHorizontal size={15} />
                      </button>
                    }
                  >
                    <Dropdown.Item icon={<FiEye size={14} />} onClick={() => setPreviewFile(file)}>Preview</Dropdown.Item>
                    <Dropdown.Item icon={<FiDownload size={14} />} onClick={() => download(file)}>Download</Dropdown.Item>
                    <Dropdown.Separator />
                    <Dropdown.Item destructive icon={<FiTrash2 size={14} />} onClick={() => setConfirmDelete(file)}>Delete</Dropdown.Item>
                  </Dropdown>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {uploadOpen && (
        <UploadModal
          teams={teams}
          onClose={() => setUploadOpen(false)}
          onUpload={async (data) => {
            const file = await uploadFile(currentUser.id, data);
            setUploadOpen(false);
            toast({ type: "success", title: "File uploaded", message: `${file.name} is now shared.` });
          }}
        />
      )}

      {previewFile && (
        <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} onDownload={() => download(previewFile)} />
      )}

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete file?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Delete file</Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          “<span className="font-medium text-ink">{confirmDelete?.name}</span>” will be removed from the workspace for everyone.
        </p>
      </Modal>
    </div>
  );
}

function UploadModal({ teams, onClose, onUpload }) {
  const [form, setForm] = useState({ name: "", kind: "doc", teamId: "", size: 1 });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (form.name.trim().length < 2) {
      setError("File name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onUpload({
        name: form.name.trim(),
        kind: form.kind,
        teamId: form.teamId || null,
        size: Number(form.size) * 1024,
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
      title="Upload a file"
      description="Share a document with your workspace."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}><FiUpload size={15} /> Upload</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{error}</p>}

        <Input
          label="File name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. sprint-notes.md"
          autoFocus
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
            options={FILE_KINDS.map((k) => ({ value: k, label: titleCase(k) }))}
          />
          <Select
            label="Team"
            value={form.teamId}
            onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
            options={[{ value: "", label: "Workspace-wide" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
          />
        </div>

        <Select
          label="Size"
          value={form.size}
          onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
          options={[
            { value: 1, label: "1 KB — note" },
            { value: 512, label: "512 KB — document" },
            { value: 2048, label: "2 MB — image" },
            { value: 51200, label: "50 MB — video" },
          ]}
        />
      </div>
    </Modal>
  );
}

function PreviewModal({ file, onClose, onDownload }) {
  const meta = KIND_META[file.kind] || KIND_META.other;
  const Icon = meta.icon;
  const uploader = useWorkspace().members.find((m) => m.id === file.uploadedById);

  return (
    <Modal
      open
      onClose={onClose}
      title={file.name}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={onDownload}><FiDownload size={15} /> Download</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-surface-2/40 p-10">
          {file.kind === "image" ? (
            <div className="flex h-48 w-64 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/30 to-sky-500/20">
              <Icon size={40} className="text-brand-300" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className={cn("flex h-20 w-20 items-center justify-center rounded-2xl", meta.color)}>
                <Icon size={36} />
              </span>
              <p className="text-xs text-ink-mute">Preview unavailable in this demo</p>
            </div>
          )}
        </div>

        <div className="w-full space-y-3 sm:w-56">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-mute uppercase">Type</p>
            <p className="text-sm capitalize text-ink">{file.kind}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-mute uppercase">Size</p>
            <p className="text-sm text-ink">{formatBytes(file.size)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-mute uppercase">Uploaded</p>
            <p className="text-sm text-ink">{formatDate(file.createdAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-mute uppercase">By</p>
            <div className="mt-1 flex items-center gap-2">
              <Avatar name={uploader?.name} size="xs" />
              <p className="text-sm text-ink">{uploader?.name}</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-mute uppercase">Downloads</p>
            <p className="text-sm text-ink">{file.downloads}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
