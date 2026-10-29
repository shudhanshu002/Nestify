import { Heart, MapPin, Star, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PropertyCard = ({ property }) => {
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate(`/property/${property._id}`)} className="cursor-pointer group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500">
      <div className="relative h-64">
        <img src={property.images?.[0]?.url || 'https://via.placeholder.com/500'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        
        {/* 󾠮 VERIFIED BADGE */}
        {property.verificationStatus === 'VERIFIED' && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-green-100">
            <ShieldCheck size={14} className="text-green-500 fill-green-50" />
            <span className="text-[9px] font-black uppercase text-green-700 tracking-tighter">Verified PG</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-xl text-gray-900 truncate">{property.title}</h3>
          <span className="flex items-center gap-1 text-sm font-bold"><Star size={14} className="fill-orange-400 text-orange-400" /> 4.8</span>
        </div>
        <p className="text-gray-400 text-sm flex items-center gap-1 font-medium"><MapPin size={14} /> {property.location?.city}</p>
        <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
          <p className="text-2xl font-black text-gray-900">₹{property.basePrice || 'N/A'}</p>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            {property.verificationStatus === 'VERIFIED' ? 'Live on Matrix' : 'Under Review'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;