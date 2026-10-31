import { 
  SlidersHorizontal, CheckCircle2, RotateCcw, 
  Sparkles, DollarSign, Star, ShieldCheck, UserCheck, Flame 
} from 'lucide-react';

const AMENITIES_LIST = [
  { name: 'AC', icon: '❄️' },
  { name: 'WiFi', icon: '📶' },
  { name: 'Attached Washroom', icon: '🚿' },
  { name: 'Food Included', icon: '🍲' },
  { name: 'Power Backup', icon: '⚡' },
  { name: 'Geyser', icon: '♨️' },
  { name: 'Laundry', icon: '🧺' },
  { name: 'CCTV', icon: '📹' },
  { name: 'RO Water', icon: '💧' },
  { name: 'Housekeeping', icon: '🧹' },
  { name: 'Parking', icon: '🅿️' },
  { name: 'Gym', icon: '🏋️' }
];

const PRICE_PRESETS = [
  { label: 'Under ₹6,000', range: [0, 6000] },
  { label: '₹6k - ₹10k', range: [6000, 10000] },
  { label: '₹10k - ₹18k', range: [10000, 18000] },
  { label: 'Luxury ₹18k+', range: [18000, 50000] }
];

const SidebarFilters = ({ filters, setFilters, onReset }) => {

  const handleAmenityToggle = (amenity) => {
    const currentAmenities = filters.amenities || [];
    const updated = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    setFilters({ ...filters, amenities: updated });
  };

  const handlePricePreset = (range) => {
    setFilters({ ...filters, priceRange: range });
  };

  const resetAll = () => {
    if (onReset) {
      onReset();
    } else {
      setFilters({
        priceRange: [0, 50000],
        amenities: [],
        category: 'all',
        verifiedOnly: false,
        gender: 'ALL',
        minRating: 0,
        collection: ''
      });
    }
  };

  const activeFilterCount = (
    (filters.amenities?.length || 0) +
    (filters.category !== 'all' && filters.category ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.gender && filters.gender !== 'ALL' ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.collection ? 1 : 0) +
    (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) ? 1 : 0)
  );

  return (
    <div className="space-y-8 select-none text-white">
      
      {/* 1. FILTER HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-[#282828]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
            <SlidersHorizontal size={16} />
          </div>
          <div>
            <h3 className="font-black text-white text-base">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-black uppercase text-primary">
                {activeFilterCount} active
              </span>
            )}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button 
            onClick={resetAll}
            className="text-[11px] font-black uppercase tracking-wider text-primary hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw size={12} /> Clear
          </button>
        )}
      </div>

      {/* 2. COLLECTIONS */}
      <section className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-400" />
          <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Collections</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: '', label: 'All Stays' },
            { id: 'FLAGSHIP', label: '⭐ Flagship' },
            { id: 'LUXURY', label: '💎 Luxury' },
            { id: 'BUDGET', label: '🎓 Student' }
          ].map((col) => (
            <button
              key={col.id}
              onClick={() => setFilters({ ...filters, collection: col.id })}
              className={`py-2 px-3 rounded-xl text-xs font-black transition text-center cursor-pointer ${
                filters.collection === col.id
                  ? 'btn-netflix shadow-md text-white'
                  : 'bg-[#242424] text-gray-300 border border-[#333333] hover:bg-[#2c2c2c] hover:text-white'
              }`}
            >
              {col.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. PRICE RANGE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <DollarSign size={14} className="text-primary" />
            <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Price Range</h4>
          </div>
          <span className="text-xs font-black text-white font-mono">
            Up to ₹{(filters.priceRange?.[1] || 50000).toLocaleString()}
          </span>
        </div>

        {/* Quick Range Presets */}
        <div className="grid grid-cols-2 gap-1.5">
          {PRICE_PRESETS.map((p, idx) => {
            const isMatch = filters.priceRange?.[0] === p.range[0] && filters.priceRange?.[1] === p.range[1];
            return (
              <button
                key={idx}
                onClick={() => handlePricePreset(p.range)}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition text-center cursor-pointer ${
                  isMatch 
                    ? 'btn-netflix shadow-sm text-white' 
                    : 'bg-[#242424] text-gray-300 border border-[#333333] hover:bg-[#2c2c2c] hover:text-white'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <input 
          type="range" 
          min="3000" 
          max="50000" 
          step="1000"
          value={filters.priceRange?.[1] || 50000}
          className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-primary"
          onChange={(e) => setFilters({
            ...filters, 
            priceRange: [filters.priceRange?.[0] || 0, Number(e.target.value)]
          })}
        />

        <div className="flex justify-between text-[11px] font-bold text-gray-400">
          <span>₹3,000</span>
          <span>₹25,000</span>
          <span>₹50,000+</span>
        </div>
      </section>

      {/* 4. RESIDENT GENDER PREFERENCE */}
      <section className="space-y-3">
        <div className="flex items-center gap-1.5">
          <UserCheck size={14} className="text-primary" />
          <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Resident Type</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'ALL', label: 'Unisex' },
            { id: 'MALE', label: 'Boys' },
            { id: 'FEMALE', label: 'Girls' }
          ].map(g => (
            <button
              key={g.id}
              onClick={() => setFilters({ ...filters, gender: g.id })}
              className={`py-2 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                (filters.gender || 'ALL') === g.id
                  ? 'btn-netflix shadow-md text-white'
                  : 'bg-[#242424] text-gray-300 border border-[#333333] hover:bg-[#2c2c2c] hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      {/* 5. PROPERTY CATEGORY */}
      <section className="space-y-3">
        <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Property Type</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'all', label: 'All Types' },
            { id: 'PG', label: 'PG / Co-Living' },
            { id: 'Hostel', label: 'Hostel' },
            { id: 'Hotel', label: 'Hotel / Suite' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setFilters({ ...filters, category: c.id })}
              className={`py-2 px-2.5 rounded-xl text-xs font-black transition text-left truncate cursor-pointer ${
                (filters.category || 'all') === c.id
                  ? 'btn-netflix shadow-md text-white'
                  : 'bg-[#242424] text-gray-300 border border-[#333333] hover:bg-[#2c2c2c] hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* 6. GUEST RATING */}
      <section className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Guest Rating</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { val: 0, label: 'Any' },
            { val: 3.5, label: '3.5+ Good' },
            { val: 4.0, label: '4.0+ Very Good' },
            { val: 4.5, label: '4.5+ Exceptional' }
          ].map(r => (
            <button
              key={r.val}
              onClick={() => setFilters({ ...filters, minRating: r.val })}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${
                (filters.minRating || 0) === r.val
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#242424] text-gray-300 border border-[#333333] hover:bg-[#2c2c2c] hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {/* 7. POPULAR AMENITIES CHECKLIST */}
      <section className="space-y-3">
        <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Amenities</h4>
        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {AMENITIES_LIST.map(item => {
            const isChecked = filters.amenities?.includes(item.name);
            return (
              <label 
                key={item.name} 
                onClick={() => handleAmenityToggle(item.name)}
                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition text-xs font-bold ${
                  isChecked 
                    ? 'border-primary bg-primary/20 text-white' 
                    : 'border-[#333333] bg-[#222222] hover:bg-[#282828] text-gray-300 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 8. TRUST & VERIFICATION */}
      <section className="pt-2 border-t border-[#282828]">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={!!filters.verifiedOnly}
            onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
            className="w-5 h-5 rounded-lg border-[#333333] text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <div className="flex items-center gap-1.5 text-xs font-black text-gray-300 group-hover:text-primary transition">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Verified Properties Only</span>
          </div>
        </label>
      </section>

    </div>
  );
};

export default SidebarFilters;
