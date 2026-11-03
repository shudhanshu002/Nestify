import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  // Date Formatter Helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

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
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 text-white space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#E50914] block">RESIDENT PORTAL</span>
          <h1 className="text-3xl font-black text-white italic tracking-wide mt-0.5">
            My Stays<span className="text-[#E50914] not-italic">.</span>
          </h1>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            Manage your room keys, extend stay duration, and raise direct maintenance tickets.
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-black px-3.5 py-1.5 rounded-full uppercase shadow-sm">
          {bookings.length} {bookings.length === 1 ? 'Stay' : 'Stays'}
        </div>
      </div>

      {/* Booking Cards (Landscape Layout) */}
      {bookings.length === 0 ? (
        <div className="bg-[#141414] rounded-3xl border border-neutral-800 p-12 sm:p-16 text-center space-y-4 max-w-lg mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914] flex items-center justify-center mx-auto">
            <Calendar size={28} />
          </div>
          <h3 className="text-2xl font-black italic tracking-tight text-white">No active bookings yet</h3>
          <p className="text-xs text-neutral-400 font-medium leading-relaxed max-w-sm mx-auto">
            You don't have any stays booked right now. Explore audited rooms, student housing, and verified coliving suites across India.
          </p>
          <div className="pt-2">
            <Link 
              to="/search" 
              className="btn-red-glow inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow"
            >
              Browse Stays <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(book => {
            const propertyId = book.property?._id || book.property;
            const propertyLink = propertyId ? `/property/${propertyId}` : '#';

            return (
              <div 
                key={book._id} 
                className="bg-[#141414] rounded-2xl border border-neutral-800 p-4 sm:p-5 shadow-2xl overflow-hidden hover:border-neutral-700 transition-all duration-300 flex flex-col md:flex-row gap-5 group"
              >
                {/* 1. Thumbnail */}
                <Link 
                  to={propertyLink}
                  className="block relative w-full md:w-56 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 cursor-pointer"
                  title="Click to view property details"
                >
                  <img 
                    src={book.property?.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    alt={book.property?.title || 'Property'} 
                  />

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow ${
                      book.status === 'CONFIRMED' ? 'bg-[#E50914] text-white' : 
                      book.status === 'CHECKED_IN' ? 'bg-emerald-500 text-black' : 
                      book.status === 'COMPLETED' ? 'bg-neutral-900 text-neutral-400 border border-neutral-700' : 'bg-neutral-900 text-white'
                    }`}>
                      {book.status === 'COMPLETED' ? 'CHECKED OUT' : book.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Booking Reference Pill */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <span className="text-[9px] font-mono text-neutral-300 bg-black/70 px-2 py-0.5 rounded border border-white/10 font-bold">
                      #{book._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </Link>

                {/* 2. Details & Options */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  
                  {/* Header: Title & Total Paid */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link 
                        to={propertyLink}
                        className="inline-block group/link"
                        title="Click to view property details"
                      >
                        <h3 className="text-xl font-black italic text-white group-hover/link:text-[#E50914] transition line-clamp-1 cursor-pointer">
                          {book.property?.title || 'Audited Stay'}
                        </h3>
                      </Link>
                      <p className="text-neutral-400 font-medium flex items-center gap-1 text-xs mt-0.5">
                        <MapPin size={13} className="text-[#E50914] shrink-0" /> 
                        <span>{book.property?.location?.city || 'City'}, {book.property?.location?.state || 'State'}</span>
                      </p>

                      {/* Dates & Unit Meta Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-300 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800 text-xs">
                          <Calendar size={13} className="text-[#E50914] shrink-0" />
                          <span>
                            {formatDate(book.checkInDate)} → {formatDate(book.checkOutDate)}
                          </span>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 px-2 py-1 rounded text-neutral-400 font-bold text-[10px]">
                          UNIT: <strong className="text-white">{book.room?.roomType || 'Standard'}</strong>
                        </div>

                        {book.extensions?.length > 0 && (
                          <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-950/70 px-2 py-1 rounded border border-emerald-500/40">
                            <CalendarPlus size={11} />
                            <span>Extended (+{book.extensions.length}x)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total Rent Paid */}
                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-neutral-400 font-bold uppercase block">TOTAL PAID</span>
                      <span className="text-xl font-black text-white italic">
                        ₹{book.totalAmount ? book.totalAmount.toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center gap-2">
                    {/* 1. EXTEND RENT / STAY */}
                    {(book.status === 'CHECKED_IN' || book.status === 'CONFIRMED') && (
                      <button 
                        onClick={() => setSelectedExtendBooking(book)}
                        className="bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <CalendarPlus size={13} /> EXTEND STAY
                      </button>
                    )}

                    {/* 2. VIEW RECEIPT */}
                    <button 
                      onClick={() => setSelectedReceiptBooking(book)}
                      className="btn-red-glow text-white text-xs font-bold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 shadow cursor-pointer"
                    >
                      <Receipt size={13} /> RECEIPT
                    </button>

                    {/* 3. CHAT WITH OWNER */}
                    <button 
                      onClick={() => handleChatWithLandlord(book)}
                      disabled={chatLoadingId === book._id}
                      className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                    >
                      {chatLoadingId === book._id ? (
                        <Loader2 size={13} className="animate-spin text-[#E50914]" />
                      ) : (
                        <MessageSquare size={13} />
                      )}
                      <span>
                        {book.property?.owner?.firstName 
                          ? `Chat with ${book.property.owner.firstName}`
                          : 'Chat with Host'}
                      </span>
                    </button>

                    {/* 4. IN-STAY MAINTENANCE TICKETS */}
                    {book.status === 'CHECKED_IN' && (
                      <>
                        <button 
                          onClick={() => { setShowIssueModal(book); setIssueData({ type: 'WIFI', desc: '', priority: 'MEDIUM' }); }}
                          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Wrench size={13} className="text-[#E50914]" /> Raise Issue
                        </button>
                        <button 
                          onClick={() => fetchAndShowTickets(book)} 
                          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Search size={13} /> Issues
                        </button>
                      </>
                    )}

                    {/* 5. RATE STAY OR TICKETS HISTORY */}
                    {book.status === 'COMPLETED' && (
                      <>
                        <button 
                          onClick={() => setShowReviewModal(book)}
                          className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <Star size={13} fill="currentColor" /> Rate Stay
                        </button>
                        <button 
                          onClick={() => fetchAndShowTickets(book)} 
                          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Search size={13} /> History
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
          );
        })}
        </div>
      )}

      {/* MODAL: QUERY TRACKER */}
      {showTracker && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowTracker(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] border border-neutral-800 text-white w-full max-w-lg rounded-3xl p-6 sm:p-8 max-h-[88vh] overflow-y-auto no-scrollbar relative animate-in zoom-in-95 duration-200 shadow-2xl space-y-5"
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-neutral-800">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[#E50914] tracking-widest mb-1">
                  <Wrench size={12} className="text-[#E50914]" /> Grievance Tracker
                </span>
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-wide text-white">
                  Issue Hub.
                </h3>
                <p className="text-xs font-semibold text-neutral-400 mt-0.5">
                  Live query status & updates from owner
                </p>
              </div>
              <button 
                onClick={() => setShowTracker(false)} 
                className="p-2.5 bg-neutral-900 text-neutral-300 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Close Issue Hub"
              >
                <X size={18}/>
              </button>
            </div>

            {/* Queries List */}
            <div className="space-y-3.5">
              {activeTickets.length > 0 ? activeTickets.map(t => (
                <div 
                  key={t._id} 
                  className="p-4 sm:p-4.5 bg-[#202020] rounded-2xl border border-[#2d2d2d] hover:border-primary/40 transition space-y-3 shadow-md"
                >
                  {/* Top Bar of Query Card */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase text-white bg-black/60 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                        {t.issueType === 'WIFI' ? <Wifi size={10} className="text-primary"/> : t.issueType === 'ELECTRIC' ? <Zap size={10} className="text-amber-400"/> : <Wrench size={10} className="text-primary"/>}
                        {t.issueType}
                      </span>
                      {t.priority && (
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                          t.priority === 'HIGH' ? 'bg-red-950/60 text-red-400 border-red-800/40' :
                          t.priority === 'MEDIUM' ? 'bg-amber-950/60 text-amber-400 border-amber-800/40' :
                          'bg-blue-950/60 text-blue-400 border-blue-800/40'
                        }`}>
                          {t.priority}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-gray-400 font-bold">
                        #{t._id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                      t.status === 'RESOLVED' 
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800/50 animate-pulse'
                    }`}>
                      {t.status === 'RESOLVED' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      {t.status === 'RESOLVED' ? 'Solved' : 'In Progress'}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-gray-200 leading-relaxed bg-[#181818] p-3 rounded-xl border border-white/5 font-medium">
                    "{t.description}"
                  </p>
                  
                  {/* Resolution note */}
                  {t.resolutionNote && (
                    <div className="bg-emerald-950/30 border-l-3 border-emerald-500 p-2.5 rounded-r-xl text-xs space-y-1">
                      <p className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <MessageSquare size={11}/> Owner Reply & Resolution:
                      </p>
                      <p className="text-xs text-gray-300 italic font-medium leading-relaxed">
                        "{t.resolutionNote}"
                      </p>
                    </div>
                  )}

                  {/* Rating Section */}
                  {t.status === 'RESOLVED' && !t.userRating && (
                    <div className="p-2.5 bg-[#181818] rounded-xl border border-dashed border-[#333] flex items-center justify-between gap-2">
                      <p className="text-[9px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                        <Star size={11} fill="currentColor" /> Rate Resolution
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={16} 
                            className="cursor-pointer transition hover:scale-125" 
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
                    <div className="flex items-center justify-between bg-[#181818] px-3 py-1.5 rounded-xl border border-white/5 text-xs">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Your Rating</span>
                      <div className="flex text-amber-400 gap-1">
                        {[...Array(t.userRating)].map((_, i) => <Star key={i} size={13} fill="currentColor"/>)}
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-12 bg-[#202020] rounded-2xl border border-[#2a2a2a] space-y-2">
                  <Clock size={36} className="mx-auto text-gray-500"/>
                  <p className="font-black uppercase text-xs tracking-wider text-gray-300">No queries raised yet</p>
                  <p className="text-[11px] text-gray-500">Need help? Raise a maintenance ticket from your booking card.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RAISE TICKET */}
      {showIssueModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowIssueModal(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] border border-neutral-800 text-white w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-5 relative animate-in zoom-in-95 duration-200 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex justify-between items-start pb-3 border-b border-neutral-800">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#E50914] tracking-widest mb-1">
                  <Wrench size={12} className="text-[#E50914]"/> Maintenance Request
                </span>
                <h3 className="text-2xl font-black italic tracking-wide text-white leading-none">
                  Raise Ticket.
                </h3>
                <p className="text-xs font-semibold text-neutral-400 mt-1 truncate max-w-xs">
                  {showIssueModal.property?.title} ({showIssueModal.room?.roomType || 'Room'})
                </p>
              </div>
              <button 
                onClick={() => setShowIssueModal(null)} 
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
                aria-label="Close ticket modal"
              >
                <X size={18}/>
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Issue Category</label>
              <div className="grid grid-cols-3 gap-2">
                {['WIFI', 'PLUMBING', 'CLEANING', 'ELECTRIC', 'OTHER'].map(t => (
                  <button 
                    key={t} 
                    type="button"
                    onClick={() => setIssueData({...issueData, type: t})} 
                    className={`py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      issueData.type === t 
                        ? 'btn-netflix shadow-md' 
                        : 'bg-[#222222] text-gray-300 border border-[#303030] hover:text-white hover:bg-[#2c2c2c]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Priority Level</label>
              <div className="flex gap-2">
                {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setIssueData({...issueData, priority: p})}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                      issueData.priority === p 
                        ? (p === 'HIGH' ? 'bg-primary text-white shadow-md' : p === 'MEDIUM' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white') 
                        : 'bg-[#222222] text-gray-400 border border-[#303030]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Describe the issue</label>
              <textarea 
                className="w-full bg-[#222222] border border-[#303030] p-3.5 rounded-2xl text-xs font-medium outline-none h-28 text-white placeholder-gray-500 focus:border-primary transition-all resize-none" 
                placeholder="What seems to be broken? E.g. Hot water geyser not working..."
                value={issueData.desc}
                onChange={(e) => setIssueData({...issueData, desc: e.target.value})}
              />
            </div>

            <button 
              onClick={handleIssueSubmit} 
              disabled={submittingIssue}
              className="w-full btn-red-glow py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submittingIssue ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
              <span>Send Ticket to Owner</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: RATE STAY */}
      {showReviewModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowReviewModal(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] border border-neutral-800 text-white w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-y-auto max-h-[90vh] no-scrollbar shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-start pb-3 border-b border-neutral-800">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[#E50914] tracking-widest mb-1">
                  <ShieldCheck size={12} className="text-[#E50914]"/> Resident Feedback
                </span>
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-wide text-white">
                  Rate Your Stay.
                </h3>
              </div>
              <button 
                onClick={() => setShowReviewModal(null)} 
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <X size={18}/>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.keys(reviewData.ratings).map(key => (
                <div key={key} className="bg-[#222222] p-3 rounded-xl border border-[#2f2f2f]">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1.5">{key}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} size={18} 
                        className={`cursor-pointer transition-all hover:scale-110 ${s <= reviewData.ratings[key] ? 'text-amber-400 fill-current' : 'text-gray-600'}`}
                        onClick={() => setReviewData({...reviewData, ratings: {...reviewData.ratings, [key]: s}})}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <textarea 
               className="w-full bg-[#222222] border border-[#303030] p-4 rounded-2xl text-xs font-medium outline-none h-28 text-white placeholder-gray-500 focus:border-primary transition-all resize-none" 
               placeholder="What should the next resident know about this stay?"
               value={reviewData.comment}
               onChange={e => setReviewData({...reviewData, comment: e.target.value})}
            />

            <button 
              onClick={handleReviewSubmit} 
              className="w-full btn-netflix py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95 cursor-pointer"
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
            const fresh = updatedBooking?.data || updatedBooking;
            if (fresh?._id) {
              setBookings(prev =>
                prev.map(b => (b._id === fresh._id ? { ...b, ...fresh } : b))
              );
            }
            fetchMyStays();
          }}
        />
      )}
    </div>
  );
};

export default MyBookings;
