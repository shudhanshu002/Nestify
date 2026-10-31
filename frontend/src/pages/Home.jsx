import { useState, useEffect, useContext } from 'react';
import API from '../api/client';
import PropertyCard from '../components/PropertyCard';
import PropertyHorizontalCard from '../components/PropertyHorizontalCard';
import PropertyMap from '../components/PropertyMap';
import CategoryFilter from '../components/CategoryFilter';
import { 
  Search, Loader2, Sparkles, MapPin, ShieldCheck, 
  Utensils, Zap, Wifi, Star, ArrowRight, LayoutGrid, 
  List, Map as MapIcon, ChevronRight, Gift, CheckCircle2 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import OwnerHome from '../components/home/OwnerHome';
import AdminHome from '../components/home/AdminHome';

const POPULAR_HUBS = [
  { city: 'Noida', label: 'Sector 62 & IT Parks', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600' },
  { city: 'Delhi NCR', label: 'North & South Campus', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600' },
  { city: 'Gurugram', label: 'Cyber City & DLF', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600' },
  { city: 'Bengaluru', label: 'Koramangala & HSR', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600' },
  { city: 'Pune', label: 'Hinjewadi & Viman Nagar', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600' },
  { city: 'Kota', label: 'Landmark City & Allen', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600' },
];

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

    // 3. TENANT / GUEST ROLE: OYO-style Public Discovery Home Page
    const [properties, setProperties] = useState([]);
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [residentType, setResidentType] = useState('ALL');
    const [homeView, setHomeView] = useState('collections'); // 'collections', 'grid', 'map'
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search.trim()) params.set('city', search.trim());
        if (residentType !== 'ALL') params.set('gender', residentType);
        if (category !== 'all') params.set('category', category);
        navigate(`/search?${params.toString()}`);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const propRes = await API.get(
                  category === 'all' 
                    ? '/properties/search' 
                    : `/properties/search?category=${category}`
                );
                setProperties(propRes.data.data || []);
            } catch (err) {
                console.error('Sync Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [category]);

    // Partition properties into OYO-style collections using explicit property.tier
    const flagshipStays = properties.filter(p => 
      p.tier === 'FLAGSHIP' || p.tier === 'LUXURY' || (!p.tier && (p.basePrice >= 9000 || p.averageRating >= 4.4))
    ).slice(0, 6);
    
    const budgetStays = properties.filter(p => 
      p.tier === 'BUDGET' || (!p.tier && p.basePrice <= 8500)
    ).slice(0, 6);
    const topRatedStays = [...properties].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 6);

    return (
        <div className="space-y-16 pb-24">
            
            {/* 1. OYO-STYLE HERO SECTION WITH SEARCH WIDGET */}
            <section className="relative rounded-[3.5rem] bg-gray-950 text-white p-6 sm:p-12 md:p-16 overflow-hidden shadow-2xl border border-gray-800">
                {/* Background glow and subtle image overlay */}
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                <div className="absolute right-[-80px] top-[-80px] w-[500px] h-[500px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none"></div>
                <div className="absolute left-[-80px] bottom-[-80px] w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-primary border border-white/10">
                        <Sparkles size={14} className="text-amber-400" />
                        India's Leading Co-Living & PG Stays
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter leading-none">
                        Your Stay, <span className="text-primary not-italic">Simplified.</span>
                    </h1>

                    <p className="text-gray-300 text-sm sm:text-base font-medium max-w-xl mx-auto">
                        Explore verified PGs, student hostels, and premium serviced suites with zero brokerage and instant check-in.
                    </p>

                    {/* Integrated Search Box */}
                    <form onSubmit={handleSearch} className="bg-white p-3 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto border-4 border-white/10">
                        
                        {/* Search Input */}
                        <div className="flex-grow flex items-center gap-3 px-5 py-2 w-full">
                            <Search className="text-gray-400 shrink-0" size={22} />
                            <input
                                type="text"
                                placeholder="Search City, Sector, Metro or Landmark..."
                                className="w-full py-2 outline-none font-bold text-gray-800 text-base placeholder-gray-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Resident Gender Pill Selector */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto shrink-0 justify-center">
                            {[
                              { id: 'ALL', label: 'All' },
                              { id: 'MALE', label: 'Boys' },
                              { id: 'FEMALE', label: 'Girls' }
                            ].map(g => (
                              <button
                                type="button"
                                key={g.id}
                                onClick={() => setResidentType(g.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                                  residentType === g.id 
                                    ? 'bg-gray-900 text-white shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                              >
                                {g.label}
                              </button>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            className="w-full md:w-auto bg-primary hover:bg-rose-600 text-white px-8 py-4 rounded-[2rem] font-black text-sm uppercase tracking-wider transition shadow-xl active:scale-95 shrink-0 flex items-center justify-center gap-2"
                        >
                            Find Stay <ArrowRight size={16} />
                        </button>
                    </form>

                    {/* Quick City Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Top Hubs:</span>
                        {['Noida', 'Delhi NCR', 'Gurugram', 'Bengaluru', 'Pune', 'Kota'].map(c => (
                            <button
                                key={c}
                                onClick={() => navigate(`/search?city=${encodeURIComponent(c)}`)}
                                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-gray-950 text-gray-200 text-xs font-bold transition border border-white/10"
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. OYO VALUE PROPOSITIONS BAR */}
            <section className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 text-white p-6 rounded-[2.5rem] border border-gray-800 shadow-xl">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                            <Gift size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-wider text-rose-400">Zero Brokerage</h4>
                            <p className="text-[11px] text-gray-400 font-medium">Direct landlord deals</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-wider text-emerald-400">100% Verified</h4>
                            <p className="text-[11px] text-gray-400 font-medium">KYC & physical audits</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                            <Utensils size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-wider text-amber-400">Meals Included</h4>
                            <p className="text-[11px] text-gray-400 font-medium">Breakfast & hot dinner</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                            <Wifi size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-wider text-blue-400">High-Speed Net</h4>
                            <p className="text-[11px] text-gray-400 font-medium">100+ Mbps fiber Wi-Fi</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. CATEGORY SELECTOR & VIEW SWITCHER */}
            <section className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <CategoryFilter active={category} onChange={setCategory} />

                {/* Home View Mode Toggle */}
                <div className="flex bg-gray-100 p-1.5 rounded-2xl shrink-0 border border-gray-200">
                    <button
                        onClick={() => setHomeView('collections')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
                            homeView === 'collections' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Sparkles size={14} className="text-amber-500" /> Curated
                    </button>
                    <button
                        onClick={() => setHomeView('grid')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
                            homeView === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <LayoutGrid size={14} /> Grid
                    </button>
                    <button
                        onClick={() => setHomeView('map')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
                            homeView === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <MapIcon size={14} /> Map
                    </button>
                </div>
            </section>

            {/* 4. CONTENT SECTIONS (ACCORDING TO ACTIVE VIEW) */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-primary mb-3" size={48} />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Syncing live stays...</p>
                </div>
            ) : homeView === 'map' ? (
                /* LIVE INTERACTIVE MAP EXPLORER */
                <section className="container mx-auto px-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">Map View.</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                Explore pricing across localities and click pins to preview
                            </p>
                        </div>
                        <Link 
                            to="/search?view=map" 
                            className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                        >
                            Open Full Screen Map <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="h-[600px] w-full rounded-[3rem] overflow-hidden shadow-xl border border-gray-100">
                        <PropertyMap properties={properties} height="600px" />
                    </div>
                </section>
            ) : homeView === 'grid' ? (
                /* ALL PROPERTIES GRID VIEW */
                <section className="container mx-auto px-4 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">
                            Available Stays ({properties.length}).
                        </h2>
                        <Link 
                            to="/search" 
                            className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                        >
                            Advanced Search & Filters <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((item) => (
                            <PropertyCard key={item._id} property={item} />
                        ))}
                    </div>
                </section>
            ) : (
                /* CURATED OYO COLLECTIONS VIEW */
                <div className="space-y-16">
                    
                    {/* RAIL 1: NESTIFY FLAGSHIP & LUXURY */}
                    {flagshipStays.length > 0 && (
                        <section className="container mx-auto px-4 space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-black uppercase tracking-wider mb-1">
                                        <Sparkles size={14} /> Premium Experience
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">
                                        Nestify Flagship & Luxury Suites.
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        Handpicked accommodations with AC, attached bath, and top-tier amenities
                                    </p>
                                </div>
                                <Link 
                                    to="/search?collection=LUXURY" 
                                    className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                                >
                                    View All Luxury ({flagshipStays.length}) <ChevronRight size={14} />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {flagshipStays.map((item) => (
                                    <PropertyCard key={item._id} property={item} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* RAIL 2: POCKET-FRIENDLY STUDENT PICKS */}
                    {budgetStays.length > 0 && (
                        <section className="container mx-auto px-4 space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-black uppercase tracking-wider mb-1">
                                        🎓 Student & Fresher Favorites
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">
                                        Pocket-Friendly Stays Under ₹8,500.
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        All-inclusive tariffs with Wi-Fi, laundry, and meals included
                                    </p>
                                </div>
                                <Link 
                                    to="/search?collection=BUDGET" 
                                    className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                                >
                                    View All Budget <ChevronRight size={14} />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {budgetStays.map((item) => (
                                    <PropertyCard key={item._id} property={item} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* RAIL 3: TOP RATED BY RESIDENTS */}
                    {topRatedStays.length > 0 && (
                        <section className="container mx-auto px-4 space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase tracking-wider mb-1">
                                        <Star size={14} className="fill-emerald-600" /> Rated 4.5+
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">
                                        Highest Rated by Residents.
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        Verified comfort, hygienic food, and excellent owner response
                                    </p>
                                </div>
                                <Link 
                                    to="/search?minRating=4.5" 
                                    className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                                >
                                    Explore Top Rated <ChevronRight size={14} />
                                </Link>
                            </div>

                            <div className="space-y-6">
                                {topRatedStays.slice(0, 3).map((item) => (
                                    <PropertyHorizontalCard key={item._id} property={item} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* RAIL 4: BROWSE BY POPULAR CO-LIVING HUBS */}
                    <section className="container mx-auto px-4 space-y-6">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">
                                Explore by City Hubs.
                            </h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                Find verified accommodation near major education centers and tech corridors
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {POPULAR_HUBS.map((hub) => (
                                <div
                                    key={hub.city}
                                    onClick={() => navigate(`/search?city=${encodeURIComponent(hub.city)}`)}
                                    className="group relative h-48 rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
                                >
                                    <img 
                                        src={hub.image} 
                                        alt={hub.city}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 right-4 text-white">
                                        <h3 className="text-lg font-black tracking-tight leading-tight group-hover:text-primary transition">
                                            {hub.city}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-300 truncate mt-0.5">
                                            {hub.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            )}

        </div>
    );
};

export default Home;
