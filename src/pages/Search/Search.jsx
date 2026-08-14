import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiSearch, FiFile, FiUsers, FiMessageSquare, FiVideo, FiCheckCircle, FiArrowRight } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import { useSearch } from "../../hooks/useSearch";
import { useWorkspace } from "../../hooks/useWorkspace";
import { usePresence } from "../../hooks/usePresence";
import { useAuth } from "../../hooks/useAuth";
import { TASK_STATUS_META, PRIORITY_META } from "../../constants/tasks";
import { formatBytes, pluralize } from "../../utils/format";
import { relativeTime } from "../../utils/formatDate";
import { cn } from "../../utils/cn";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [value, setValue] = useState(query);
  const navigate = useNavigate();

  const { results, searching } = useSearch(query);
  const { teams, members } = useWorkspace();
  const { presenceOf } = usePresence();
  const { currentUser } = useAuth();

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setSearchParams({ q: value.trim() });
  };

  const sectionCount = results
    ? Object.values(results.results).reduce((sum, list) => sum + list.length, 0)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        subtitle="Find tasks, people, files, and conversations across your workspace."
      />

      <form onSubmit={submit} className="relative max-w-xl">
        <FiSearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-mute" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Try 'onboarding', 'roadmap', 'Maya'…"
          className="h-11 pl-10 text-base"
          autoFocus
        />
      </form>

      {!query && (
        <EmptyState
          icon={<FiSearch size={22} />}
          title="Search your workspace"
          description="Type above to search across tasks, people, teams, files, messages, and meetings."
        />
      )}

      {query && searching && (
        <p className="flex items-center gap-2 text-sm text-ink-mute">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Searching…
        </p>
      )}

      {query && !searching && results && sectionCount === 0 && (
        <EmptyState
          icon={<FiSearch size={22} />}
          title={`No results for "${query}"`}
          description="Check the spelling, or try a broader term like a team name or tag."
        />
      )}

      {query && !searching && results && sectionCount > 0 && (
        <div className="space-y-5">
          <p className="text-xs text-ink-mute">
            {sectionCount} {pluralize(sectionCount, "result")} for “{results.query}”
          </p>

          <SearchSection
            title="Tasks"
            icon={<FiCheckCircle size={14} />}
            results={results.results.tasks}
            render={(t) => (
              <ResultRow
                key={t.id}
                icon={<span className={cn("h-2 w-2 rounded-full", TASK_STATUS_META[t.status].dot)} />}
                title={t.title}
                meta={`${TASK_STATUS_META[t.status].label} · ${PRIORITY_META[t.priority].label}${t.teamId ? ` · #${teams.find((x) => x.id === t.teamId)?.name || ""}` : ""}`}
                onClick={() => navigate("/app/tasks")}
              />
            )}
          />

          <SearchSection
            title="People"
            icon={<FiUsers size={14} />}
            results={results.results.users}
            render={(u) => (
              <ResultRow
                key={u.id}
                icon={<Avatar name={u.name} size="xs" presence={presenceOf(u.id)} />}
                title={u.name}
                meta={`${u.title} · ${u.email}`}
                onClick={() => navigate(u.id === currentUser?.id ? "/app/profile" : `/app/chat?dm=${u.id}`)}
              />
            )}
          />

          <SearchSection
            title="Teams"
            icon={<FiUsers size={14} />}
            results={results.results.teams}
            render={(t) => (
              <ResultRow
                key={t.id}
                icon={<span className="text-sm">{t.emoji}</span>}
                title={t.name}
                meta={`${t.memberIds.length} members · ${t.description || ""}`}
                onClick={() => navigate(`/app/teams/${t.id}`)}
              />
            )}
          />

          <SearchSection
            title="Files"
            icon={<FiFile size={14} />}
            results={results.results.files}
            render={(f) => (
              <ResultRow
                key={f.id}
                icon={<FiFile size={14} className="text-brand-300" />}
                title={f.name}
                meta={`${formatBytes(f.size)} · ${f.kind} · ${relativeTime(f.createdAt)}`}
                onClick={() => navigate("/app/files")}
              />
            )}
          />

          <SearchSection
            title="Messages"
            icon={<FiMessageSquare size={14} />}
            results={results.results.messages}
            render={(m) => {
              const author = members.find((u) => u.id === m.authorId);
              return (
                <ResultRow
                  key={m.id}
                  icon={<Avatar name={author?.name} size="xs" />}
                  title={m.text}
                  meta={`${author?.name || "Unknown"} · ${relativeTime(m.createdAt)}`}
                  onClick={() => navigate("/app/chat")}
                />
              );
            }}
          />

          <SearchSection
            title="Meetings"
            icon={<FiVideo size={14} />}
            results={results.results.meetings}
            render={(m) => (
              <ResultRow
                key={m.id}
                icon={<FiVideo size={14} className="text-violet-300" />}
                title={m.title}
                meta={`${new Date(m.startTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · ${m.durationMin}min`}
                onClick={() => navigate("/app/meetings")}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}

function SearchSection({ title, icon, results, render }) {
  if (!results || results.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ink-mute uppercase">
        {icon} {title}
        <Badge variant="default" className="ml-1">{results.length}</Badge>
      </h2>
      <Card padded={false} className="divide-y divide-border-subtle">
        {results.map(render)}
      </Card>
    </section>
  );
}

function ResultRow({ icon, title, meta, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/40"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{title}</span>
        <span className="block truncate text-xs text-ink-mute">{meta}</span>
      </span>
      <FiArrowRight size={14} className="shrink-0 text-ink-mute opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}
