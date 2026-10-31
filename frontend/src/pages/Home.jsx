import { useState, useEffect, useContext } from 'react';
import API from '../api/client';
import PropertyCard from '../components/PropertyCard';
import CategoryFilter from '../components/CategoryFilter';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import OwnerHome from '../components/home/OwnerHome';
import AdminHome from '../components/home/AdminHome';

const Home = () => {
    const { user } = useContext(AuthContext);

    // 1. OWNER ROLE: Render customized Owner Home Page
    if (user?.role === 'OWNER') {
        return <OwnerHome user={user} />;
    }

    // 2. ADMIN ROLE: Render customized Admin Home Page with all owners and verified PGs
    if (user?.role === 'ADMIN') {
        return <AdminHome user={user} />;
    }

    // 3. TENANT / GUEST ROLE: Standard Tenant Discovery Home Page
    const [properties, setProperties] = useState([]);
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (!search.trim()) return;
        navigate(`/search?city=${encodeURIComponent(search.trim())}`);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const propRes = await API.get(category === 'all' ? '/properties/search' : `/properties/search?category=${category}`);
                setProperties(propRes.data.data || []);
            } catch (err) {
                console.error('Sync Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [category]);

    return (
        <div className="space-y-16 pb-20">
            {/* 1. HERO SECTION */}
            <section className="relative h-[500px] rounded-[4rem] overflow-hidden flex items-center justify-center px-6 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80" className="absolute inset-0 w-full h-full object-cover" alt="Hero" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
                <div className="relative z-10 w-full max-w-3xl text-center space-y-8">
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                        Your Stay, <br /> <span className="text-primary italic">Simplified.</span>
                    </h1>
                    <form onSubmit={handleSearch} className="bg-white p-2 rounded-[2.5rem] shadow-2xl flex items-center gap-2">
                        <div className="flex-grow flex items-center gap-3 px-6">
                            <Search className="text-gray-400" size={24} />
                            <input
                                type="text"
                                placeholder="Where are you moving? (City)..."
                                className="w-full py-5 outline-none font-bold text-gray-700 text-lg"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-primary transition shadow-xl">
                            Find PG
                        </button>
                    </form>
                </div>
            </section>

            {/* 2. CATEGORIES & GRID */}
            <section className="container mx-auto px-4">
                <CategoryFilter active={category} onChange={setCategory} />
            </section>
            <section className="container mx-auto px-4">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight italic mb-8">Recommended.</h2>
                {loading ? (
                    <div className="py-24 flex justify-center">
                        <Loader2 className="animate-spin text-primary" size={48} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {properties.map((item) => (
                            <PropertyCard key={item._id} property={item} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
