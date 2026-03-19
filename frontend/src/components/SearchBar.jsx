import { useState } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState({ city: '', category: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto -mt-8 relative z-10">
      <div className="bg-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 border border-gray-100">
        <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
          <MapPin className="text-primary" size={20} />
          <input
            type="text"
            placeholder="Search by city (e.g. Delhi, Bangalore)"
            className="bg-transparent w-full outline-none text-sm font-medium"
            onChange={(e) => setQuery({ ...query, city: e.target.value })}
          />
        </div>

        <div className="md:w-48 flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
          <Filter className="text-gray-400" size={18} />
          <select 
            className="bg-transparent w-full outline-none text-sm font-medium text-gray-600"
            onChange={(e) => setQuery({ ...query, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="PG">PG</option>
            <option value="Hotel">Hotel</option>
            <option value="Motel">Motel</option>
          </select>
        </div>

        <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
          <Search size={18} />
          Find Now
        </button>
      </div>
    </form>
  );
};

export default SearchBar;