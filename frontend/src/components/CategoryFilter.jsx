import { Home, Building2, Car, Map as MapIcon } from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Stays', icon: MapIcon },
  { id: 'PG', name: 'Student PG', icon: Home },
  { id: 'Hotel', name: 'Hotels', icon: Building2 },
  { id: 'Motel', name: 'Motels', icon: Car },
];

const CategoryFilter = ({ active, onChange }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
            active === cat.id 
            ? 'bg-primary text-white shadow-xl shadow-blue-100 scale-105' 
            : 'bg-white text-gray-500 border border-gray-100 hover:border-primary/30'
          }`}
        >
          <cat.icon size={18} />
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;