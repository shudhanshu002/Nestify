import { useContext } from 'react';
import { Heart, MapPin, Star, ShieldCheck, ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PropertyCard = ({ property, onWishlistToggle, onPeek }) => {
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
  
  const originalPrice = Math.round(basePrice * 1.30 / 100) * 100;
  const discountPercent = Math.round(((originalPrice - basePrice) / originalPrice) * 100);
  const rating = property.averageRating || 4.8;
  const reviewCount = property.numReviews || property.reviews?.length || 38;

  // Calculate available beds across rooms if configured
  const totalBedsLeft = (property.rooms || []).reduce((acc, r) => acc + (r.availableUnitsForDates || r.availableUnits || 1), 0) || 3;

  // Match score calculation
  const matchScore = Math.min(99, Math.max(90, Math.round(rating * 20)));

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

  const auditTag = property.safetyMetrics?.internetSpeed
    ? `${property.safetyMetrics.internetSpeed} • ${property.safetyMetrics.noiseLevel || 'Low'} Noise`
    : '100% Inverter Backup • Noise: Low';

  return (
    <div 
      onClick={() => navigate(`/property/${property._id}`)} 
      className="netflix-card cursor-pointer group bg-[#141414] rounded-2xl overflow-hidden border border-neutral-800 text-white flex flex-col justify-between shadow-2xl transition duration-300"
    >
      <div>
        {/* 1. IMAGE & BADGES */}
        <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
          <img 
            src={images[0]?.url} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none"></div>

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="bg-[#E50914] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
              {matchScore}% MATCH
            </span>
            <span className="bg-black/70 backdrop-blur text-white text-[9px] font-extrabold px-2 py-0.5 rounded border border-white/20 uppercase">
              {property.tier || 'FLAGSHIP'}
            </span>
          </div>

          {/* Wishlist Heart */}
          <button 
            onClick={handleHeartClick}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md transition flex items-center justify-center shadow z-10 cursor-pointer ${
              isLiked ? 'bg-[#E50914] text-white' : 'bg-black/60 text-white hover:bg-[#E50914]'
            }`}
            title={isLiked ? "Remove from Saved Stays" : "Save to Wishlist"}
          >
            <Heart size={14} className={isLiked ? 'fill-white text-white' : ''} />
          </button>

          {/* Bottom Overlay: Rating and Beds left */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs z-10">
            <span className="text-amber-400 font-bold flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded backdrop-blur">
              <Star size={11} fill="currentColor" /> {rating.toFixed(1)} ({reviewCount})
            </span>
            <span className="bg-emerald-950/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
              {totalBedsLeft} Beds Left
            </span>
          </div>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="p-4 space-y-2.5">
          <div>
            <h3 className="text-base font-black text-white group-hover:text-[#E50914] transition line-clamp-1">
              {property.title}
            </h3>
            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5 line-clamp-1 font-semibold">
              <MapPin size={13} className="text-[#E50914] shrink-0" />
              <span>{property.location?.address || ''} {property.location?.city || 'City'}, {property.location?.state || ''}</span>
            </p>
          </div>

          {/* Audit tag banner */}
          <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-xl p-2.5 text-[11px] text-neutral-300">
            <span>{auditTag}</span>
          </div>
        </div>
      </div>

      {/* 3. PRICING & ACTIONS */}
      <div className="p-4 pt-0 border-t border-neutral-900 flex items-center justify-between mt-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-bold text-neutral-500">RENT</span>
            <span className="text-xs text-neutral-500 line-through">₹{originalPrice.toLocaleString()}</span>
            <span className="text-[9px] text-[#E50914] font-black">{discountPercent}% OFF</span>
          </div>
          <p className="text-lg font-black text-white italic">
            ₹{basePrice.toLocaleString()} 
            <span className="text-xs text-neutral-500 font-normal not-italic">/mo</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onPeek && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPeek(property);
              }}
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-neutral-800 transition cursor-pointer"
            >
              PEEK
            </button>
          )}
          <button 
            type="button"
            className="btn-red-glow text-white text-xs font-bold uppercase px-3 py-1.5 rounded-xl shadow transition cursor-pointer flex items-center gap-1"
          >
            <span>VIEW STAY</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
