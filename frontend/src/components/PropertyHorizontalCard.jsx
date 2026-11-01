import { useState, useContext } from 'react';
import { 
  Star, MapPin, ShieldCheck, Wifi, Zap, Heart, 
  Utensils, Droplets, Tv, Bed, ArrowRight, Sparkles, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AMENITY_ICONS = {
  'AC': '❄️',
  'WiFi': '📶',
  'Attached Washroom': '🚿',
  'Food Included': '🍲',
  'Power Backup': '⚡',
  'Geyser': '♨️',
  'Laundry': '🧺',
  'Washing Machine': '🧺',
  'CCTV': '📹',
  'RO Water': '💧',
  'Housekeeping': '🧹',
  'Gym': '🏋️',
  'Parking': '🅿️',
  'Lift': '🛗'
};

const PropertyHorizontalCard = ({ property }) => {
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { user, isWishlisted, toggleWishlist } = useContext(AuthContext);
  const isLiked = isWishlisted(property?._id);

  const images = property.images && property.images.length > 0 
    ? property.images 
    : [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600' }];

  const roomPrices = (property.rooms || []).map(r => r.basePrice).filter(p => typeof p === 'number' && p > 0);
  const basePrice = roomPrices.length > 0 
    ? Math.min(...roomPrices) 
    : (property.basePrice > 0 ? property.basePrice : 7500);
  const hasMultipleRooms = (property.rooms || []).length > 1;
  const originalPrice = Math.round(basePrice * 1.32 / 100) * 100;
  const discountPercent = Math.round(((originalPrice - basePrice) / originalPrice) * 100);

  const rating = property.averageRating || 4.5;
  const getRatingSentiment = (r) => {
    if (r >= 4.7) return 'Fabulous';
    if (r >= 4.2) return 'Very Good';
    if (r >= 3.8) return 'Good';
    return 'Comfortable';
  };

  const getTierBadge = () => {
    if (property.tier === 'LUXURY') return { label: 'Premier Luxury', bg: 'bg-gradient-to-r from-amber-600 to-rose-600', icon: '💎' };
    if (property.tier === 'BUDGET') return { label: 'Student Budget', bg: 'bg-blue-600', icon: '🎓' };
    if (property.tier === 'STANDARD') return { label: 'Standard PG', bg: 'bg-[#2a2a2a]', icon: '🏠' };
    if (property.tier === 'FLAGSHIP') return { label: 'Nestify Flagship', bg: 'bg-primary', icon: '⭐' };
    return property.basePrice > 12000 
      ? { label: 'Premier Luxury', bg: 'bg-gradient-to-r from-amber-600 to-rose-600', icon: '💎' }
      : { label: 'Nestify Flagship', bg: 'bg-primary', icon: '⭐' };
  };
  const tierBadge = getTierBadge();

  const handleNextImage = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      onClick={() => navigate(`/property/${property._id}`)}
      className="group bg-[#181818] rounded-[2.5rem] p-4 sm:p-5 border border-[#2a2a2a] text-white flex flex-col md:flex-row gap-6 netflix-card hover:border-primary/50 cursor-pointer relative shadow-xl"
    >
      {/* 1. IMAGE GALLERY CONTAINER */}
      <div className="relative w-full md:w-80 h-64 md:h-68 shrink-0 overflow-hidden rounded-[2rem] bg-[#121212]">
        <img 
          src={images[activeImageIndex]?.url} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />

        {/* Collection / Flagship Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className={`${tierBadge.bg} text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-md flex items-center gap-1`}>
            <span>{tierBadge.icon}</span>
            <span>{tierBadge.label}</span>
          </span>
          {property.verificationStatus === 'VERIFIED' && (
            <span className="bg-black/80 backdrop-blur-md text-emerald-400 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-900/40">
              <ShieldCheck size={11} /> Verified Stay
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={async (e) => {
            e.stopPropagation();
            if (!user) {
              navigate('/login', { state: { from: window.location.pathname } });
              return;
            }
            await toggleWishlist(property._id);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-2xl backdrop-blur-md transition-all shadow-md z-10 cursor-pointer ${
            isLiked ? 'bg-primary text-white scale-105 shadow-red-950/60' : 'bg-black/50 text-white hover:bg-white hover:text-primary'
          }`}
          title={isLiked ? "Remove from Saved Stays" : "Save to Wishlist"}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        {/* Image Carousel Controls */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
              {images.map((_, i) => (
                <span 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    activeImageIndex === i ? 'bg-primary w-3' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. STAY CONTENT COLUMN */}
      <div className="flex-grow flex flex-col justify-between py-1">
        <div>
          {/* Header & Rating */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-primary transition line-clamp-1">
                {property.title}
              </h3>
              <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                <MapPin size={13} className="text-primary shrink-0" /> 
                <span className="truncate">{property.location?.address ? `${property.location.address}, ` : ''}{property.location?.city}</span>
              </p>
            </div>

            {/* Rating Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-950/40 px-3 py-1.5 rounded-2xl border border-emerald-800/40">
              <span className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                <Star size={11} className="fill-white" />
                {rating.toFixed(1)}
              </span>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                  {getRatingSentiment(rating)}
                </span>
                <span className="text-[9px] font-bold text-gray-400">120+ reviews</span>
              </div>
            </div>
          </div>

          {/* Amenities Strip */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(property.amenities && property.amenities.length > 0 
              ? property.amenities 
              : ['AC', 'WiFi', 'Attached Washroom', 'Food Included', 'Power Backup']
            ).slice(0, 5).map((amenity, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#242424] text-gray-300 px-2.5 py-1 rounded-xl border border-[#333333]"
              >
                <span>{AMENITY_ICONS[amenity] || '•'}</span>
                <span>{amenity}</span>
              </span>
            ))}
          </div>

          {/* Room Configurations Preview */}
          {property.rooms && property.rooms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#262626]">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                <Bed size={12} className="text-primary" /> Units:
              </span>
              {property.rooms.slice(0, 3).map((r, i) => (
                <span 
                  key={i} 
                  className="text-[10px] font-bold bg-[#222222] text-gray-300 px-2.5 py-0.5 rounded-lg border border-[#333333]"
                >
                  {r.roomType} • ₹{r.basePrice?.toLocaleString()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Booking CTA Strip */}
        <div className="flex items-end justify-between mt-6 pt-4 border-t border-[#282828]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {hasMultipleRooms ? "Starts from" : "Rent"}
              </span>
              <span className="text-xs text-gray-500 font-bold line-through">₹{originalPrice.toLocaleString()}</span>
              <span className="text-[11px] font-black text-primary bg-primary/20 border border-primary/30 px-2 py-0.5 rounded-lg">
                {discountPercent}% OFF
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                ₹{basePrice.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">/ month</span>
            </div>
            <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <Check size={11} strokeWidth={3} /> Zero Deposit Options • Free Cancellation
            </p>
          </div>

          <div className="flex gap-2">
            <Link 
              to={`/property/${property._id}`}
              className="btn-netflix px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 flex items-center gap-1.5"
            >
              Book Now <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyHorizontalCard;
