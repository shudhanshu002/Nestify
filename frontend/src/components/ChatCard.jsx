// HELPER COMPONENT: Chat Card with WhatsApp style unread badge (Netflix Dark Theme)
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

  const isAdmin = other?.role === 'ADMIN';

  return (
    <div 
      onClick={() => onSelect(chat)} 
      className="p-4 bg-[#1f1f1f] rounded-2xl hover:bg-[#252525] cursor-pointer transition-all border border-[#2d2d2d] hover:border-primary/50 flex items-center gap-3.5 shadow-md group"
    >
      {/* Role-based Avatar */}
      <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-black text-white shadow-md transition-all shrink-0 ${
        isAdmin ? 'bg-primary shadow-red-950/50' : 'bg-[#2a2a2a] group-hover:bg-primary group-hover:scale-105'
      }`}>
        {other?.firstName?.[0] || (isAdmin ? 'S' : '?')}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <p className={`font-black text-sm truncate ${unread > 0 ? 'text-white' : 'text-gray-200'}`}>
            {other?.firstName} {other?.lastName}
          </p>
          
          <div className="flex items-center gap-2 shrink-0">
            {chat.lastMessageAt && (
              <span className={`text-[10px] ${unread > 0 ? 'text-emerald-400 font-bold' : 'text-gray-400 font-medium'}`}>
                {formatTime(chat.lastMessageAt)}
              </span>
            )}
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
              isAdmin 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-[#292929] text-gray-400 border border-[#353535]'
            }`}>
              {isAdmin ? 'Support' : other?.role || 'User'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <p className={`text-xs truncate italic ${unread > 0 ? 'font-bold text-gray-200' : 'text-gray-400 font-normal'}`}>
            {chat.lastMessage || "New session initialized..."}
          </p>

          {unread > 0 && (
            <span className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm shrink-0">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
