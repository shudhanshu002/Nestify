import { useState, useEffect, useRef } from 'react';
import API from '../api/client';
import { Send, ShieldAlert, Loader2 } from 'lucide-react';

const ChatWindow = ({ conversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await API.get(`/chat/messages/${conversation._id}`);
      setMessages(data.data);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling for demo purposes
    return () => clearInterval(interval);
  }, [conversation._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { data } = await API.post('/chat/send', {
        receiverId: conversation.participants.find(p => p._id !== conversation.user)._id,
        propertyId: conversation.property?._id,
        text: newMessage
      });
      setMessages([...messages, data.data]);
      setNewMessage('');
    } catch (err) {
      console.error("Message failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg._id} className={`flex flex-col ${msg.sender === conversation.user ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
              msg.sender === conversation.user 
              ? 'bg-primary text-white rounded-tr-none' 
              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
            
            {/* 󾠮 Privacy Engine Warning */}
            {msg.containsContactInfo && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                <ShieldAlert size={12} /> Contact Info Detected & Flagged
              </div>
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-3">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button 
          disabled={sending}
          className="bg-primary text-white p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
        >
          {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;