/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as chatService from "../services/chatService";
import { useAuth } from "../hooks/useAuth";

export const ChatContext = createContext(null);

const REPLY_POOL = [
  "Good point — I'll take a look and circle back.",
  "That lines up with what we discussed earlier 👍",
  "Agreed. Let's ship it.",
  "Can you add this to the board so we don't lose it?",
  "Nice, thanks for the heads up!",
  "I'll review this after standup.",
  "Sounds good to me.",
  "Let me sync with the team and confirm.",
];

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const repliesRef = useRef(new Set());

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    chatService.listRooms(currentUser.id).then((list) => {
      if (!active) return;
      setRooms(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [currentUser]);

  const selectRoom = useCallback(async (roomId) => {
    setActiveRoomId(roomId);
    setMessages([]);
    const list = await chatService.getMessages(roomId);
    setMessages(list);
  }, []);

  const scheduleReply = useCallback(
    (room, authorId) => {
      if (room.type !== "channel") return;
      const others = room.memberIds.filter((id) => id !== authorId);
      if (others.length === 0) return;
      const replier = others[Math.floor(Math.random() * others.length)];
      const key = `${room.id}:${replier}`;
      if (repliesRef.current.has(key)) return;
      repliesRef.current.add(key);

      window.setTimeout(() => {
        setTypingUsers((prev) => (prev.includes(replier) ? prev : [...prev, replier]));
      }, 900);

      window.setTimeout(async () => {
        const text = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
        const message = await chatService.sendMessage(room.id, replier, text);
        setTypingUsers((prev) => prev.filter((id) => id !== replier));
        setMessages((prev) => [...prev, message]);
        setRooms((prev) =>
          prev
            .map((r) =>
              r.id === room.id
                ? { ...r, lastMessage: { text, createdAt: message.createdAt } }
                : r,
            )
            .sort((a, b) => new Date(b.lastMessage?.createdAt || b.createdAt) - new Date(a.lastMessage?.createdAt || a.createdAt)),
        );
        window.setTimeout(() => repliesRef.current.delete(key), 30000);
      }, 2400 + Math.random() * 1800);
    },
    [],
  );

  const sendMessage = useCallback(
    async (text) => {
      if (!currentUser || !activeRoomId) return null;
      const message = await chatService.sendMessage(activeRoomId, currentUser.id, text);
      if (!message) return null;
      setMessages((prev) => [...prev, message]);
      const room = rooms.find((r) => r.id === activeRoomId);
      if (room) scheduleReply(room, currentUser.id);
      setRooms((prev) =>
        prev
          .map((r) =>
            r.id === activeRoomId
              ? { ...r, lastMessage: { text, createdAt: message.createdAt } }
              : r,
          )
          .sort((a, b) => new Date(b.lastMessage?.createdAt || b.createdAt) - new Date(a.lastMessage?.createdAt || a.createdAt)),
      );
      return message;
    },
    [activeRoomId, currentUser, rooms, scheduleReply],
  );

  const startDm = useCallback(
    async (otherId) => {
      if (!currentUser) return null;
      const room = await chatService.startDm(currentUser.id, otherId);
      const refreshed = await chatService.listRooms(currentUser.id);
      setRooms(refreshed);
      return room;
    },
    [currentUser],
  );

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || null,
    [rooms, activeRoomId],
  );

  const value = useMemo(
    () => ({
      rooms,
      activeRoom,
      messages,
      typingUsers,
      loading,
      selectRoom,
      sendMessage,
      startDm,
      setActiveRoomId,
    }),
    [rooms, activeRoom, messages, typingUsers, loading, selectRoom, sendMessage, startDm],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
