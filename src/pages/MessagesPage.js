// src/pages/MessagesPage.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";
import { useAuth } from "../App"; 

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const MessageInput = ({ activeRoom, user, socketRef, onMessageSent }) => {
  const [newMessage, setNewMessage] = useState("");
  const typingTimeoutRef = useRef(null);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (activeRoom && user?.email !== 'alumninetworkplatform@gmail.com' && socketRef.current) {
      socketRef.current.emit("typing", activeRoom.id);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stopTyping", activeRoom.id);
      }, 2000);
    }
  };

  const sendMessage = async (e) => { 
    e.preventDefault(); 
    if (!newMessage.trim() || !activeRoom) return; 
    
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Guest accounts cannot send messages.");
      setNewMessage(""); 
      return;
    }
    
    try { 
      const res = await axios.post(`/api/messages/${activeRoom.id}`, { message: newMessage }); 
      onMessageSent(res.data.message); 
      setNewMessage(""); 
    } catch (err) { toast.error("Failed to send message"); } 
  };

  return (
    <form onSubmit={sendMessage} style={{ display: "flex", padding: "15px", background: "var(--bg-color)", borderTop: "1px solid var(--border-color)" }}>
      <input type="text" className="input-box" value={newMessage} onChange={handleTyping} placeholder="Type a message..." style={{ flex: 1, borderRadius: "24px", marginBottom: 0 }} />
      <button type="submit" className="btn-primary" style={{ borderRadius: "50%", width: "45px", height: "45px", marginLeft: "10px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fas fa-paper-plane"></i></button>
    </form>
  );
};

const MessagesPage = () => {
  const { user } = useAuth(); 
  const [isTyping, setIsTyping] = useState(false); 
  const socketRef = useRef(null); 
  
  const [messages, setMessages] = useState([]); 
  const [activeRoom, setActiveRoom] = useState(null); 
  const [chatPartner, setChatPartner] = useState(null); 
  const [inbox, setInbox] = useState([]); 
  const [searchParams] = useSearchParams(); 
  const targetUserId = searchParams.get("userId");

  const loadInbox = useCallback(async () => { 
    try { 
      const res = await axios.get("/api/inbox"); 
      setInbox(res.data.rooms || []); 
    } catch (err) { console.error("Failed to load inbox"); } 
  }, []);

  const fetchMessages = useCallback(async (roomId) => { 
    try { 
      const res = await axios.get(`/api/messages/${roomId}`); 
      setMessages(res.data.messages || []); 
    } catch (err) { console.error(err); } 
  }, []);

  const startChat = useCallback(async (otherUserId) => { 
    try { 
      const roomRes = await axios.post(`/api/messages/room/${otherUserId}`); 
      setActiveRoom(roomRes.data.room); 
      setChatPartner(roomRes.data.otherUser); 
      fetchMessages(roomRes.data.room.id); 
    } catch (err) { toast.error("Failed to start chat"); } 
  }, [fetchMessages]);

  useEffect(() => {
    if (activeRoom) {
      socketRef.current = io(API_URL);
      const socket = socketRef.current;

      socket.emit("joinRoom", activeRoom.id);
      socket.emit("markAsRead", { roomId: activeRoom.id, userId: user.id });

      socket.on("receiveMessage", (newMsg) => {
        if (newMsg.sender_id !== user.id) {
          setMessages((prevMessages) => [...prevMessages, newMsg]);
          setIsTyping(false);
          socket.emit("markAsRead", { roomId: activeRoom.id, userId: user.id });
        }
      });

      socket.on("userTyping", () => setIsTyping(true));
      socket.on("userStoppedTyping", () => setIsTyping(false));

      socket.on("messagesRead", ({ readerId }) => {
        if (readerId !== user.id) {
          setMessages(prev => prev.map(msg => 
            msg.sender_id === user.id ? { ...msg, read_status: 'read' } : msg
          ));
        }
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [activeRoom, user.id]);

  useEffect(() => { 
    if (targetUserId) { startChat(targetUserId); } else { loadInbox(); } 
  }, [targetUserId, startChat, loadInbox]);

  const deleteChat = async () => {
    if(window.confirm("Are you sure you want to permanently delete this entire chat history?")) {
      try {
        await axios.delete(`/api/messages/room/${activeRoom.id}`);
        setActiveRoom(null);
        setChatPartner(null);
        loadInbox();
        toast.success("Chat deleted");
      } catch(err) { toast.error("Failed to delete chat"); }
    }
  };

  const handleNewMessageSent = (newMsg) => {
    setMessages(prev => [...prev, newMsg]);
  };

  return (
    <div className="page-container"><Toaster />
      <div className="card" style={{ display: "flex", flexDirection: "column", height: "70vh", padding: 0, overflow: "hidden" }}>
        
        <div style={{ padding: "15px 20px", background: "var(--bg-color)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            {activeRoom && <button onClick={() => { setActiveRoom(null); setChatPartner(null); loadInbox(); }} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}><i className="fas fa-arrow-left"></i> Back</button>}
            <h2 style={{ margin: 0, fontSize: "18px" }}>{chatPartner ? `Chat with ${chatPartner.first_name} ${chatPartner.last_name}` : "Messages Inbox"}</h2>
          </div>
          
          {activeRoom && (
            <button onClick={deleteChat} className="btn-danger" style={{ padding: "6px 12px", fontSize: "13px" }}>
              <i className="fas fa-trash"></i> Delete Chat
            </button>
          )}
        </div>

        <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", background: "var(--card-bg)" }}>
          {!activeRoom ? (
            inbox.length === 0 ? ( <div style={{ margin: "auto", color: "var(--text-muted)", textAlign: "center" }}><i className="fas fa-inbox fa-3x" style={{ marginBottom: 10 }}></i><p>Your inbox is empty.</p></div> ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {inbox.map((item) => (
                  <div key={item.room.id} onClick={() => startChat(item.otherUser.id)} style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px", border: "1px solid var(--border-color)", borderRadius: "12px", cursor: "pointer" }}>
                    <div style={{ width: 45, height: 45, background: "var(--primary)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold" }}>{item.otherUser.first_name[0]}</div>
                    <div>
                       <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>{item.otherUser.first_name} {item.otherUser.last_name}{item.hasUnread && <span style={{ width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>}</h4>
                       <p style={{ margin: 0, fontSize: "13px", color: item.hasUnread ? "#ef4444" : "var(--text-muted)", fontWeight: item.hasUnread ? "bold" : "normal" }}>{item.hasUnread ? "New message!" : "Click to open chat"}</p>
                     </div>
                  </div>
                ))}
              </div>
            )
          ) : messages.length === 0 ? ( <div style={{ margin: "auto", color: "var(--text-muted)", textAlign: "center" }}><i className="fas fa-comments fa-3x" style={{ marginBottom: 10 }}></i><p>No messages yet. Say hi! 👋</p></div> ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={isMe ? 'message-bubble message-mine' : 'message-bubble message-theirs'}>
                  <div>{msg.message}</div>
                  
                  <div style={{ 
                    fontSize: "10px", opacity: 0.8, marginTop: "5px", display: "flex", 
                    justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "center", gap: "6px" 
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    
                    {isMe && (
                      <span style={{ fontSize: "11px", color: msg.read_status === 'read' ? "#3b82f6" : "inherit" }}>
                        {msg.read_status === 'read' ? (
                          <i className="fas fa-check-double"></i>
                        ) : msg.read_status === 'delivered' ? (
                          <i className="fas fa-check-double"></i>
                        ) : (
                          <i className="fas fa-check"></i>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {activeRoom && (
          <>
            {isTyping && chatPartner && (
              <div style={{ padding: "0 20px 10px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                {chatPartner.first_name} is typing...
              </div>
            )}
            
            <MessageInput 
              activeRoom={activeRoom} 
              user={user} 
              socketRef={socketRef} 
              onMessageSent={handleNewMessageSent} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
