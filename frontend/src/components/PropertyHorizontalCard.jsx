import { useState } from 'react';
import { 
  Star, MapPin, ShieldCheck, Wifi, Zap, Heart, 
  Utensils, Droplets, Tv, Bed, ArrowRight, Sparkles, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  const [isLiked, setIsLiked] = useState(false);

  const images = property.images && property.images.length > 0 
    ? property.images 
    : [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600' }];

  const basePrice = property.basePrice || (property.rooms?.[0]?.basePrice) || 7500;
  // Calculate simulated strike-through original price (25-35% higher)
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
    if (property.tier === 'STANDARD') return { label: 'Standard PG', bg: 'bg-gray-800', icon: '🏠' };
    if (property.tier === 'FLAGSHIP') return { label: 'Nestify Flagship', bg: 'bg-rose-600', icon: '⭐' };
    return property.basePrice > 12000 
      ? { label: 'Premier Collection', bg: 'bg-gradient-to-r from-amber-600 to-rose-600', icon: '💎' }
      : { label: 'Nestify Flagship', bg: 'bg-rose-600', icon: '⭐' };
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
      className="group bg-white rounded-[2.5rem] p-4 sm:p-5 border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-2xl transition-all duration-300 hover:border-primary/20 cursor-pointer relative"
    >
      {/* 1. IMAGE GALLERY CONTAINER */}
      <div className="relative w-full md:w-80 h-64 md:h-68 shrink-0 overflow-hidden rounded-[2rem] bg-gray-100">
        <img 
          src={images[activeImageIndex]?.url} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />

        {/* OYO Collection / Flagship Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className={`${tierBadge.bg} text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-md flex items-center gap-1`}>
            <span>{tierBadge.icon}</span>
            <span>{tierBadge.label}</span>
          </span>
          {property.verificationStatus === 'VERIFIED' && (
            <span className="bg-gray-950/80 backdrop-blur-md text-emerald-400 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} /> Verified Stay
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-2xl backdrop-blur-md transition-all shadow-md z-10 ${
            isLiked ? 'bg-rose-500 text-white' : 'bg-black/30 text-white hover:bg-white hover:text-rose-500'
          }`}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        {/* Image Carousel Controls */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              {images.map((_, i) => (
                <span 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    activeImageIndex === i ? 'bg-white w-3' : 'bg-white/50'
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
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight group-hover:text-primary transition line-clamp-1">
                {property.title}
              </h3>
              <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                <MapPin size={13} className="text-primary shrink-0" /> 
                <span className="truncate">{property.location?.address ? `${property.location.address}, ` : ''}{property.location?.city}</span>
              </p>
            </div>

            {/* OYO Emerald Green Rating Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-100">
              <span className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                <Star size={11} className="fill-white" />
                {rating.toFixed(1)}
              </span>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
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
                className="inline-flex items-center gap-1 text-[11px] font-bold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-xl border border-gray-100"
              >
                <span>{AMENITY_ICONS[amenity] || '•'}</span>
                <span>{amenity}</span>
              </span>
            ))}
          </div>

          {/* Room Configurations Preview */}
          {property.rooms && property.rooms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-50">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                <Bed size={12} className="text-primary" /> Units:
              </span>
              {property.rooms.slice(0, 3).map((r, i) => (
                <span 
                  key={i} 
                  className="text-[10px] font-bold bg-blue-50/60 text-blue-800 px-2.5 py-0.5 rounded-lg border border-blue-100"
                >
                  {r.roomType} • ₹{r.basePrice?.toLocaleString()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Booking CTA Strip */}
        <div className="flex items-end justify-between mt-6 pt-4 border-t border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold line-through">₹{originalPrice.toLocaleString()}</span>
              <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                {discountPercent}% OFF
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 font-mono tracking-tight">
                ₹{basePrice.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">/ month</span>
            </div>
            <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              <Check size={11} strokeWidth={3} /> Zero Deposit Options • Free Cancellation
            </p>
          </div>

          <div className="flex gap-2">
            <Link 
              to={`/property/${property._id}`}
              className="bg-gray-900 hover:bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-gray-900/10 transition active:scale-95 flex items-center gap-1.5"
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
