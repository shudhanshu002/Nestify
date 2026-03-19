import { ShieldCheck, Star, MapPin, Wifi, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const PropertyCard = ({ pg }) => {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="relative h-56">
        <img 
          src={pg.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80'} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          alt={pg.title}
        />
        {pg.isVerified && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={14} className="text-secondary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-800">Verified</span>
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-gray-900/80 text-white px-3 py-1 rounded-lg text-sm font-bold">
          ₹{pg.basePrice} <span className="text-[10px] font-normal opacity-80">/mo</span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">{pg.title}</h3>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-yellow-700 font-bold text-xs">
            <Star size={12} fill="currentColor" /> {pg.averageRating || 'New'}
          </div>
        </div>

        <p className="flex items-center gap-1 text-gray-500 text-sm mb-4">
          <MapPin size={14} /> {pg.location.city}, {pg.location.state}
        </p>

        <div className="flex items-center gap-4 border-t pt-4">
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <Wifi size={14} className={pg.safetyMetrics?.internetSpeed ? 'text-primary' : 'text-gray-300'} />
            <span>High Speed</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <Zap size={14} className={pg.safetyMetrics?.powerBackup ? 'text-accent' : 'text-gray-300'} />
            <span>24/7 Power</span>
          </div>
        </div>

        <Link 
          to={`/property/${pg._id}`}
          className="block w-full text-center mt-5 bg-gray-50 text-gray-800 py-2.5 rounded-xl font-bold hover:bg-primary hover:text-white transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;