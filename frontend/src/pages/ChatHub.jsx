import { useState, useEffect, useContext, useRef } from 'react';
import { 
  Send, X, ShieldCheck, User, Building, MessageSquare, 
  Loader2, ArrowLeft, Users, Search, Check, CheckCheck,
  Headphones, Sparkles
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { ChatCard } from '../components/ChatCard';
import API from '../api/client';

const ChatHub = () => {
  const { 
    socket, 
    isChatOpen, 
    setIsChatOpen, 
    selectedChat, 
    setSelectedChat, 
    refreshUnreadCount 
  } = useChat();
  const { user: currentUser } = useContext(AuthContext);
  
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [fetching, setFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectingAdmin, setConnectingAdmin] = useState(false);

  // Admin specific states
  const [directory, setDirectory] = useState([]); 
  const [view, setView] = useState('inbox'); 
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  // Format message timestamp
  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 1. Fetch Inbox & Directory
  const loadChats = async () => {
    if (!currentUser) return;
    try {
      setFetching(true);
      const res = await API.get('/chat/my-chats');
      setChats(res.data.data || []);
    } catch (err) {
      console.error("Inbox Sync Error:", err);
    } finally {
      setFetching(false);
    }
  };

  const loadDirectory = async () => {
    if (!currentUser || currentUser.role?.toUpperCase() !== 'ADMIN') return;
    try {
      const res = await API.get('/chat/admin/directory');
      setDirectory(res.data.data || []);
    } catch (err) {
      console.error("Directory Sync Error:", err);
    }
  };

  useEffect(() => {
    if (isChatOpen && currentUser) {
      loadChats();

      if (currentUser.role?.toUpperCase() === 'ADMIN') {
        loadDirectory();
      }
    }
  }, [isChatOpen, currentUser]);

  // 2. Fetch History & Mark as Read when a chat is selected
  useEffect(() => {
    if (selectedChat && currentUser) {
      // 1. Fetch message history
      API.get(`/chat/history/${selectedChat._id}`)
        .then(res => {
          setMessages(res.data.data || []);
          setTimeout(() => scrollToBottom(false), 50);
        })
        .catch(err => console.error("History Error:", err));
      
      // 2. Join socket room
      if (socket) socket.emit("join_room", selectedChat._id);

      // 3. Mark messages as read in backend and reset local unread count
      API.patch(`/chat/read/${selectedChat._id}`)
        .then(() => {
          const uId = currentUser._id.toString();
          setChats(prev => prev.map(c => {
            if (c._id === selectedChat._id) {
              const updated = { ...c };
              if (updated.unreadCount) {
                if (updated.unreadCount instanceof Map) {
                  updated.unreadCount.set(uId, 0);
                } else {
                  updated.unreadCount = { ...updated.unreadCount, [uId]: 0 };
                }
              }
              return updated;
            }
            return c;
          }));
          refreshUnreadCount();
        })
        .catch(() => {});
    }
  }, [selectedChat, currentUser, socket, refreshUnreadCount]);

  // 3. Socket event listeners for live messaging
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = (msg) => {
      if (selectedChat?._id === msg.conversation) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
      loadChats();
    };

    const handleMessageDelivered = ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'DELIVERED' } : m));
    };

    const handleAllMessagesDelivered = ({ conversationId }) => {
      if (selectedChat?._id === conversationId) {
        setMessages(prev => prev.map(m => m.status === 'SENT' ? { ...m, status: 'DELIVERED' } : m));
      }
    };

    const handleMessagesRead = ({ conversationId }) => {
      if (selectedChat?._id === conversationId) {
        const uId = currentUser._id.toString();
        setMessages(prev => prev.map(m => {
          const isMine = (m.sender?._id || m.sender).toString() === uId;
          if (isMine) {
            return { ...m, status: 'READ', isRead: true };
          }
          return m;
        }));
      }
    };

    socket.on("message_received", handleNewMessage);
    socket.on("message_delivered", handleMessageDelivered);
    socket.on("messages_delivered", handleAllMessagesDelivered);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("message_received", handleNewMessage);
      socket.off("message_delivered", handleMessageDelivered);
      socket.off("messages_delivered", handleAllMessagesDelivered);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, selectedChat, currentUser]);

  // 4. Send Message Logic
  const handleSend = async () => {
    if (!text.trim() || !selectedChat) return;

    const receiver = selectedChat.participants?.find(p => {
      const pId = p._id || p;
      return pId.toString() !== currentUser._id.toString();
    });

    const receiverId = receiver?._id || receiver;

    if (!receiverId) {
      return alert("Receiver not found in this chat session.");
    }

    const currentText = text.trim();
    setText("");

    try {
      const { data } = await API.post('/chat/send', {
        conversationId: selectedChat._id,
        propertyId: selectedChat.property?._id || selectedChat.property || null,
        receiverId: receiverId.toString(),
        text: currentText,
        status: 'SENT'
      });
      
      const newMsg = data.data;

      setMessages(prev => [...prev, newMsg]);

      if (socket) {
        socket.emit("send_message", { 
          ...newMsg, 
          receiverId: receiverId.toString() 
        });
      }

      setChats(prev => {
        const idx = prev.findIndex(c => c._id === selectedChat._id);
        const targetChat = idx !== -1 ? prev[idx] : selectedChat;
        const current = { 
          ...targetChat, 
          lastMessage: currentText, 
          lastMessageAt: new Date().toISOString() 
        };
        const remaining = idx !== -1 ? prev.filter(c => c._id !== selectedChat._id) : prev;
        return [current, ...remaining];
      });

    } catch (err) {
      const errorMsg = err.response?.data?.message || "Internal Server Error";
      alert("Error: " + errorMsg);
      setText(currentText);
    }
  };

  // 5. Connect / Chat with Admin Support
  const handleConnectWithAdmin = async () => {
    if (!currentUser) return;
    try {
      setConnectingAdmin(true);
      const { data } = await API.post('/chat/access', { receiverId: 'ADMIN_ROLE_ID' });
      if (data.data) {
        setSelectedChat(data.data);
      }
    } catch (err) {
      console.error("Admin chat error:", err);
      alert(err.response?.data?.message || "Could not connect to live admin support.");
    } finally {
      setConnectingAdmin(false);
    }
  };

  // 6. Start chat from directory (Admin Only)
  const handleStartFromDirectory = async (userId) => {
    try {
      const { data } = await API.post('/chat/access', { receiverId: userId });
      if (data.data) {
        setSelectedChat(data.data);
        setChats(prev => {
          const exists = prev.some(c => c._id === data.data._id);
          return exists ? prev : [data.data, ...prev];
        });
      }
      setView('inbox'); 
    } catch (err) {
      alert(err.response?.data?.message || "Could not initialize chat with this user.");
    }
  };

  // Filtered chats and directory
  const filteredChats = chats.filter(chat => {
    const other = chat.participants?.find(p => (p._id || p).toString() !== currentUser?._id?.toString());
    const name = `${other?.firstName || ''} ${other?.lastName || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || (chat.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredDirectory = directory.filter(u => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const role = (u.role || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase()) || role.includes(searchQuery.toLowerCase());
  });

  const otherUser = selectedChat?.participants?.find(
    p => (p._id || p).toString() !== currentUser?._id?.toString()
  );

  const isOtherAdmin = otherUser?.role === 'ADMIN';
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  return (
    <>
      {/* Dark backdrop overlay to smoothly close on outside click */}
      {isChatOpen && (
        <div 
          onClick={() => setIsChatOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[290] transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Drawer Container */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[470px] bg-[#141414] text-white shadow-2xl z-[300] transform transition-transform duration-300 ease-out sm:rounded-l-[2.5rem] flex flex-col border-l border-[#262626] ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* HEADER */}
        <div className="p-5 sm:p-6 bg-[#181818] text-white sm:rounded-tl-[2.5rem] flex justify-between items-center border-b border-[#262626] shadow-md">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">Concierge.</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50 animate-pulse" title="Connected"></span>
            </div>
            
            {isAdmin ? (
              <div className="flex gap-2 mt-2.5">
                <button 
                  onClick={() => { setView('inbox'); setSelectedChat(null); }} 
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    view === 'inbox' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-[#252525] text-gray-400 hover:text-white'
                  }`}
                >
                  <MessageSquare size={12} />
                  Inbox ({chats.length})
                </button>
                <button 
                  onClick={() => { setView('directory'); setSelectedChat(null); loadDirectory(); }} 
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    view === 'directory' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-[#252525] text-gray-400 hover:text-white'
                  }`}
                >
                  <Users size={12} />
                  Directory ({directory.length})
                </button>
              </div>
            ) : (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Official Real-Time Messaging & Support
              </p>
            )}
          </div>

          <button 
            onClick={() => setIsChatOpen(false)} 
            className="p-2.5 bg-[#252525] rounded-xl text-gray-300 hover:text-white hover:bg-primary transition-all active:scale-95 cursor-pointer"
            aria-label="Close Chat"
          >
            <X size={18}/>
          </button>
        </div>

        {/* BODY AREA */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {fetching ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
              <Loader2 className="animate-spin mb-3 text-primary" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Messages...</p>
            </div>
          ) : !selectedChat ? (
            view === 'inbox' ? (
              /* INBOX LIST */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#181818]/70">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages or contacts..."
                      className="w-full bg-[#202020] pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold text-white outline-none border border-[#2d2d2d] focus:border-primary transition placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Quick Action: Chat with Admin Support */}
                {!isAdmin && (
                  <div className="px-5 pt-4">
                    <button
                      onClick={handleConnectWithAdmin}
                      disabled={connectingAdmin}
                      className="w-full bg-gradient-to-r from-red-950/60 to-[#1e1e1e] hover:from-primary hover:to-red-700 text-white border border-primary/40 hover:border-primary p-3.5 rounded-2xl flex items-center justify-between transition-all duration-300 shadow-lg group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary group-hover:bg-white group-hover:text-primary flex items-center justify-center transition">
                          {connectingAdmin ? <Loader2 size={18} className="animate-spin" /> : <Headphones size={18} />}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black uppercase tracking-wide">Live Support Desk</p>
                          <p className="text-[10px] text-gray-400 group-hover:text-white/80">Direct chat with Nestify Administrator</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 group-hover:bg-white group-hover:text-black">
                        Start
                      </span>
                    </button>
                  </div>
                )}

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.25em] px-1">
                    Active Conversations
                  </p>
                  
                  {filteredChats.length > 0 ? (
                    filteredChats.map(chat => (
                      <ChatCard 
                        key={chat._id} 
                        chat={chat} 
                        currentUser={currentUser} 
                        onSelect={setSelectedChat} 
                      />
                    ))
                  ) : isAdmin ? (
                    <div className="text-center py-16 px-4 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                        <Users size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-white">No active admin chats</p>
                        <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1">
                          You have no ongoing conversations. Browse the platform directory to message any registered landlord or tenant directly.
                        </p>
                      </div>
                      <button
                        onClick={() => { setView('directory'); loadDirectory(); }}
                        className="btn-netflix px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                      >
                        <Users size={14} /> Open Platform Directory ({directory.length})
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 px-4 space-y-2 opacity-50">
                      <MessageSquare size={36} className="mx-auto text-gray-400"/>
                      <p className="text-xs font-black uppercase tracking-wider text-gray-300">No active chats yet</p>
                      <p className="text-[11px] text-gray-400 max-w-xs mx-auto">Reach out to property landlords on any PG listing, or click Live Support Desk above.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ADMIN DIRECTORY LIST */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#262626] bg-[#181818]/70">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search platform users..."
                      className="w-full bg-[#202020] pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold text-white outline-none border border-[#2d2d2d] focus:border-primary transition placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-2.5 no-scrollbar">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.25em]">Platform Directory</p>
                    <span className="text-[10px] text-gray-400 font-bold">{filteredDirectory.length} Users</span>
                  </div>

                  {filteredDirectory.length > 0 ? (
                    filteredDirectory.map(u => (
                      <div 
                        key={u._id} 
                        onClick={() => handleStartFromDirectory(u._id)}
                        className="p-3.5 bg-[#1f1f1f] rounded-2xl flex items-center gap-3.5 hover:bg-[#252525] cursor-pointer border border-[#2c2c2c] hover:border-primary/50 transition-all shadow-sm group"
                      >
                        <div className="w-10 h-10 bg-[#2a2a2a] group-hover:bg-primary text-white rounded-xl flex items-center justify-center font-black transition-all">
                          {u.firstName?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-xs text-white truncate">{u.firstName} {u.lastName}</p>
                            {u.kycStatus === 'VERIFIED' && (
                              <ShieldCheck size={12} className="text-emerald-400 shrink-0" title="KYC Verified" />
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border ${
                            u.role === 'OWNER' 
                              ? 'bg-primary/20 text-primary border-primary/30' 
                              : 'bg-[#2a2a2a] text-gray-300 border-[#383838]'
                          }`}>
                            {u.role}
                          </span>
                          <span className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            Chat &rarr;
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 px-4 space-y-2 opacity-60">
                      <Users size={36} className="mx-auto text-gray-400" />
                      <p className="text-xs font-black uppercase tracking-wider text-white">No Users Found</p>
                      <p className="text-[11px] text-gray-400">No registered landlords or tenants match your search.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            /* ACTIVE CHAT VIEW */
            <div className="flex-1 flex flex-col bg-[#141414]">
              {/* Active Chat Header */}
              <div className="p-4 sm:p-5 bg-[#181818] border-b border-[#262626] flex items-center justify-between shadow-sm">
                <button 
                  onClick={() => setSelectedChat(null)} 
                  className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft size={16}/> Back
                </button>

                <div className="text-right">
                  <p className="text-sm font-black text-white flex items-center justify-end gap-1.5">
                    {otherUser?.firstName} {otherUser?.lastName}
                    {isOtherAdmin && <ShieldCheck size={14} className="text-primary" />}
                  </p>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                      {isOtherAdmin ? 'Nestify Administrator' : otherUser?.role || 'Active'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 no-scrollbar bg-[#111111]">
                {messages.length === 0 ? (
                  <div className="text-center py-20 opacity-40 space-y-2">
                    <MessageSquare size={36} className="mx-auto text-gray-500" />
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Say hello to start the chat!</p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isMine = (m.sender?._id || m.sender).toString() === currentUser?._id?.toString();
                    
                    return (
                      <div key={m._id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium shadow-sm relative ${
                          isMine 
                            ? 'bg-primary text-white rounded-br-none shadow-red-950/40' 
                            : 'bg-[#202020] text-gray-100 rounded-bl-none border border-[#2e2e2e]'
                        }`}>
                          <p className="leading-relaxed break-words whitespace-pre-wrap">{m.text}</p>
                          
                          {/* Timestamp & Ticks */}
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] select-none ${
                            isMine ? 'text-white/80' : 'text-gray-400'
                          }`}>
                            <span>{formatMsgTime(m.createdAt)}</span>

                            {isMine && (
                              <span className="flex items-center ml-0.5">
                                {m.status === 'READ' ? (
                                  <CheckCheck size={14} className="text-sky-300 stroke-[2.5]" title="Read" />
                                ) : m.status === 'DELIVERED' ? (
                                  <CheckCheck size={14} className="text-white/70 stroke-[2]" title="Delivered" />
                                ) : (
                                  <Check size={14} className="text-white/70 stroke-[2]" title="Sent" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <div className="p-3.5 sm:p-4 bg-[#181818] border-t border-[#262626] flex items-center gap-2">
                <input 
                  value={text} 
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 bg-[#222222] border border-[#303030] px-4 py-3 rounded-2xl text-xs font-medium text-white outline-none focus:border-primary transition placeholder:text-gray-500"
                  placeholder="Type your message..."
                  autoFocus
                />
                <button 
                  onClick={handleSend} 
                  disabled={!text.trim()}
                  className="btn-netflix w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Send Message"
                >
                  <Send size={16}/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHub;
