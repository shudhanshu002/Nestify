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
      <section className="relative rounded-[2.5rem] bg-[#181818] text-white p-6 sm:p-10 overflow-hidden shadow-2xl border border-[#2a2a2a]">
        <div className="absolute right-[-60px] top-[-60px] w-80 h-80 bg-primary/20 rounded-full blur-[90px] pointer-events-none animate-netflix-pulse"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-primary border border-white/5">
            <Building size={12} /> Owner Portal • Portfolio Console
          </div>
          <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter leading-tight text-white">
            PG Portfolio & Management
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm font-medium max-w-xl">
            Manage your listed PGs, monitor room capacity, track verification status, and manage active tenant residencies.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link 
              to="/owner/add-property" 
              className="btn-netflix px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <Plus size={16} /> List New PG
            </Link>
            <Link 
              to="/owner/dashboard?tab=occupancy" 
              className="btn-netflix-secondary px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95"
            >
              <Calendar size={16} /> Room & Date Schedule
            </Link>
            <Link 
              to="/owner/my-properties" 
              className="px-4 py-2.5 bg-[#202020] hover:bg-[#282828] border border-[#303030] rounded-xl text-gray-300 hover:text-white font-bold text-xs uppercase flex items-center gap-1.5 transition"
            >
              <Building size={15} /> Inventory
            </Link>
          </div>
        </div>

        {/* METRICS ROW (Compact & Aesthetic) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-[#262626]">
          <div className="bg-[#202020] px-4 py-3 rounded-xl border border-[#303030]">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Listed PGs</span>
            <p className="text-2xl font-black italic text-white mt-0.5">{properties.length}</p>
          </div>
          <div className="bg-[#202020] px-4 py-3 rounded-xl border border-[#303030]">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Live & Verified</span>
            <p className="text-2xl font-black italic text-emerald-400 mt-0.5">{verifiedCount}</p>
          </div>
          <div className="bg-[#202020] px-4 py-3 rounded-xl border border-[#303030]">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Room Units</span>
            <p className="text-2xl font-black italic text-white mt-0.5">{totalRooms}</p>
          </div>
          <div className="bg-[#202020] px-4 py-3 rounded-xl border border-[#303030]">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Avg Rating</span>
            <p className="text-2xl font-black italic text-amber-400 mt-0.5 flex items-center gap-1">
              <Star size={16} fill="currentColor"/> {avgRating}
            </p>
          </div>
        </div>
      </section>

      {/* 2. OWNER SEARCH & STATUS FILTER */}
      <section className="bg-[#181818] p-4 sm:p-5 rounded-2xl border border-[#2a2a2a] shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={17} />
            <input 
              type="text" 
              placeholder="Search by title, city, room..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#202020] rounded-xl font-medium text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-primary border border-[#303030] transition"
            />
          </div>

          {/* STATUS PILLS (Compact Badges) */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { id: 'ALL', label: `All (${properties.length})` },
              { id: 'VERIFIED', label: `Live (${verifiedCount})` },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'REJECTED', label: `Needs Review (${properties.filter(p => p.verificationStatus === 'REJECTED').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  statusFilter === tab.id 
                    ? 'btn-netflix shadow-sm text-white' 
                    : 'bg-[#202020] text-gray-300 border border-[#303030] hover:text-white hover:bg-[#282828]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. OWNER'S LISTED PGs GRID */}
      <section className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white">Your Properties</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
              Showing {filteredProperties.length} of {properties.length} listed accommodations
            </p>
          </div>
          <Link 
            to="/owner/my-properties" 
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Manage Inventory</span>
            <ChevronRight size={13}/>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((pg) => {
              const roomsCount = pg.rooms?.length || 0;
              return (
                <div 
                  key={pg._id} 
                  className="bg-[#181818] rounded-2xl border border-[#2a2a2a] shadow-xl overflow-hidden netflix-card flex flex-col group"
                >
                  {/* Property Image & Status Badges */}
                  <div className="relative h-48 bg-[#121212] overflow-hidden">
                    <img 
                      src={pg.images?.[0]?.url || 'https://via.placeholder.com/600x400?text=No+Photo'} 
                      alt={pg.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border border-white/10">
                      {pg.category || 'PG'}
                    </div>

                    <div className="absolute top-3 right-3">
                      {pg.verificationStatus === 'VERIFIED' ? (
                        <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1 shadow-md">
                          <CheckCircle2 size={11}/> Live
                        </span>
                      ) : pg.verificationStatus === 'REJECTED' ? (
                        <span className="bg-primary text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1 shadow-md">
                          <AlertOctagon size={11}/> Rejected
                        </span>
                      ) : (
                        <span className="bg-amber-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1 shadow-md">
                          <Clock size={11}/> In Review
                        </span>
                      )}
                    </div>

                    {pg.averageRating > 0 && (
                      <div className="absolute bottom-3 left-3 bg-[#181818]/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shadow-md border border-white/10">
                        <Star size={11} className="text-amber-400 fill-current" />
                        <span>{pg.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight group-hover:text-primary transition line-clamp-1">
                        {pg.title}
                      </h3>
                      <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={12} className="shrink-0 text-primary"/> 
                        <span className="truncate">{pg.location?.address ? `${pg.location.address}, ` : ''}{pg.location?.city || 'City'}, {pg.location?.state || ''}</span>
                      </p>
                    </div>

                    {/* Room Units Preview */}
                    <div className="bg-[#202020] p-3 rounded-xl border border-[#2e2e2e]">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                          <Bed size={12} className="text-primary"/> Listed Rooms ({roomsCount})
                        </span>
                        <Link 
                          to={`/owner/add-room/${pg._id}`}
                          className="text-[9px] font-black uppercase text-primary hover:underline flex items-center gap-0.5"
                        >
                          <Plus size={11}/> Add Room
                        </Link>
                      </div>

                      {roomsCount > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pg.rooms.map((r, i) => (
                            <span 
                              key={r._id || i}
                              className="text-[9px] font-bold bg-[#181818] text-gray-300 px-2 py-0.5 rounded-md border border-[#303030]"
                            >
                              {r.roomType} • ₹{r.basePrice?.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">No room units added yet. Click Add Room to set pricing.</p>
                      )}
                    </div>

                    {/* Room Pricing & Actions */}
                    {(() => {
                      const roomPrices = (pg.rooms || []).map(r => r.basePrice).filter(p => typeof p === 'number' && p > 0);
                      const minPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : (pg.basePrice || 0);
                      const maxPrice = roomPrices.length > 0 ? Math.max(...roomPrices) : (pg.basePrice || 0);
                      const hasRooms = roomPrices.length > 0;
                      const hasMultiple = roomPrices.length > 1;

                      return (
                        <div className="pt-2.5 border-t border-[#262626] flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">
                              {hasMultiple ? `Starts from (₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()})` : "Monthly Rent"}
                            </span>
                            <p className="text-lg font-black text-white font-mono">
                              {hasRooms ? (
                                <>
                                  ₹{minPrice.toLocaleString()}
                                  <span className="text-[10px] font-normal text-gray-400">/mo</span>
                                </>
                              ) : (
                                <span className="text-xs text-amber-400 font-sans font-bold">Price Pending</span>
                              )}
                            </p>
                          </div>

                          <div className="flex gap-1.5">
                            <Link 
                              to={`/property/${pg._id}`}
                              className="btn-netflix-secondary px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition"
                            >
                              View
                            </Link>
                            <Link 
                              to={`/owner/dashboard?tab=occupancy&propertyId=${pg._id}`}
                              className="btn-netflix-secondary px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition flex items-center gap-1"
                              title="Inspect Room Schedule & Bookings"
                            >
                              <Calendar size={11} /> Dates
                            </Link>
                            <Link 
                              to="/owner/my-properties"
                              className="btn-netflix px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition shadow-sm"
                            >
                              Manage
                            </Link>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
            <Building size={40} className="mx-auto mb-3 text-gray-500"/>
            <h3 className="text-lg font-black text-white tracking-tight">No Matching PGs Found</h3>
            <p className="font-medium text-gray-400 text-xs mt-1 max-w-sm mx-auto">
              {search ? "No properties match your search criteria. Try clearing the search filter." : "You have not listed any PGs yet. Add your first PG to start receiving tenant bookings."}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="btn-netflix-secondary px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
              <Link 
                to="/owner/add-property" 
                className="btn-netflix px-5 py-2 rounded-xl text-xs font-black uppercase shadow-lg"
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
