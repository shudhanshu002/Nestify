import { useEffect, useState } from 'react';
import API from '../api/client';
import { useChat } from '../context/ChatContext';
import { 
  Calendar, MapPin, Loader2, Wrench, Star, 
  X, Send, ShieldCheck, Wifi, Volume2, Zap, Search, MessageSquare,
  Clock, ChevronRight, CheckCircle2, Lock, Check, Receipt, CalendarPlus
} from 'lucide-react';
import ReceiptModal from '../components/modals/ReceiptModal';
import ExtendStayModal from '../components/modals/ExtendStayModal';

const MyBookings = () => {
  const { setSelectedChat, setIsChatOpen, socket } = useChat();
  const [chatLoadingId, setChatLoadingId] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Visibility States
  const [showIssueModal, setShowIssueModal] = useState(null); 
  const [showReviewModal, setShowReviewModal] = useState(null); 
  const [showTracker, setShowTracker] = useState(false); 
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState(null);
  const [selectedExtendBooking, setSelectedExtendBooking] = useState(null);
  
  // Data States
  const [activeTickets, setActiveTickets] = useState([]); 
  const [tempRating, setTempRating] = useState(0);
  
  // Form States
  const [issueData, setIssueData] = useState({ type: 'WIFI', desc: '', priority: 'MEDIUM' });
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [reviewData, setReviewData] = useState({
    ratings: { cleanliness: 5, maintenance: 5, safety: 5, services: 5 },
    comment: '',
    safetySignals: { noiseLevel: 'Moderate', internetSpeed: 'Good', powerBackupReliability: true }
  });

  // Start chat with the PG or Hotel owner
  const handleChatWithLandlord = async (book) => {
    const ownerId = book.property?.owner?._id || book.property?.owner;
    if (!ownerId) {
      alert("Landlord / Owner details are not available for this property.");
      return;
    }

    try {
      setChatLoadingId(book._id);
      const { data } = await API.post('/chat/access', { 
        receiverId: ownerId.toString(), 
        propertyId: book.property?._id 
      });
      setSelectedChat(data.data);
      setIsChatOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || "Could not open chat with landlord.");
    } finally {
      setChatLoadingId(null);
    }
  };

  // 1. Fetch user's booking history
  const fetchMyStays = async () => {
    try {
      const { data } = await API.get('/bookings/my-bookings');
      setBookings(data.data || []);
    } catch (err) {
      console.error("Fetch Stays Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch maintenance queries for a specific property
  const fetchAndShowTickets = async (book) => {
    try {
      const { data } = await API.get(`/maintenance/my-tickets/${book.property._id}`);
      setActiveTickets(data.data || []);
      setShowTracker(true);
    } catch (err) {
      console.error("Ticket Fetch Error:", err);
      alert("Could not load tickets at this moment.");
    }
  };

  useEffect(() => {
    fetchMyStays();
  }, []);

  // Real-time socket listener for ticket updates
  useEffect(() => {
    if (!socket) return;

    const handleTicketStatusChange = (updatedTicket) => {
      setActiveTickets(prev => 
        prev.map(t => t._id === updatedTicket._id ? { ...t, ...updatedTicket } : t)
      );
    };

    socket.on('ticket_status_updated', handleTicketStatusChange);
    return () => {
      socket.off('ticket_status_updated', handleTicketStatusChange);
    };
  }, [socket]);

  // 3. Submit Maintenance Query
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!showIssueModal) return;

    if (showIssueModal.status !== 'CHECKED_IN') {
      alert("Active Check-In Required: You can only raise service issues while actively checked into the room.");
      return;
    }

    if (!issueData.desc?.trim()) {
      alert("Please provide a description of the issue.");
      return;
    }

    try {
      setSubmittingIssue(true);
      const { data } = await API.post('/maintenance', {
        propertyId: showIssueModal.property?._id || showIssueModal.property,
        bookingId: showIssueModal._id,
        issueType: issueData.type,
        description: issueData.desc.trim(),
        priority: issueData.priority
      });

      alert(`Request Raised Successfully!\nTicket ID: #${data.data._id.slice(-6).toUpperCase()}\nThe owner has been notified immediately.`);
      setShowIssueModal(null);
      setIssueData({ type: 'WIFI', desc: '', priority: 'MEDIUM' });

      if (showTracker) {
        fetchAndShowTickets(showIssueModal);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to raise ticket. Please ensure you are checked in.");
    } finally {
      setSubmittingIssue(false);
    }
  };

  // 4. Rate a fixed maintenance issue
  const handleRateTicket = async (ticketId, rating) => {
    try {
      await API.patch(`/maintenance/${ticketId}/rate`, { 
        rating, 
        feedback: "User rated the resolution." 
      });
      alert("Thank you for rating the service!");
      if (activeTickets.length > 0) {
        const propId = activeTickets[0].property?._id || activeTickets[0].property;
        const { data } = await API.get(`/maintenance/my-tickets/${propId}`);
        setActiveTickets(data.data || []);
      }
    } catch (err) {
      alert("Failed to save rating.");
    }
  };

  // 5. Submit Property Review
  const handleReviewSubmit = async () => {
    try {
      await API.post(`/reviews/${showReviewModal.property._id}`, {
        bookingId: showReviewModal._id,
        ratings: reviewData.ratings,
        comment: reviewData.comment,
        safetySignals: reviewData.safetySignals
      });
      alert("Verified review published!");
      setShowReviewModal(null);
      fetchMyStays();
    } catch (err) {
      alert(err.response?.data?.message || "Review submission failed");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#141414]">
      <Loader2 className="animate-spin text-primary" size={40}/>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 text-white space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter">My Stays.</h1>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-2">Manage your residency & queries</p>
        </div>
        <div className="bg-[#242424] border border-[#333333] px-6 py-2 rounded-full text-xs font-black text-gray-300 uppercase">
          {bookings.length} Bookings
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {bookings.map(book => (
          <div key={book._id} className="bg-[#181818] rounded-[3.5rem] border border-[#2a2a2a] shadow-xl overflow-hidden netflix-card transition-all duration-500 group">
            <div className="relative h-56 bg-[#121212]">
              <img src={book.property?.images?.[0]?.url || 'https://via.placeholder.com/600x400'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Property" />
              <div className={`absolute top-6 right-6 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl ${
                book.status === 'CONFIRMED' ? 'bg-primary text-white' : 
                book.status === 'CHECKED_IN' ? 'bg-emerald-600 text-white' : 
                book.status === 'COMPLETED' ? 'bg-[#2a2a2a] text-gray-300 border border-[#444]' : 'bg-[#181818] text-white'
              }`}>
                {book.status === 'COMPLETED' ? 'CHECKED OUT' : book.status.replace('_', ' ')}
              </div>
            </div>
            
            <div className="p-8 sm:p-10 space-y-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-primary transition">{book.property?.title}</h3>
                <p className="text-gray-400 font-bold flex items-center gap-1 text-sm mt-2 italic">
                  <MapPin size={16} className="text-primary"/> {book.property?.location?.city}, {book.property?.location?.state}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 py-6 border-y border-[#262626]">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Unit Type</p>
                  <p className="font-black text-white">{book.room?.roomType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Paid</p>
                  <p className="font-black text-white text-xl font-mono">₹{book.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-3">
                {/* CHAT WITH PG / HOTEL OWNER */}
                <button 
                  onClick={() => handleChatWithLandlord(book)}
                  disabled={chatLoadingId === book._id}
                  className="w-full btn-netflix-secondary py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {chatLoadingId === book._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MessageSquare size={16} />
                  )}
                  <span>
                    {book.property?.owner?.firstName 
                      ? `Chat with ${book.property.owner.firstName} (Owner)`
                      : 'Chat with Owner / Landlord'}
                  </span>
                </button>

                {/* TICKET & EXTENSION ACTIONS BASED ON CHECK-IN STATUS */}
                {book.status === 'CHECKED_IN' ? (
                  <div className="space-y-3">
                    <button 
                      onClick={() => setSelectedExtendBooking(book)}
                      className="w-full bg-emerald-950/50 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800/50 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-300 shadow-sm active:scale-[0.99] cursor-pointer"
                    >
                      <CalendarPlus size={16} /> Extend Rent / Extend Stay
                    </button>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setShowIssueModal(book); setIssueData({ type: 'WIFI', desc: '', priority: 'MEDIUM' }); }}
                        className="flex-1 btn-netflix py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase flex items-center justify-center gap-2 transition shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Wrench size={15}/> Raise Ticket
                      </button>
                      <button 
                        onClick={() => fetchAndShowTickets(book)} 
                        className="flex-1 btn-netflix-secondary py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                      >
                        <Search size={15}/> Track Issues
                      </button>
                    </div>
                  </div>
                ) : book.status === 'COMPLETED' ? (
                  <div className="flex gap-3">
                    <div 
                      className="flex-1 bg-[#222222] text-gray-400 py-3.5 px-4 rounded-[1.5rem] font-bold text-[10px] uppercase flex items-center justify-center gap-2 border border-[#333333] cursor-default select-none"
                    >
                      <CheckCircle2 size={14} className="text-gray-400"/> Checked Out • Tickets Closed
                    </div>
                    <button 
                      onClick={() => fetchAndShowTickets(book)} 
                      className="btn-netflix-secondary py-3.5 px-5 rounded-[1.5rem] font-black text-[10px] uppercase flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Search size={14}/> View History
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div 
                      className="flex-1 bg-[#222222] text-gray-400 py-3.5 px-4 rounded-[1.5rem] font-bold text-[10px] uppercase flex items-center justify-center gap-2 border border-[#333333] cursor-not-allowed select-none"
                    >
                      <Lock size={14} className="opacity-40"/> Check-in Required for Tickets
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {book.status === 'COMPLETED' && (
                    <button 
                      onClick={() => setShowReviewModal(book)}
                      className="flex-1 bg-amber-500 text-white py-4 rounded-[1.5rem] font-black text-[11px] uppercase flex items-center justify-center gap-2 shadow-lg hover:bg-amber-600 transition cursor-pointer"
                    >
                      <Star size={16} fill="currentColor"/> Rate Stay
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedReceiptBooking(book)}
                    className="flex-1 btn-netflix py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition shadow-xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Receipt size={16}/> View Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: QUERY TRACKER */}
      {showTracker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-[#181818] border border-[#2e2e2e] text-white w-full max-w-xl rounded-[4rem] p-8 sm:p-12 max-h-[85vh] overflow-y-auto relative animate-in zoom-in duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">Issue Hub.</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Live updates from owner</p>
              </div>
              <button onClick={() => setShowTracker(false)} className="p-3 bg-[#242424] text-gray-300 rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer"><X size={20}/></button>
            </div>

            <div className="space-y-6">
              {activeTickets.length > 0 ? activeTickets.map(t => (
                <div key={t._id} className="p-6 sm:p-8 bg-[#222222] rounded-[3rem] border border-[#333333] relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-[#181818] px-3 py-1 rounded-lg border border-primary/20">{t.issueType}</span>
                      <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">Ticket ID: #{t._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-2xl shadow-sm ${t.status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white animate-pulse'}`}>
                      {t.status === 'RESOLVED' ? 'Solved' : 'In Progress'}
                    </span>
                  </div>
                  
                  <p className="text-base font-bold text-gray-200 leading-snug mb-6">"{t.description}"</p>
                  
                  {t.resolutionNote && (
                    <div className="mt-4 p-6 bg-[#1a1a1a] rounded-[2rem] border-l-[6px] border-emerald-500 shadow-inner">
                      <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 flex items-center gap-2">
                        <MessageSquare size={13}/> Owner Reply & Resolution
                      </p>
                      <p className="text-sm font-semibold text-gray-300 leading-relaxed italic">"{t.resolutionNote}"</p>
                    </div>
                  )}

                  {t.status === 'RESOLVED' && !t.userRating && (
                    <div className="mt-6 p-6 bg-[#1c1c1c] rounded-[2rem] border-2 border-dashed border-amber-900/50 text-center">
                      <p className="text-[11px] font-black uppercase text-amber-400 mb-3 tracking-widest">Rate This Fix</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} size={26} 
                            className="cursor-pointer transition-all hover:scale-125 active:scale-90" 
                            fill={star <= (tempRating || 0) ? "#f1c40f" : "none"}
                            color={star <= (tempRating || 0) ? "#f1c40f" : "#64748b"}
                            onMouseEnter={() => setTempRating(star)}
                            onMouseLeave={() => setTempRating(0)}
                            onClick={() => handleRateTicket(t._id, star)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {t.userRating && (
                    <div className="mt-6 flex flex-col items-center gap-1 bg-[#1a1a1a] py-3 rounded-[1.5rem] border border-[#333]">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">You Rated This Fix</span>
                      <div className="flex text-amber-400 gap-1">
                        {[...Array(t.userRating)].map((_, i) => <Star key={i} size={16} fill="currentColor"/>)}
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-20 opacity-40">
                  <Clock size={56} className="mx-auto mb-3 text-gray-400"/>
                  <p className="font-black uppercase text-xs tracking-widest text-gray-400">No queries raised yet for this property</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RAISE TICKET */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#181818] border border-[#2e2e2e] text-white w-full max-w-md rounded-[3.5rem] p-8 sm:p-10 space-y-6 relative animate-in zoom-in duration-200 shadow-2xl">
            <button onClick={() => setShowIssueModal(null)} className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={22}/></button>
            <div>
              <h3 className="text-3xl font-black italic tracking-tighter text-white leading-none">Raise Ticket.</h3>
              <p className="text-xs font-bold text-gray-400 mt-2">
                For {showIssueModal.property?.title} ({showIssueModal.room?.roomType || 'Room'})
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              {['WIFI', 'PLUMBING', 'CLEANING', 'ELECTRIC', 'OTHER'].map(t => (
                <button 
                  key={t} 
                  type="button"
                  onClick={() => setIssueData({...issueData, type: t})} 
                  className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${issueData.type === t ? 'btn-netflix shadow-lg scale-[1.02]' : 'bg-[#242424] text-gray-300 border border-[#333333] hover:text-white hover:bg-[#2c2c2c]'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Priority</label>
              <div className="flex gap-2">
                {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setIssueData({...issueData, priority: p})}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${issueData.priority === p ? (p === 'HIGH' ? 'bg-primary text-white shadow-md' : p === 'MEDIUM' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white') : 'bg-[#242424] text-gray-400 border border-[#333333]'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Describe the issue</label>
              <textarea 
                className="w-full bg-[#242424] border border-[#333333] p-5 rounded-[2rem] text-sm font-medium outline-none h-32 text-white placeholder-gray-500 focus:border-primary transition-all resize-none" 
                placeholder="What seems to be broken? E.g. No hot water in bathroom..."
                value={issueData.desc}
                onChange={(e) => setIssueData({...issueData, desc: e.target.value})}
              />
            </div>

            <button 
              onClick={handleIssueSubmit} 
              disabled={submittingIssue}
              className="w-full btn-netflix py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submittingIssue ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
              <span>Send Ticket to Owner</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: RATE STAY */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#181818] border border-[#2e2e2e] text-white w-full max-w-2xl rounded-[4rem] p-8 sm:p-12 space-y-8 relative overflow-y-auto max-h-[90vh] shadow-2xl">
            <button onClick={() => setShowReviewModal(null)} className="absolute top-10 right-10 text-gray-400 hover:text-white transition-colors cursor-pointer"><X size={24}/></button>
            <div>
              <h3 className="text-4xl font-black italic tracking-tighter text-white">Experience.</h3>
              <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} className="text-primary"/> Verified Resident Review</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(reviewData.ratings).map(key => (
                <div key={key}>
                  <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-2">{key}</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} size={22} 
                        className={`cursor-pointer transition-all hover:scale-110 ${s <= reviewData.ratings[key] ? 'text-amber-400 fill-current' : 'text-gray-600'}`}
                        onClick={() => setReviewData({...reviewData, ratings: {...reviewData.ratings, [key]: s}})}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <textarea 
               className="w-full bg-[#242424] border border-[#333333] p-6 rounded-[2.5rem] text-sm font-medium outline-none h-36 text-white placeholder-gray-500 focus:border-primary transition-all resize-none" 
               placeholder="What should the next resident know?"
               value={reviewData.comment}
               onChange={e => setReviewData({...reviewData, comment: e.target.value})}
            />

            <button 
              onClick={handleReviewSubmit} 
              className="w-full btn-netflix py-5 rounded-[2rem] font-black text-xl transition-all shadow-2xl active:scale-95 cursor-pointer"
            >
              Post Verified Review
            </button>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL TAX INVOICE & RECEIPT */}
      {selectedReceiptBooking && (
        <ReceiptModal 
          booking={selectedReceiptBooking} 
          onClose={() => setSelectedReceiptBooking(null)} 
        />
      )}

      {/* MODAL: EXTEND STAY / RENT */}
      {selectedExtendBooking && (
        <ExtendStayModal
          booking={selectedExtendBooking}
          onClose={() => setSelectedExtendBooking(null)}
          onSuccess={(updatedBooking) => {
            setBookings(prev =>
              prev.map(b => (b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b))
            );
          }}
        />
      )}
    </div>
  );
};

export default MyBookings;
