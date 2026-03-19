import { useState, useEffect } from 'react';
import API from '../api/client';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { Loader2, Compass } from 'lucide-react';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await API.get('/properties/search', { params });
      setProperties(data.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="bg-primary pt-20 pb-24 px-4 text-center text-white rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <Compass size={400} className="absolute -top-20 -left-20" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4">Find Your Perfect Stay</h1>
        <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto">
          Verified PGs, Hotels, and Motels with verified safety metrics and student-friendly pricing.
        </p>
      </div>

      <SearchBar onSearch={fetchProperties} />

      <div className="mt-16">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-black text-gray-900">Featured Listings</h2>
          <span className="text-gray-500 text-sm">{properties.length} Results Found</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-gray-500 font-medium">Scanning the neighborhood...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map(item => (
              <PropertyCard key={item._id} pg={item} />
            ))}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No properties match your search. Try a different city!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;