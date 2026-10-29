import { useState, useEffect, useContext } from 'react';
import API from '../api/client';
import PropertyCard from '../components/PropertyCard';
import CategoryFilter from '../components/CategoryFilter';
import { Search, SlidersHorizontal, Loader2, MessageSquare, ShieldCheck, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
    const { user } = useContext(AuthContext);
    const { setSelectedChat, setIsChatOpen } = useChat();
    const [properties, setProperties] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
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
                setProperties(propRes.data.data);

                if (user) {
                    const bookingRes = await API.get('/bookings/my-bookings');
                    // LOOSE FILTER: Show anything that has a property title to prevent vanishing
                    const activeOnes = (bookingRes.data.data || []).filter((b) => b.property);
                    setMyBookings(activeOnes);
                }
            } catch (err) {
                console.error('Sync Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [category, user]);

    const startChat = async (receiverId, propertyId = null) => {
        // 󾠮 Log for you to see in F12
        console.log('Starting chat with Receiver:', receiverId);

        if (!receiverId || receiverId === 'undefined') {
            return alert('Owner details are still loading or missing. Please refresh.');
        }

        try {
            const { data } = await API.post('/chat/access', { receiverId, propertyId });
            setSelectedChat(data.data);
            setIsChatOpen(true);
        } catch (err) {
            // 󾠯 Show the ACTUAL error from the backend (e.g., "No admin found")
            alert(err.response?.data?.message || 'Connection Error');
        }
    };

    return (
        <div className="space-y-16 pb-20">
            {/* 1. HERO SECTION (Restored logic) */}
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

            {/* 2. COMMUNICATION HUB */}
            {user && (
                <section className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Admin Support */}
                        <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white flex justify-between items-center group shadow-xl">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                                    <ShieldCheck size={14} /> Support Matrix
                                </div>
                                <h3 className="text-3xl font-black italic tracking-tighter">Chat with Admin.</h3>
                                <button
                                    onClick={() => startChat('ADMIN_ROLE_ID')}
                                    className="mt-4 flex items-center gap-2 text-white font-black text-[10px] uppercase border-b-2 border-primary pb-1 group-hover:gap-4 transition-all"
                                >
                                    Open Channel <ArrowRight size={14} />
                                </button>
                            </div>
                            <div className="hidden lg:block opacity-10">
                                <MessageSquare size={120} />
                            </div>
                        </div>

                        {/* Landlords - FIXED WITH FALLBACKS */}
                        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
                            <h3 className="text-xl font-black text-gray-900 italic tracking-tighter mb-6">Your Landlords</h3>
                            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                                {myBookings.length > 0 ? (
                                    myBookings.map((b) => (
                                        <button
                                            key={b._id}
                                            onClick={() => {
                                                // 󾠰 Better data extraction
                                                const ownerId = b.property?.owner?._id || b.property?.owner;
                                                startChat(ownerId, b.property?._id);
                                            }}
                                            className="flex-shrink-0 flex flex-col items-center gap-2 group"
                                        >
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-transparent group-hover:border-primary transition-all">
                                                <User size={24} className="text-gray-300 group-hover:text-primary" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase text-gray-400 truncate w-16 text-center">{b.property?.title?.split(' ')[0] || 'Owner'}</p>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-xs font-bold text-gray-300 py-4 uppercase">No active bookings.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 3. CATEGORIES & GRID */}
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
