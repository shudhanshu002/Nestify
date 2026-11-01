import { MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatHub from '../../pages/ChatHub';

const ChatLauncher = () => {
  const { isChatOpen, setIsChatOpen, unreadTotal } = useChat();

  return (
    <>
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#1c1c1c] hover:bg-primary text-white rounded-full shadow-2xl border border-white/10 hover:border-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-[250] group cursor-pointer shadow-black/80"
          aria-label="Open Live Concierge Chat"
          title="Chat with Support & Landlords"
        >
          <MessageSquare size={22} className="group-hover:rotate-6 transition-transform" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary min-w-[22px] h-[22px] px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center border-2 border-[#141414] shadow-lg animate-pulse">
               {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </button>
      )}

      <ChatHub /> 
    </>
  );
};

export default ChatLauncher;
