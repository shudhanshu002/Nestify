import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api/client';
import PropertyHorizontalCard from '../components/PropertyHorizontalCard';
import SidebarFilters from '../components/SidebarFilters';
import PropertyMap from '../components/PropertyMap'; // 󾠮 Make sure this component exists
import { Loader2, Map as MapIcon, List, SlidersHorizontal, ArrowLeft } from 'lucide-react';

const SearchResults = () => {
  const [view, setView] = useState('list'); // 'list' or 'map'
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 󾠯 Default coordinates (centers on NCR/Noida area if no city is found)
  const [mapCoords, setMapCoords] = useState({ lat: 28.62, lng: 77.36 });

  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    amenities: [],
    category: 'all',
    verifiedOnly: false
  });

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const city = queryParams.get('city') || '';

  // 󾠰 Core Fetch Logic: Combines City, Filters, and Map Coordinates
  const fetchResults = useCallback(async (lat, lng) => {
  setLoading(true);
  try {
    // 󾠮 LOGIC: Map the URL 'city' to a general 'search' keyword.
    // This allows searching for "Matrix" or "Noida" in the same input.
    const params = { 
      ...filters, 
      search: city, // Backend uses this for Title/City/Address regex
      lat: view === 'map' ? lat : undefined,
      lng: view === 'map' ? lng : undefined,
      maxDistance: 15000 // Increased to 15km for better "catch" area
    };

    // 󾠯 DEBUG: Look at your browser console to see if lat/lng are populated!
    console.log("󾓲 MATRIX REQUEST:", params);

    const { data } = await API.get('/properties/search', { params });
    setProperties(data.data);
  } catch (err) {
    console.error("Search Matrix Error:", err);
  } finally {
    setLoading(false);
  }
}, [filters, city, view]);

  useEffect(() => {
    fetchResults(mapCoords.lat, mapCoords.lng);
  }, [fetchResults, mapCoords]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Search Matrix
          </div>
          <h1 className="text-4xl font-black text-gray-900 italic tracking-tighter">
            Stays in {city || 'Current Area'}
          </h1>
          <p className="text-gray-400 font-bold text-sm mt-1">
            {properties.length} verified results found for your filters
          </p>
        </div>

        {/* 󾠱 TOGGLE BUTTON: List vs Map */}
        <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-2xl shadow-blue-100/50 border border-gray-100">
          <button 
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List size={16} /> List
          </button>
          <button 
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${view === 'map' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MapIcon size={16} /> Map
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT: SIDEBAR FILTERS (Always visible unless full-screen map is preferred) */}
        <aside className="lg:w-[320px] shrink-0">
          <div className="sticky top-28 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <SidebarFilters filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        {/* RIGHT: CONTENT AREA */}
        <main className="flex-1 min-h-[70vh]">
          {loading && view === 'list' ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-gray-50">
              <Loader2 className="animate-spin text-primary mb-4" size={48} />
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em]">Decoding Availability...</p>
            </div>
          ) : view === 'map' ? (
            /* 󾠲 MAP VIEW: Pass properties and the move handler */
            <div className="h-[75vh] sticky top-28 animate-in fade-in zoom-in duration-500">
              <PropertyMap 
                properties={properties} 
                onMapMove={(lat, lng) => setMapCoords({ lat, lng })}
              />
            </div>
          ) : properties.length > 0 ? (
            /* LIST VIEW */
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
              {properties.map(pg => (
                <PropertyHorizontalCard key={pg._id} property={pg} />
              ))}
            </div>
          ) : (
            /* NO RESULTS STATE */
            <div className="text-center py-32 bg-gray-50 rounded-[4rem] border-4 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <SlidersHorizontal size={32} className="text-gray-200" />
              </div>
              <h3 className="text-2xl font-black italic text-gray-400 uppercase tracking-tighter">No Matches Found.</h3>
              <p className="text-gray-300 font-bold text-sm mt-2">Adjust your filters or move the map to a different sector.</p>
              <button 
                onClick={() => setFilters({ priceRange: [0, 50000], amenities: [], category: 'all', verifiedOnly: false })} 
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase mt-8 hover:bg-primary transition shadow-xl"
              >
                Reset Search
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResults;