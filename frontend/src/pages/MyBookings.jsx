import { useEffect, useState } from 'react';
import API from '../api/client';
import { 
  Calendar, MapPin, Loader2, Wrench, Star, 
  X, Send, ShieldCheck, Wifi, Volume2, Zap, Search, MessageSquare,
  Clock, ChevronRight, CheckCircle2
} from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Visibility States
  const [showIssueModal, setShowIssueModal] = useState(null); 
  const [showReviewModal, setShowReviewModal] = useState(null); 
  const [showTracker, setShowTracker] = useState(false); 
  
  // Data States
  const [activeTickets, setActiveTickets] = useState([]); 
  const [tempRating, setTempRating] = useState(0); // Hover state for stars
  
  // Form States
  const [issueData, setIssueData] = useState({ type: 'WIFI', desc: '', priority: 'MEDIUM' });
  const [reviewData, setReviewData] = useState({
    ratings: { cleanliness: 5, maintenance: 5, safety: 5, services: 5 },
    comment: '',
    safetySignals: { noiseLevel: 'Moderate', internetSpeed: 'Good', powerBackupReliability: true }
  });

  // 󾠮 Fetch user's booking history
  const fetchMyStays = async () => {
    try {
      const { data } = await API.get('/bookings/my-bookings');
      setBookings(data.data);
    } catch (err) {
      console.error("Fetch Stays Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 󾠯 Fetch maintenance queries for a specific property
  const fetchAndShowTickets = async (book) => {
    try {
      const { data } = await API.get(`/maintenance/my-tickets/${book.property._id}`);
      setActiveTickets(data.data);
      setShowTracker(true);
    } catch (err) {
      alert("Could not load tracking data.");
    }
  };

  useEffect(() => { fetchMyStays(); }, []);

  // 󾠰 Submit new Maintenance Ticket
  const handleIssueSubmit = async () => {
    try {
      await API.post('/maintenance', {
        propertyId: showIssueModal.property._id,
        issueType: issueData.type,
        description: issueData.desc,
        priority: issueData.priority
      });
      alert("Request Sent! The manager has been notified.");
      setShowIssueModal(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to raise ticket");
    }
  };

  // 󾠱 Rate a fixed maintenance issue
  const handleRateTicket = async (ticketId, rating) => {
    try {
      await API.patch(`/maintenance/${ticketId}/rate`, { 
        rating, 
        feedback: "User rated the resolution." 
      });
      alert("Thank you for rating the service!");
      // Refresh the specific tickets list
      if (activeTickets.length > 0) {
        const { data } = await API.get(`/maintenance/my-tickets/${activeTickets[0].property}`);
        setActiveTickets(data.data);
      }
    } catch (err) {
      alert("Failed to save rating.");
    }
  };

  // 󾠲 Submit Property Review
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
      fetchMyStays(); // Refresh to hide 'Rate Stay' button
    } catch (err) {
      alert(err.response?.data?.message || "Review submission failed");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" size={40}/>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-5xl font-black text-gray-900 italic tracking-tighter">My Stays.</h1>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-2">Manage your residency & queries</p>
        </div>
        <div className="bg-gray-100 px-6 py-2 rounded-full text-xs font-black text-gray-400 uppercase">
          {bookings.length} Bookings
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {bookings.map(book => (
          <div key={book._id} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 group">
            <div className="relative h-56">
              <img src={book.property?.images?.[0]?.url || 'https://via.placeholder.com/600x400'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Property" />
              <div className={`absolute top-6 right-6 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl ${
                book.status === 'CONFIRMED' ? 'bg-blue-500 text-white' : 
                book.status === 'CHECKED_IN' ? 'bg-green-500 text-white' : 'bg-gray-900 text-white'
              }`}>
                {book.status.replace('_', ' ')}
              </div>
            </div>
            
            <div className="p-10 space-y-8">
              <div>
                <h3 className="text-3xl font-black text-gray-900 group-hover:text-primary transition">{book.property?.title}</h3>
                <p className="text-gray-400 font-bold flex items-center gap-1 text-sm mt-2 italic">
                  <MapPin size={16}/> {book.property?.location?.city}, {book.property?.location?.state}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-50">
                <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Unit Type</p>
                  <p className="font-black text-gray-700">{book.room?.roomType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Total Paid</p>
                  <p className="font-black text-gray-700 text-xl">₹{book.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-4">
                {book.status === 'CHECKED_IN' && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setShowIssueModal(book); setIssueData({ type: 'WIFI', desc: '', priority: 'MEDIUM' }); }}
                      className="flex-1 bg-red-50 text-red-500 py-4 rounded-[1.5rem] font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition shadow-sm"
                    >
                      <Wrench size={16}/> Raise Query
                    </button>
                    <button 
                      onClick={() => fetchAndShowTickets(book)} 
                      className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-[1.5rem] font-black text-[11px] uppercase border-2 border-blue-100 flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition"
                    >
                      <Search size={16}/> Track Status
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  {book.status === 'COMPLETED' && (
                    <button 
                      onClick={() => setShowReviewModal(book)}
                      className="flex-1 bg-yellow-400 text-white py-4 rounded-[1.5rem] font-black text-[11px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-yellow-100 hover:bg-yellow-500 transition"
                    >
                      <Star size={16} fill="currentColor"/> Rate Stay
                    </button>
                  )}
                  <button className="flex-1 bg-gray-900 text-white py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-primary transition shadow-xl">
                    View Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 󾠳 MODAL: QUERY TRACKER */}
      {showTracker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 max-h-[85vh] overflow-y-auto relative animate-in zoom-in duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-4xl font-black italic tracking-tighter text-gray-900">Issue Hub.</h3>
              <button onClick={() => setShowTracker(false)} className="p-3 bg-gray-100 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
            </div>

            <div className="space-y-8">
              {activeTickets.length > 0 ? activeTickets.map(t => (
                <div key={t._id} className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-white px-3 py-1 rounded-lg border border-primary/10">{t.issueType}</span>
                      <p className="text-[9px] font-bold text-gray-300 mt-3 uppercase tracking-tighter">Ticket ID: #{t._id.slice(-6)}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-2xl shadow-sm ${t.status === 'RESOLVED' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}>
                      {t.status}
                    </span>
                  </div>
                  
                  <p className="text-lg font-bold text-gray-700 leading-snug mb-8">"{t.description}"</p>
                  
                  {/* MANAGER RESOLUTION RESPONSE */}
                  {t.resolutionNote && (
                    <div className="mt-6 p-8 bg-white rounded-[2.5rem] border-l-[10px] border-primary shadow-inner">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-3 flex items-center gap-2">
                        <MessageSquare size={14}/> Manager's Response
                      </p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{t.resolutionNote}"</p>
                    </div>
                  )}

                  {/* USER RATING FOR THE FIX */}
                  {t.status === 'RESOLVED' && !t.userRating && (
                    <div className="mt-8 p-8 bg-yellow-50 rounded-[2.5rem] border-2 border-dashed border-yellow-200 text-center animate-pulse-slow">
                      <p className="text-[11px] font-black uppercase text-yellow-700 mb-4 tracking-widest">How was the fix?</p>
                      <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} size={28} 
                            className="cursor-pointer transition-all hover:scale-125 active:scale-90" 
                            fill={star <= (tempRating || 0) ? "#f1c40f" : "none"}
                            color={star <= (tempRating || 0) ? "#f1c40f" : "#cbd5e1"}
                            onMouseEnter={() => setTempRating(star)}
                            onMouseLeave={() => setTempRating(0)}
                            onClick={() => handleRateTicket(t._id, star)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {t.userRating && (
                    <div className="mt-8 flex flex-col items-center gap-2 bg-white/40 py-4 rounded-[2rem]">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">You Rated This Fix</span>
                      <div className="flex text-yellow-400 gap-1">
                        {[...Array(t.userRating)].map((_, i) => <Star key={i} size={18} fill="currentColor"/>)}
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-24 opacity-20">
                  <Clock size={64} className="mx-auto mb-4"/>
                  <p className="font-black uppercase text-sm tracking-widest">No queries raised yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 󾠴 MODAL: RAISE QUERY */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 space-y-8 relative animate-in zoom-in duration-200 shadow-2xl">
            <button onClick={() => setShowIssueModal(null)} className="absolute top-10 right-10 text-gray-300 hover:text-gray-900 transition-colors"><X size={24}/></button>
            <h3 className="text-4xl font-black italic tracking-tighter text-gray-900 leading-none">Support.</h3>
            <p className="text-xs font-bold text-gray-400">Reporting issue for {showIssueModal.property?.title}</p>
            
            <div className="grid grid-cols-2 gap-3">
              {['WIFI', 'PLUMBING', 'CLEANING', 'ELECTRIC'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setIssueData({...issueData, type: t})} 
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${issueData.type === t ? 'bg-primary text-white shadow-xl scale-105' : 'bg-gray-50 text-gray-400 border border-transparent'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <textarea 
              className="w-full bg-gray-50 p-8 rounded-[2.5rem] text-sm font-medium outline-none h-40 border-2 border-transparent focus:border-primary transition-all resize-none" 
              placeholder="Tell us what's wrong..."
              onChange={(e) => setIssueData({...issueData, desc: e.target.value})}
            />

            <button 
              onClick={handleIssueSubmit} 
              className="w-full bg-gray-900 text-white py-6 rounded-3xl font-black text-lg uppercase flex items-center justify-center gap-3 hover:bg-primary transition-all shadow-xl active:scale-95"
            >
              <Send size={20}/> Send Ticket
            </button>
          </div>
        </div>
      )}

      {/* 󾠵 MODAL: RATE STAY (Verified Property Review) */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-14 space-y-10 relative overflow-y-auto max-h-[90vh] shadow-2xl">
            <button onClick={() => setShowReviewModal(null)} className="absolute top-12 right-12 text-gray-300 hover:text-gray-900 transition-colors"><X size={28}/></button>
            <div>
              <h3 className="text-5xl font-black italic tracking-tighter text-gray-900">Experience.</h3>
              <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} className="text-blue-500"/> Verified Resident Review</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {Object.keys(reviewData.ratings).map(key => (
                <div key={key}>
                  <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-3">{key}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} size={24} 
                        className={`cursor-pointer transition-all hover:scale-110 ${s <= reviewData.ratings[key] ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                        onClick={() => setReviewData({...reviewData, ratings: {...reviewData.ratings, [key]: s}})}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <textarea 
               className="w-full bg-gray-50 p-10 rounded-[3rem] text-base font-medium outline-none h-48 border-2 border-transparent focus:border-primary transition-all resize-none" 
               placeholder="What should the next resident know?"
               onChange={e => setReviewData({...reviewData, comment: e.target.value})}
            />

            <button 
              onClick={handleReviewSubmit} 
              className="w-full bg-gray-900 text-white py-7 rounded-[2.5rem] font-black text-2xl hover:bg-primary transition-all shadow-2xl active:scale-95"
            >
              Post Verified Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;