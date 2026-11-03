import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import API from '../api/client';
import { 
  Star, MapPin, Loader2, Check, Users, Shield, 
  Calendar, ShieldCheck, Loader, AlertCircle, Heart,
  MessageSquare, Edit3, Wifi, Volume2, ShieldCheck as VerifiedIcon,
  ChevronLeft, ChevronRight, Maximize2, X, Share2, CheckCircle2,
  Wind, Coffee, Zap, Shirt, Sparkles, Droplets, Building, Tv,
  Flame, ArrowLeft, Bed, Clock, Award, Info
} from 'lucide-react';
import CustomDatePicker from '../components/common/CustomDatePicker';

// Fallback high-res curated photography for PG and Coliving spaces
const FALLBACK_PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80'
];

const FALLBACK_ROOM_IMAGES = {
  SUITE: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  ],
  PREMIUM: [
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'
  ],
  DELUXE: [
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=800&q=80'
  ],
  CLASSIC: [
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  ]
};

const extractImageUrl = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.url || item.secure_url || '';
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isWishlisted, toggleWishlist } = useContext(AuthContext);
  const { setSelectedChat, setIsChatOpen } = useChat();
  
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Multi-photo slider states
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [roomImageIndices, setRoomImageIndices] = useState({});
  const [copiedShare, setCopiedShare] = useState(false);

  const [dates, setDates] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  const fetchPropertyData = useCallback(async () => {
    try {
      const [propRes, reviewRes] = await Promise.all([
        API.get(`/properties/${id}`, {
          params: { checkIn: dates.checkIn, checkOut: dates.checkOut }
        }),
        API.get(`/reviews/${id}`).catch(() => ({ data: { data: [] } }))
      ]);
      
      setProperty(propRes.data.data);
      setReviews(reviewRes.data.data || []);
      
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
  }, [id, dates.checkIn, dates.checkOut, selectedRoom]);

  useEffect(() => {
    fetchPropertyData();
  }, [id, dates.checkIn, dates.checkOut]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNextHero();
      if (e.key === 'ArrowLeft') handlePrevHero();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, property]);

  const stayDays = Math.max(
    1,
    Math.ceil(Math.abs(new Date(dates.checkOut) - new Date(dates.checkIn)) / (1000 * 60 * 60 * 24))
  ) || 1;

  const isOwner = user?._id === (property?.owner?._id || property?.owner);

  // Property photos list with fallback
  const rawPropertyImages = (property?.images || []).map(extractImageUrl).filter(Boolean);
  const propertyImages = rawPropertyImages.length > 0 ? rawPropertyImages : FALLBACK_PROPERTY_IMAGES;

  const handlePrevHero = () => {
    setCurrentHeroIdx(prev => (prev - 1 + propertyImages.length) % propertyImages.length);
  };

  const handleNextHero = () => {
    setCurrentHeroIdx(prev => (prev + 1) % propertyImages.length);
  };

  const getRoomImages = (room) => {
    const raw = (room?.images || []).map(extractImageUrl).filter(Boolean);
    if (raw.length > 0) return raw;
    return FALLBACK_ROOM_IMAGES[room?.roomType] || FALLBACK_ROOM_IMAGES.CLASSIC;
  };

  const handlePrevRoomImage = (e, roomId, total) => {
    e.stopPropagation();
    setRoomImageIndices(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) - 1 + total) % total
    }));
  };

  const handleNextRoomImage = (e, roomId, total) => {
    e.stopPropagation();
    setRoomImageIndices(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) + 1) % total
    }));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

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
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-[#262626] border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 blur-sm" />
        </div>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mt-6 animate-pulse">
        Syncing Real-Time Inventory & Amenities
      </p>
    </div>
  );

  if (!property) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#141414] text-white px-4 text-center">
      <AlertCircle size={48} className="text-primary mb-4" />
      <h2 className="text-2xl font-black italic mb-2">Property Not Found</h2>
      <p className="text-gray-400 text-sm mb-6">The stay you are looking for does not exist or is no longer listed.</p>
      <Link to="/" className="btn-netflix px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider">
        Explore Properties
      </Link>
    </div>
  );

  // Amenity icon lookup
  const getAmenityIcon = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return <Wifi size={18} className="text-primary" />;
    if (lower.includes('ac') || lower.includes('air')) return <Wind size={18} className="text-primary" />;
    if (lower.includes('food') || lower.includes('meal') || lower.includes('mess')) return <Coffee size={18} className="text-primary" />;
    if (lower.includes('power') || lower.includes('backup') || lower.includes('inverter')) return <Zap size={18} className="text-primary" />;
    if (lower.includes('laundry') || lower.includes('wash')) return <Shirt size={18} className="text-primary" />;
    if (lower.includes('clean') || lower.includes('housekeep')) return <Sparkles size={18} className="text-primary" />;
    if (lower.includes('ro') || lower.includes('water')) return <Droplets size={18} className="text-primary" />;
    if (lower.includes('lift') || lower.includes('elevator')) return <Building size={18} className="text-primary" />;
    if (lower.includes('tv')) return <Tv size={18} className="text-primary" />;
    if (lower.includes('geyser') || lower.includes('heater')) return <Flame size={18} className="text-primary" />;
    return <ShieldCheck size={18} className="text-primary" />;
  };

  const defaultAmenities = property.amenities && property.amenities.length > 0 
    ? property.amenities 
    : ['High-Speed WiFi', 'Air Conditioned', 'Power Backup', 'Daily Housekeeping', 'RO Water Purifier', 'CCTV Security', 'Attached Bath'];

  return (
    <div className="bg-[#141414] text-white min-h-screen pb-24 selection:bg-primary selection:text-white">
      {/* TOP SUB-NAV / BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between text-xs text-gray-400">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-wider text-[11px]">Back to stays</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="bg-[#202020] border border-[#2e2e2e] text-gray-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            {property.category || 'PG / Coliving'}
          </span>
          <span className="hidden sm:inline text-gray-500">•</span>
          <span className="hidden sm:inline text-gray-400 font-semibold">{property.location?.city}</span>
        </div>
      </div>

      {/* HERO SECTION WITH MULTI-PHOTO SLIDING CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative h-[55vh] sm:h-[65vh] w-full overflow-hidden rounded-[2.5rem] border border-[#262626] shadow-2xl bg-[#181818] group">
          {/* Main Slide Image */}
          <img 
            key={currentHeroIdx}
            src={propertyImages[currentHeroIdx]} 
            alt={`${property.title} - Photo ${currentHeroIdx + 1}`}
            className="w-full h-full object-cover transition-all duration-700 ease-out transform group-hover:scale-[1.02]"
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/40 to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 pointer-events-none" />

          {/* Top Controls: Badges & Action Buttons */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
            {/* Tier & Gender Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/90 backdrop-blur-md text-white border border-primary/40 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-950/40 flex items-center gap-1.5">
                <Award size={12} /> {property.tier || 'FLAGSHIP'}
              </span>

              <span className="bg-black/70 backdrop-blur-md text-gray-200 border border-white/10 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                {property.genderPreference === 'MALE' ? 'Boys PG' : property.genderPreference === 'FEMALE' ? 'Girls Only PG' : 'Unisex Coliving'}
              </span>

              {property.verificationStatus === 'VERIFIED' && (
                <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <VerifiedIcon size={12} /> Audited Stay
                </span>
              )}
            </div>

            {/* Top Right Actions: Photo count, Lightbox, Share, Wishlist */}
            <div className="flex items-center gap-2">
              {/* Photo Counter Pill */}
              <button 
                onClick={() => setIsLightboxOpen(true)}
                className="bg-black/70 hover:bg-black/90 backdrop-blur-md text-white border border-white/15 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="View Fullscreen Gallery"
              >
                <Maximize2 size={13} className="text-primary" />
                <span>{currentHeroIdx + 1} / {propertyImages.length}</span>
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-xl bg-black/70 hover:bg-white hover:text-black text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition cursor-pointer relative"
                title="Share Property"
              >
                {copiedShare ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                {copiedShare && (
                  <span className="absolute -bottom-8 bg-[#202020] text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-lg border border-[#333]">
                    Copied!
                  </span>
                )}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => {
                  if (!user) return navigate('/login', { state: { from: `/property/${id}` } });
                  toggleWishlist(property._id);
                }}
                className={`w-10 h-10 rounded-xl backdrop-blur-md transition-all flex items-center justify-center shadow-2xl cursor-pointer ${
                  isWishlisted(property._id)
                    ? 'btn-netflix shadow-red-950/60'
                    : 'bg-black/70 hover:bg-white hover:text-primary text-white border border-white/15'
                }`}
                title={isWishlisted(property._id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
              >
                <Heart size={18} fill={isWishlisted(property._id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Left Arrow Button for Sliding */}
          {propertyImages.length > 1 && (
            <button 
              onClick={handlePrevHero}
              aria-label="Previous image"
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-primary text-white border border-white/10 hover:border-primary flex items-center justify-center backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-20 cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Right Arrow Button for Sliding */}
          {propertyImages.length > 1 && (
            <button 
              onClick={handleNextHero}
              aria-label="Next image"
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-primary text-white border border-white/10 hover:border-primary flex items-center justify-center backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-20 cursor-pointer"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Bottom Overlay: Title, Location, and Thumbnail Selector Strip */}
          <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-400 bg-black/60 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-black">
                  <Star size={13} fill="currentColor" /> {property.averageRating ? property.averageRating.toFixed(1) : "4.8"}
                </div>
                <span className="text-[11px] font-bold text-gray-300">
                  ({reviews.length} Verified {reviews.length === 1 ? 'Review' : 'Reviews'})
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter leading-tight drop-shadow-md">
                {property.title}
              </h1>

              <p className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <MapPin size={16} className="text-primary shrink-0" /> 
                <span>{property.location?.address}, {property.location?.city}, {property.location?.state}</span>
              </p>
            </div>

            {/* Thumbnail Strip for Direct Navigation */}
            {propertyImages.length > 1 && (
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 overflow-x-auto max-w-full shrink-0">
                {propertyImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHeroIdx(idx)}
                    className={`relative w-14 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      currentHeroIdx === idx 
                        ? 'border-primary ring-2 ring-primary/40 scale-105' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TRUST METRICS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-[#E50914] flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-white block">1% BROKERAGE</span>
              <span className="text-[10px] text-neutral-400 block">Direct Landlord Lease</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-white block">ESCROW PROTECTED</span>
              <span className="text-[10px] text-neutral-400 block">100% Move-in Peace of Mind</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400 flex items-center justify-center shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-white block">24/7 POWER BACKUP</span>
              <span className="text-[10px] text-neutral-400 block">Uninterrupted Work</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-sky-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-white block">AUDITED HYGIENE</span>
              <span className="text-[10px] text-neutral-400 block">Daily Housekeeping</span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr,390px] gap-10 mt-10">
        {/* LEFT COLUMN: ABOUT, AMENITIES, SAFETY, ROOM MATRIX, REVIEWS */}
        <div className="space-y-10">
          
          {/* ABOUT THIS STAY */}
          <section className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-[#E50914] text-[10px] font-black uppercase tracking-widest block">NESTIFY VERIFIED RESIDENCE</span>
                <h2 className="text-2xl font-black text-white italic tracking-wide">About this stay</h2>
                <p className="text-neutral-400 font-medium text-xs sm:text-sm leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Rating Card */}
              <div className="text-center bg-black/60 p-5 rounded-2xl border border-neutral-800 shrink-0 min-w-[130px] self-start sm:self-auto">
                <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-2xl italic">
                  <Star size={20} fill="currentColor"/> {property.averageRating ? property.averageRating.toFixed(1) : "4.8"}
                </div>
                <p className="text-[9px] font-black uppercase text-neutral-400 mt-1 tracking-widest">Global Rating</p>
                <p className="text-[10px] text-neutral-500 font-bold mt-0.5">{reviews.length} audits logged</p>
              </div>
            </div>

            {/* Host / Owner Info Banner */}
            {property.owner && (
              <div className="bg-black/40 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E50914] text-white flex items-center justify-center font-black text-base shadow">
                    {property.owner.firstName?.[0] || 'H'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      Hosted by {property.owner.firstName} {property.owner.lastName || ''}
                      <span className="w-1.5 h-1.5 rounded-full bg-[#46D369]"></span>
                    </p>
                    <p className="text-[10px] font-bold text-neutral-400 tracking-wider">
                      Senior Building Manager • Responds within 15 mins
                    </p>
                  </div>
                </div>

                {!isOwner && (
                  <button 
                    onClick={handleChatWithOwner}
                    className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare size={13} /> Contact Host
                  </button>
                )}
              </div>
            )}
          </section>

          {/* AMENITIES & CONVENIENCES */}
          <section className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#E50914] text-[10px] font-black uppercase tracking-widest block">INCLUDED PRIVILEGES</span>
                <h2 className="text-xl font-black italic tracking-wide text-white mt-0.5">Coliving Amenities</h2>
              </div>
              <span className="text-[11px] text-neutral-400 font-bold bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                {defaultAmenities.length} Facilities
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {defaultAmenities.map((amenity, idx) => (
                <div 
                  key={idx}
                  className="bg-black/50 border border-neutral-800 rounded-xl p-3 flex items-center gap-2.5 text-xs text-neutral-200"
                >
                  <div className="text-[#E50914]">
                    {getAmenityIcon(amenity)}
                  </div>
                  <span className="font-bold text-xs">{amenity}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SAFETY & ATMOSPHERE AUDIT */}
          {property.safetyMetrics && (
            <section className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-[#E50914] text-[10px] font-black uppercase tracking-widest block">PHYSICAL AUDIT MATRIX</span>
                <h2 className="text-xl font-black italic tracking-wide text-white mt-0.5">Safety & Living Standards</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-black/50 border border-neutral-800 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[9px] font-extrabold uppercase">
                    <Volume2 size={12} className="text-[#E50914]" /> NOISE LEVEL
                  </div>
                  <p className="text-sm font-black text-white italic">{property.safetyMetrics.noiseLevel || 'Low'}</p>
                  <p className="text-[10px] text-neutral-500">Study Friendly</p>
                </div>

                <div className="bg-black/50 border border-neutral-800 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[9px] font-extrabold uppercase">
                    <Wifi size={12} className="text-[#E50914]" /> FIBER SPEED
                  </div>
                  <p className="text-sm font-black text-white italic">{property.safetyMetrics.internetSpeed || '100 Mbps'}</p>
                  <p className="text-[10px] text-neutral-500">Dual Optical Leased</p>
                </div>

                <div className="bg-black/50 border border-neutral-800 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[9px] font-extrabold uppercase">
                    <Zap size={12} className="text-[#E50914]" /> POWER BACKUP
                  </div>
                  <p className="text-sm font-black text-white italic">{property.safetyMetrics.powerBackup ? '100% Inverter' : 'Partial'}</p>
                  <p className="text-[10px] text-neutral-500">Automatic Switch</p>
                </div>

                <div className="bg-black/50 border border-neutral-800 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[9px] font-extrabold uppercase">
                    <ShieldCheck size={12} className="text-[#E50914]" /> SURVEILLANCE
                  </div>
                  <p className="text-sm font-black text-white italic">{property.safetyMetrics.cctv ? '24/7 CCTV' : 'Guard on Duty'}</p>
                  <p className="text-[10px] text-neutral-500">Biometric Entry</p>
                </div>
              </div>
            </section>
          )}

          {/* AVAILABLE UNITS & ROOM MATRIX */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-[#E50914] text-[10px] font-black uppercase tracking-widest block">FLOORPLAN & INVENTORY</span>
                <h2 className="text-xl font-black italic tracking-wide text-white mt-0.5">Available Units</h2>
              </div>
              <span className="text-xs text-neutral-400 font-bold">
                {property.rooms?.length || 0} Room Categories
              </span>
            </div>

            <div className="space-y-3">
              {property.rooms?.map((room) => {
                const isSoldOut = room.availableUnitsForDates <= 0;
                const isSelected = selectedRoom?._id === room._id;
                const roomImgs = getRoomImages(room);
                const activeRoomImgIdx = roomImageIndices[room._id] || 0;

                return (
                  <div 
                    key={room._id} 
                    onClick={() => !isSoldOut && setSelectedRoom(room)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-[#141414] relative group shadow-2xl ${
                      isSoldOut 
                        ? 'opacity-40 grayscale cursor-not-allowed bg-[#141414] border-neutral-800' 
                        : isSelected 
                        ? 'room-card-selected' 
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      {/* Left: Room Photo Slider */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full md:w-auto">
                        <div className="relative w-full sm:w-56 h-48 sm:h-36 rounded-2xl overflow-hidden border border-[#2d2d2d] shrink-0 bg-black group/room">
                          <img 
                            src={roomImgs[activeRoomImgIdx]} 
                            alt={`${room.roomType} preview`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/room:scale-105" 
                          />

                          {/* Gradient shadow */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                          {/* Photo navigation arrows for Room (multi-photo slider) */}
                          {roomImgs.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handlePrevRoomImage(e, room._id, roomImgs.length)}
                                aria-label="Previous room photo"
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/75 hover:bg-primary text-white flex items-center justify-center transition backdrop-blur-sm z-10 cursor-pointer shadow-lg"
                              >
                                <ChevronLeft size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleNextRoomImage(e, room._id, roomImgs.length)}
                                aria-label="Next room photo"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/75 hover:bg-primary text-white flex items-center justify-center transition backdrop-blur-sm z-10 cursor-pointer shadow-lg"
                              >
                                <ChevronRight size={14} />
                              </button>

                              {/* Room photo counter */}
                              <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-black text-gray-300 z-10 border border-white/10">
                                {activeRoomImgIdx + 1}/{roomImgs.length}
                              </span>

                              {/* Dot Indicators */}
                              <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                                {roomImgs.map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                      activeRoomImgIdx === i ? 'bg-primary w-3' : 'bg-white/40'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Room Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xl font-black text-white italic tracking-tight">{room.roomType}</h4>
                            {isSelected && (
                              <span className="bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Check size={10} /> Selected
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1 bg-[#202020] px-2.5 py-1 rounded-lg border border-[#2e2e2e]">
                              <Users size={12} className="text-primary" /> Max {room.capacity} Guests
                            </span>

                            <span className="text-[10px] font-bold text-gray-300 uppercase bg-[#202020] px-2.5 py-1 rounded-lg border border-[#2e2e2e]">
                              {room.roomSize || '180 sq.ft'}
                            </span>

                            {isSoldOut ? (
                              <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                                <AlertCircle size={10}/> Sold Out
                              </span>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                room.availableUnitsForDates < 3 
                                  ? 'bg-amber-950/50 text-amber-400 border-amber-800/50' 
                                  : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                              }`}>
                                {room.availableUnitsForDates} of {room.totalInventory || 1} Beds Available
                              </span>
                            )}
                          </div>

                          {/* Room Amenities preview */}
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {room.amenities.slice(0, 3).map((item, idx) => (
                                <span key={idx} className="text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Pricing & Select button */}
                      <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#262626]">
                        <div className="text-left md:text-right">
                          <p className="text-2xl font-black text-white font-mono tracking-tight">₹{room.basePrice.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">per 24 hrs</p>
                        </div>

                        <button 
                          type="button"
                          disabled={isSoldOut}
                          className={`mt-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isSoldOut 
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : isSelected 
                              ? 'btn-red-glow text-white shadow' 
                              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          {isSoldOut ? 'Sold Out' : isSelected ? 'Selected' : 'Select Room'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* VERIFIED RESIDENT REVIEWS SECTION */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between px-2">
              <div>
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.25em]">Community Authenticity</span>
                <h3 className="text-3xl font-black italic tracking-tighter text-white mt-1">Resident Reviews</h3>
              </div>
              <span className="text-xs text-gray-400 font-bold">{reviews.length} Audited Reviews</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review._id} className="bg-[#181818] p-7 sm:p-8 rounded-[2.5rem] border border-[#262626] shadow-xl relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center font-black text-primary border border-primary/30">
                        {review.user?.firstName?.[0] || 'R'}
                      </div>
                      <div>
                        <p className="font-black text-white flex items-center gap-2">
                          {review.user?.firstName} {review.user?.lastName || ''}
                          {review.isVerifiedStay && (
                            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                              <VerifiedIcon size={11} /> Verified Stay
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 text-amber-400 bg-[#202020] px-2.5 py-1 rounded-xl border border-[#2e2e2e]">
                      {[1,2,3,4,5].map(s => {
                        const avg = review.ratings 
                          ? (review.ratings.cleanliness + review.ratings.maintenance + review.ratings.safety + review.ratings.services) / 4 
                          : 5;
                        return <Star key={s} size={13} fill={s <= avg ? "currentColor" : "none"} />;
                      })}
                    </div>
                  </div>

                  <p className="text-gray-300 font-medium text-sm leading-relaxed italic bg-[#202020]/50 p-4 rounded-2xl border border-white/5">
                    "{review.comment}"
                  </p>
                  
                  {/* Edit Option if the current user is the author */}
                  {user?._id === review.user?._id && (
                    <button 
                      onClick={() => navigate('/my-bookings')} 
                      className="mt-4 flex items-center gap-2 text-primary font-black text-[10px] uppercase hover:underline cursor-pointer"
                    >
                      <Edit3 size={13}/> Edit My Review
                    </button>
                  )}
                </div>
              )) : (
                <div className="text-center py-16 bg-[#181818] rounded-[2.5rem] border border-[#262626]">
                  <MessageSquare size={44} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-300 font-black uppercase text-xs tracking-widest">No reviews for this property yet</p>
                  <p className="text-gray-500 text-xs mt-1">Be the first verified resident to complete a stay and leave an audit!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: STICKY BOOKING CONSOLE */}
        <aside>
          {!isOwner ? (
            <div className="sticky top-24 bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-white">
              <div>
                <span className="text-[#E50914] text-[10px] font-black uppercase tracking-widest block">RESERVE YOUR SPOT</span>
                <h3 className="text-2xl font-black italic tracking-wide text-white mt-0.5">Booking Console</h3>
              </div>

              {/* DATES PICKER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-400">
                  <span className="uppercase tracking-wider text-[10px]">Stay Duration</span>
                  <span className="text-[#E50914] bg-red-950/40 px-2.5 py-0.5 rounded-full border border-[#E50914]/30 text-[10px] font-black">
                    {stayDays} {stayDays === 1 ? 'Night' : 'Nights'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <CustomDatePicker 
                      label="Move-In Date"
                      min={new Date().toISOString().split('T')[0]} 
                      value={dates.checkIn} 
                      onChange={val => {
                        const nextOut = val >= dates.checkOut 
                          ? new Date(new Date(val).getTime() + 86400000).toISOString().split('T')[0]
                          : dates.checkOut;
                        setDates({ checkIn: val, checkOut: nextOut });
                      }}
                      align="left"
                    />
                  </div>
                  <div>
                    <CustomDatePicker 
                      label="Move-Out Date"
                      min={dates.checkIn} 
                      value={dates.checkOut} 
                      onChange={val => setDates({...dates, checkOut: val})}
                      align="right"
                    />
                  </div>
                </div>
              </div>

              {/* SELECTED ROOM PRICING BREAKDOWN */}
              {selectedRoom ? (
                <div className="space-y-4 pt-3 border-t border-neutral-800">
                  {/* Selected room tag */}
                  <div className="flex items-center justify-between p-3.5 bg-black/50 rounded-2xl border border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <Bed size={16} className="text-[#E50914]" />
                      <div>
                        <p className="text-xs font-black text-white">{selectedRoom.roomType}</p>
                        <p className="text-[10px] text-neutral-400 font-semibold">{stayDays} nights × ₹{selectedRoom.basePrice.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-white">
                      ₹{(selectedRoom.basePrice * stayDays).toLocaleString()}
                    </span>
                  </div>

                  {/* Fee calculation breakdown */}
                  <div className="space-y-2 text-xs text-neutral-400 px-1">
                    <div className="flex justify-between items-center">
                      <span>Zero Brokerage Fee</span>
                      <span className="text-emerald-400 font-black">₹0 (FREE)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Move-In Escrow Protection</span>
                      <span className="text-neutral-300 font-bold">Included</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Resident Care & Support</span>
                      <span className="text-neutral-300 font-bold">24/7 Free</span>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="pt-3 border-t border-neutral-800 flex justify-between items-baseline">
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Total Payable</p>
                      <p className={`text-3xl font-black italic font-mono tracking-tight ${selectedRoom.availableUnitsForDates <= 0 ? 'text-neutral-500' : 'text-white'}`}>
                        ₹{(selectedRoom.basePrice * stayDays).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">All Taxes Inc.</span>
                  </div>

                  {/* Instant Booking Trigger Button */}
                  <button 
                    disabled={checkingAvailability || selectedRoom.availableUnitsForDates <= 0}
                    onClick={handleBookingInit} 
                    className="w-full btn-red-glow py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-2xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {checkingAvailability ? <Loader className="animate-spin" size={16}/> : <ShieldCheck size={16}/>}
                    {selectedRoom.availableUnitsForDates <= 0 
                      ? 'Room Sold Out For Dates' 
                      : checkingAvailability 
                      ? 'Verifying Allocation...' 
                      : 'Instant Move-in Reserve'}
                  </button>

                  {/* Chat With Owner */}
                  <button 
                    type="button"
                    onClick={handleChatWithOwner}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare size={14} /> Chat with Building Owner
                  </button>

                  {/* Trust guarantees badge */}
                  <div className="pt-2 text-[10px] text-neutral-500 space-y-1 font-semibold text-center">
                    <p className="flex items-center justify-center gap-1.5">
                      <Shield size={12} className="text-[#E50914]" /> 100% Escrow safe • Refund if not as described
                    </p>
                    <p>No brokerage fees • Direct owner agreement</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-black/50 rounded-2xl text-center border border-neutral-800 space-y-2">
                  <Bed size={32} className="mx-auto text-neutral-500 mb-1" />
                  <p className="text-xs font-black uppercase text-neutral-300">Select a room unit above</p>
                  <p className="text-[10px] text-neutral-500">Pick from Classic, Deluxe, Premium or Suite units to review pricing.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="sticky top-28 bg-[#181818] text-white p-10 rounded-[3rem] border border-[#2a2a2a] text-center space-y-6 shadow-2xl">
              <ShieldCheck size={48} className="text-primary mx-auto"/>
              <h4 className="text-2xl font-black italic">Owner Dashboard</h4>
              <p className="text-gray-400 text-xs font-bold leading-relaxed px-2">
                You are registered as the manager/owner of this property. Access your management suite to review bookings, update inventories, and adjust rates.
              </p>
              <button 
                onClick={() => navigate('/owner/dashboard')} 
                className="w-full btn-netflix py-4 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Open Analytics & Management
              </button>
            </div>
          )}
        </aside>
      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-300">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white z-10 max-w-7xl mx-auto w-full">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary">Fullscreen Gallery</p>
              <h3 className="text-xl font-black italic">{property.title}</h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-[#202020] px-3 py-1.5 rounded-xl border border-white/10">
                {currentHeroIdx + 1} / {propertyImages.length}
              </span>
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-[#202020] hover:bg-primary text-white flex items-center justify-center transition border border-white/10 cursor-pointer"
                aria-label="Close fullscreen gallery"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image with navigation */}
          <div className="relative flex-1 flex items-center justify-center my-4 max-w-7xl mx-auto w-full overflow-hidden">
            {propertyImages.length > 1 && (
              <button 
                onClick={handlePrevHero}
                aria-label="Previous photo"
                className="absolute left-2 sm:left-6 w-12 h-12 rounded-full bg-black/70 hover:bg-primary text-white flex items-center justify-center transition border border-white/10 z-20 cursor-pointer shadow-2xl"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img 
              key={currentHeroIdx}
              src={propertyImages[currentHeroIdx]} 
              alt={`${property.title} slide`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
            />

            {propertyImages.length > 1 && (
              <button 
                onClick={handleNextHero}
                aria-label="Next photo"
                className="absolute right-2 sm:right-6 w-12 h-12 rounded-full bg-black/70 hover:bg-primary text-white flex items-center justify-center transition border border-white/10 z-20 cursor-pointer shadow-2xl"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Lightbox Footer Thumbnail Strip */}
          {propertyImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-4xl mx-auto w-full py-2">
              {propertyImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHeroIdx(idx)}
                  className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                    currentHeroIdx === idx 
                      ? 'border-primary ring-2 ring-primary/40 scale-105' 
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;