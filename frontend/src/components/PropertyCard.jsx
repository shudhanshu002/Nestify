import { useContext } from 'react';
import { Heart, MapPin, Star, ShieldCheck, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PropertyCard = ({ property, onWishlistToggle }) => {
  const navigate = useNavigate();
  const { user, isWishlisted, toggleWishlist } = useContext(AuthContext);

  if (!property) return null;

  const isLiked = isWishlisted(property._id);

  const images = property.images && property.images.length > 0 
    ? property.images 
    : [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500' }];

  const roomPrices = (property.rooms || []).map(r => r.basePrice).filter(p => typeof p === 'number' && p > 0);
  const basePrice = roomPrices.length > 0 
    ? Math.min(...roomPrices) 
    : (property.basePrice > 0 ? property.basePrice : 6999);
  const hasMultipleRooms = (property.rooms || []).length > 1;
  const originalPrice = Math.round(basePrice * 1.30 / 100) * 100;
  const discountPercent = Math.round(((originalPrice - basePrice) / originalPrice) * 100);
  const rating = property.averageRating || 4.6;

  const getTierBadge = () => {
    if (property.tier === 'LUXURY') return { label: 'Luxury', bg: 'bg-gradient-to-r from-amber-600 to-rose-600', icon: '💎' };
    if (property.tier === 'BUDGET') return { label: 'Budget', bg: 'bg-blue-600', icon: '🎓' };
    if (property.tier === 'STANDARD') return { label: 'Classic', bg: 'bg-[#2a2a2a]', icon: '🏠' };
    if (property.tier === 'FLAGSHIP') return { label: 'Flagship', bg: 'bg-primary', icon: '⭐' };
    return property.basePrice > 12000 
      ? { label: 'Premier', bg: 'bg-gradient-to-r from-amber-600 to-rose-600', icon: '💎' }
      : { label: 'Flagship', bg: 'bg-primary', icon: '⭐' };
  };
  const tierBadge = getTierBadge();

  const handleHeartClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    await toggleWishlist(property._id);
    if (onWishlistToggle) {
      onWishlistToggle(property._id);
    }
  };

  return (
    <div 
      onClick={() => navigate(`/property/${property._id}`)} 
      className="cursor-pointer group bg-[#181818] rounded-[2.5rem] overflow-hidden border border-[#2a2a2a] text-white netflix-card flex flex-col justify-between shadow-xl"
    >
      {/* 1. IMAGE & BADGES */}
      <div className="relative h-60 bg-[#121212] overflow-hidden">
        <img 
          src={images[0]?.url} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />

        {/* Flagship Tier Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className={`${tierBadge.bg} text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow-md flex items-center gap-1`}>
            <span>{tierBadge.icon}</span>
            <span>{tierBadge.label}</span>
          </span>
          {property.verificationStatus === 'VERIFIED' && (
            <span className="bg-black/80 backdrop-blur-md text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-900/40">
              <ShieldCheck size={10} /> Verified
            </span>
          )}
        </div>

        {/* Wishlist Heart */}
        <button 
          onClick={handleHeartClick}
          className={`absolute top-3 right-3 p-2.5 rounded-2xl backdrop-blur-md transition-all shadow-md z-10 cursor-pointer ${
            isLiked ? 'bg-primary text-white scale-105 shadow-red-950/60' : 'bg-black/50 text-white hover:bg-white hover:text-primary'
          }`}
          title={isLiked ? "Remove from Saved Stays" : "Save to Wishlist"}
        >
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        {/* Rating Badge Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#181818]/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5 z-10 border border-white/10">
          <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Star size={10} className="fill-white" />
            {rating.toFixed(1)}
          </span>
          <span className="text-[10px] font-black text-gray-200">
            {rating >= 4.5 ? 'Very Good' : 'Good'}
          </span>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-black text-lg text-white group-hover:text-primary transition line-clamp-1">
            {property.title}
          </h3>
          <p className="text-gray-400 text-xs flex items-center gap-1 font-bold mt-1">
            <MapPin size={13} className="text-primary shrink-0" />
            <span className="truncate">{property.location?.city || 'Delhi NCR'}</span>
          </p>

          {/* Quick Amenities Pill Strip */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(property.amenities && property.amenities.length > 0
              ? property.amenities
              : ['AC', 'WiFi', 'Meals']
            ).slice(0, 3).map((a, i) => (
              <span key={i} className="text-[10px] font-bold bg-[#242424] text-gray-300 px-2 py-0.5 rounded-md border border-[#333333]">
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing Box */}
        <div className="pt-4 border-t border-[#282828] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                {hasMultipleRooms ? "Starts from" : "Rent"}
              </span>
              <span className="text-[11px] text-gray-500 line-through">₹{originalPrice.toLocaleString()}</span>
              <span className="text-[9px] font-black text-primary bg-primary/20 border border-primary/30 px-1 py-0.2 rounded">
                {discountPercent}% OFF
              </span>
            </div>
            <p className="text-xl font-black text-white font-mono">
              ₹{basePrice.toLocaleString()}
              <span className="text-[10px] text-gray-400 font-normal">/mo</span>
            </p>
          </div>

          <span className="w-9 h-9 rounded-2xl bg-[#252525] group-hover:bg-primary text-white flex items-center justify-center transition shadow-md">
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
