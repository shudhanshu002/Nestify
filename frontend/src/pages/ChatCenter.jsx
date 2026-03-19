import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import ChatWindow from '../components/ChatWindow';
import { MessageSquare, User, Home as HomeIcon, Search } from 'lucide-react';

const ChatCenter = () => {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await API.get('/chat/conversations');
        setConversations(data.data);
      } catch (err) {
        console.error("Failed to load inbox");
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto h-[80vh] bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex">
      {/* Sidebar: Conversation List */}
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-black text-gray-900">Messages</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              placeholder="Search chats..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => setActiveChat(conv)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-50 ${
                  activeChat?._id === conv._id ? 'bg-blue-50/50 border-r-4 border-r-primary' : ''
                }`}
              >
                <div className="bg-gray-200 p-2 rounded-xl text-gray-500">
                  <User size={20} />
                </div>
                <div className="text-left overflow-hidden">
                  <h4 className="font-bold text-gray-900 text-sm truncate">
                    {user.role === 'OWNER' ? conv.participants[0].firstName : 'Property Owner'}
                  </h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <HomeIcon size={10} /> {conv.property?.title || 'General Inquiry'}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm">No messages yet.</div>
          )}
        </div>
      </div>

      {/* Main: Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        {activeChat ? (
          <ChatWindow conversation={activeChat} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="p-6 bg-white rounded-full shadow-sm">
              <MessageSquare size={48} className="text-gray-200" />
            </div>
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatCenter;