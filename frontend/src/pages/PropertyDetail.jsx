import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import API from '../api/client';
import { 
  Star, MapPin, Loader2, Info, Check, Users, Shield, 
  Calendar, ArrowRight, ShieldCheck, Loader, AlertCircle,
  MessageSquare, Edit3, Wifi, Volume2, ShieldCheck as VerifiedIcon
} from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { setSelectedChat, setIsChatOpen } = useChat();
  
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [dates, setDates] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  const fetchPropertyData = async () => {
    try {
      const [propRes, reviewRes] = await Promise.all([
        API.get(`/properties/${id}`, {
          params: { checkIn: dates.checkIn, checkOut: dates.checkOut }
        }),
        API.get(`/reviews/${id}`).catch(() => ({ data: { data: [] } }))
      ]);
      
      setProperty(propRes.data.data);
      setReviews(reviewRes.data.data);
      
      if (!selectedRoom) {
        const firstAvailable = propRes.data.data.rooms?.find(r => r.availableUnitsForDates > 0);
        if (firstAvailable) setSelectedRoom(firstAvailable);
      } else {
        const updatedSelected = propRes.data.data.rooms?.find(r => r._id === selectedRoom._id);
        setSelectedRoom(updatedSelected);
      }
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, [id, dates.checkIn, dates.checkOut]);

  const stayDays = Math.ceil(Math.abs(new Date(dates.checkOut) - new Date(dates.checkIn)) / (1000 * 60 * 60 * 24)) || 1;
  const isOwner = user?._id === (property?.owner?._id || property?.owner);

  const handleBookingInit = async () => {
    if (!user) return navigate('/login', { state: { from: `/property/${id}` } });
    if (!selectedRoom) return alert("Please select a room type");

    setCheckingAvailability(true);
    try {
      await API.post('/bookings/initiate', {
        roomId: selectedRoom._id,
        checkInDate: dates.checkIn,
        checkOutDate: dates.checkOut
      });

      navigate(`/booking/confirm/${id}`, { 
        state: { property, room: selectedRoom, checkIn: dates.checkIn, checkOut: dates.checkOut, days: stayDays } 
      });
    } catch (err) {
      alert(err.response?.data?.message || "Selected dates are no longer available.");
      fetchPropertyData();
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleChatWithOwner = async () => {
    if (!user) return navigate('/login', { state: { from: `/property/${id}` } });
    const ownerId = property?.owner?._id || property?.owner;
    if (!ownerId) return alert("Owner details are not available yet.");
    if (ownerId.toString() === user._id.toString()) return alert("You are the manager/owner of this property.");

    try {
      const { data } = await API.post('/chat/access', { 
        receiverId: ownerId.toString(), 
        propertyId: property._id 
      });
      setSelectedChat(data.data);
      setIsChatOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || "Could not start chat with owner.");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#141414]">
      <Loader2 className="animate-spin text-primary mb-4" size={48}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Loading Real-Time Inventory</p>
    </div>
  );

  if (!property) return <div className="h-screen flex items-center justify-center font-black uppercase text-gray-400 bg-[#141414]">Property Not Found</div>;

  return (
    <div className="bg-[#141414] text-white min-h-screen pb-20">
      {/* HERO SECTION */}
      <section className="relative h-[60vh] pt-20 overflow-hidden rounded-[3rem] border border-[#262626] shadow-2xl">
        <img src={property.images?.[0]?.url || 'https://via.placeholder.com/1200x600'} className="w-full h-full object-cover" alt={property.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/50 to-black/30" />
        <div className="absolute bottom-10 left-10 text-white">
          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter leading-none">{property.title}</h1>
          <p className="flex items-center gap-2 font-bold mt-2 text-gray-300">
            <MapPin size={18} className="text-primary"/> {property.location?.address}, {property.location?.city}
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-12 mt-12">
        <div className="space-y-12">
          {/* ABOUT SECTION */}
          <section className="bg-[#181818] p-8 sm:p-10 rounded-[3.5rem] shadow-xl border border-[#2a2a2a] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
             <div>
               <h3 className="text-2xl font-black text-white italic mb-2">About this stay</h3>
               <p className="text-gray-400 font-medium max-w-xl leading-relaxed">{property.description}</p>
             </div>
             <div className="text-center bg-[#242424] p-6 rounded-[2.5rem] border border-[#333333] shrink-0">
                <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-3xl italic">
                   <Star size={24} fill="currentColor"/> {property.averageRating || "0.0"}
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 mt-1 tracking-widest">Global Rating</p>
             </div>
          </section>

          {/* ROOM MATRIX */}
          <section className="space-y-6">
            <h3 className="text-3xl font-black italic tracking-tighter text-white px-4">Available Units</h3>
            <div className="space-y-4">
              {property.rooms?.map(room => {
                const isSoldOut = room.availableUnitsForDates <= 0;
                const isSelected = selectedRoom?._id === room._id;
                return (
                  <div 
                    key={room._id} 
                    onClick={() => !isSoldOut && setSelectedRoom(room)}
                    className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#181818] ${
                      isSoldOut ? 'opacity-40 grayscale cursor-not-allowed bg-[#141414] border-[#222]' :
                      isSelected ? 'border-primary ring-4 ring-primary/20 shadow-xl' : 'border-[#2a2a2a] hover:border-primary/40'
                    }`}
                  >
                    <div className="flex gap-6 items-center">
                      <img src={room.images?.[0]?.url || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-[2rem] object-cover border border-[#333]" />
                      <div>
                        <h4 className="text-xl font-black text-white">{room.roomType}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1 bg-[#222] px-2.5 py-1 rounded-lg border border-[#333]"><Users size={12}/> Max {room.capacity}</span>
                          {isSoldOut ? (
                            <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                              <AlertCircle size={10}/> Sold Out
                            </span>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${room.availableUnitsForDates < 3 ? 'bg-amber-950/40 text-amber-400 border-amber-800/40' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'}`}>
                                {room.availableUnitsForDates} of {room.totalInventory || 1} Units Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-black text-white font-mono">₹{room.basePrice}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase">per 24 hrs</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* VERIFIED REVIEWS SECTION */}
          <section className="space-y-6 pt-6">
            <h3 className="text-3xl font-black italic tracking-tighter text-white px-4">Verified Resident Reviews</h3>
            <div className="grid grid-cols-1 gap-6">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review._id} className="bg-[#181818] p-8 sm:p-10 rounded-[3rem] border border-[#2a2a2a] shadow-xl relative group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center font-black text-primary border border-primary/30">
                        {review.user?.firstName?.[0]}
                      </div>
                      <div>
                        <p className="font-black text-white flex items-center gap-2">
                          {review.user?.firstName} {review.user?.lastName}
                          {review.isVerifiedStay && <VerifiedIcon size={14} className="text-primary" />}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resident Review</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="flex gap-1 text-amber-400 mb-1">
                         {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= (review.ratings.cleanliness + review.ratings.maintenance + review.ratings.safety + review.ratings.services)/4 ? "currentColor" : "none"} />)}
                       </div>
                       <p className="text-[9px] font-black text-gray-400 uppercase">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 font-medium leading-relaxed italic">"{review.comment}"</p>
                  
                  {/* Edit Option if the current user is the author */}
                  {user?._id === review.user?._id && (
                    <button 
                      onClick={() => navigate('/my-bookings')} 
                      className="mt-6 flex items-center gap-2 text-primary font-black text-[10px] uppercase hover:underline cursor-pointer"
                    >
                      <Edit3 size={14}/> Edit My Review
                    </button>
                  )}
                </div>
              )) : (
                <div className="text-center py-20 bg-[#181818] rounded-[3rem] border border-[#282828]">
                  <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No reviews for this property yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside>
          {!isOwner ? (
            <div className="sticky top-28 bg-[#181818] p-8 sm:p-10 rounded-[3.5rem] shadow-2xl border border-[#2a2a2a] space-y-8 animate-in slide-in-from-bottom duration-500 text-white">
              <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Stay Period</h4>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#242424] rounded-2xl border border-[#333333]">
                       <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Check-In</label>
                       <input type="date" className="w-full bg-transparent font-bold text-xs outline-none text-white cursor-pointer" min={new Date().toISOString().split('T')[0]} value={dates.checkIn} onChange={e => setDates({...dates, checkIn: e.target.value})}/>
                    </div>
                    <div className="p-4 bg-[#242424] rounded-2xl border border-[#333333]">
                       <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Check-Out</label>
                       <input type="date" className="w-full bg-transparent font-bold text-xs outline-none text-white cursor-pointer" min={dates.checkIn} value={dates.checkOut} onChange={e => setDates({...dates, checkOut: e.target.value})}/>
                    </div>
                 </div>
              </div>

              {selectedRoom && (
                <div className="space-y-6 pt-6 border-t border-[#282828]">
                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase">{selectedRoom.roomType} x {stayDays} Days</p>
                        <p className={`text-4xl font-black italic tracking-tighter font-mono ${selectedRoom.availableUnitsForDates <= 0 ? 'text-gray-500' : 'text-white'}`}>
                            ₹{(selectedRoom.basePrice * stayDays + 149).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 italic">Total</p>
                   </div>
                   <button 
                    disabled={checkingAvailability || selectedRoom.availableUnitsForDates <= 0}
                    onClick={handleBookingInit} 
                    className="w-full btn-netflix py-5 rounded-3xl font-black text-lg transition shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                   >
                      {checkingAvailability ? <Loader className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                      {selectedRoom.availableUnitsForDates <= 0 ? 'Room Sold Out' : checkingAvailability ? 'Verifying...' : 'Confirm & Pay'}
                   </button>

                   <button 
                     type="button"
                     onClick={handleChatWithOwner}
                     className="w-full btn-netflix-secondary py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                   >
                     <MessageSquare size={16} /> Chat with Owner
                   </button>
                </div>
              )}
            </div>
          ) : (
            <div className="sticky top-28 bg-[#181818] text-white p-10 rounded-[3.5rem] border border-[#2a2a2a] text-center space-y-6">
               <ShieldCheck size={48} className="text-primary mx-auto"/>
               <h4 className="text-2xl font-black italic">Owner Dashboard</h4>
               <p className="text-gray-400 text-xs font-bold leading-relaxed px-4">You are the manager of this building. Please manage inventory from your portal.</p>
               <button onClick={() => navigate('/owner/dashboard')} className="w-full btn-netflix py-4 rounded-2xl font-black">Open Analytics</button>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default PropertyDetail;
