"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Send,
  RefreshCw,
  Search,
  X,
  ArrowLeft,
  Bot,
  HeadphonesIcon,
  Lock,
} from "lucide-react";

type SessionStatus = "active" | "resolved" | "pending";

interface ChatSession {
  id: number;
  guest_name: string;
  guest_email?: string;
  status: SessionStatus;
  unread: number;
  last_message?: string;
  last_active?: string;
}

interface ChatMessage {
  id: number;
  sender_type: "user" | "admin" | "bot";
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SessionDetail {
  session: {
    id: number;
    guest_name: string;
    guest_email?: string;
    status: SessionStatus;
    created_at: string;
  };
  messages: ChatMessage[];
}

const ADMIN_API = "/api/admin/chat";
const POLL_MS = 4000;
const SESSION_MS = 6000;

function adminHeaders() {
  return { "Content-Type": "application/json", Accept: "application/json" };
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const map = {
    active: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
    pending: { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
    resolved: { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  };
  const s = map[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Avatar({ name, size = 36 }: { name?: string; size?: number }) {
  const safeName = name ?? "";
  const initials = safeName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const palette = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
  ];
  const bg = safeName
    ? palette[safeName.charCodeAt(0) % palette.length]
    : "#94a3b8";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#fff",
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
      }}
    >
      {initials || <User size={Math.round(size * 0.45)} />}
    </div>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isAdmin = msg.sender_type === "admin";
  const isBot = msg.sender_type === "bot";
  const time = new Date(msg.created_at).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: isAdmin ? "flex-end" : "flex-start",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#94a3b8",
          paddingInline: 4,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {isBot && <Bot size={11} />}
        {msg.sender_name} · {time}
      </span>
      <div
        style={{
          maxWidth: "75%",
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          borderRadius: 16,
          ...(isAdmin
            ? {
                background: "#c0392b",
                color: "#fff",
                borderBottomRightRadius: 4,
              }
            : isBot
              ? {
                  background: "#eff6ff",
                  color: "#1e40af",
                  borderBottomLeftRadius: 4,
                  border: "1px solid #bfdbfe",
                }
              : {
                  background: "#f1f5f9",
                  color: "#1e293b",
                  borderBottomLeftRadius: 4,
                  border: "1px solid #e2e8f0",
                }),
        }}
      >
        {msg.message}
      </div>
    </div>
  );
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<SessionDetail | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SessionStatus | "all">(
    "all",
  );
  const [showChat, setShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const sessionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgIdRef = useRef<number>(0);
  const isMsgPollingRef = useRef(false);
  const activeSessionIdRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_API}/sessions`, {
        headers: adminHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch {
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const pollActiveSession = useCallback(async () => {
    const sid = activeSessionIdRef.current;
    if (!sid || isMsgPollingRef.current) return;
    isMsgPollingRef.current = true;
    try {
      const res = await fetch(
        `${ADMIN_API}/sessions/${sid}?after=${lastMsgIdRef.current}`,
        { headers: adminHeaders() },
      );
      if (!res.ok) return;
      const data = await res.json();
      const newMsgs: ChatMessage[] = data.messages ?? [];

      // ✅ CHANGE 1: If the session status changed to resolved from another tab/admin,
      // reflect it in the UI without stopping the poll (admin might reopen it).
      if (data.session?.status) {
        setActiveSession((prev) => {
          if (!prev || prev.session.id !== sid) return prev;
          if (prev.session.status === data.session.status) return prev;
          return {
            ...prev,
            session: { ...prev.session, status: data.session.status },
          };
        });
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sid ? { ...s, status: data.session.status } : s,
          ),
        );
      }

      if (!newMsgs.length) return;
      lastMsgIdRef.current = Math.max(...newMsgs.map((m) => m.id));
      const incoming = newMsgs.filter((m) => m.sender_type !== "admin");
      if (incoming.length) {
        setActiveSession((prev) => {
          if (!prev || prev.session.id !== sid) return prev;
          const existing = new Set(prev.messages.map((m) => m.id));
          const fresh = incoming.filter((m) => !existing.has(m.id));
          return fresh.length
            ? { ...prev, messages: [...prev.messages, ...fresh] }
            : prev;
        });
        setSessions((prev) =>
          prev.map((s) => (s.id === sid ? { ...s, unread: 0 } : s)),
        );
      }
    } catch {
    } finally {
      isMsgPollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadSessions();
    sessionPollRef.current = setInterval(loadSessions, SESSION_MS);
    return () => {
      if (sessionPollRef.current) clearInterval(sessionPollRef.current);
      if (msgPollRef.current) clearInterval(msgPollRef.current);
    };
  }, [loadSessions]);

  useEffect(() => {
    if (msgPollRef.current) clearInterval(msgPollRef.current);
    lastMsgIdRef.current = 0;
    isMsgPollingRef.current = false;
    activeSessionIdRef.current = activeSession?.session.id ?? null;
    if (activeSession)
      msgPollRef.current = setInterval(pollActiveSession, POLL_MS);
    return () => {
      if (msgPollRef.current) clearInterval(msgPollRef.current);
    };
  }, [activeSession?.session.id, pollActiveSession]);

  const openSession = async (id: number) => {
    setLoadingMessages(true);
    setShowChat(true);
    lastMsgIdRef.current = 0;
    try {
      const res = await fetch(`${ADMIN_API}/sessions/${id}`, {
        headers: adminHeaders(),
      });
      const data = await res.json();
      if (data.messages?.length)
        lastMsgIdRef.current = Math.max(
          ...data.messages.map((m: ChatMessage) => m.id),
        );
      setActiveSession(data);
      setReplyText("");
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, unread: 0 } : s)),
      );
      // ✅ CHANGE 2: Only focus reply box if session is not resolved
      if (data.session?.status !== "resolved") {
        setTimeout(() => replyRef.current?.focus(), 150);
      }
    } catch {
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeSession || sending) return;
    // ✅ CHANGE 3: Block sending if session is resolved
    if (activeSession.session.status === "resolved") return;

    const text = replyText.trim();
    setSending(true);
    setReplyText("");
    setActiveSession((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: Date.now(),
                sender_type: "admin",
                sender_name: "You (Admin)",
                message: text,
                is_read: false,
                created_at: new Date().toISOString(),
              },
            ],
          }
        : prev,
    );
    try {
      await fetch(`${ADMIN_API}/sessions/${activeSession.session.id}`, {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ message: text }),
      });
    } catch {
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: SessionStatus) => {
    if (!activeSession) return;
    try {
      await fetch(`${ADMIN_API}/sessions/${activeSession.session.id}`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ status }),
      });
      setActiveSession((prev) =>
        prev ? { ...prev, session: { ...prev.session, status } } : prev,
      );
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.session.id ? { ...s, status } : s,
        ),
      );
      // ✅ CHANGE 4: Clear reply text when resolving so stale text doesn't linger
      if (status === "resolved") setReplyText("");
    } catch {}
  };

  const filtered = sessions.filter(
    (s) =>
      (filterStatus === "all" || s.status === filterStatus) &&
      (!search ||
        (s.guest_name ?? "").toLowerCase().includes(search.toLowerCase())),
  );
  const totalUnread = sessions.reduce((n, s) => n + s.unread, 0);

  // ✅ CHANGE 5: Derive isResolved for clean conditional rendering below
  const isResolved = activeSession?.session.status === "resolved";

  return (
    <>
      <style>{`
        .ach-root {
          display: flex;
          height: 100%;
          overflow: hidden;
          background: #f8fafc;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .ach-sidebar {
          width: 320px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-right: 1px solid #e2e8f0;
        }
        .ach-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #f8fafc;
        }
        @media (max-width: 767px) {
          .ach-root { height: 100%; }
          .ach-sidebar { width: 100%; }
          .ach-sidebar.mobile-hidden { display: none; }
          .ach-chat.mobile-hidden   { display: none; }
        }
        @media (min-width: 768px) {
          .ach-sidebar { display: flex !important; }
          .ach-chat    { display: flex !important; }
        }
        .ach-session-row { width: 100%; text-align: left; padding: 12px 16px;
          border: none; border-bottom: 1px solid #f1f5f9; cursor: pointer;
          background: #fff; border-left: 3px solid transparent; transition: all 0.12s; display: block; }
        .ach-session-row:hover { background: #fafafa; }
        .ach-session-row.active { background: #fff1f0; border-left-color: #c0392b; }
        .ach-filter-btn { flex: 1; padding: 7px 4px; font-size: 11px; font-weight: 600;
          border: none; cursor: pointer; border-bottom: 2px solid transparent;
          background: transparent; color: #94a3b8; text-transform: capitalize;
          transition: all 0.12s; border-radius: 6px 6px 0 0; }
        .ach-filter-btn.active { color: #c0392b; background: #fff1f0; border-bottom-color: #c0392b; }
        .ach-status-btn { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: opacity 0.12s; }
        .ach-status-btn:hover { opacity: 0.8; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className="ach-root">
        {/* ── Sidebar ── */}
        <div className={`ach-sidebar${showChat ? " mobile-hidden" : ""}`}>
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              flexShrink: 0,
              background: "linear-gradient(135deg, #7f1d1d 0%, #c0392b 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <HeadphonesIcon size={17} color="#fff" />
              </div>
              <div>
                <p
                  style={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Live Chat
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 11,
                    margin: 0,
                  }}
                >
                  {sessions.filter((s) => s.status === "active").length} active
                  {totalUnread > 0 && (
                    <span style={{ color: "#fbbf24", marginLeft: 5 }}>
                      · {totalUnread} unread
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={loadSessions}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "none",
                borderRadius: 8,
                padding: 7,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RefreshCw size={14} color="#fff" />
            </button>
          </div>

          {/* Search */}
          <div
            style={{
              padding: "10px 14px",
              flexShrink: 0,
              borderBottom: "1px solid #f1f5f9",
              background: "#fafafa",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                padding: "7px 11px",
              }}
            >
              <Search size={13} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#334155",
                  background: "transparent",
                  flex: 1,
                  minWidth: 0,
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <X size={13} color="#94a3b8" />
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              padding: "6px 14px 0",
              gap: 2,
              borderBottom: "1px solid #e2e8f0",
              background: "#fafafa",
              flexShrink: 0,
            }}
          >
            {(["all", "active", "pending", "resolved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`ach-filter-btn${filterStatus === s ? " active" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingSessions ? (
              <div
                style={{
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 60,
                      background: "#f1f5f9",
                      borderRadius: 10,
                      animation: "shimmer 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                No sessions found
              </div>
            ) : (
              filtered.map((session) => (
                <button
                  key={session.id}
                  onClick={() => openSession(session.id)}
                  className={`ach-session-row${activeSession?.session.id === session.id ? " active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <Avatar name={session.guest_name ?? "Unknown"} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1e293b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {session.guest_name ?? "Unknown"}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          {session.unread > 0 && (
                            <span
                              style={{
                                minWidth: 18,
                                height: 18,
                                background: "#ef4444",
                                borderRadius: 9,
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "0 4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {session.unread > 9 ? "9+" : session.unread}
                            </span>
                          )}
                          <StatusBadge status={session.status} />
                        </div>
                      </div>
                      {session.last_message && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            margin: "0 0 2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {session.last_message}
                        </p>
                      )}
                      {session.last_active && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Clock size={10} />
                          {formatRelative(session.last_active)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className={`ach-chat${!showChat ? " mobile-hidden" : ""}`}>
          {activeSession ? (
            <>
              {/* Chat header */}
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <button
                    onClick={() => setShowChat(false)}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: 8,
                      padding: 7,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                    className="md:hidden"
                  >
                    <ArrowLeft size={16} color="#475569" />
                  </button>
                  <Avatar
                    name={activeSession.session.guest_name ?? "Unknown"}
                    size={38}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#1e293b",
                        margin: "0 0 2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {activeSession.session.guest_name ?? "Unknown"}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {activeSession.session.guest_email && (
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          {activeSession.session.guest_email}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(
                          activeSession.session.created_at,
                        ).toLocaleDateString("en-PH")}
                      </span>
                      <StatusBadge status={activeSession.session.status} />
                    </div>
                  </div>
                </div>

                {/* Status action buttons */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {activeSession.session.status !== "resolved" && (
                    <button
                      onClick={() => updateStatus("resolved")}
                      className="ach-status-btn"
                      style={{
                        border: "1.5px solid #bbf7d0",
                        background: "#f0fdf4",
                        color: "#15803d",
                      }}
                    >
                      <CheckCircle2 size={13} />
                      <span className="btn-label">Resolve</span>
                    </button>
                  )}
                  {activeSession.session.status !== "pending" && (
                    <button
                      onClick={() => updateStatus("pending")}
                      className="ach-status-btn"
                      style={{
                        border: "1.5px solid #fde68a",
                        background: "#fffbeb",
                        color: "#92400e",
                      }}
                    >
                      <Circle size={13} />
                      <span className="btn-label">Pending</span>
                    </button>
                  )}
                  {activeSession.session.status !== "active" && (
                    <button
                      onClick={() => updateStatus("active")}
                      className="ach-status-btn"
                      style={{
                        border: "1.5px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                      }}
                    >
                      <MessageSquare size={13} />
                      <span className="btn-label">Reopen</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  background:
                    "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                }}
              >
                {loadingMessages ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        border: "3px solid #c0392b",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  </div>
                ) : activeSession.messages.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      gap: 8,
                      color: "#94a3b8",
                    }}
                  >
                    <MessageSquare size={36} style={{ opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: 14 }}>No messages yet</p>
                  </div>
                ) : (
                  activeSession.messages.map((msg) => (
                    <Bubble key={msg.id} msg={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ✅ CHANGE 6: Reply box — locked banner when resolved, normal textarea otherwise */}
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #e2e8f0",
                  background: "#fff",
                  flexShrink: 0,
                }}
              >
                {isResolved ? (
                  // Resolved — show a read-only notice instead of the input
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "10px 0",
                      color: "#94a3b8",
                      fontSize: 13,
                    }}
                  >
                    <Lock size={14} />
                    <span>
                      This conversation is closed. Use{" "}
                      <strong style={{ color: "#1d4ed8", fontWeight: 600 }}>
                        Reopen
                      </strong>{" "}
                      to reply again.
                    </span>
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", gap: 10, alignItems: "flex-end" }}
                  >
                    <textarea
                      ref={replyRef}
                      placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                      rows={2}
                      style={{
                        flex: 1,
                        background: "#f8fafc",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontSize: 14,
                        color: "#1e293b",
                        outline: "none",
                        resize: "none",
                        fontFamily: "inherit",
                        lineHeight: 1.5,
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#c0392b")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim() || sending}
                      style={{
                        width: 42,
                        height: 42,
                        border: "none",
                        borderRadius: 12,
                        marginBottom: 2,
                        cursor:
                          replyText.trim() && !sending
                            ? "pointer"
                            : "not-allowed",
                        background:
                          replyText.trim() && !sending ? "#c0392b" : "#e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      {sending ? (
                        <div
                          style={{
                            width: 15,
                            height: 15,
                            border: "2px solid #94a3b8",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                      ) : (
                        <Send
                          size={16}
                          color={replyText.trim() ? "#fff" : "#94a3b8"}
                        />
                      )}
                    </button>
                  </div>
                )}
                {!isResolved && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      margin: "5px 0 0",
                    }}
                  >
                    User receives your reply within ~4 seconds
                  </p>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "#94a3b8",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  background: "#f1f5f9",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare size={26} color="#cbd5e1" />
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Select a conversation
                </p>
                <p style={{ margin: 0, fontSize: 13 }}>
                  Choose from the list on the left
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
