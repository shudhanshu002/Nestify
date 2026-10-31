import { useState, useEffect, useContext } from 'react';
import API from '../api/client';
import PropertyCard from '../components/PropertyCard';
import PropertyHorizontalCard from '../components/PropertyHorizontalCard';
import PropertyMap from '../components/PropertyMap';
import CategoryFilter from '../components/CategoryFilter';

import { 
  Search, Loader2, Sparkles, MapPin, ShieldCheck, 
  Utensils, Zap, Wifi, Star, ArrowRight, LayoutGrid, 
  List, Map as MapIcon, ChevronRight, ChevronDown, Gift, 
  CheckCircle2, X, Building2, Clock, Lock, FileText, 
  Check, HelpCircle, Quote, UserCheck, ThumbsUp, Calendar, 
  CreditCard, Shield, Bed
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import OwnerHome from '../components/home/OwnerHome';
import AdminHome from '../components/home/AdminHome';

const POPULAR_HUBS = [
  { city: 'Noida', label: 'Sector 62, 125 & IT Hubs', avgPrice: '₹7,200', tag: 'Tech & Media', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600' },
  { city: 'Delhi NCR', label: 'North & South Campuses', avgPrice: '₹8,500', tag: 'University Hub', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600' },
  { city: 'Gurugram', label: 'Cyber City, Golf Course & DLF', avgPrice: '₹11,500', tag: 'Fortune 500', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600' },
  { city: 'Bengaluru', label: 'Koramangala, HSR & Indiranagar', avgPrice: '₹10,500', tag: 'Startup Capital', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600' },
  { city: 'Pune', label: 'Hinjewadi IT & Viman Nagar', avgPrice: '₹7,800', tag: 'Automobile & IT', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600' },
  { city: 'Kota', label: 'Landmark City & Allen Campus', avgPrice: '₹6,500', tag: 'Medical & JEE', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600' },
];

const RESIDENT_REVIEWS = [
  {
    name: 'Ananya Sharma',
    role: 'Software Engineer at Google',
    city: 'Gurugram (Cyber City)',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    text: 'Finding a PG near DLF Cyber City with true high-speed fiber Wi-Fi and hygienic food was impossible until Nestify. The in-app ticket resolved a geyser issue in under two hours!'
  },
  {
    name: 'Rohan Mehra',
    role: 'B.Tech Student (Final Year)',
    city: 'Noida (Sector 62)',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    text: 'The extend rent feature made my semester extension completely seamless. No awkward calls to brokers, zero brokerage, and I received my digital tax invoice instantly.'
  },
  {
    name: 'Dr. Rajesh Verma',
    role: 'Parent of Pre-Med Resident',
    city: 'Kota (Landmark City)',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    text: 'As parents living in Jaipur, knowing our daughter is in a physically audited PG with biometric security, verified warden KYC, and wholesome meals gives our family 100% peace of mind.'
  }
];

const FAQS = [
  {
    q: 'How does the Zero Brokerage Guarantee work?',
    a: 'Nestify connects you directly with verified landlords and building operators. There are no middlemen, no commission fees, and no hidden broker charges. What you see on the platform is the exact rent you pay.'
  },
  {
    q: 'How are Nestify properties verified and audited?',
    a: 'Every property undergoes our mandatory 35-point physical audit covering fire safety, CCTV coverage, high-speed fiber bandwidth, water purification, kitchen hygiene, and room measurements before going live.'
  },
  {
    q: 'What is the Move-In Escrow Protection?',
    a: 'When you book a stay on Nestify, your advance token is held in secure digital escrow. It is only released to the property owner after you complete your physical check-in and verify room specifications.'
  },
  {
    q: 'Can I extend my stay if my internship or semester continues?',
    a: 'Yes! Simply open your "My Stays" tab and click "Extend Stay". Nestify checks live room calendar availability in real time and increases your check-out date with automated digital payment.'
  },
  {
    q: 'How does maintenance support work during my stay?',
    a: 'Residents can raise a ticket directly in-app for Wi-Fi, plumbing, cleaning, or electrical issues. You get live progress alerts from the owner, and you can rate the quality of the fix once solved.'
  }
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

    // 3. TENANT / GUEST ROLE: Public Discovery Experience
    const [properties, setProperties] = useState([]);
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [residentType, setResidentType] = useState('ALL');
    const [budgetFilter, setBudgetFilter] = useState('ALL');
    const [homeView, setHomeView] = useState('collections'); // 'collections', 'grid', 'map'
    const [expandedFaq, setExpandedFaq] = useState(null);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search.trim()) params.set('city', search.trim());
        if (residentType !== 'ALL') params.set('gender', residentType);
        if (category !== 'all') params.set('category', category);
        if (budgetFilter === 'BUDGET') params.set('maxPrice', '8500');
        if (budgetFilter === 'LUXURY') params.set('minPrice', '12000');
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

    // Partition properties into collections
    const flagshipStays = properties.filter(p => 
      p.tier === 'FLAGSHIP' || p.tier === 'LUXURY' || (!p.tier && (p.basePrice >= 9000 || p.averageRating >= 4.4))
    ).slice(0, 6);
    
    const budgetStays = properties.filter(p => 
      p.tier === 'BUDGET' || (!p.tier && p.basePrice <= 8500)
    ).slice(0, 6);

    const topRatedStays = [...properties].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 6);

    return (
        <div className="space-y-24 text-white">
            
            {/* 1. CINEMATIC EDITORIAL HERO SECTION */}
            <section className="relative rounded-[3rem] bg-gradient-to-b from-[#181818] via-[#121212] to-[#141414] text-white p-6 sm:p-12 md:p-16 overflow-hidden shadow-2xl border border-[#2a2a2a]">
                
                {/* Ambient Red Glows & Grid Background */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E50914_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
                <div className="absolute right-[-100px] top-[-100px] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px] pointer-events-none animate-netflix-pulse"></div>
                <div className="absolute left-[-100px] bottom-[-100px] w-[450px] h-[450px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-[#222222]/90 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-primary border border-[#333333] shadow-md">
                        <Sparkles size={14} className="text-amber-400" />
                        Verified Co-Living & Student Housing Network
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter leading-none">
                        Find Your Ideal Stay. <br />
                        <span className="text-primary not-italic">Zero Brokerage. Pure Comfort.</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-gray-300 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
                        Explore over 14,000+ audited rooms across Delhi NCR, Gurugram, Bengaluru, Noida, Pune & Kota. Direct landlord lease agreements, escrow move-in protection, and 24/7 in-app grievance resolution.
                    </p>

                    {/* Professional Search Console */}
                    <form onSubmit={handleSearch} className="bg-[#1a1a1a]/95 backdrop-blur-xl p-3 sm:p-3.5 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-2.5 max-w-3xl mx-auto border border-[#333333]">
                        
                        {/* Search Input */}
                        <div className="flex-grow flex items-center gap-3 px-4 py-2 w-full">
                            <Search className="text-gray-400 shrink-0" size={20} />
                            <input
                                type="text"
                                placeholder="Search city, sector, college, or landmark..."
                                className="w-full py-2 outline-none font-bold text-white text-sm sm:text-base placeholder-gray-400 bg-transparent"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Resident Gender Pill Selector */}
                        <div className="flex bg-[#242424] p-1 rounded-2xl w-full md:w-auto shrink-0 justify-center border border-[#333333]">
                            {[
                              { id: 'ALL', label: 'All' },
                              { id: 'MALE', label: 'Boys' },
                              { id: 'FEMALE', label: 'Girls' }
                            ].map(g => (
                              <button
                                type="button"
                                key={g.id}
                                onClick={() => setResidentType(g.id)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                                  residentType === g.id 
                                    ? 'btn-netflix shadow-sm text-white' 
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {g.label}
                              </button>
                            ))}
                        </div>

                        {/* Budget Filter Quick Dropdown */}
                        <div className="hidden sm:flex items-center bg-[#242424] px-3 py-2 rounded-2xl border border-[#333333] shrink-0">
                            <select 
                              value={budgetFilter}
                              onChange={(e) => setBudgetFilter(e.target.value)}
                              className="bg-transparent text-xs font-black uppercase text-gray-300 outline-none cursor-pointer"
                            >
                              <option value="ALL" className="bg-[#242424] text-white">Any Budget</option>
                              <option value="BUDGET" className="bg-[#242424] text-white">Under ₹8.5k</option>
                              <option value="LUXURY" className="bg-[#242424] text-white">Luxury ₹12k+</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            className="w-full md:w-auto btn-netflix px-8 py-3.5 rounded-[2rem] font-black text-xs uppercase tracking-wider transition shadow-xl shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Find Stay <ArrowRight size={16} />
                        </button>
                    </form>

                    {/* Quick City Hubs Bar */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Top Hubs:</span>
                        {['Noida', 'Delhi NCR', 'Gurugram', 'Bengaluru', 'Pune', 'Kota'].map(c => (
                            <button
                                key={c}
                                onClick={() => navigate(`/search?city=${encodeURIComponent(c)}`)}
                                className="px-3 py-1 rounded-full bg-[#222222] hover:bg-primary text-gray-300 hover:text-white text-xs font-bold transition border border-[#333333] cursor-pointer"
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    {/* Live Platform Stats Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#262626] max-w-3xl mx-auto">
                        <div className="p-3 bg-[#1c1c1c] rounded-2xl border border-[#2e2e2e]">
                            <p className="text-2xl font-black italic font-mono text-white">14,200+</p>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Audited Beds</span>
                        </div>
                        <div className="p-3 bg-[#1c1c1c] rounded-2xl border border-[#2e2e2e]">
                            <p className="text-2xl font-black italic font-mono text-primary">₹0</p>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Brokerage Fees</span>
                        </div>
                        <div className="p-3 bg-[#1c1c1c] rounded-2xl border border-[#2e2e2e]">
                            <p className="text-2xl font-black italic font-mono text-emerald-400">100%</p>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Escrow Safe</span>
                        </div>
                        <div className="p-3 bg-[#1c1c1c] rounded-2xl border border-[#2e2e2e]">
                            <p className="text-2xl font-black italic font-mono text-amber-400 flex items-center justify-center gap-1">
                                <Star size={18} fill="currentColor"/> 4.8
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Resident Rating</span>
                        </div>
                    </div>

                </div>
            </section>

            {/* 2. CATEGORY SELECTOR & VIEW SWITCHER */}
            <section className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <CategoryFilter active={category} onChange={setCategory} />

                {/* View Mode Switcher */}
                <div className="flex bg-[#1c1c1c] p-1.5 rounded-2xl shrink-0 border border-[#2e2e2e]">
                    <button
                        onClick={() => setHomeView('collections')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                            homeView === 'collections' ? 'btn-netflix shadow-md text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Sparkles size={14} className="text-amber-400" /> Curated
                    </button>
                    <button
                        onClick={() => setHomeView('grid')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                            homeView === 'grid' ? 'btn-netflix shadow-md text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <LayoutGrid size={14} /> Grid
                    </button>
                    <button
                        onClick={() => setHomeView('map')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                            homeView === 'map' ? 'btn-netflix shadow-md text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <MapIcon size={14} /> Map
                    </button>
                </div>
            </section>

            {/* 3. CONTENT ACCORDING TO VIEW */}
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
                            <h2 className="text-3xl font-black italic tracking-tighter text-white">Map View.</h2>
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
                    <div className="h-[600px] w-full rounded-[3rem] overflow-hidden shadow-2xl border border-[#2a2a2a]">
                        <PropertyMap properties={properties} height="600px" />
                    </div>
                </section>
            ) : homeView === 'grid' ? (
                /* ALL PROPERTIES GRID VIEW */
                <section className="container mx-auto px-4 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black italic tracking-tighter text-white">
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
                /* CURATED EDITORIAL RAILS VIEW */
                <div className="space-y-20">
                    
                    {/* RAIL 1: NESTIFY FLAGSHIP & LUXURY */}
                    {flagshipStays.length > 0 && (
                        <section className="container mx-auto px-4 space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider mb-1">
                                        <Sparkles size={14} className="text-amber-400" /> Premier Living
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">
                                        Nestify Flagship & Luxury Suites.
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        Handpicked boutique coliving with AC, attached bath, biometric access & housekeeping
                                    </p>
                                </div>
                                <Link 
                                    to="/search?collection=LUXURY" 
                                    className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                                >
                                    View All ({flagshipStays.length}) <ChevronRight size={14} />
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
                                    <div className="inline-flex items-center gap-1.5 text-blue-400 text-xs font-black uppercase tracking-wider mb-1">
                                        🎓 Student & Fresher Favorites
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">
                                        Pocket-Friendly Stays Under ₹8,500.
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        All-inclusive tariffs with Wi-Fi, laundry, and daily home-cooked meals included
                                    </p>
                                </div>
                                <Link 
                                    to="/search?collection=BUDGET" 
                                    className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                                >
                                    View All ({budgetStays.length}) <ChevronRight size={14} />
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
                                    <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">
                                        <Star size={14} className="fill-emerald-400" /> Rated 4.5+ Verified
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">
                                        Highest Rated by Residents.
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        Verified comfort, hygienic food ratings, and rapid landlord response times
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

                    {/* RAIL 4: BROWSE BY MAJOR TECH & STUDENT HUBS */}
                    <section className="container mx-auto px-4 space-y-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-wider mb-1">
                                <MapPin size={14} /> Prime Localities
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">
                                Explore by City Corridors.
                            </h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                Verified accommodation within 10-15 minutes of major corporate offices & universities
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {POPULAR_HUBS.map((hub) => (
                                <div
                                    key={hub.city}
                                    onClick={() => navigate(`/search?city=${encodeURIComponent(hub.city)}`)}
                                    className="group relative h-56 rounded-[2rem] overflow-hidden cursor-pointer shadow-xl netflix-card border border-[#2a2a2a]"
                                >
                                    <img 
                                        src={hub.image} 
                                        alt={hub.city}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                    <div className="absolute top-3 left-3">
                                      <span className="bg-black/70 backdrop-blur-md text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full text-gray-200 border border-white/10">
                                        {hub.tag}
                                      </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 text-white">
                                        <h3 className="text-lg font-black tracking-tight leading-tight group-hover:text-primary transition">
                                            {hub.city}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-300 truncate mt-0.5">
                                            {hub.label}
                                        </p>
                                        <p className="text-[11px] font-mono font-black text-primary mt-1">
                                            From {hub.avgPrice}/mo
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            )}

            {/* 4. THE NESTIFY ADVANTAGE (COMPARISON MATRIX) */}
            <section className="container mx-auto px-4 pt-12">
                <div className="bg-[#181818] rounded-[3rem] p-8 sm:p-12 md:p-16 border border-[#2a2a2a] shadow-2xl relative overflow-hidden">
                    <div className="max-w-3xl mb-12">
                        <div className="inline-flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-widest mb-2">
                            <ShieldCheck size={16} /> Transparent Living Standards
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter leading-tight text-white">
                            Why Renting on Nestify is Unmatched.
                        </h2>
                        <p className="text-gray-400 text-sm font-medium mt-2 leading-relaxed">
                            Traditional renting is plagued by broker charges, fake photos, lost deposits, and absent landlords. Nestify sets an audited institutional standard.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#282828] text-xs font-black uppercase tracking-widest text-gray-400">
                                    <th className="pb-4 w-1/3">Rental Feature</th>
                                    <th className="pb-4 w-1/3 text-gray-500">Traditional Local PG / Broker</th>
                                    <th className="pb-4 w-1/3 text-primary">The Nestify Guarantee</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222222] font-medium text-xs sm:text-sm">
                                {[
                                    {
                                        feature: 'Brokerage & Commission',
                                        traditional: '1 to 2 months rent lost forever',
                                        nestify: '₹0 Brokerage. 100% direct landlord booking',
                                        good: true
                                    },
                                    {
                                        feature: 'Room Verification',
                                        traditional: 'Unverified photos, unexpected surprises on arrival',
                                        nestify: '100% physically audited for Wi-Fi, AC, and room size',
                                        good: true
                                    },
                                    {
                                        feature: 'Advance Payment Safety',
                                        traditional: 'Non-refundable cash advances with zero receipt',
                                        nestify: 'Digital Escrow: Held safe until you check in physically',
                                        good: true
                                    },
                                    {
                                        feature: 'Maintenance & Repairs',
                                        traditional: 'Endless calls to landlord with delayed or ignored fixes',
                                        nestify: 'In-app ticketing with live status alerts and rating audit',
                                        good: true
                                    },
                                    {
                                        feature: 'Stay Extensions',
                                        traditional: 'Manual renegotiations, risk of eviction or extra charges',
                                        nestify: '1-click stay extension with real-time calendar inventory',
                                        good: true
                                    },
                                    {
                                        feature: 'Rental Invoicing',
                                        traditional: 'Paper receipts or non-compliant cash slips',
                                        nestify: 'Official GST tax invoices for corporate HRA claims',
                                        good: true
                                    }
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-[#202020]/50 transition">
                                        <td className="py-4 font-bold text-white flex items-center gap-2">
                                            <CheckCircle2 size={15} className="text-primary shrink-0" />
                                            <span>{row.feature}</span>
                                        </td>
                                        <td className="py-4 text-gray-500 font-semibold">{row.traditional}</td>
                                        <td className="py-4 text-gray-200 font-bold flex items-center gap-1.5">
                                            <span className="text-emerald-400 font-black">✓</span> {row.nestify}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 5. HOW IT WORKS (3-STEP LIVING LIFECYCLE) */}
            <section className="container mx-auto px-4 space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Simplified Onboarding</span>
                    <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white">How Nestify Works.</h2>
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">From discovering verified rooms to digital move-in, your stay is secured in 3 simple steps.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            step: '01',
                            title: 'Explore & Inspect',
                            desc: 'Filter verified rooms by city, single/sharing occupancy, meal options, and metro distance with transparent monthly tariffs.',
                            icon: Search,
                            badge: '100% Audited'
                        },
                        {
                            step: '02',
                            title: 'Reserve with Escrow',
                            desc: 'Lock your bed with a secure advance token held in escrow until you arrive. Zero brokerage and instant digital lease generation.',
                            icon: ShieldCheck,
                            badge: 'Zero Risk'
                        },
                        {
                            step: '03',
                            title: 'Live & On-Demand Support',
                            desc: 'Enjoy included Wi-Fi, nutritious meals, raise instant maintenance tickets, or extend your stay with one click.',
                            icon: Zap,
                            badge: 'Live Assistance'
                        }
                    ].map((card, i) => (
                        <div key={i} className="bg-[#181818] p-8 sm:p-10 rounded-[3rem] border border-[#2a2a2a] shadow-xl relative overflow-hidden netflix-card flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <span className="font-mono text-4xl sm:text-5xl font-black italic text-[#2c2c2c] group-hover:text-primary transition">
                                        {card.step}
                                    </span>
                                    <span className="text-[10px] font-black uppercase bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full">
                                        {card.badge}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight mb-2">{card.title}</h3>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">{card.desc}</p>
                            </div>
                            <div className="pt-6 mt-6 border-t border-[#262626] flex items-center text-xs font-black uppercase tracking-wider text-primary">
                                <span>Learn More</span>
                                <ChevronRight size={14} className="ml-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. VERIFIED RESIDENT STORIES */}
            <section className="container mx-auto px-4 space-y-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Community Voices</span>
                        <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white">Resident Experiences.</h2>
                        <p className="text-gray-400 text-xs sm:text-sm font-medium mt-1">Verified reviews from working professionals and students living at Nestify properties.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#181818] px-4 py-2 rounded-2xl border border-[#2a2a2a]">
                        <Star size={16} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-black text-white">4.8 / 5 Rating</span>
                        <span className="text-xs text-gray-500 font-bold">• 3,400+ Reviews</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {RESIDENT_REVIEWS.map((rev, idx) => (
                        <div key={idx} className="bg-[#181818] p-8 sm:p-10 rounded-[3rem] border border-[#2a2a2a] shadow-xl relative netflix-card flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex gap-1 text-amber-400">
                                    {[...Array(rev.rating)].map((_, i) => (
                                        <Star key={i} size={15} fill="currentColor" />
                                    ))}
                                </div>
                                <p className="text-gray-300 text-sm font-medium leading-relaxed italic">
                                    "{rev.text}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-6 mt-6 border-t border-[#262626]">
                                <img src={rev.avatar} alt={rev.name} className="w-12 h-12 rounded-2xl object-cover border border-primary/30" />
                                <div>
                                    <h4 className="font-black text-white text-sm">{rev.name}</h4>
                                    <p className="text-[11px] text-gray-400 font-medium">{rev.role}</p>
                                    <span className="text-[10px] font-bold text-primary mt-0.5 block">{rev.city}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 7. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
            <section className="container mx-auto px-4 max-w-4xl space-y-8">
                <div className="text-center space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Everything You Need To Know</span>
                    <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white">Frequently Asked Questions.</h2>
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">Got questions about booking, security deposits, or stay extensions? We have you covered.</p>
                </div>

                <div className="space-y-4">
                    {FAQS.map((faq, idx) => {
                        const isOpen = expandedFaq === idx;
                        return (
                            <div 
                                key={idx}
                                className="bg-[#181818] rounded-2xl border border-[#2a2a2a] overflow-hidden transition"
                            >
                                <button
                                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                                    className="w-full p-6 text-left flex justify-between items-center gap-4 text-white hover:text-primary transition cursor-pointer"
                                >
                                    <span className="font-bold text-sm sm:text-base tracking-tight">{faq.q}</span>
                                    <ChevronDown size={18} className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`} />
                                </button>
                                {isOpen && (
                                    <div className="px-6 pb-6 text-xs sm:text-sm text-gray-400 font-medium leading-relaxed border-t border-[#222222] pt-4 animate-in fade-in duration-200">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>



        </div>
    );
};

export default Home;
