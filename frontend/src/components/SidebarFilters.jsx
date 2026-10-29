import { SlidersHorizontal, CheckCircle2 } from 'lucide-react';

const SidebarFilters = ({ filters, setFilters }) => {
  const handleAmenityToggle = (amenity) => {
    const updated = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    setFilters({ ...filters, amenities: updated });
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
        <SlidersHorizontal size={20} className="text-primary" />
        <h3 className="font-black text-gray-900">Filters</h3>
      </div>

      {/* Price Range */}
      <section>
        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Price Range</h4>
        <input 
          type="range" min="0" max="50000" step="1000"
          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
          onChange={(e) => setFilters({...filters, priceRange: [0, e.target.value]})}
        />
        <div className="flex justify-between mt-2 text-xs font-black text-gray-900">
          <span>₹0</span>
          <span>₹{filters.priceRange[1]}</span>
        </div>
      </section>

      {/* Trust & Verification */}
      <section>
        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Trust Factor</h4>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary"
            onChange={(e) => setFilters({...filters, verifiedOnly: e.target.checked})}
          />
          <span className="text-sm font-bold text-gray-600 group-hover:text-primary transition">Verified Only</span>
        </label>
      </section>

      {/* Amenities */}
      <section>
        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Amenities</h4>
        <div className="space-y-3">
          {['AC', 'WiFi', 'Attached Washroom', 'Food Included', 'Laundry'].map(item => (
            <label key={item} className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded-lg border-gray-200 text-primary"
                onChange={() => handleAmenityToggle(item)}
              />
              <span className="text-sm font-bold text-gray-600">{item}</span>
            </label>
          ))}
        </div>
      </section>

      <button 
        onClick={() => window.location.reload()}
        className="w-full py-4 text-xs font-black text-gray-400 hover:text-primary uppercase tracking-widest border-t border-gray-50"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default SidebarFilters;