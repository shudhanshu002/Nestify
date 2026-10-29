// HELPER COMPONENT: Chat Card with WhatsApp style unread badge
export const ChatCard = ({ chat, currentUser, onSelect }) => {
  const other = chat.participants?.find(p => (p._id || p).toString() !== currentUser?._id?.toString());
  
  const currentUserId = currentUser?._id?.toString();
  const unread = chat.unreadCount?.[currentUserId] || 
                 (chat.unreadCount instanceof Map ? chat.unreadCount.get(currentUserId) : 0) || 0;

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      onClick={() => onSelect(chat)} 
      className="p-5 bg-gray-50 rounded-[2rem] hover:bg-white cursor-pointer transition-all border border-transparent hover:border-gray-100 flex items-center gap-4 shadow-sm group hover:shadow-md"
    >
      {/* Role-based Avatar */}
      <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-md transition-all flex-shrink-0 ${other?.role === 'ADMIN' ? 'bg-red-500' : 'bg-gray-900 group-hover:bg-primary group-hover:rotate-3'}`}>
        {other?.firstName?.[0] || '?'}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
           <p className={`font-black text-sm truncate ${unread > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
             {other?.firstName} {other?.lastName}
           </p>
           
           <div className="flex items-center gap-2 flex-shrink-0">
             {chat.lastMessageAt && (
               <span className={`text-[10px] ${unread > 0 ? 'text-emerald-500 font-bold' : 'text-gray-400 font-medium'}`}>
                 {formatTime(chat.lastMessageAt)}
               </span>
             )}
             <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${other?.role === 'ADMIN' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-gray-200 text-gray-500'}`}>
                {other?.role === 'ADMIN' ? 'Support' : other?.role}
             </span>
           </div>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <p className={`text-xs truncate italic ${unread > 0 ? 'font-bold text-gray-900' : 'text-gray-400 font-medium'}`}>
            {chat.lastMessage || "New session initialized..."}
          </p>

          {unread > 0 && (
            <span className="min-w-[20px] h-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm flex-shrink-0">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};