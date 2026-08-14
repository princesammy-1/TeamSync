import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSend, FiVideo, FiPlus, FiHash, FiSearch, FiUsers } from "react-icons/fi";
import Avatar from "../../components/ui/Avatar";
import AvatarStack from "../../components/ui/AvatarStack";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import PageSkeleton from "../../components/shared/PageSkeleton";
import { useChat } from "../../hooks/useChat";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { usePresence } from "../../hooks/usePresence";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import { formatDate, isToday, relativeTime, formatTime } from "../../utils/formatDate";
import { meetingRoomPath } from "../../constants/routes";

const PRESENCE_LABEL = { online: "Online", busy: "Busy", away: "Away", offline: "Offline" };

export default function Chat() {
  const { currentUser } = useAuth();
  const {
    rooms,
    activeRoom,
    messages,
    typingUsers,
    loading,
    selectRoom,
    sendMessage,
    startDm,
  } = useChat();
  const { members, userById } = useWorkspace();
  const { presenceOf } = usePresence();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [peopleOpen, setPeopleOpen] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    const dmTarget = searchParams.get("dm");
    if (dmTarget) {
      startDm(dmTarget).then((room) => {
        if (room) selectRoom(room.id);
      });
    } else if (!activeRoom && rooms.length > 0) {
      const general = rooms.find((r) => r.id === "room-general") || rooms[0];
      selectRoom(general.id);
    }
  }, [loading, searchParams, startDm, selectRoom, activeRoom, rooms]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingUsers]);

  const filteredRooms = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rooms;
    return rooms.filter((r) => {
      if (r.type === "dm") {
        const partner = userById(r.dmPartnerId);
        return `${partner?.name || ""}`.toLowerCase().includes(q);
      }
      return `${r.name} ${r.description || ""}`.toLowerCase().includes(q);
    });
  }, [rooms, query, userById]);

  const onlineMembers = members
    .filter((m) => m.id !== currentUser.id && presenceOf(m.id) !== "offline")
    .slice(0, 8);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendMessage(text);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="grid h-[calc(100vh-8.5rem)] gap-4 lg:grid-cols-[240px_1fr_260px]">
      <Card padded={false} className="hidden flex-col overflow-hidden lg:flex">
        <div className="p-3">
          <div className="relative">
            <FiSearch size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a room…"
              className="h-8.5 pl-9"
            />
          </div>
        </div>

        <div className="scrollbar-slim flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
            <p className="text-[11px] font-semibold tracking-wider text-ink-mute uppercase">Channels</p>
          </div>

          {filteredRooms.filter((r) => r.type === "channel").map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              active={activeRoom?.id === room.id}
              onClick={() => selectRoom(room.id)}
            />
          ))}

          <div className="flex items-center justify-between px-2 pt-4 pb-1.5">
            <p className="text-[11px] font-semibold tracking-wider text-ink-mute uppercase">Direct messages</p>
            <button
              onClick={() => setPeopleOpen((v) => !v)}
              className="rounded-md p-1 text-ink-mute transition hover:bg-surface-2 hover:text-ink"
              aria-label="Start a new conversation"
            >
              <FiPlus size={14} />
            </button>
          </div>

          {filteredRooms.filter((r) => r.type === "dm").map((room) => {
            const partner = userById(room.dmPartnerId);
            return (
              <RoomItem
                key={room.id}
                room={room}
                partner={partner}
                presence={presenceOf(room.dmPartnerId)}
                active={activeRoom?.id === room.id}
                onClick={() => selectRoom(room.id)}
              />
            );
          })}
        </div>
      </Card>

      <Card padded={false} className="flex min-h-0 flex-col overflow-hidden">
        {activeRoom ? (
          <>
            <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
              {activeRoom.type === "channel" ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                  <FiHash size={16} />
                </span>
              ) : (
                <Avatar name={userById(activeRoom.dmPartnerId)?.name} size="sm" presence={presenceOf(activeRoom.dmPartnerId)} />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {activeRoom.type === "dm" ? userById(activeRoom.dmPartnerId)?.name : `#${activeRoom.name}`}
                </p>
                <p className="truncate text-xs text-ink-mute">
                  {activeRoom.type === "dm"
                    ? PRESENCE_LABEL[presenceOf(activeRoom.dmPartnerId)]
                    : activeRoom.description}
                </p>
              </div>

              {activeRoom.type === "channel" && (
                <AvatarStack users={activeRoom.memberIds.map((id) => userById(id)).filter(Boolean)} max={4} size="xs" />
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const partner = activeRoom.type === "dm" ? userById(activeRoom.dmPartnerId) : null;
                  toast({ type: "info", title: "Meeting started", message: partner ? `Calling ${partner.name}…` : "Opening a call link…" });
                  navigate(meetingRoomPath("mtg-2"));
                }}
              >
                <FiVideo size={14} /> Call
              </Button>
            </div>

            <div ref={scrollRef} className="scrollbar-slim flex-1 space-y-5 overflow-y-auto px-4 py-5">
              {messages.map((message, i) => {
                const prev = messages[i - 1];
                const mine = message.authorId === currentUser.id;
                const author = userById(message.authorId);
                const showMeta = !prev || prev.authorId !== message.authorId;
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    author={author}
                    mine={mine}
                    showMeta={showMeta}
                    presence={presenceOf(message.authorId)}
                  />
                );
              })}

              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-ink-mute">
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1 w-1 animate-bounce rounded-full bg-ink-mute"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </span>
                  {typingUsers.map((id) => userById(id)?.name.split(" ")[0]).join(", ")} is typing…
                </div>
              )}
            </div>

            <div className="border-t border-border-subtle p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder={
                    activeRoom.type === "channel" ? `Message #${activeRoom.name}` : "Message…"
                  }
                  className="scrollbar-slim max-h-32 min-h-9.5 flex-1 resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-mute focus:border-brand-500/50"
                />
                <Button onClick={handleSend} className="h-9.5 shrink-0 px-3.5" aria-label="Send message">
                  <FiSend size={16} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<FiUsers size={22} />}
            title="Select a conversation"
            description="Pick a channel or start a direct message to begin chatting."
          />
        )}
      </Card>

      <Card padded={false} className="hidden flex-col overflow-hidden xl:flex">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">People</h2>
          <Badge variant="success">Online</Badge>
        </div>

        <div className="scrollbar-slim flex-1 overflow-y-auto p-2">
          {onlineMembers.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-mute">No one is online right now.</p>
          )}
          {onlineMembers.map((m) => (
            <button
              key={m.id}
              onClick={async () => {
                const room = await startDm(m.id);
                if (room) selectRoom(room.id);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-surface-2"
            >
              <Avatar name={m.name} size="sm" presence={presenceOf(m.id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                <p className="truncate text-xs text-ink-mute">{m.title}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {peopleOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 lg:hidden" onClick={() => setPeopleOpen(false)}>
          <Card className="w-full max-w-sm">
            <h2 className="mb-3 text-sm font-semibold text-ink">Start a conversation</h2>
            <div className="space-y-1">
              {members.filter((m) => m.id !== currentUser.id).slice(0, 10).map((m) => (
                <button
                  key={m.id}
                  onClick={async () => {
                    const room = await startDm(m.id);
                    if (room) selectRoom(room.id);
                    setPeopleOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-surface-2"
                >
                  <Avatar name={m.name} size="sm" presence={presenceOf(m.id)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                    <p className="text-xs text-ink-mute">{PRESENCE_LABEL[presenceOf(m.id)]}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function RoomItem({ room, partner, presence, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
        active ? "bg-brand-500/12 text-brand-300" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
      )}
    >
      {room.type === "channel" ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-2 text-[12px] text-ink-mute">
          <FiHash size={12} />
        </span>
      ) : (
        <Avatar name={partner?.name} size="sm" presence={presence} />
      )}

      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {room.type === "channel" ? `#${room.name}` : partner?.name}
      </span>

      {room.lastMessage && (
        <span className="shrink-0 text-[10px] text-ink-mute">
          {relativeTime(room.lastMessage.createdAt)}
        </span>
      )}
    </button>
  );
}

function MessageBubble({ message, author, mine, showMeta, presence }) {
  const timeLabel = isToday(message.createdAt)
    ? formatTime(message.createdAt)
    : formatDate(message.createdAt, { month: "short", day: "numeric" });

  return (
    <div className={cn("flex gap-3", mine && "flex-row-reverse")}>
      {showMeta ? (
        <Avatar name={author?.name} size="sm" presence={mine ? undefined : presence} className="mt-0.5" />
      ) : (
        <span className="w-8 shrink-0" />
      )}

      <div className={cn("max-w-[75%] space-y-0.5", mine && "flex flex-col items-end")}>
        {showMeta && (
          <p className="text-xs">
            <span className="font-semibold text-ink">{mine ? "You" : author?.name}</span>
            <span className="ml-2 text-[10px] text-ink-mute">{timeLabel}</span>
          </p>
        )}

        <div
          className={cn(
            "rounded-xl px-3.5 py-2 text-sm leading-relaxed",
            mine
              ? "rounded-br-sm bg-brand-600 text-white"
              : "rounded-bl-sm border border-border-subtle bg-surface-2/60 text-ink-soft",
          )}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}
