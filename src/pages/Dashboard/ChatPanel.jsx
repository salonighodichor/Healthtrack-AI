import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../../api";

/**
 * Phase-1.5 shared Patient <-> Doctor chat panel.
 *
 * Used identically by Patient.jsx (side = "patient") and
 * Doctor.jsx (side = "doctor"). The only caller difference is the
 * novelty of media; everything else (thread fetch, 5s polling,
 * unread counts, read receipts, send) is shared so the two dashboards
 * can never drift out of sync.
 *
 * REST + 5-second polling. No WebSocket (per requirements).
 */
export default function ChatPanel({ userId, side }) {
  const [conversations, setConversations] = useState([]);
  const [activePeer, setActivePeer] = useState(null); // { peer_id, peer_name, peer_role }
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const peers = conversations.filter((c) => c.peer_id !== activePeer?.peer_id ? true : false);

  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations/${userId}`);
      const data = await res.json();
      if (res.ok) setConversations(data.conversations || []);
      else setError(data.message || "Could not load conversations");
    } catch (err) {
      setError(err.message || "Could not load conversations");
    }
  };

  const loadThread = async () => {
    if (!activePeer) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/chat/thread/${userId}/${activePeer.peer_id}`
      );
      const data = await res.json();
      if (res.ok) setThread(data.thread || []);
      else setError(data.message || "Could not load thread");
    } catch (err) {
      setError(err.message || "Could not load thread");
    }
  };

  // 5s polling for live updates (no WebSocket).
  useEffect(() => {
    loadConversations();
    loadThread();
    const timer = setInterval(() => {
      loadConversations();
      loadThread();
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activePeer?.peer_id]);

  // Auto-scroll to newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const openConversation = async (peer) => {
    setActivePeer({
      peer_id: peer.peer_id,
      peer_name: peer.peer_name,
      peer_role: peer.peer_role,
    });
    setDraft("");
    // Mark this whole thread read.
    try {
      const res = await fetch(
        `${API_BASE}/api/chat/thread/${userId}/${peer.peer_id}`,
        { method: "GET" }
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.thread)) {
        setThread(data.thread);
        // Mark every received-unread message as read (fire-and-forget).
        data.thread
          .filter((m) => m.receiver_id === userId && !m.read_at)
          .forEach((m) => {
            fetch(`${API_BASE}/api/chat/read/${m.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reader_id: userId }),
            }).catch(() => {});
          });
        loadConversations(); // refresh unread badges after marking read
      }
    } catch {
      // fall through; polling will retry
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activePeer || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: activePeer.peer_id,
          message: text,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDraft("");
        await loadThread(); // show it immediately, don't wait for poll
      } else {
        setError(data.message || "Could not send message");
      }
    } catch (err) {
      setError(err.message || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="phase1-chat-container">
      <div className="phase1-chat-conversations">
        <div className="phase1-chat-section-title">
          {side === "doctor" ? "Patient Inbox" : "My Doctors"}
        </div>
        {error && <div className="phase1-chat-error">❌ {error}</div>}
        {conversations.length === 0 && (
          <div className="phase1-chat-empty">
            {side === "patient"
              ? "No connected doctors found."
              : "No conversations yet. Patients you're linked to will appear here."}
          </div>
        )}
        <div className="phase1-chat-peer-list">
          {conversations.map((c) => (
            <button
              key={c.peer_id}
              className={`phase1-chat-peer ${
                activePeer?.peer_id === c.peer_id ? "active" : ""
              }`}
              onClick={() => openConversation(c)}
            >
              <span className="phase1-chat-peer-avatar">
                {c.peer_role === "doctor" ? "👨‍⚕️" : "🧑"}
              </span>
              <span className="phase1-chat-peer-body">
                <span className="phase1-chat-peer-name">
                  {c.peer_name} <small>({c.peer_role})</small>
                </span>
                {c.last_message && (
                  <span className="phase1-chat-peer-preview">
                    {c.last_message.slice(0, 40)}
                    {c.last_message.length > 40 ? "…" : ""}
                  </span>
                )}
              </span>
              {c.unread_count > 0 && (
                <span className="phase1-chat-unread-badge">{c.unread_count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="phase1-chat-thread">
        {!activePeer ? (
          <div className="phase1-chat-empty-thread">
            Select a conversation on the left to start messaging.
          </div>
        ) : (
          <>
            <div className="phase1-chat-thread-header">
              {activePeer.peer_name}
              <small> · {activePeer.peer_role}</small>
            </div>
            <div className="phase1-chat-messages">
              {thread.length === 0 && (
                <div className="phase1-chat-empty">
                  Say hello to start the conversation.
                </div>
              )}
              {thread.map((m) => (
                <div
                  key={m.id}
                  className={`phase1-chat-bubble ${
                    m.sender_id === userId ? "mine" : "theirs"
                  }`}
                >
                  <span className="phase1-chat-bubble-text">{m.message}</span>
                  <span className="phase1-chat-bubble-time">
                    {m.read_at
                      ? "✓✓ read"
                      : m.sender_id === userId
                      ? "✓ sent"
                      : ""}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="phase1-chat-composer">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                disabled={sending}
              />
              <button
                className="phase1-chat-send"
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
