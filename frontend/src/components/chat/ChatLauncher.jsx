import { MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatHub from '../../pages/ChatHub';

const ChatLauncher = () => {
  const { isChatOpen, setIsChatOpen, unreadTotal } = useChat();

  return (
    <>
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary hover:scale-110 transition-all z-[250] group"
        aria-label="Open Chat"
      >
        <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
        {unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 bg-emerald-500 min-w-[26px] h-[26px] px-1.5 rounded-full text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
             {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      <ChatHub /> 
    </>
  );
};

export default ChatLauncher;