import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/client';
import PropertyHorizontalCard from '../components/PropertyHorizontalCard';
import SidebarFilters from '../components/SidebarFilters';
import PropertyMap from '../components/PropertyMap';
import { useDebounce } from '../hooks/useDebounce';
import { 
  Loader2, Map as MapIcon, List, Columns, SlidersHorizontal, 
  Search, X, RotateCcw, MapPin, ChevronDown, Check, Sparkles 
} from 'lucide-react';

const POPULAR_CITIES = [
  'All Cities', 'Noida', 'Delhi NCR', 'Gurugram', 
  'Bengaluru', 'Pune', 'Mumbai', 'Hyderabad', 'Kota'
];

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // View mode: 'list', 'split', 'map'
  const [view, setView] = useState('list');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Search input with debounce
  const initialSearch = queryParams.get('city') || queryParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 350);

  // Sorting
  const [sortBy, setSortBy] = useState('popular');

  // Map Coordinates (default to NCR/Noida)
  const [mapCoords, setMapCoords] = useState({ lat: 28.62, lng: 77.36 });

  // Filter state
  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    amenities: [],
    category: queryParams.get('category') || 'all',
    verifiedOnly: false,
    gender: 'ALL',
    minRating: 0,
    collection: ''
  });

  // Fetch results based on debounced search and active filters
  const fetchResults = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch.trim() === 'All Cities' ? '' : debouncedSearch.trim(),
        category: filters.category !== 'all' ? filters.category : undefined,
        minPrice: filters.priceRange?.[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange?.[1] < 50000 ? filters.priceRange[1] : undefined,
        amenities: filters.amenities?.length > 0 ? filters.amenities.join(',') : undefined,
        verifiedOnly: filters.verifiedOnly ? true : undefined,
        gender: filters.gender !== 'ALL' ? filters.gender : undefined,
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        collection: filters.collection || undefined,
        sortBy: sortBy,
        lat: view === 'map' && lat ? lat : undefined,
        lng: view === 'map' && lng ? lng : undefined,
        maxDistance: 25000
      };

      const { data } = await API.get('/properties/search', { params });
      setProperties(data.data || []);
    } catch (err) {
      console.error("Search Matrix Error:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, sortBy, view]);

  // Trigger search on filter/search change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Handle direct city click from quick chips
  const handleCitySelect = (city) => {
    if (city === 'All Cities') {
      setSearchInput('');
    } else {
      setSearchInput(city);
    }
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      priceRange: [0, 50000],
      amenities: [],
      category: 'all',
      verifiedOnly: false,
      gender: 'ALL',
      minRating: 0,
      collection: ''
    });
  };

  // Active filter count for badge
  const activeChips = [];
  if (searchInput && searchInput !== 'All Cities') {
    activeChips.push({ label: `City: ${searchInput}`, remove: () => setSearchInput('') });
  }
  if (filters.collection) {
    activeChips.push({ label: `Tier: ${filters.collection}`, remove: () => setFilters({ ...filters, collection: '' }) });
  }
  if (filters.category && filters.category !== 'all') {
    activeChips.push({ label: `Type: ${filters.category}`, remove: () => setFilters({ ...filters, category: 'all' }) });
  }
  if (filters.gender && filters.gender !== 'ALL') {
    activeChips.push({ label: `Resident: ${filters.gender}`, remove: () => setFilters({ ...filters, gender: 'ALL' }) });
  }
  if (filters.minRating > 0) {
    activeChips.push({ label: `${filters.minRating}+ Stars`, remove: () => setFilters({ ...filters, minRating: 0 }) });
  }
  if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000)) {
    activeChips.push({ 
      label: `₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}`, 
      remove: () => setFilters({ ...filters, priceRange: [0, 50000] }) 
    });
  }
  if (filters.verifiedOnly) {
    activeChips.push({ label: 'Verified Only', remove: () => setFilters({ ...filters, verifiedOnly: false }) });
  }
  filters.amenities?.forEach(a => {
    activeChips.push({ 
      label: a, 
      remove: () => setFilters({ ...filters, amenities: filters.amenities.filter(item => item !== a) }) 
    });
  });

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* 1. TOP SEARCH & CONTROLS HEADER */}
      <section className="bg-[#181818] rounded-[2.5rem] p-5 sm:p-7 border border-[#2a2a2a] shadow-xl text-white space-y-5">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Debounced Search Input */}
          <div className="relative w-full lg:w-[480px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by city, locality, PG name, sector..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-[#242424] rounded-2xl font-bold text-sm text-white outline-none focus:ring-2 focus:ring-primary border border-[#333333] transition placeholder-gray-400"
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Right Action Group: Sorting, View Switcher & Mobile Filter */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-[#242424] hover:bg-[#2c2c2c] text-white border border-[#333333] px-4 py-2.5 rounded-2xl font-black text-xs uppercase"
            >
              <SlidersHorizontal size={14} /> Filters
              {activeChips.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                  {activeChips.length}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-[#242424] px-4 py-2.5 rounded-2xl border border-[#333333]">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Sort:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-xs text-white outline-none cursor-pointer"
              >
                <option value="popular" className="bg-[#242424] text-white">Recommended</option>
                <option value="price_asc" className="bg-[#242424] text-white">Price: Low to High</option>
                <option value="price_desc" className="bg-[#242424] text-white">Price: High to Low</option>
                <option value="rating_desc" className="bg-[#242424] text-white">Guest Rating: High to Low</option>
                <option value="newest" className="bg-[#242424] text-white">Newest Stays</option>
              </select>
            </div>

            {/* View Switcher: List, Split, Map */}
            <div className="flex bg-[#1c1c1c] p-1 rounded-2xl border border-[#2e2e2e]">
              <button 
                onClick={() => setView('list')}
                title="List View"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs uppercase transition-all cursor-pointer ${
                  view === 'list' ? 'btn-netflix shadow-sm text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List size={15} /> <span className="hidden sm:inline">List</span>
              </button>

              <button 
                onClick={() => setView('split')}
                title="Split View (List + Map)"
                className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs uppercase transition-all cursor-pointer ${
                  view === 'split' ? 'btn-netflix shadow-sm text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Columns size={15} /> <span>Split</span>
              </button>

              <button 
                onClick={() => setView('map')}
                title="Map View"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs uppercase transition-all cursor-pointer ${
                  view === 'map' ? 'btn-netflix shadow-sm text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <MapIcon size={15} /> <span className="hidden sm:inline">Map</span>
              </button>
            </div>

          </div>
        </div>

        {/* Quick City Selector Rail */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <MapPin size={12} className="text-primary" /> Hubs:
          </span>
          {POPULAR_CITIES.map((c) => {
            const isSelected = (searchInput === c) || (c === 'All Cities' && !searchInput);
            return (
              <button
                key={c}
                onClick={() => handleCitySelect(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected 
                    ? 'btn-netflix shadow-sm text-white' 
                    : 'bg-[#242424] text-gray-300 border border-[#333333] hover:text-white hover:bg-[#2c2c2c]'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips Bar */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#282828]">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active:</span>
            {activeChips.map((chip, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1.5 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30"
              >
                <span>{chip.label}</span>
                <button onClick={chip.remove} className="hover:text-white cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            ))}
            <button 
              onClick={handleResetFilters}
              className="text-[11px] font-black uppercase tracking-wider text-primary hover:underline ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* 2. MAIN RESULTS LAYOUT (BASED ON VIEW MODE) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* DESKTOP SIDEBAR FILTERS */}
        {view !== 'map' && (
          <aside className="hidden lg:block w-[300px] shrink-0 sticky top-24 bg-[#181818] p-7 rounded-[2.5rem] border border-[#2a2a2a] shadow-xl text-white max-h-[calc(100vh-120px)] overflow-y-auto">
            <SidebarFilters 
              filters={filters} 
              setFilters={setFilters} 
              onReset={handleResetFilters} 
            />
          </aside>
        )}

        {/* CONTENT REGION */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          
          {/* Header Count Banner */}
          <div className="flex justify-between items-center px-1">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">
                {searchInput ? `Stays in ${searchInput}` : 'Recommended Accommodations'}
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {loading ? 'Searching live matrix...' : `${properties.length} verified properties ready for booking`}
              </p>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-[#181818] rounded-[3.5rem] border border-[#2a2a2a]">
              <Loader2 className="animate-spin text-primary mb-4" size={44} />
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em]">
                Finding Best Deals & Checking Availability...
              </p>
            </div>
          ) : properties.length === 0 ? (
            /* EMPTY STATE */
            <div className="text-center py-28 bg-[#181818] rounded-[3.5rem] border border-[#2a2a2a] p-8 space-y-4">
              <div className="w-16 h-16 bg-[#242424] rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                <SlidersHorizontal size={28} />
              </div>
              <h3 className="text-2xl font-black italic text-white tracking-tight">No Stays Found</h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto">
                No properties match your current combination of city, budget, and amenities.
              </p>
              <button 
                onClick={handleResetFilters}
                className="btn-netflix px-7 py-3 rounded-2xl font-black text-xs uppercase shadow-lg cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : view === 'split' ? (
            /* SPLIT VIEW (LEFT: CARDS, RIGHT: STICKY MAP) */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-7 space-y-5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
                {properties.map(pg => (
                  <div 
                    key={pg._id}
                    onMouseEnter={() => setSelectedPropertyId(pg._id)}
                    className={selectedPropertyId === pg._id ? 'ring-2 ring-primary rounded-[2.5rem]' : ''}
                  >
                    <PropertyHorizontalCard property={pg} />
                  </div>
                ))}
              </div>

              <div className="xl:col-span-5 sticky top-24 h-[calc(100vh-140px)]">
                <PropertyMap 
                  properties={properties} 
                  selectedPropertyId={selectedPropertyId}
                  onSelectProperty={(prop) => setSelectedPropertyId(prop._id)}
                  onMapMove={(lat, lng) => setMapCoords({ lat, lng })}
                />
              </div>
            </div>
          ) : view === 'map' ? (
            /* FULL MAP VIEW */
            <div className="h-[78vh] relative rounded-[3rem] overflow-hidden shadow-xl border border-[#2a2a2a]">
              <PropertyMap 
                properties={properties} 
                selectedPropertyId={selectedPropertyId}
                onSelectProperty={(prop) => setSelectedPropertyId(prop._id)}
                onMapMove={(lat, lng) => setMapCoords({ lat, lng })}
              />
            </div>
          ) : (
            /* FULL LIST VIEW */
            <div className="space-y-6">
              {properties.map(pg => (
                <PropertyHorizontalCard key={pg._id} property={pg} />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* 3. MOBILE FILTER MODAL DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#181818] text-white border-l border-[#2e2e2e] h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-primary" />
                  <h3 className="text-lg font-black text-white">Filters</h3>
                </div>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 rounded-xl bg-[#242424] text-gray-300 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <SidebarFilters 
                filters={filters} 
                setFilters={setFilters} 
                onReset={handleResetFilters} 
              />
            </div>

            <div className="pt-6 border-t border-[#2e2e2e] mt-6 sticky bottom-0 bg-[#181818]">
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full btn-netflix py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition cursor-pointer"
              >
                Apply Filters ({properties.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SearchResults;
