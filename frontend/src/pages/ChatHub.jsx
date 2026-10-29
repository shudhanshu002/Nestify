import { useState, useEffect, useContext, useRef } from 'react';
import { 
  Send, X, ShieldCheck, User, Building, MessageSquare, 
  Loader2, ArrowLeft, Users, Search, Check, CheckCheck 
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

  useEffect(() => {
    if (isChatOpen && currentUser) {
      loadChats();

      if (currentUser.role === 'ADMIN') {
        API.get('/chat/admin/directory')
          .then(res => setDirectory(res.data.data || []))
          .catch(err => console.error("Directory Sync Error:", err));
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
      const other = selectedChat.participants?.find(
        p => (p._id || p).toString() !== currentUser._id.toString()
      );
      const otherId = other?._id || other;

      API.patch(`/chat/read/${selectedChat._id}`)
        .then(() => {
          // Reset local unread badge on this chat
          const uId = currentUser._id.toString();
          setChats(prev => prev.map(c => {
            if (c._id === selectedChat._id) {
              const updatedUnread = { ...(c.unreadCount || {}) };
              updatedUnread[uId] = 0;
              return { ...c, unreadCount: updatedUnread };
            }
            return c;
          }));
          refreshUnreadCount();
        })
        .catch(err => console.error("Read status error:", err));

      // 4. Emit mark_as_read socket event so sender gets DOUBLE BLUE TICKS in real time
      if (socket && otherId) {
        socket.emit("mark_as_read", {
          conversationId: selectedChat._id,
          userId: currentUser._id,
          receiverId: otherId.toString()
        });
      }
    }
  }, [selectedChat, socket, currentUser, refreshUnreadCount]);

  // 3. Real-time Socket Listeners (Messages, Delivery Ticks, Blue Read Ticks)
  useEffect(() => {
    if (!socket || !currentUser) return;

    // A. When incoming message arrives
    const handleNewMessage = (msg) => {
      const isForActiveChat = selectedChat?._id === msg.conversation;

      if (isForActiveChat) {
        setMessages(prev => {
          if (prev.some(m => m._id && m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Since chat is open right now, immediately mark as read
        const other = selectedChat.participants?.find(
          p => (p._id || p).toString() !== currentUser._id.toString()
        );
        const otherId = other?._id || other;
        API.patch(`/chat/read/${selectedChat._id}`).catch(() => {});
        if (otherId) {
          socket.emit("mark_as_read", {
            conversationId: selectedChat._id,
            userId: currentUser._id,
            receiverId: otherId.toString()
          });
        }
      }

      // Update chats list (lastMessage, lastMessageAt, unread badge, and move to top)
      setChats(prev => {
        const chatIndex = prev.findIndex(c => c._id === msg.conversation);
        const uId = currentUser._id.toString();

        if (chatIndex !== -1) {
          const updated = [...prev];
          const target = { ...updated[chatIndex] };
          target.lastMessage = msg.text;
          target.lastMessageAt = msg.createdAt || new Date().toISOString();

          // Increment unread count only if user is NOT currently inside this chat
          if (!isForActiveChat) {
            const currentUnread = (target.unreadCount?.[uId] || 0) + 1;
            target.unreadCount = { ...target.unreadCount, [uId]: currentUnread };
          }

          updated.splice(chatIndex, 1);
          return [target, ...updated];
        } else {
          // If conversation is brand new, reload chats
          loadChats();
          return prev;
        }
      });
    };

    // B. When our sent message was delivered to recipient (Double Grey Tick)
    const handleMessageDelivered = ({ messageId, conversationId }) => {
      setMessages(prev => prev.map(m => {
        if ((m._id === messageId || (!messageId && m.conversation === conversationId)) && m.status !== 'READ') {
          return { ...m, status: 'DELIVERED' };
        }
        return m;
      }));
    };

    // C. When recipient came online and all pending messages were delivered
    const handleAllMessagesDelivered = () => {
      const uId = currentUser._id.toString();
      setMessages(prev => prev.map(m => {
        const isMine = (m.sender?._id || m.sender).toString() === uId;
        if (isMine && m.status === 'SENT') {
          return { ...m, status: 'DELIVERED' };
        }
        return m;
      }));
    };

    // D. When recipient read our messages (Double Blue Ticks!)
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
      return alert("Critical Error: Receiver not found in this chat session.");
    }

    const currentText = text.trim();
    setText("");

    try {
      const { data } = await API.post('/chat/send', {
        propertyId: selectedChat.property?._id || selectedChat.property || null,
        receiverId: receiverId.toString(),
        text: currentText,
        status: 'SENT'
      });
      
      const newMsg = data.data;

      // Add to local message list immediately
      setMessages(prev => [...prev, newMsg]);

      // Emit to socket server
      if (socket) {
        socket.emit("send_message", { 
          ...newMsg, 
          receiverId: receiverId.toString() 
        });
      }

      // Update last message in the thread list
      setChats(prev => {
        const idx = prev.findIndex(c => c._id === selectedChat._id);
        if (idx !== -1) {
          const updated = [...prev];
          const current = { 
            ...updated[idx], 
            lastMessage: currentText, 
            lastMessageAt: new Date().toISOString() 
          };
          updated.splice(idx, 1);
          return [current, ...updated];
        }
        return prev;
      });

    } catch (err) {
      const errorMsg = err.response?.data?.message || "Internal Server Error";
      if (errorMsg.includes("SELF_CHAT")) {
        alert("Test Error: You are logged in as this person. Log out and use a different account to test chat.");
      } else {
        alert("Error: " + errorMsg);
      }
      setText(currentText); // Restore on error
    }
  };

  // 5. Start chat from directory (Admin Only)
  const handleStartFromDirectory = async (userId) => {
    try {
      const { data } = await API.post('/chat/access', { receiverId: userId });
      setSelectedChat(data.data);
      setView('inbox'); 
    } catch (err) {
      alert("Could not initialize chat with this user.");
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
    return name.includes(searchQuery.toLowerCase()) || (u.role || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const otherUser = selectedChat?.participants?.find(
    p => (p._id || p).toString() !== currentUser?._id?.toString()
  );

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-[300] transform transition-transform duration-500 rounded-l-[3rem] flex flex-col border-l border-gray-100 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* HEADER WITH TOGGLE */}
      <div className="p-8 bg-gray-900 text-white rounded-tl-[3rem] flex justify-between items-center shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black italic tracking-tighter">Concierge.</h2>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Connected"></span>
          </div>
          {currentUser?.role === 'ADMIN' && (
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => { setView('inbox'); setSelectedChat(null); }} 
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view === 'inbox' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
              >
                Inbox
              </button>
              <button 
                onClick={() => { setView('directory'); setSelectedChat(null); }} 
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${view === 'directory' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
              >
                Directory
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsChatOpen(false)} 
          className="p-3 bg-white/10 rounded-2xl hover:bg-red-500 transition-all active:scale-95"
          aria-label="Close Chat"
        >
          <X size={20}/>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {fetching ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40">
            <Loader2 className="animate-spin mb-3 text-primary" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Syncing Messages...</p>
          </div>
        ) : !selectedChat ? (
          view === 'inbox' ? (
            /* INBOX LIST (WHATSAPP STYLE WITH SEARCH & BADGES) */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl text-xs font-bold outline-none border border-gray-200 focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.25em] mb-3 px-2">Active Conversations</p>
                {filteredChats.length > 0 ? filteredChats.map(chat => (
                  <ChatCard 
                    key={chat._id} 
                    chat={chat} 
                    currentUser={currentUser} 
                    onSelect={setSelectedChat} 
                  />
                )) : (
                  <div className="text-center py-24 opacity-30">
                    <MessageSquare size={48} className="mx-auto mb-3"/>
                    <p className="text-xs font-black uppercase tracking-widest">No conversations found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ADMIN DIRECTORY LIST */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl text-xs font-bold outline-none border border-gray-200 focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <p className="text-[10px] font-black uppercase text-primary tracking-[0.25em] mb-3 px-2">Platform Directory</p>
                {filteredDirectory.map(u => (
                  <div 
                    key={u._id} 
                    onClick={() => handleStartFromDirectory(u._id)}
                    className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-white cursor-pointer border border-transparent hover:border-gray-100 transition-all shadow-sm group"
                  >
                    <div className="w-12 h-12 bg-gray-900 group-hover:bg-primary text-white rounded-2xl flex items-center justify-center font-black transition-all">
                      {u.firstName?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-[9px] font-bold text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className="text-[8px] font-black px-2 py-1 rounded bg-gray-200 text-gray-600 uppercase">
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* ACTIVE CHAT VIEW (WITH TICKS & TIMESTAMPS) */
          <div className="flex-1 flex flex-col bg-[#F8FAFC]">
            {/* CHAT HEADER */}
            <div className="p-5 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
              <button 
                onClick={() => setSelectedChat(null)} 
                className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 hover:text-primary transition-colors"
              >
                <ArrowLeft size={16}/> Back
              </button>

              <div className="text-right">
                <p className="text-sm font-black text-gray-900">
                  {otherUser?.firstName} {otherUser?.lastName}
                </p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                    {otherUser?.role === 'ADMIN' ? 'Support' : otherUser?.role || 'Active'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* MESSAGES SCROLL CONTAINER */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {messages.length === 0 ? (
                 <div className="text-center py-20 opacity-30">
                   <MessageSquare size={40} className="mx-auto mb-2 text-gray-400" />
                   <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Say hello to start the chat!</p>
                 </div>
               ) : (
                 messages.map((m, i) => {
                   const isMine = (m.sender?._id || m.sender).toString() === currentUser?._id?.toString();
                   
                   return (
                     <div key={m._id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm font-medium shadow-sm relative group ${
                          isMine 
                            ? 'bg-gray-900 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                        }`}>
                           <p className="leading-relaxed break-words whitespace-pre-wrap">{m.text}</p>
                           
                           {/* TIMESTAMP & STATUS TICKS */}
                           <div className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] select-none ${
                             isMine ? 'text-gray-400' : 'text-gray-400'
                           }`}>
                             <span>{formatMsgTime(m.createdAt)}</span>

                             {isMine && (
                               <span className="flex items-center ml-0.5">
                                 {m.status === 'READ' ? (
                                   // Double Blue Tick (WhatsApp Style Sky Blue)
                                   <CheckCheck size={16} className="text-sky-400 stroke-[2.5]" title="Read" />
                                 ) : m.status === 'DELIVERED' ? (
                                   // Double Grey Tick
                                   <CheckCheck size={16} className="text-gray-400 stroke-[2]" title="Delivered" />
                                 ) : (
                                   // Single Grey Tick
                                   <Check size={16} className="text-gray-400 stroke-[2]" title="Sent" />
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

            {/* MESSAGE INPUT */}
            <div className="p-5 bg-white border-t border-gray-100 flex items-center gap-3">
               <input 
                 value={text} 
                 onChange={e => setText(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSend();
                   }
                 }}
                 className="flex-1 bg-gray-100 px-5 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-primary transition-all placeholder:text-gray-400"
                 placeholder="Type a message..."
                 autoFocus
               />
               <button 
                 onClick={handleSend} 
                 disabled={!text.trim()}
                 className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-primary transition-all shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                 aria-label="Send Message"
               >
                 <Send size={18}/>
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHub;