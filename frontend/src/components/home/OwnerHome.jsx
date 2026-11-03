import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/client';
import { 
  Building, Plus, Search, CheckCircle2, Clock, 
  AlertOctagon, Bed, Star, ChevronRight, LayoutDashboard, Loader2, MapPin, Calendar
} from 'lucide-react';

const OwnerHome = ({ user }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/properties/my-listings');
      setProperties(data.data || []);
    } catch (err) {
      console.error("Owner listings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Filter properties by search and status
  const filteredProperties = properties.filter((pg) => {
    const matchesStatus = statusFilter === 'ALL' || pg.verificationStatus === statusFilter;
    const matchesSearch = 
      pg.title?.toLowerCase().includes(search.toLowerCase()) ||
      pg.location?.city?.toLowerCase().includes(search.toLowerCase()) ||
      pg.location?.address?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate live stats
  const verifiedCount = properties.filter(p => p.verificationStatus === 'VERIFIED').length;
  const pendingCount = properties.filter(p => p.verificationStatus === 'PENDING').length;
  const totalRooms = properties.reduce((acc, p) => acc + (p.rooms?.length || 0), 0);
  const avgRating = properties.length > 0 
    ? (properties.reduce((acc, p) => acc + (p.averageRating || 0), 0) / properties.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-10 pb-20 text-white">
      
      {/* 1. OWNER PORTFOLIO HERO */}
      <section className="relative rounded-[2.5rem] bg-[#141414] text-white p-6 sm:p-8 overflow-hidden shadow-2xl border border-neutral-800">
        <div className="relative z-10 space-y-4">
          <div>
            <span className="bg-red-950/80 border border-[#E50914]/50 text-[#E50914] text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span> OWNER PORTAL • PORTFOLIO CONSOLE
            </span>
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-wide text-white">
              PG Portfolio & Management
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Manage your listed PGs, monitor room capacity, track verification status, and manage active tenant residencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link 
              to="/owner/add-property" 
              className="btn-red-glow text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
            >
              <Plus size={16} /> LIST NEW PG
            </Link>
            <Link 
              to="/owner/dashboard?tab=occupancy" 
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
            >
              <Calendar size={14} className="text-[#E50914]" /> ROOM & DATE SCHEDULE
            </Link>
            <Link 
              to="/owner/my-properties" 
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
            >
              <Building size={14} className="text-neutral-400" /> INVENTORY
            </Link>
          </div>

          {/* 4 METRIC KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">TOTAL LISTED PGS</span>
              <span className="text-2xl sm:text-3xl font-black text-white italic mt-1 block">{properties.length}</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">LIVE & VERIFIED</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 italic mt-1 block">{verifiedCount}</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">TOTAL ROOM UNITS</span>
              <span className="text-2xl sm:text-3xl font-black text-white italic mt-1 block">{totalRooms}</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">AVG RATING</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 italic mt-1 flex items-center gap-1">
                ★ {avgRating}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OWNER SEARCH & STATUS FILTER */}
      <section className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 text-neutral-500" size={16} />
            <input 
              type="text" 
              placeholder="Search by title, city, room..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-neutral-600 font-medium placeholder:text-neutral-500"
            />
          </div>

          {/* STATUS PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-extrabold w-full md:w-auto">
            {[
              { id: 'ALL', label: `ALL (${properties.length})` },
              { id: 'VERIFIED', label: `LIVE (${verifiedCount})` },
              { id: 'PENDING', label: `PENDING (${pendingCount})` },
              { id: 'REJECTED', label: `NEEDS REVIEW (${properties.filter(p => p.verificationStatus === 'REJECTED').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer text-[10px] font-black uppercase ${
                  statusFilter === tab.id 
                    ? 'bg-[#E50914] text-white shadow' 
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. OWNER'S LISTED PGs GRID */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-xl font-black text-white italic">Your Properties</h2>
            <p className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider mt-0.5">
              SHOWING {filteredProperties.length} OF {properties.length} LISTED ACCOMMODATIONS
            </p>
          </div>
          <Link 
            to="/owner/my-properties" 
            className="text-xs font-bold text-[#E50914] hover:underline flex items-center gap-1"
          >
            <span>Manage Inventory &gt;</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-[#E50914]" size={36} />
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((pg) => {
              const roomsCount = pg.rooms?.length || 0;
              const isVerified = pg.verificationStatus === 'VERIFIED';
              const isRejected = pg.verificationStatus === 'REJECTED';

              return (
                <div 
                  key={pg._id} 
                  className="bg-[#141414] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between group"
                >
                  <div>
                    {/* Property Image & Status Badges */}
                    <div className="relative h-44 w-full overflow-hidden bg-neutral-900">
                      <img 
                        src={pg.images?.[0]?.url || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80'} 
                        alt={pg.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                      
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-black/70 backdrop-blur border border-white/20 text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                          {pg.category || 'PG'} • {pg.tier || 'STANDARD'}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        <span className={`${
                          isVerified 
                            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400' 
                            : isRejected 
                            ? 'bg-red-950/80 border border-red-500/50 text-[#E50914]' 
                            : 'bg-amber-950/80 border border-amber-500/50 text-amber-400'
                        } text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isVerified ? 'bg-emerald-400' : isRejected ? 'bg-[#E50914]' : 'bg-amber-400'
                          }`}></span> {isVerified ? 'LIVE' : isRejected ? 'REJECTED' : 'PENDING'}
                        </span>
                      </div>

                      {pg.averageRating > 0 && (
                        <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black text-amber-400 flex items-center gap-1 shadow border border-white/10">
                          <Star size={11} fill="currentColor" />
                          <span>{pg.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-[#E50914] transition line-clamp-1">
                          {pg.title}
                        </h3>
                        <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                          <MapPin size={12} className="shrink-0 text-[#E50914]"/> 
                          <span>{pg.location?.address ? `${pg.location.address}, ` : ''}{pg.location?.city || 'City'}</span>
                        </p>
                      </div>

                      {/* Listed Rooms Box */}
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-300">LISTED ROOMS ({roomsCount})</span>
                          <Link 
                            to={`/owner/add-room/${pg._id}`}
                            className="text-[10px] text-[#E50914] font-extrabold hover:underline"
                          >
                            + ADD ROOM
                          </Link>
                        </div>
                        {roomsCount > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {pg.rooms.map((r, i) => (
                              <span 
                                key={r._id || i}
                                className="text-[9px] font-bold bg-black/60 text-neutral-300 px-2 py-0.5 rounded border border-neutral-800"
                              >
                                {r.roomType} • ₹{r.basePrice?.toLocaleString()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-neutral-500">No room units added yet. Click Add Room to set pricing.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 pt-0 border-t border-neutral-900 flex items-center justify-between mt-2">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">
                      {roomsCount} Rooms Added
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Link 
                        to={`/property/${pg._id}`}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-neutral-800 transition"
                      >
                        VIEW
                      </Link>
                      <Link 
                        to={`/owner/dashboard?tab=occupancy&propertyId=${pg._id}`}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-1 transition"
                        title="Inspect Room Schedule & Bookings"
                      >
                        <Calendar size={12} /> DATES
                      </Link>
                      <Link 
                        to={`/owner/dashboard?tab=occupancy&propertyId=${pg._id}`}
                        className="btn-red-glow text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg shadow transition"
                      >
                        MANAGE
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-[#141414] rounded-3xl border border-neutral-800 p-8 space-y-3">
            <Building size={40} className="mx-auto text-neutral-500"/>
            <h3 className="text-lg font-black text-white italic">No Matching PGs Found</h3>
            <p className="font-medium text-neutral-400 text-xs max-w-sm mx-auto">
              {search ? "No properties match your search criteria. Try clearing the search filter." : "You have not listed any PGs yet. Add your first PG to start receiving tenant bookings."}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="bg-neutral-900 text-neutral-300 border border-neutral-800 px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
              <Link 
                to="/owner/add-property" 
                className="btn-red-glow text-white px-5 py-2 rounded-xl text-xs font-black uppercase shadow"
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
