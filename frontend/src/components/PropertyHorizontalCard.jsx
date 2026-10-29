import { Star, MapPin, ShieldCheck, Wifi, Zap, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const PropertyHorizontalCard = ({ property }) => {
  return (
    <div className="group bg-white rounded-[2.5rem] p-4 border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-2xl transition-all duration-500 hover:border-primary/20">
      {/* Image Section */}
      <div className="relative w-full md:w-72 h-60 shrink-0 overflow-hidden rounded-[2rem]">
        <img 
          src={property.images?.[0]?.url} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        />
        <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white hover:text-red-500 transition">
          <Heart size={18} />
        </button>
      </div>

      {/* Content Section */}
      <div className="flex-grow flex flex-col justify-between py-2">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-primary transition">{property.title}</h3>
              <p className="text-sm font-medium text-gray-400 flex items-center gap-1 mt-1">
                <MapPin size={14} /> {property.location?.address}, {property.location?.city}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <Star size={14} className="text-orange-400 fill-orange-400" />
              <span className="text-sm font-black text-gray-900">4.9</span>
            </div>
          </div>

          {/* Safety & Amenities Icons (The Industry Grade Stuff) */}
          <div className="flex gap-4 mt-6">
            {property.safetyMetrics?.internetSpeed && (
              <div className="flex items-center gap-1.5 text-gray-500 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-50">
                <Wifi size={14} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-wider">{property.safetyMetrics.internetSpeed}</span>
              </div>
            )}
            {property.safetyMetrics?.powerBackup && (
              <div className="flex items-center gap-1.5 text-gray-500 bg-green-50/50 px-3 py-1.5 rounded-xl border border-green-50">
                <Zap size={14} className="text-secondary" />
                <span className="text-[10px] font-black uppercase tracking-wider">24/7 Power</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between mt-6">
          <div>
            <div className="flex items-center gap-1 text-secondary font-black text-xs uppercase mb-1">
               <ShieldCheck size={14} /> Verified Provider
            </div>
            <p className="text-2xl font-black text-gray-900">
              ₹{property.basePrice}<span className="text-xs text-gray-400 font-bold uppercase tracking-widest ml-1">/ month</span>
            </p>
          </div>
          <Link 
            to={`/property/${property._id}`}
            className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyHorizontalCard;