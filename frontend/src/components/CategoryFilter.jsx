import { Home, Building2, Car, Map as MapIcon } from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Stays', icon: MapIcon },
  { id: 'PG', name: 'Student PG', icon: Home },
  { id: 'Hotel', name: 'Hotels', icon: Building2 },
  { id: 'Motel', name: 'Motels', icon: Car },
];

const CategoryFilter = ({ active, onChange }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
      {categories.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer ${
              isActive 
                ? 'btn-netflix scale-105 shadow-lg shadow-red-950/60' 
                : 'bg-[#1e1e1e] text-gray-300 border border-[#2e2e2e] hover:bg-[#282828] hover:text-white hover:border-primary/40'
            }`}
          >
            <cat.icon size={16} className={isActive ? 'text-white' : 'text-gray-400'} />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
