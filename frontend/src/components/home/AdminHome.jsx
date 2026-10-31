import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/client';
import { 
  ShieldCheck, ShieldAlert, Search, CheckCircle2, Clock, 
  AlertOctagon, Star, MapPin, Loader2, Bed, 
  ExternalLink, Check, X, ChevronDown, ChevronUp, Users, Building, Mail, Phone, Sparkles
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
      const { data } = await API.get('/admin/owners-overview');
      setOwners(data.data || []);
      // Expand all owners with pending PGs by default
      const initialExpanded = {};
      data.data?.forEach(o => {
        if (o.properties?.some(p => p.verificationStatus === 'PENDING') || o.kycStatus === 'PENDING') {
          initialExpanded[o._id] = true;
        }
      });
      setExpandedOwners(initialExpanded);
    } catch (err) {
      console.error("Admin owners overview fetch error:", err);
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

  const handleVerifyProperty = async (propId, status, rejectionReason = '') => {
    try {
      setVerifyingPropId(propId);
      await API.patch(`/admin/verify-property/${propId}`, { 
        status, 
        rejectionReason 
      });
      // Refresh directory
      fetchOwnersDirectory();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update property status.");
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
    <div className="space-y-12 pb-20 text-white">
      
      {/* 1. ADMIN PLATFORM HERO */}
      <section className="relative rounded-[3.5rem] bg-[#181818] text-white p-8 md:p-14 overflow-hidden shadow-2xl border border-[#2a2a2a]">
        <div className="absolute right-[-40px] top-[-40px] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-netflix-pulse"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-primary border border-primary/20">
            <ShieldCheck size={14} /> Master Platform Oversight • Admin Command Center
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none text-white">
            Owners & PG Directory.
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-xl">
            Audit registered PG owners, inspect listed properties and room inventories, manage collection tiers, verify safety compliance, and monitor ratings.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link 
              to="/admin/verify-users" 
              className="btn-netflix px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl active:scale-95"
            >
              <ShieldCheck size={18} /> KYC Approval Queue ({totalPendingKyc})
            </Link>
            <Link 
              to="/admin/dashboard" 
              className="btn-netflix-secondary px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95"
            >
              <ShieldAlert size={18} /> Platform Analytics
            </Link>
          </div>
        </div>

        {/* ADMIN METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#282828]">
          <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Registered Owners</span>
            <p className="text-3xl font-black italic text-white mt-1">{owners.length}</p>
          </div>
          <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
            <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Total Platform PGs</span>
            <p className="text-3xl font-black italic text-primary mt-1">{totalProperties}</p>
          </div>
          <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Live & Verified PGs</span>
            <p className="text-3xl font-black italic text-emerald-400 mt-1">{totalVerifiedPGs}</p>
          </div>
          <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333]">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Pending Approvals</span>
            <p className="text-3xl font-black italic text-amber-400 mt-1">{totalPendingPGs + totalPendingKyc}</p>
          </div>
        </div>
      </section>

      {/* 2. ADMIN SEARCH & FILTER BAR */}
      <section className="bg-[#181818] p-6 rounded-[2.5rem] border border-[#2a2a2a] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search owners, PG title, tier, city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#242424] rounded-2xl font-bold text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary border border-[#333333] transition"
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
                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                  kycFilter === tab.id 
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

      {/* 3. OWNERS DIRECTORY LIST & THEIR LISTED PGs */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-white">Owner Roster & PG Portfolios.</h2>
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
            className="text-xs font-black uppercase tracking-wider text-primary hover:underline cursor-pointer"
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
                  className="bg-[#181818] rounded-[3rem] border border-[#2a2a2a] shadow-xl overflow-hidden transition-all duration-300 text-white"
                >
                  {/* OWNER SUMMARY HEADER */}
                  <div 
                    onClick={() => toggleExpand(owner._id)}
                    className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-[#202020] transition border-b border-[#282828]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.firstName + ' ' + (owner.lastName || ''))}&background=E50914&color=fff`} 
                          alt={owner.firstName}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/40 shadow-sm"
                        />
                        {owner.kycStatus === 'VERIFIED' && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border-2 border-[#181818]" title="KYC Verified">
                            <CheckCircle2 size={14}/>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-white tracking-tight">
                            {owner.firstName} {owner.lastName || ''}
                          </h3>
                          <span className="text-[10px] font-black uppercase text-gray-300 bg-[#242424] border border-[#333333] px-2 py-0.5 rounded">
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
                          owner.kycStatus === 'VERIFIED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                          owner.kycStatus === 'PENDING' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 animate-pulse' :
                          'bg-[#242424] text-gray-400'
                        }`}>
                          {owner.kycStatus || 'NOT_SUBMITTED'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider block text-gray-400">Portfolio</span>
                        <span className="bg-primary/20 text-primary border border-primary/30 text-[11px] font-black uppercase px-3 py-1 rounded-full inline-block mt-0.5">
                          {pgsCount} {pgsCount === 1 ? 'PG' : 'PGs'} ({livePgsCount} Live)
                        </span>
                      </div>

                      <div className="p-2 bg-[#242424] rounded-xl text-gray-400">
                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                      </div>
                    </div>
                  </div>

                  {/* INDIVIDUAL OWNER LISTED PGs (EXPANDED VIEW) */}
                  {isExpanded && (
                    <div className="p-6 md:p-8 bg-[#141414] space-y-6 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center px-1">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                          Properties Listed by {owner.firstName} ({pgsCount})
                        </h4>
                        {owner.kycStatus === 'PENDING' && (
                          <Link 
                            to="/admin/verify-users" 
                            className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800/40 hover:bg-amber-950 transition"
                          >
                            Review Owner KYC
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
                                className="bg-[#1c1c1c] rounded-3xl p-6 border border-[#2e2e2e] shadow-sm space-y-4 hover:border-primary/40 transition text-white"
                              >
                                <div className="flex gap-4 items-start">
                                  <img 
                                    src={pg.images?.[0]?.url || 'https://via.placeholder.com/200?text=No+Photo'} 
                                    alt={pg.title}
                                    className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-[#333]"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-[#242424] text-gray-300 px-2 py-0.5 rounded border border-[#333]">
                                          {pg.category || 'PG'}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30 flex items-center gap-0.5">
                                          <Sparkles size={10} className="text-amber-400" /> {pg.tier || 'FLAGSHIP'}
                                        </span>
                                      </div>
                                      
                                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                        pg.verificationStatus === 'VERIFIED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                                        pg.verificationStatus === 'REJECTED' ? 'bg-primary/20 text-primary border border-primary/30' :
                                        'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                                      }`}>
                                        {pg.verificationStatus || 'PENDING'}
                                      </span>
                                    </div>

                                    <h5 className="font-black text-white text-lg truncate mt-1">
                                      {pg.title}
                                    </h5>

                                    <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                                      <MapPin size={12} className="shrink-0 text-primary"/>
                                      <span className="truncate">{pg.location?.address ? `${pg.location.address}, ` : ''}{pg.location?.city || 'City'}</span>
                                    </p>

                                    <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-200">
                                      <span className="font-mono text-primary font-black">₹{pg.basePrice?.toLocaleString()}/mo</span>
                                      {pg.averageRating > 0 ? (
                                        <span className="flex items-center gap-1 text-amber-400 font-black">
                                          <Star size={12} fill="currentColor"/> {pg.averageRating.toFixed(1)} Rating
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-gray-500 font-normal">New (Unrated)</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* ROOM CONFIGURATION BREAKDOWN */}
                                <div className="bg-[#242424] p-3 rounded-2xl border border-[#333333] space-y-1.5">
                                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block flex items-center gap-1">
                                    <Bed size={12} className="text-primary"/> Configured Rooms & Inventory ({rooms.length})
                                  </span>

                                  {rooms.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      {rooms.map((room, rIdx) => (
                                        <div key={room._id || rIdx} className="bg-[#1a1a1a] p-2 rounded-xl border border-[#333333] text-[10px]">
                                          <p className="font-black text-white">{room.roomType}</p>
                                          <p className="text-gray-400">₹{room.basePrice?.toLocaleString()} • {room.capacity} Bed</p>
                                          <p className="text-gray-500 font-mono">Inv: {room.availableInventory}/{room.totalInventory}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-400 italic">No room units configured yet.</p>
                                  )}
                                </div>

                                {/* ADMIN PROPERTY ACTIONS & TIER CONTROL */}
                                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#282828]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-gray-400">Tier:</span>
                                    <select
                                      value={pg.tier || 'FLAGSHIP'}
                                      onChange={(e) => handleUpdateTier(pg._id, e.target.value)}
                                      className="text-[10px] font-black uppercase bg-[#242424] text-white border border-[#333333] rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-primary transition"
                                      title="Update Property Tier"
                                    >
                                      <option value="FLAGSHIP" className="bg-[#242424] text-white">⭐ Flagship</option>
                                      <option value="LUXURY" className="bg-[#242424] text-white">💎 Luxury</option>
                                      <option value="BUDGET" className="bg-[#242424] text-white">🎓 Budget</option>
                                      <option value="STANDARD" className="bg-[#242424] text-white">🏠 Standard</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Link 
                                      to={`/property/${pg._id}`}
                                      className="text-xs font-black uppercase text-gray-300 hover:text-white transition flex items-center gap-1"
                                    >
                                      View <ExternalLink size={12}/>
                                    </Link>

                                    {isPending && (
                                      <div className="flex gap-2">
                                        <button 
                                          disabled={verifyingPropId === pg._id}
                                          onClick={() => handleVerifyProperty(pg._id, 'VERIFIED')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-1 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                                        >
                                          <Check size={12}/> Approve
                                        </button>
                                        <button 
                                          disabled={verifyingPropId === pg._id}
                                          onClick={() => {
                                            const reason = prompt("Enter rejection reason for owner:");
                                            if (reason) handleVerifyProperty(pg._id, 'REJECTED', reason);
                                          }}
                                          className="bg-primary/20 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-1 border border-primary/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
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
                        <div className="p-8 text-center bg-[#1c1c1c] rounded-2xl border border-dashed border-[#2e2e2e]">
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
          <div className="py-24 text-center bg-[#181818] rounded-[3.5rem] border border-[#2a2a2a] p-12">
            <Users size={56} className="mx-auto mb-4 text-gray-500"/>
            <h3 className="text-2xl font-black text-white tracking-tight">No Matching Owners Found</h3>
            <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest max-w-md mx-auto">
              No owner accounts match your search filter. Try clearing your search keyword.
            </p>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="mt-6 btn-netflix-secondary px-6 py-3 rounded-2xl font-black text-xs uppercase cursor-pointer"
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
