import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/client';
import { 
  ShieldCheck, Users, Building, Search, CheckCircle2, 
  Clock, AlertCircle, Star, MapPin, Loader2, Bed, 
  ExternalLink, ChevronDown, ChevronUp, ShieldAlert,
  Phone, Mail, Check, X, ArrowUpRight, Sparkles
} from 'lucide-react';

const AdminHome = ({ user }) => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [expandedOwners, setExpandedOwners] = useState({});
  const [verifyingPropId, setVerifyingPropId] = useState(null);

  const fetchOwnersDirectory = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/owners-directory');
      setOwners(data.data || []);
      // By default expand the first 3 owners
      const initialExpanded = {};
      (data.data || []).forEach((o, index) => {
        initialExpanded[o._id] = index < 3;
      });
      setExpandedOwners(initialExpanded);
    } catch (err) {
      console.error("Admin owners directory error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnersDirectory();
  }, []);

  const toggleExpand = (ownerId) => {
    setExpandedOwners(prev => ({ ...prev, [ownerId]: !prev[ownerId] }));
  };

  const handleVerifyProperty = async (propId, status, reason = "") => {
    try {
      setVerifyingPropId(propId);
      await API.put(`/properties/admin/verify/${propId}`, { status, reason });
      alert(`Property marked as ${status}!`);
      fetchOwnersDirectory();
    } catch (err) {
      alert("Verification update failed.");
    } finally {
      setVerifyingPropId(null);
    }
  };

  const handleUpdateTier = async (propId, tier) => {
    try {
      await API.patch(`/properties/${propId}/tier`, { tier });
      fetchOwnersDirectory();
    } catch (err) {
      alert("Failed to update property tier.");
    }
  };

  // Filter owners by search query and KYC status
  const filteredOwners = owners.filter(owner => {
    const query = search.toLowerCase().trim();
    const ownerName = `${owner.firstName} ${owner.lastName || ''}`.toLowerCase();
    const ownerEmail = (owner.email || '').toLowerCase();
    
    // Check if query matches owner or any of their PGs/cities
    const matchesOwner = !query || ownerName.includes(query) || ownerEmail.includes(query);
    const matchesPG = owner.properties?.some(p => 
      p.title?.toLowerCase().includes(query) ||
      p.location?.city?.toLowerCase().includes(query) ||
      p.tier?.toLowerCase().includes(query) ||
      p.rooms?.some(r => r.roomType?.toLowerCase().includes(query))
    );

    const matchesSearch = matchesOwner || matchesPG;

    const matchesKyc = 
      kycFilter === 'ALL' ||
      (kycFilter === 'VERIFIED' && owner.kycStatus === 'VERIFIED') ||
      (kycFilter === 'PENDING' && owner.kycStatus === 'PENDING') ||
      (kycFilter === 'WITH_PGS' && (owner.properties?.length || 0) > 0);

    return matchesSearch && matchesKyc;
  });

  const totalProperties = owners.reduce((acc, o) => acc + (o.properties?.length || 0), 0);
  const totalVerifiedPGs = owners.reduce((acc, o) => acc + (o.verifiedPropertiesCount || 0), 0);
  const totalPendingKyc = owners.filter(o => o.kycStatus === 'PENDING').length;
  const totalPendingPGs = owners.reduce((acc, o) => acc + (o.properties?.filter(p => p.verificationStatus === 'PENDING')?.length || 0), 0);

  return (
    <div className="space-y-12 pb-20">
      
      {/* 1. ADMIN PLATFORM HERO */}
      <section className="relative rounded-[3.5rem] bg-gray-950 text-white p-8 md:p-14 overflow-hidden shadow-2xl border border-gray-800">
        <div className="absolute right-[-40px] top-[-40px] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">
            <ShieldCheck size={14} /> Master Platform Oversight • Admin Command Center
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none">
            Owners & PG Directory.
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-xl">
            Audit registered PG owners, inspect listed properties and room inventories, manage collection tiers, verify safety compliance, and monitor ratings.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link 
              to="/admin/verify-users" 
              className="bg-primary hover:bg-white hover:text-primary text-white px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-primary/20 transition active:scale-95"
            >
              <ShieldCheck size={18} /> KYC Approval Queue ({totalPendingKyc})
            </Link>
            <Link 
              to="/admin/dashboard" 
              className="bg-white/10 hover:bg-white hover:text-gray-950 text-white px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 border border-white/10"
            >
              <ShieldAlert size={18} /> Platform Analytics
            </Link>
          </div>
        </div>

        {/* ADMIN METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Registered Owners</span>
            <p className="text-3xl font-black italic text-white mt-1">{owners.length}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block">Total Platform PGs</span>
            <p className="text-3xl font-black italic text-blue-400 mt-1">{totalProperties}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase text-green-400 tracking-wider block">Live & Verified PGs</span>
            <p className="text-3xl font-black italic text-green-400 mt-1">{totalVerifiedPGs}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Pending Approvals</span>
            <p className="text-3xl font-black italic text-amber-400 mt-1">{totalPendingPGs + totalPendingKyc}</p>
          </div>
        </div>
      </section>

      {/* 2. ADMIN SEARCH & FILTER BAR */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search owners, PG title, tier, city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl font-bold text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary border-none transition"
            />
          </div>

          {/* FILTER PILLS */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: 'ALL', label: `All Owners (${owners.length})` },
              { id: 'VERIFIED', label: `KYC Verified (${owners.filter(o => o.kycStatus === 'VERIFIED').length})` },
              { id: 'PENDING', label: `KYC Pending (${totalPendingKyc})` },
              { id: 'WITH_PGS', label: `With Listed PGs (${owners.filter(o => (o.properties?.length || 0) > 0).length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setKycFilter(tab.id)}
                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition ${
                  kycFilter === tab.id 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. OWNERS DIRECTORY LIST & THEIR LISTED PGs */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">Owner Roster & PG Portfolios.</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Showing {filteredOwners.length} owners across platform
            </p>
          </div>
          <button 
            onClick={() => {
              const allExpanded = {};
              const nextState = Object.values(expandedOwners).some(v => !v);
              owners.forEach(o => { allExpanded[o._id] = nextState; });
              setExpandedOwners(allExpanded);
            }}
            className="text-xs font-black uppercase tracking-wider text-primary hover:underline"
          >
            {Object.values(expandedOwners).some(v => !v) ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : filteredOwners.length > 0 ? (
          <div className="space-y-6">
            {filteredOwners.map((owner) => {
              const isExpanded = !!expandedOwners[owner._id];
              const pgsCount = owner.properties?.length || 0;
              const livePgsCount = owner.properties?.filter(p => p.verificationStatus === 'VERIFIED').length || 0;

              return (
                <div 
                  key={owner._id}
                  className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden transition-all duration-300"
                >
                  {/* OWNER SUMMARY HEADER */}
                  <div 
                    onClick={() => toggleExpand(owner._id)}
                    className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-gray-50/50 transition border-b border-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.firstName + ' ' + (owner.lastName || ''))}&background=0D8ABC&color=fff`} 
                          alt={owner.firstName}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                        />
                        {owner.kycStatus === 'VERIFIED' && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white" title="KYC Verified">
                            <CheckCircle2 size={14}/>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-gray-900 tracking-tight">
                            {owner.firstName} {owner.lastName || ''}
                          </h3>
                          <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {owner.role || 'OWNER'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-400 flex flex-wrap items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Mail size={12}/> {owner.email}</span>
                          {owner.phone && <span className="flex items-center gap-1"><Phone size={12}/> {owner.phone}</span>}
                        </p>
                      </div>
                    </div>

                    {/* OWNER BADGES & STATS */}
                    <div className="flex items-center gap-4 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider block text-gray-400">Owner KYC</span>
                        <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full inline-block mt-0.5 ${
                          owner.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                          owner.kycStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {owner.kycStatus || 'NOT_SUBMITTED'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider block text-gray-400">Portfolio</span>
                        <span className="bg-primary/10 text-primary text-[11px] font-black uppercase px-3 py-1 rounded-full inline-block mt-0.5">
                          {pgsCount} {pgsCount === 1 ? 'PG' : 'PGs'} ({livePgsCount} Live)
                        </span>
                      </div>

                      <div className="p-2 bg-gray-100 rounded-xl text-gray-500">
                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                      </div>
                    </div>
                  </div>

                  {/* INDIVIDUAL OWNER LISTED PGs (EXPANDED VIEW) */}
                  {isExpanded && (
                    <div className="p-6 md:p-8 bg-gray-50/40 space-y-6 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center px-1">
                        <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                          Properties Listed by {owner.firstName} ({pgsCount})
                        </h4>
                        {owner.kycStatus === 'PENDING' && (
                          <Link 
                            to="/admin/verify-users" 
                            className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 transition"
                          >
                            Review Owner KYC Documents →
                          </Link>
                        )}
                      </div>

                      {pgsCount > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {owner.properties.map((pg) => {
                            const rooms = pg.rooms || [];
                            const isPending = pg.verificationStatus === 'PENDING';

                            return (
                              <div 
                                key={pg._id}
                                className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4 hover:shadow-md transition"
                              >
                                <div className="flex gap-4 items-start">
                                  <img 
                                    src={pg.images?.[0]?.url || 'https://via.placeholder.com/200?text=No+Photo'} 
                                    alt={pg.title}
                                    className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-gray-100"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                          {pg.category || 'PG'}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-0.5">
                                          <Sparkles size={10} className="text-amber-500" /> {pg.tier || 'FLAGSHIP'}
                                        </span>
                                      </div>
                                      
                                      {/* Verification Status */}
                                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                        pg.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                        pg.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {pg.verificationStatus || 'PENDING'}
                                      </span>
                                    </div>

                                    <h5 className="font-black text-gray-900 text-lg truncate mt-1">
                                      {pg.title}
                                    </h5>

                                    <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                                      <MapPin size={12} className="shrink-0"/>
                                      <span className="truncate">{pg.location?.address ? `${pg.location.address}, ` : ''}{pg.location?.city || 'City'}</span>
                                    </p>

                                    <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-700">
                                      <span className="font-mono text-primary font-black">₹{pg.basePrice?.toLocaleString()}/mo</span>
                                      {pg.averageRating > 0 ? (
                                        <span className="flex items-center gap-1 text-yellow-500 font-black">
                                          <Star size={12} fill="currentColor"/> {pg.averageRating.toFixed(1)} Rating
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-gray-400 font-normal">New (Unrated)</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* ROOM CONFIGURATION BREAKDOWN */}
                                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1.5">
                                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block flex items-center gap-1">
                                    <Bed size={12} className="text-primary"/> Configured Rooms & Inventory ({rooms.length})
                                  </span>

                                  {rooms.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      {rooms.map((room, rIdx) => (
                                        <div key={room._id || rIdx} className="bg-white p-2 rounded-xl border border-gray-100 text-[10px]">
                                          <p className="font-black text-gray-800">{room.roomType}</p>
                                          <p className="text-gray-500">₹{room.basePrice?.toLocaleString()} • {room.capacity} Bed</p>
                                          <p className="text-gray-400 font-mono">Inv: {room.availableInventory}/{room.totalInventory}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-400 italic">No room units configured yet.</p>
                                  )}
                                </div>

                                {/* ADMIN PROPERTY ACTIONS & TIER CONTROL */}
                                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-gray-400">Tier:</span>
                                    <select
                                      value={pg.tier || 'FLAGSHIP'}
                                      onChange={(e) => handleUpdateTier(pg._id, e.target.value)}
                                      className="text-[10px] font-black uppercase bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-primary transition"
                                      title="Update Property Tier"
                                    >
                                      <option value="FLAGSHIP">⭐ Flagship</option>
                                      <option value="LUXURY">💎 Luxury</option>
                                      <option value="BUDGET">🎓 Budget</option>
                                      <option value="STANDARD">🏠 Standard</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Link 
                                      to={`/property/${pg._id}`}
                                      className="text-xs font-black uppercase text-gray-600 hover:text-primary transition flex items-center gap-1"
                                    >
                                      View <ExternalLink size={12}/>
                                    </Link>

                                    {isPending && (
                                      <div className="flex gap-2">
                                        <button 
                                          disabled={verifyingPropId === pg._id}
                                          onClick={() => handleVerifyProperty(pg._id, 'VERIFIED')}
                                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-1 shadow-sm transition active:scale-95 disabled:opacity-50"
                                        >
                                          <Check size={12}/> Approve
                                        </button>
                                        <button 
                                          disabled={verifyingPropId === pg._id}
                                          onClick={() => {
                                            const reason = prompt("Enter rejection reason for owner:");
                                            if (reason) handleVerifyProperty(pg._id, 'REJECTED', reason);
                                          }}
                                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-1 border border-red-200 transition active:scale-95 disabled:opacity-50"
                                        >
                                          <X size={12}/> Reject
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            This owner has not created any PG listings yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[3.5rem] border-2 border-dashed border-gray-200 p-12">
            <Users size={56} className="mx-auto mb-4 text-gray-300"/>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">No Matching Owners Found</h3>
            <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest max-w-md mx-auto">
              No owner accounts match your search filter. Try clearing your search keyword.
            </p>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>

    </div>
  );
};

export default AdminHome;
