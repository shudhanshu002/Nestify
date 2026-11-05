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
  CreditCard, Shield, Bed, Eye
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import OwnerHome from '../components/home/OwnerHome';
import AdminHome from '../components/home/AdminHome';

const CITY_VIDEOS = [
  {
    city: 'Gurugram',
    tag: 'Cyber City & DLF Skylines',
    url: 'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4'
  },
  {
    city: 'Bengaluru',
    tag: 'Tech Hub Expressways',
    url: 'https://videos.pexels.com/video-files/3015510/3015510-hd_1920_1080_24fps.mp4'
  },
  {
    city: 'Delhi NCR',
    tag: 'Capital Architecture',
    url: 'https://videos.pexels.com/video-files/5752729/5752729-hd_1920_1080_30fps.mp4'
  },
  {
    city: 'Noida',
    tag: 'Expressway Corridors',
    url: 'https://videos.pexels.com/video-files/10433645/10433645-hd_1920_1080_25fps.mp4'
  },
  {
    city: 'Pune',
    tag: 'Metropolitan Dusk',
    url: 'https://videos.pexels.com/video-files/2098989/2098989-hd_1920_1080_30fps.mp4'
  }
];

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

const TenantDiscoveryHome = ({ user }) => {
    // Public & Resident Discovery Experience
    const [properties, setProperties] = useState([]);
    const [category, setCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [residentType, setResidentType] = useState('ALL');
    const [budgetFilter, setBudgetFilter] = useState('ALL');
    const [homeView, setHomeView] = useState('collections'); // 'collections', 'grid', 'map'
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [peekProperty, setPeekProperty] = useState(null);
    const navigate = useNavigate();
    const [currentVideoIdx, setCurrentVideoIdx] = useState(0);

    // Auto-cycle city background videos smoothly
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentVideoIdx((prev) => (prev + 1) % CITY_VIDEOS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const handleQuickCity = (cityName) => {
        setSearch(cityName);
        const idx = CITY_VIDEOS.findIndex(v => 
            v.city.toLowerCase().includes(cityName.toLowerCase()) || 
            cityName.toLowerCase().includes(v.city.toLowerCase())
        );
        if (idx !== -1) {
            setCurrentVideoIdx(idx);
        }
    };

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
    const top5Trending = [...properties].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 5);
    const spotlightProperty = properties.find(p => p.tier === 'FLAGSHIP' || p.tier === 'LUXURY') || properties[0];
    const spotlightImage = spotlightProperty?.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
    const spotlightPrice = (spotlightProperty?.rooms || []).map(r => r.basePrice).filter(p => typeof p === 'number' && p > 0)[0] || spotlightProperty?.basePrice || 8500;

    return (
        <div className="space-y-24 text-white">
            
            {/* 1. CINEMATIC CITY VIDEO HERO SECTION */}
            <section className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#2a2a2a] min-h-[500px] sm:min-h-[540px] flex items-center justify-center p-6 sm:p-12 md:p-16">
                
                {/* Background Video of Changing Cities */}
                <video
                    key={CITY_VIDEOS[currentVideoIdx].url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-105 transition-all duration-1000"
                >
                    <source src={CITY_VIDEOS[currentVideoIdx].url} type="video/mp4" />
                </video>

                {/* Cinematic Overlays to keep text & search razor-sharp */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/75 to-[#141414]/50 pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] pointer-events-none"></div>
                <div className="absolute right-[-100px] top-[-100px] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px] pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                    
                    {/* Micro Badge */}
                    <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-primary border border-white/10 shadow-lg">
                        <Sparkles size={14} className="text-amber-400" />
                        Curated Co-Living & Student Housing
                    </div>

                    {/* Simple & Modern Headline */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-2xl">
                        Find your next nest<span className="text-primary not-italic">.</span>
                    </h1>

                    {/* Clean Subtitle */}
                    <p className="text-gray-300 text-sm sm:text-base font-medium max-w-xl mx-auto drop-shadow leading-relaxed">
                        Audited rooms, zero brokerage, and direct owner booking across India's top cities.
                    </p>

                    {/* Professional Search Console */}
                    <form onSubmit={handleSearch} className="bg-[#181818]/90 backdrop-blur-xl p-3 sm:p-3.5 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-2.5 max-w-3xl mx-auto border border-white/15 hover:border-white/25 transition">
                        
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
                        <div className="flex bg-[#242424]/90 p-1 rounded-2xl w-full md:w-auto shrink-0 justify-center border border-[#333333]">
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
                        <div className="hidden sm:flex items-center bg-[#242424]/90 px-3 py-2 rounded-2xl border border-[#333333] shrink-0">
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
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Top Hubs:</span>
                        {['Noida', 'Delhi NCR', 'Gurugram', 'Bengaluru', 'Pune', 'Kota'].map(c => (
                            <button
                                key={c}
                                onClick={() => handleQuickCity(c)}
                                className="px-3.5 py-1 rounded-full bg-black/60 hover:bg-primary text-gray-300 hover:text-white text-xs font-bold transition border border-white/10 hover:border-primary shadow-sm cursor-pointer"
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                </div>

                {/* Bottom Live City Video Controller Pill */}
                <div className="absolute bottom-5 right-6 z-20 hidden md:flex items-center gap-3 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-gray-300 shadow-xl">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="font-semibold text-white">{CITY_VIDEOS[currentVideoIdx].city}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-[11px] text-gray-400">{CITY_VIDEOS[currentVideoIdx].tag}</span>
                    <div className="flex items-center gap-1.5 ml-1 border-l border-white/10 pl-2.5">
                        {CITY_VIDEOS.map((v, i) => (
                            <button
                                key={v.city}
                                onClick={() => setCurrentVideoIdx(i)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                    currentVideoIdx === i ? 'w-5 bg-primary' : 'w-1.5 bg-white/40 hover:bg-white/80'
                                }`}
                                title={`Switch background to ${v.city}`}
                            />
                        ))}
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
                            <PropertyCard key={item._id} property={item} onPeek={setPeekProperty} />
                        ))}
                    </div>
                </section>
            ) : (
                /* CURATED EDITORIAL RAILS VIEW */
                <div className="space-y-16 sm:space-y-20">
                    
                    {/* SPOTLIGHT ORIGINAL BANNER */}
                    {spotlightProperty && (
                        <section className="container mx-auto px-4">
                            <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-[#141414] shadow-2xl">
                                <div className="relative h-72 sm:h-84 md:h-96 w-full">
                                    <img 
                                        src={spotlightImage} 
                                        alt={spotlightProperty.title}
                                        className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                                    
                                    <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-center max-w-xl space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-[#E50914] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow">
                                                ★ #1 FEATURED PICK
                                            </span>
                                            <span className="text-emerald-400 font-extrabold text-xs">98% Match</span>
                                            <span className="bg-white/10 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                                                0% BROKERAGE
                                            </span>
                                        </div>
                                        <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-wide">
                                            {spotlightProperty.title}
                                        </h2>
                                        <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2">
                                            {spotlightProperty.description || 'Audited Flagship Co-living with 100% inverter backup, ultra-quiet study enclave, and high-speed fiber connectivity.'}
                                        </p>
                                        <div className="flex items-center gap-3 pt-2">
                                            <button 
                                                onClick={() => navigate(`/property/${spotlightProperty._id}`)}
                                                className="bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-2 shadow transition cursor-pointer"
                                            >
                                                <Eye size={15} /> INSPECT STAY
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/property/${spotlightProperty._id}`)}
                                                className="btn-red-glow text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-2 shadow transition cursor-pointer"
                                            >
                                                <Lock size={15} /> ESCROW LOCK (₹{spotlightPrice.toLocaleString()})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TOP 5 TRENDING PGS RAIL WITH GIANT BEBAS NUMBERS */}
                    {top5Trending.length > 0 && (
                        <section className="container mx-auto px-4 space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="netflix-subhead block mb-1">MOST POPULAR RESIDENCES</span>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-wide">
                                        Top 5 Trending PGs This Week
                                    </h2>
                                </div>
                                <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider hidden sm:block">
                                    Real-time Resident Bookings
                                </span>
                            </div>

                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 pt-2">
                                {top5Trending.map((p, idx) => {
                                    const pImg = p.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
                                    const pPrice = (p.rooms || []).map(r => r.basePrice).filter(x => typeof x === 'number' && x > 0)[0] || p.basePrice || 7500;
                                    const pMatch = Math.min(99, Math.max(90, Math.round((p.averageRating || 4.8) * 20)));

                                    return (
                                        <div 
                                            key={p._id} 
                                            className="card-group flex items-end shrink-0 cursor-pointer" 
                                            onClick={() => setPeekProperty(p)}
                                        >
                                            <span className="rank-number text-8xl sm:text-9xl font-black -mr-6 sm:-mr-8 z-10">
                                                {idx + 1}
                                            </span>
                                            <div className="w-48 sm:w-60 h-64 sm:h-80 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 relative shadow-2xl group transition duration-300">
                                                <img 
                                                    src={pImg} 
                                                    alt={p.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                                                />
                                                <div className="absolute inset-0 card-fade-bottom"></div>
                                                <div className="absolute bottom-3 left-3 right-3 text-xs">
                                                    <span className="text-emerald-400 font-bold block">{pMatch}% Match</span>
                                                    <h4 className="font-black text-white truncate">{p.title}</h4>
                                                    <span className="text-neutral-400 text-[10px]">From ₹{pPrice.toLocaleString()}/mo</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

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
                                    <PropertyCard key={item._id} property={item} onPeek={setPeekProperty} />
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
                                    <PropertyCard key={item._id} property={item} onPeek={setPeekProperty} />
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



            {/* QUICK PEEK PREVIEW MODAL */}
            {peekProperty && (
                <div 
                    onClick={() => setPeekProperty(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="relative w-full max-w-2xl bg-[#141414] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        <button 
                            onClick={() => setPeekProperty(null)}
                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-white text-white hover:text-black flex items-center justify-center transition border border-white/20 cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        <div className="relative h-60 sm:h-72 w-full">
                            <img 
                                src={peekProperty.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80'} 
                                alt={peekProperty.title}
                                className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30"></div>
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                <span className="bg-[#E50914] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow">
                                    {Math.min(99, Math.max(90, Math.round((peekProperty.averageRating || 4.8) * 20)))}% MATCH
                                </span>
                                <span className="bg-black/70 backdrop-blur text-white text-[10px] font-extrabold px-2 py-0.5 rounded border border-white/20 uppercase">
                                    {peekProperty.tier || 'FLAGSHIP'}
                                </span>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-2xl font-black text-white italic drop-shadow">{peekProperty.title}</h3>
                                <p className="text-xs text-neutral-300 flex items-center gap-1 mt-0.5">
                                    <MapPin size={13} className="text-[#E50914]" />
                                    <span>{peekProperty.location?.address || ''} {peekProperty.location?.city || ''}</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                                {peekProperty.description || 'Verified accommodation with 24/7 power backup, high-speed fiber internet, and hygienic daily housekeeping.'}
                            </p>

                            <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
                                <div>
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">STARTING AT</span>
                                    <span className="text-xl font-black text-white italic">
                                        ₹{((peekProperty.rooms || []).map(r => r.basePrice).filter(x => typeof x === 'number' && x > 0)[0] || peekProperty.basePrice || 7500).toLocaleString()} 
                                        <span className="text-xs text-neutral-500 not-italic font-normal"> /mo</span>
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => {
                                            navigate(`/property/${peekProperty._id}`);
                                            setPeekProperty(null);
                                        }}
                                        className="btn-red-glow text-white text-xs font-black uppercase px-5 py-2.5 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                                    >
                                        VIEW FULL STAY <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const Home = () => {
    const { user, activeMode } = useContext(AuthContext);

    // 1. ADMIN ROLE: Render customized Admin Command Console
    if (user?.role === 'ADMIN') {
        return <AdminHome user={user} />;
    }

    // 2. OWNER IN OWNER CONSOLE MODE: Render customized Owner Home
    if (user?.role === 'OWNER' && activeMode === 'OWNER') {
        return <OwnerHome user={user} />;
    }

    // 3. TENANT / RESIDENT / OWNER IN RESIDENT MODE: Public Discovery Experience
    return <TenantDiscoveryHome user={user} />;
};

export default Home;
