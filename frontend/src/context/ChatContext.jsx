// src/context/ChatContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import API from '../api/client';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/chat/unread-count');
      setUnreadTotal(data.count || 0);
    } catch (err) {
      // Quiet fail if not yet ready
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshUnreadCount();

      const newSocket = io("http://localhost:5000", {
        transports: ["websocket"],
        reconnectionAttempts: 5
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("setup", user._id);
      });

      newSocket.on("message_received", (msg) => {
        setNotifications(prev => [msg, ...prev]);

        // Acknowledge delivery to sender so they get double grey tick
        if (msg._id && msg.sender) {
          const senderId = msg.sender?._id || msg.sender;
          newSocket.emit("acknowledge_delivery", {
            messageId: msg._id,
            conversationId: msg.conversation,
            senderId
          });
        }

        // Increment unread total if this chat is not currently open
        if (!selectedChat || selectedChat._id !== msg.conversation) {
          setUnreadTotal(prev => prev + 1);
        }
      });

      return () => newSocket.disconnect();
    } else {
      setSocket(null);
      setUnreadTotal(0);
      setNotifications([]);
    }
  }, [user, selectedChat, refreshUnreadCount]);

  return (
    <ChatContext.Provider value={{ 
      socket, 
      notifications, 
      setNotifications, 
      selectedChat, 
      setSelectedChat, 
      isChatOpen, 
      setIsChatOpen,
      unreadTotal,
      setUnreadTotal,
      refreshUnreadCount
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);