import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMonitor,
  FiMessageSquare,
  FiPhone,
  FiSend,
  FiUsers,
} from "react-icons/fi";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { cn } from "../../utils/cn";

function useElapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { mm, ss };
}

export default function MeetingRoom() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { meetings, userById } = useWorkspace();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { mm, ss } = useElapsed();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const chatScrollRef = useRef(null);

  const meeting = meetings.find((m) => m.id === meetingId);

  const participants = useMemo(() => {
    if (!meeting) return [currentUser];
    const ids = new Set([meeting.hostId, currentUser.id, ...meeting.attendeeIds]);
    return [...ids].map((id) => userById(id)).filter(Boolean);
  }, [meeting, currentUser, userById]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight });
  }, [chatMessages]);

  const sendChat = () => {
    const text = chatDraft.trim();
    if (!text) return;
    setChatMessages((prev) => [
      ...prev,
      { id: `c-${prev.length}`, authorId: currentUser.id, text, at: new Date() },
    ]);
    setChatDraft("");
  };

  if (!meeting) {
    return (
      <div className="flex h-[calc(100vh-8.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-sm text-ink-mute">Meeting not found.</p>
        <Button variant="secondary" onClick={() => navigate("/app/meetings")}>Back to meetings</Button>
      </div>
    );
  }

  const leave = () => {
    toast({ type: "info", title: "You left the meeting" });
    navigate("/app/meetings");
  };

  const tiles = screenSharing
    ? [
        { user: currentUser, sharing: true, isMe: true },
        ...participants.filter((p) => p.id !== currentUser.id),
      ]
    : participants;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-ink">{meeting.title}</h1>
            <p className="text-xs text-ink-mute">
              {mm}:{ss} · {participants.length} in the room
            </p>
          </div>
        </div>

        <Badge variant="success">Secure call</Badge>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className={cn("grid min-w-0 flex-1 auto-rows-fr gap-3", chatOpen ? "lg:grid-cols-2" : "lg:grid-cols-3")}>
          {tiles.map((p, i) => (
            <VideoTile
              key={p.id + (p.sharing ? "-share" : "")}
              user={p}
              isMe={p.id === currentUser.id}
              micOff={!micOn && p.id === currentUser.id}
              camOff={!camOn && p.id === currentUser.id}
              sharing={Boolean(p.sharing)}
              gradient={i % 2 === 0}
            />
          ))}
        </div>

        {chatOpen && (
          <aside className="hidden w-80 shrink-0 flex-col rounded-xl border border-border bg-surface lg:flex">
            <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
              <FiMessageSquare size={15} className="text-brand-300" />
              <h2 className="text-sm font-semibold text-ink">In-call chat</h2>
              <span className="ml-auto flex items-center gap-1 text-xs text-ink-mute">
                <FiUsers size={12} /> {participants.length}
              </span>
            </div>

            <div ref={chatScrollRef} className="scrollbar-slim flex-1 space-y-3 overflow-y-auto p-4">
              {chatMessages.length === 0 && (
                <p className="py-8 text-center text-xs text-ink-mute">
                  Share links or notes here. Messages stay in the meeting.
                </p>
              )}
              {chatMessages.map((m) => {
                const author = userById(m.authorId);
                const mine = m.authorId === currentUser.id;
                return (
                  <div key={m.id} className={cn("max-w-[90%]", mine ? "ml-auto" : "")}>
                    <p className="text-[11px] text-ink-mute">
                      {mine ? "You" : author?.name} · {m.at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className={cn("mt-0.5 rounded-lg px-3 py-1.5 text-sm", mine ? "bg-brand-600 text-white" : "bg-surface-2/70 text-ink-soft")}>
                      {m.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border-subtle p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                  rows={1}
                  placeholder="Send to everyone…"
                  className="max-h-24 min-h-9.5 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-mute focus:border-brand-500/50"
                />
                <Button onClick={sendChat} className="h-9.5 shrink-0 px-3" aria-label="Send chat">
                  <FiSend size={15} />
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
        <button
          onClick={() => setMicOn((v) => !v)}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition",
            micOn ? "bg-surface-2 text-ink hover:bg-elevated" : "bg-rose-500/90 text-white",
          )}
          aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micOn ? <FiMic size={18} /> : <FiMicOff size={18} />}
        </button>

        <button
          onClick={() => setCamOn((v) => !v)}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition",
            camOn ? "bg-surface-2 text-ink hover:bg-elevated" : "bg-rose-500/90 text-white",
          )}
          aria-label={camOn ? "Turn camera off" : "Turn camera on"}
        >
          {camOn ? <FiVideo size={18} /> : <FiVideoOff size={18} />}
        </button>

        <button
          onClick={() => setScreenSharing((v) => !v)}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition",
            screenSharing ? "bg-brand-600 text-white" : "bg-surface-2 text-ink hover:bg-elevated",
          )}
          aria-label={screenSharing ? "Stop sharing screen" : "Share screen"}
        >
          <FiMonitor size={18} />
        </button>

        <button
          onClick={() => setChatOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink transition hover:bg-elevated lg:hidden"
          aria-label="Toggle chat"
        >
          <FiMessageSquare size={18} />
        </button>

        <span className="mx-1 h-6 w-px bg-border-subtle" />

        <button
          onClick={leave}
          className="flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          <FiPhone size={16} className="rotate-[135deg]" /> Leave
        </button>
      </div>

      {chatOpen && (
        <MobileChat
          open
          onClose={() => setChatOpen(false)}
          chatMessages={chatMessages}
          chatDraft={chatDraft}
          setChatDraft={setChatDraft}
          sendChat={sendChat}
          userById={userById}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

function VideoTile({ user, isMe, micOff, camOff, sharing, gradient }) {
  return (
    <div
      className={cn(
        "relative flex min-h-36 items-center justify-center overflow-hidden rounded-xl border border-border",
        sharing ? "border-brand-500/60" : gradient ? "bg-gradient-to-br from-[#1a1f36] to-[#141827]" : "bg-gradient-to-br from-[#161b2e] to-[#101420]",
      )}
    >
      {sharing ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface">
          <div className="h-24 w-36 rounded-md border border-border bg-surface-2/60">
            <div className="mx-auto mt-4 h-2 w-16 rounded-full bg-brand-500/60" />
            <div className="mx-auto mt-2 h-2 w-24 rounded-full bg-surface-2" />
            <div className="mx-auto mt-3 grid w-28 grid-cols-3 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="h-2.5 rounded-sm bg-brand-500/30" />
              ))}
            </div>
          </div>
          <p className="text-xs font-medium text-brand-300">{user?.name.split(" ")[0]} is presenting</p>
        </div>
      ) : camOff ? (
        <span className="flex flex-col items-center gap-2">
          <Avatar name={user?.name} size="xl" />
          <span className="text-sm font-medium text-ink-soft">{user?.name}</span>
          {isMe && <span className="text-[11px] text-ink-mute">Camera off</span>}
        </span>
      ) : (
        <>
          <Avatar name={user?.name} size="xl" className="opacity-80 blur-[1px]" />
          <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
            {user?.name}
            {isMe && " (you)"}
          </span>
        </>
      )}

      {micOff && (
        <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/90 text-white">
          <FiMicOff size={12} />
        </span>
      )}

      {sharing && (
        <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
          <FiMonitor size={12} />
        </span>
      )}
    </div>
  );
}

function MobileChat({ open, onClose, chatMessages, chatDraft, setChatDraft, sendChat, userById, currentUser }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [chatMessages]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 lg:hidden">
      <div className="flex h-[70vh] w-full max-w-md flex-col rounded-xl border border-border bg-elevated">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">In-call chat</h2>
          <Button variant="ghost" size="xs" onClick={onClose}>Close</Button>
        </div>
        <div ref={ref} className="scrollbar-slim flex-1 space-y-3 overflow-y-auto p-4">
          {chatMessages.length === 0 && (
            <p className="py-8 text-center text-xs text-ink-mute">No messages yet.</p>
          )}
          {chatMessages.map((m) => {
            const mine = m.authorId === currentUser.id;
            return (
              <div key={m.id} className={cn("max-w-[90%]", mine ? "ml-auto" : "")}>
                <p className="text-[11px] text-ink-mute">{mine ? "You" : userById(m.authorId)?.name}</p>
                <p className={cn("mt-0.5 rounded-lg px-3 py-1.5 text-sm", mine ? "bg-brand-600 text-white" : "bg-surface-2/70 text-ink-soft")}>
                  {m.text}
                </p>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border-subtle p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChat();
                }
              }}
              rows={1}
              placeholder="Send to everyone…"
              className="max-h-24 min-h-9.5 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-mute focus:border-brand-500/50"
            />
            <Button onClick={sendChat} className="h-9.5 shrink-0 px-3">
              <FiSend size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
