import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/client';
import { 
  Building, Plus, Search, CheckCircle2, Clock, 
  AlertOctagon, Star, MapPin, Loader2, Bed, 
  LayoutDashboard, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';

const OwnerHome = ({ user }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyPGs = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/properties/my-listings');
        setProperties(data.data || []);
      } catch (err) {
        console.error("Owner PG fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPGs();
  }, []);

  // Filter owner's properties by search keyword and verification status
  const filteredProperties = properties.filter((item) => {
    const matchesSearch = 
      !search.trim() ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.city?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.address?.toLowerCase().includes(search.toLowerCase()) ||
      item.rooms?.some(r => r.roomType?.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' ||
      item.verificationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const verifiedCount = properties.filter(p => p.verificationStatus === 'VERIFIED').length;
  const pendingCount = properties.filter(p => p.verificationStatus === 'PENDING').length;
  const totalRooms = properties.reduce((acc, p) => acc + (p.rooms?.length || 0), 0);
  const avgRating = properties.length > 0 
    ? (properties.reduce((acc, p) => acc + (p.averageRating || 0), 0) / properties.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-12 pb-20 text-white">
      
      {/* 1. OWNER PORTFOLIO HERO */}
      <section className="relative rounded-[3.5rem] bg-[#181818] text-white p-8 md:p-14 overflow-hidden shadow-2xl border border-[#2a2a2a]">
        <div className="absolute right-[-60px] top-[-60px] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-netflix-pulse"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-primary border border-white/5">
            <Building size={14} /> Owner Portal • Portfolio Management
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none text-white">
            Welcome back, <br/>
            <span className="text-primary not-italic">{user?.firstName || 'Host'} {user?.lastName || ''}</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-xl">
            Manage your listed PGs, monitor room capacity, track verification status, and manage active tenant residencies.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link 
              to="/owner/add-property" 
              className="btn-netflix px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl active:scale-95"
            >
              <Plus size={18} /> List New PG
            </Link>
            <Link 
              to="/owner/dashboard" 
              className="btn-netflix-secondary px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95"
            >
              <LayoutDashboard size={18} /> Occupancy & Ledger
            </Link>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#282828]">
          <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Listed PGs</span>
            <p className="text-3xl font-black italic text-white mt-1">{properties.length}</p>
          </div>
          <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Live & Verified</span>
            <p className="text-3xl font-black italic text-emerald-400 mt-1">{verifiedCount}</p>
          </div>
          <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Room Units</span>
            <p className="text-3xl font-black italic text-white mt-1">{totalRooms}</p>
          </div>
          <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Avg Rating</span>
            <p className="text-3xl font-black italic text-amber-400 mt-1 flex items-center gap-1">
              <Star size={20} fill="currentColor"/> {avgRating}
            </p>
          </div>
        </div>
      </section>

      {/* 2. OWNER SEARCH & STATUS FILTER */}
      <section className="bg-[#181818] p-6 rounded-[2.5rem] border border-[#2a2a2a] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search your PGs by title, city, room..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#242424] rounded-2xl font-bold text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary border border-[#333333] transition"
            />
          </div>

          {/* STATUS PILLS */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: 'ALL', label: `All (${properties.length})` },
              { id: 'VERIFIED', label: `Live (${verifiedCount})` },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'REJECTED', label: `Needs Review (${properties.filter(p => p.verificationStatus === 'REJECTED').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                  statusFilter === tab.id 
                    ? 'btn-netflix shadow-md text-white' 
                    : 'bg-[#242424] text-gray-300 border border-[#333333] hover:text-white hover:bg-[#2c2c2c]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. OWNER'S LISTED PGs GRID */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-white">Your Properties.</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Showing {filteredProperties.length} of {properties.length} listed accommodations
            </p>
          </div>
          <Link 
            to="/owner/my-properties" 
            className="text-xs font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
          >
            Manage Detailed Inventory <ChevronRight size={14}/>
          </Link>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((pg) => {
              const roomsCount = pg.rooms?.length || 0;
              return (
                <div 
                  key={pg._id} 
                  className="bg-[#181818] rounded-[3rem] border border-[#2a2a2a] shadow-xl overflow-hidden netflix-card flex flex-col group"
                >
                  {/* Property Image & Status Badges */}
                  <div className="relative h-56 bg-[#121212] overflow-hidden">
                    <img 
                      src={pg.images?.[0]?.url || 'https://via.placeholder.com/600x400?text=No+Photo'} 
                      alt={pg.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider border border-white/10">
                      {pg.category || 'PG'}
                    </div>

                    <div className="absolute top-4 right-4">
                      {pg.verificationStatus === 'VERIFIED' ? (
                        <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg">
                          <CheckCircle2 size={12}/> Live
                        </span>
                      ) : pg.verificationStatus === 'REJECTED' ? (
                        <span className="bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg">
                          <AlertOctagon size={12}/> Rejected
                        </span>
                      ) : (
                        <span className="bg-amber-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-lg">
                          <Clock size={12}/> In Review
                        </span>
                      )}
                    </div>

                    {pg.averageRating > 0 && (
                      <div className="absolute bottom-4 left-4 bg-[#181818]/90 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-md border border-white/10">
                        <Star size={13} className="text-amber-400 fill-current" />
                        <span>{pg.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-7 flex-1 flex flex-col justify-between space-y-5">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-primary transition line-clamp-1">
                        {pg.title}
                      </h3>
                      <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={13} className="shrink-0 text-primary"/> 
                        <span className="truncate">{pg.location?.address ? `${pg.location.address}, ` : ''}{pg.location?.city || 'City'}, {pg.location?.state || ''}</span>
                      </p>
                    </div>

                    {/* Room Units Preview */}
                    <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                          <Bed size={13} className="text-primary"/> Listed Rooms ({roomsCount})
                        </span>
                        <Link 
                          to={`/owner/add-room/${pg._id}`}
                          className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-0.5"
                        >
                          <Plus size={12}/> Add Room
                        </Link>
                      </div>

                      {roomsCount > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {pg.rooms.map((r, i) => (
                            <span 
                              key={r._id || i}
                              className="text-[10px] font-bold bg-[#1a1a1a] text-gray-300 px-2.5 py-0.5 rounded-lg border border-[#333333]"
                            >
                              {r.roomType} • ₹{r.basePrice?.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">No room units added yet. Click Add Room to set pricing.</p>
                      )}
                    </div>

                    {/* Base Price & Actions */}
                    <div className="pt-3 border-t border-[#282828] flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Base Tariff</span>
                        <p className="text-xl font-black text-white font-mono">
                          ₹{(pg.basePrice || (pg.rooms?.[0]?.basePrice) || 0).toLocaleString()}
                          <span className="text-xs font-medium text-gray-400">/mo</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Link 
                          to={`/property/${pg._id}`}
                          className="btn-netflix-secondary px-4 py-2.5 rounded-xl text-xs font-black uppercase transition"
                        >
                          View
                        </Link>
                        <Link 
                          to="/owner/my-properties"
                          className="btn-netflix px-4 py-2.5 rounded-xl text-xs font-black uppercase transition shadow-md"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center bg-[#181818] rounded-[3.5rem] border border-[#2a2a2a] p-12">
            <Building size={56} className="mx-auto mb-4 text-gray-500"/>
            <h3 className="text-2xl font-black text-white tracking-tight">No Matching PGs Found</h3>
            <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest max-w-md mx-auto">
              {search ? "No properties match your search criteria. Try clearing the search filter." : "You have not listed any PGs yet. Add your first PG to start receiving tenant bookings."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="btn-netflix-secondary px-6 py-3 rounded-2xl font-black text-xs uppercase cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
              <Link 
                to="/owner/add-property" 
                className="btn-netflix px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl"
              >
                + List New PG
              </Link>
            </div>
          </div>
        )}
      </section>

    </div>
  );
};

export default OwnerHome;
