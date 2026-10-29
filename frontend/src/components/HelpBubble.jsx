// src/components/HelpBubble.jsx
const HelpBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-10 right-10 z-[100]">
      {/* 󾠮 The Popup Menu */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-72 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-bottom-10 duration-300">
           <p className="font-black italic text-xl mb-4">Concierge.</p>
           <div className="space-y-3">
              <button className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-primary hover:text-white transition group">
                 <Wrench size={20} className="text-primary group-hover:text-white"/>
                 <div className="text-left">
                    <p className="text-xs font-black">Report Issue</p>
                    <p className="text-[10px] opacity-60">Plumbing, WiFi, etc.</p>
                 </div>
              </button>
              <button className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-900 hover:text-white transition group">
                 <MessageSquare size={20} className="text-gray-400 group-hover:text-white"/>
                 <div className="text-left">
                    <p className="text-xs font-black">Chat with Owner</p>
                    <p className="text-[10px] opacity-60">Instant Messaging</p>
                 </div>
              </button>
           </div>
        </div>
      )}

      {/* 󾠯 The Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-primary transition active:scale-90"
      >
        {isOpen ? <X size={24}/> : <Info size={24}/>}
      </button>
    </div>
  );
};