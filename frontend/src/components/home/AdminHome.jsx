import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/client';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import { 
  ShieldCheck, ShieldAlert, Search, CheckCircle2, Clock, 
  AlertOctagon, Star, MapPin, Loader2, Bed, 
  ExternalLink, Check, X, ChevronDown, ChevronUp, Users, Building, Mail, Phone, Sparkles, MessageSquare, BarChart3,
  Handshake, FileText, Award, AlertTriangle
} from 'lucide-react';

const AdminHome = ({ user }) => {
  const toast = useToast();
  const { setSelectedChat, setIsChatOpen } = useChat();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [expandedOwners, setExpandedOwners] = useState({});
  const [verifyingPropId, setVerifyingPropId] = useState(null);
  const [rejectingProp, setRejectingProp] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRevokeMode, setIsRevokeMode] = useState(false);
  const [mainView, setMainView] = useState('directory'); // 'directory' or 'deals'
  const [modalTab, setModalTab] = useState('certificate'); // 'certificate' or 'edit'

  // Admin Commercial Deal Modal State
  const [dealModalOwner, setDealModalOwner] = useState(null);
  const [dealFormData, setDealFormData] = useState({
    dealType: 'COMMISSION_PERCENTAGE',
    annualTokenAmount: 9999,
    commissionRate: 6,
    status: 'PENDING_SELECTION',
    adminNotes: ''
  });
  const [savingDeal, setSavingDeal] = useState(false);

  const openDealModal = (owner, initialTab = 'certificate') => {
    setDealModalOwner(owner);
    setModalTab(initialTab);
    setDealFormData({
      dealType: owner.deal?.dealType || 'COMMISSION_PERCENTAGE',
      annualTokenAmount: owner.deal?.annualTokenAmount || 9999,
      commissionRate: owner.deal?.commissionRate || 6,
      status: owner.deal?.status || (owner.kycStatus === 'VERIFIED' ? 'PENDING_SELECTION' : 'NOT_ELIGIBLE'),
      adminNotes: owner.deal?.adminNotes || ''
    });
  };

  const handleSaveDeal = async () => {
    if (!dealModalOwner) return;
    try {
      setSavingDeal(true);
      const res = await API.patch(`/admin/owners/${dealModalOwner._id}/deal`, dealFormData);
      toast.success(res.data.message || "Commercial deal updated successfully!");
      setOwners(prev => prev.map(o => o._id === dealModalOwner._id ? { ...o, deal: res.data.data } : o));
      setDealModalOwner(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update commercial agreement.");
    } finally {
      setSavingDeal(false);
    }
  };

  const handleChatWithOwner = async (e, ownerId) => {
    e.stopPropagation();
    try {
      const { data } = await API.post('/chat/access', { receiverId: ownerId });
      if (data.data) {
        setSelectedChat(data.data);
      }
      setIsChatOpen(true);
    } catch (err) {
      toast.error("Could not open chat with this owner.");
    }
  };

  const fetchOwnersDirectory = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await API.get('/admin/owners-directory');
      } catch (e1) {
        res = await API.get('/admin/owners-overview');
      }
      const dataList = res.data?.data || [];
      setOwners(dataList);
      // Expand all owners with pending PGs by default
      const initialExpanded = {};
      dataList.forEach(o => {
        if (o.properties?.some(p => p.verificationStatus === 'PENDING') || o.kycStatus === 'PENDING') {
          initialExpanded[o._id] = true;
        }
      });
      setExpandedOwners(initialExpanded);
    } catch (err) {
      console.error("Admin owners directory fetch error:", err);
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

      // Optimistic local state update so UI responds instantly
      setOwners(prev => prev.map(owner => {
        const updatedProps = owner.properties?.map(p => {
          if (p._id === propId) {
            return { ...p, verificationStatus: status, rejectionReason };
          }
          return p;
        }) || [];
        return {
          ...owner,
          properties: updatedProps,
          verifiedPropertiesCount: updatedProps.filter(p => p.verificationStatus === 'VERIFIED').length
        };
      }));

      // Send update to backend (support both routes)
      try {
        await API.patch(`/admin/verify-property/${propId}`, { 
          status, 
          rejectionReason,
          reason: rejectionReason
        });
      } catch (err1) {
        await API.put(`/properties/admin/verify/${propId}`, { 
          status, 
          reason: rejectionReason,
          rejectionReason
        });
      }

      toast.success(`Property marked as ${status}`);
      // Re-fetch in background to ensure database parity
      fetchOwnersDirectory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update property status.");
      fetchOwnersDirectory();
    } finally {
      setVerifyingPropId(null);
    }
  };

  const handleUpdateTier = async (propId, tier) => {
    try {
      await API.patch(`/properties/${propId}/tier`, { tier });
      toast.success(`Property tier updated to ${tier}`);
      fetchOwnersDirectory();
    } catch (err) {
      toast.error("Failed to update property tier.");
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
      (kycFilter === 'DEAL_ACTIVE' && owner.deal?.status === 'ACTIVE') ||
      (kycFilter === 'DEAL_PENDING' && (owner.deal?.status === 'PENDING_SELECTION' || (owner.kycStatus === 'VERIFIED' && owner.deal?.status !== 'ACTIVE'))) ||
      (kycFilter === 'WITH_PGS' && (owner.properties?.length || 0) > 0);

    return matchesSearch && matchesKyc;
  });

  const totalProperties = owners.reduce((acc, o) => acc + (o.properties?.length || 0), 0);
  const totalVerifiedPGs = owners.reduce((acc, o) => acc + (o.verifiedPropertiesCount || 0), 0);
  const totalPendingKyc = owners.filter(o => o.kycStatus === 'PENDING').length;
  const totalPendingPGs = owners.reduce((acc, o) => acc + (o.properties?.filter(p => p.verificationStatus === 'PENDING')?.length || 0), 0);
  const totalActiveDeals = owners.filter(o => o.deal?.status === 'ACTIVE').length;
  const totalPendingDeals = owners.filter(o => o.deal?.status === 'PENDING_SELECTION' || (o.kycStatus === 'VERIFIED' && o.deal?.status !== 'ACTIVE')).length;

  return (
    <div className="space-y-12 pb-20 text-white">
      
      {/* 1. ADMIN PLATFORM HERO */}
      <section className="relative rounded-[2.5rem] bg-[#181818] text-white p-6 sm:p-10 overflow-hidden shadow-2xl border border-[#2a2a2a]">
        <div className="absolute right-[-40px] top-[-40px] w-80 h-80 bg-primary/20 rounded-full blur-[90px] pointer-events-none animate-netflix-pulse"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-primary border border-primary/20">
            <ShieldCheck size={12} /> Master Platform Oversight • Admin Command Center
          </div>
          <h1 className="text-2xl sm:text-4xl font-black italic tracking-tight leading-tight text-white">
            Admin Command Console
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm font-medium max-w-xl">
            Real-time management of registered landlords, property compliance, and system-wide verification queues.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link 
              to="/admin/verify-users" 
              className="btn-netflix px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <ShieldCheck size={16} /> KYC Queue ({totalPendingKyc})
            </Link>
            <button
              onClick={() => setMainView(mainView === 'deals' ? 'directory' : 'deals')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                mainView === 'deals' 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/40' 
                  : 'btn-netflix-secondary'
              }`}
            >
              <Handshake size={16} /> Commercial Agreements ({totalActiveDeals})
            </button>
            <Link 
              to="/admin/dashboard" 
              className="btn-netflix-secondary px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95"
            >
              <BarChart3 size={16} /> Performance & Analytics
            </Link>
          </div>
        </div>

        {/* ADMIN METRICS ROW (Concise & Aesthetic) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8 pt-6 border-t border-[#262626]">
          <div className="bg-[#202020] px-4 py-3 rounded-xl border border-[#303030]">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Registered Owners</span>
            <p className="text-2xl font-black italic text-white mt-0.5">{owners.length}</p>
          </div>
          <div className="bg-[#202020] px-4 py-3 rounded-xl border border-[#303030]">
            <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Total Platform PGs</span>
            <p className="text-2xl font-black italic text-primary mt-0.5">{totalProperties}</p>
          </div>
          <div className="bg-[#202020] px-4 py-3 rounded-xl border border-[#303030]">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Live & Verified PGs</span>
            <p className="text-2xl font-black italic text-emerald-400 mt-0.5">{totalVerifiedPGs}</p>
          </div>
          <div className="bg-[#202020] px-4 py-3 rounded-xl border border-[#303030]">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Pending Approvals</span>
            <p className="text-2xl font-black italic text-amber-400 mt-0.5">{totalPendingPGs + totalPendingKyc}</p>
          </div>
          <div 
            onClick={() => setMainView('deals')}
            className={`px-4 py-3 rounded-xl border transition cursor-pointer group ${
              mainView === 'deals' ? 'bg-[#261f18] border-amber-500 shadow-lg' : 'bg-[#202020] border-amber-800/40 hover:border-amber-600'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center justify-between">
              <span>Active Deals</span>
              <span className="text-[9px] font-mono group-hover:underline">View All →</span>
            </span>
            <p className="text-2xl font-black italic text-amber-400 mt-0.5">{totalActiveDeals}</p>
            <span className="text-[10px] text-gray-400 block font-medium truncate">
              {owners.filter(o => o.deal?.status === 'ACTIVE' && o.deal?.dealType === 'ANNUAL_TOKEN').length} Token • {owners.filter(o => o.deal?.status === 'ACTIVE' && o.deal?.dealType === 'COMMISSION_PERCENTAGE').length} Comm
            </span>
          </div>
        </div>
      </section>

      {/* 2. ADMIN SEARCH & FILTER BAR */}
      <section className="bg-[#181818] p-4 sm:p-5 rounded-2xl border border-[#2a2a2a] shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search owners, PG title, tier, city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#202020] rounded-xl font-medium text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-primary border border-[#303030] transition"
            />
          </div>

          {/* FILTER PILLS */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: 'ALL', label: `All Owners (${owners.length})` },
              { id: 'VERIFIED', label: `KYC Verified (${owners.filter(o => o.kycStatus === 'VERIFIED').length})` },
              { id: 'DEAL_ACTIVE', label: `Deal Active (${totalActiveDeals})` },
              { id: 'DEAL_PENDING', label: `Deal Pending (${totalPendingDeals})` },
              { id: 'PENDING', label: `KYC Pending (${totalPendingKyc})` },
              { id: 'WITH_PGS', label: `With Listed PGs (${owners.filter(o => (o.properties?.length || 0) > 0).length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setKycFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  kycFilter === tab.id 
                    ? 'btn-netflix shadow-md text-white' 
                    : 'bg-[#202020] text-gray-300 border border-[#303030] hover:text-white hover:bg-[#282828]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2.5 ADMIN VIEW MODE SWITCHER */}
      <div className="flex bg-[#1a1a1a] p-1.5 rounded-2xl border border-[#2a2a2a] w-full sm:w-fit gap-1">
        <button
          onClick={() => setMainView('directory')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            mainView === 'directory'
              ? 'btn-netflix text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Building size={14} />
          <span>Owners & PG Directory</span>
        </button>

        <button
          onClick={() => setMainView('deals')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            mainView === 'deals'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Handshake size={14} />
          <span>Commercial Deals & Agreements</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
            {totalActiveDeals} Active
          </span>
        </button>
      </div>

      {/* 3. OWNERS DIRECTORY LIST & THEIR LISTED PGs (VIEW: DIRECTORY) */}
      {mainView === 'directory' && (
      <section className="space-y-4 animate-in fade-in duration-300">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white">Owner Directory & Portfolios</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Showing {filteredOwners.length} registered owners across platform
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
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : filteredOwners.length > 0 ? (
          <div className="space-y-4">
            {filteredOwners.map((owner) => {
              const isExpanded = !!expandedOwners[owner._id];
              const pgsCount = owner.properties?.length || 0;
              const livePgsCount = owner.properties?.filter(p => p.verificationStatus === 'VERIFIED').length || 0;

              return (
                <div 
                  key={owner._id}
                  className="bg-[#181818] rounded-2xl border border-[#2a2a2a] shadow-lg overflow-hidden transition-all duration-300 text-white"
                >
                  {/* OWNER SUMMARY HEADER */}
                  <div 
                    onClick={() => toggleExpand(owner._id)}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#202020] transition border-b border-[#282828]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img 
                          src={owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.firstName + ' ' + (owner.lastName || ''))}&background=E50914&color=fff`} 
                          alt={owner.firstName}
                          className="w-12 h-12 rounded-xl object-cover border border-primary/40 shadow-sm"
                        />
                        {owner.kycStatus === 'VERIFIED' && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border-2 border-[#181818]" title="KYC Verified">
                            <CheckCircle2 size={12}/>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                            {owner.firstName} {owner.lastName || ''}
                          </h3>
                          <span className="text-[9px] font-black uppercase text-gray-300 bg-[#242424] border border-[#333333] px-2 py-0.5 rounded">
                            {owner.role || 'OWNER'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-400 flex flex-wrap items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1"><Mail size={12}/> {owner.email}</span>
                          {owner.phone && <span className="flex items-center gap-1"><Phone size={12}/> {owner.phone}</span>}
                        </p>
                      </div>
                    </div>

                    {/* OWNER BADGES & STATS */}
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider block text-gray-400">KYC Status</span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                          owner.kycStatus === 'VERIFIED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                          owner.kycStatus === 'PENDING' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 animate-pulse' :
                          'bg-[#242424] text-gray-400'
                        }`}>
                          {owner.kycStatus || 'NOT_SUBMITTED'}
                        </span>
                      </div>

                      {/* Commercial Agreement Status */}
                      <div className="text-right hidden sm:block">
                        <span className="text-[9px] font-black uppercase tracking-wider block text-gray-400">Platform Deal</span>
                        {owner.deal?.status === 'ACTIVE' ? (
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 ${
                            owner.deal.dealType === 'ANNUAL_TOKEN'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                              : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                          }`}>
                            {owner.deal.dealType === 'ANNUAL_TOKEN' ? (
                              <>⚡ Token (₹{owner.deal.annualTokenAmount || 9999}/yr)</>
                            ) : (
                              <>📈 {owner.deal.commissionRate || 6}% Comm/bk</>
                            )}
                          </span>
                        ) : owner.kycStatus === 'VERIFIED' ? (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 bg-purple-950/60 text-purple-300 border border-purple-800/40">
                            ⏳ Deal Pending
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 bg-[#242424] text-gray-500">
                            🔒 KYC Req
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider block text-gray-400">Portfolio</span>
                        <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                          {pgsCount} {pgsCount === 1 ? 'PG' : 'PGs'} ({livePgsCount} Live)
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDealModal(owner);
                        }}
                        className="p-2 bg-[#252525] hover:bg-emerald-600 text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                        title="Manage Commercial Deal & Agreement"
                      >
                        <Handshake size={16} />
                      </button>

                      <button
                        onClick={(e) => handleChatWithOwner(e, owner._id)}
                        className="p-2 bg-[#252525] hover:bg-primary text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                        title={`Message ${owner.firstName}`}
                      >
                        <MessageSquare size={16} />
                      </button>

                      <div className="p-2 bg-[#242424] rounded-xl text-gray-400">
                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    </div>
                  </div>

                  {/* INDIVIDUAL OWNER LISTED PGs (EXPANDED VIEW) */}
                  {isExpanded && (
                    <div className="p-6 md:p-8 bg-[#141414] space-y-6 animate-in fade-in duration-300">
                      
                      {/* Commercial Deal & Agreement Box for this Owner */}
                      <div className="bg-[#1c1c1c] p-4 sm:p-5 rounded-2xl border border-[#2d2d2d] space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#262626] pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
                              <Handshake size={18} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                                <span>Commercial Partnership Agreement</span>
                                {owner.deal?.status === 'ACTIVE' ? (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    ACTIVE
                                  </span>
                                ) : owner.kycStatus === 'VERIFIED' ? (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    AWAITING SIGNATURE
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                                    KYC UNVERIFIED
                                  </span>
                                )}
                              </h4>
                              <p className="text-[11px] text-gray-400">
                                Governs booking commission cuts, settlement timelines, and listing placement tiers.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDealModal(owner, 'certificate');
                              }}
                              className="btn-netflix-secondary px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <FileText size={12} />
                              <span>View Certificate</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDealModal(owner, 'edit');
                              }}
                              className="btn-netflix px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-950/30 transition cursor-pointer"
                            >
                              <span>Adjust Terms</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                          <div className="bg-[#242424] p-3 rounded-xl border border-[#333]">
                            <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Agreed Plan</span>
                            <p className="font-black text-white mt-0.5">
                              {owner.deal?.dealType === 'ANNUAL_TOKEN' ? '⚡ Annual Token Plan' : '📈 Pay-As-You-Earn'}
                            </p>
                            <span className="text-[10px] text-gray-400 block">
                              {owner.deal?.dealType === 'ANNUAL_TOKEN' ? `Fixed ₹${owner.deal.annualTokenAmount || 9999}/yr` : `${owner.deal?.commissionRate || 6}% Platform Cut`}
                            </span>
                          </div>

                          <div className="bg-[#242424] p-3 rounded-xl border border-[#333]">
                            <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Booking Commission</span>
                            <p className="font-black text-emerald-400 mt-0.5">
                              {owner.deal?.dealType === 'ANNUAL_TOKEN' ? '0% Commission' : `${owner.deal?.commissionRate || 6}% Per Booking`}
                            </p>
                            <span className="text-[10px] text-gray-400 block">
                              {owner.deal?.dealType === 'ANNUAL_TOKEN' ? 'Landlord keeps 100%' : 'Escrow deduction'}
                            </span>
                          </div>

                          <div className="bg-[#242424] p-3 rounded-xl border border-[#333]">
                            <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Agreement Reference</span>
                            <p className="font-mono font-black text-gray-200 mt-0.5 truncate text-[11px]">
                              {owner.deal?.agreementReference || 'Not Executed Yet'}
                            </p>
                            <span className="text-[10px] text-gray-400 block truncate">
                              Signatory: {owner.deal?.signatureName || `${owner.firstName} ${owner.lastName || ''}`}
                            </span>
                          </div>

                          <div className="bg-[#242424] p-3 rounded-xl border border-[#333]">
                            <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Agreement Validity</span>
                            <p className="font-black text-white mt-0.5">
                              {owner.deal?.validUntil ? new Date(owner.deal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (owner.kycStatus === 'VERIFIED' ? 'Pending Signature' : 'Locked')}
                            </p>
                            <span className="text-[10px] text-gray-400 block">
                              {owner.deal?.agreedAt ? `Executed ${new Date(owner.deal.agreedAt).toLocaleDateString()}` : '365 Days upon signing'}
                            </span>
                          </div>
                        </div>
                      </div>

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
                                      {rooms.length > 0 ? (
                                        <span className="font-mono text-primary font-black">
                                          From ₹{Math.min(...rooms.map(r => r.basePrice || Infinity)).toLocaleString()}/mo
                                        </span>
                                      ) : pg.basePrice ? (
                                        <span className="font-mono text-primary font-black">₹{pg.basePrice?.toLocaleString()}/mo</span>
                                      ) : (
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Room pricing below</span>
                                      )}
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

                                    {pg.verificationStatus === 'VERIFIED' ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                                          <Check size={12} /> Live
                                        </span>
                                        <button
                                          disabled={verifyingPropId === pg._id}
                                          onClick={() => {
                                            setRejectingProp(pg);
                                            setIsRevokeMode(true);
                                            setRejectionNote('');
                                          }}
                                          className="text-[9px] font-black uppercase text-gray-400 hover:text-primary transition underline cursor-pointer"
                                          title="Revoke Verification"
                                        >
                                          {verifyingPropId === pg._id ? <Loader2 size={10} className="animate-spin" /> : "Revoke"}
                                        </button>
                                      </div>
                                    ) : pg.verificationStatus === 'REJECTED' ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                                          <X size={12} /> Rejected
                                        </span>
                                        <button
                                          disabled={verifyingPropId === pg._id}
                                          onClick={() => handleVerifyProperty(pg._id, 'VERIFIED')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                                          title="Re-approve this property"
                                        >
                                          {verifyingPropId === pg._id ? <Loader2 size={10} className="animate-spin" /> : <><Check size={10} /> Re-Approve</>}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <button 
                                          disabled={verifyingPropId === pg._id}
                                          onClick={() => handleVerifyProperty(pg._id, 'VERIFIED')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-1 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                                        >
                                          {verifyingPropId === pg._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12}/>} Approve
                                        </button>
                                        <button 
                                          disabled={verifyingPropId === pg._id}
                                          onClick={() => {
                                            setRejectingProp(pg);
                                            setIsRevokeMode(false);
                                            setRejectionNote('');
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
          <div className="py-16 text-center bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
            <Users size={44} className="mx-auto mb-3 text-gray-500"/>
            <h3 className="text-xl font-black text-white tracking-tight">No Matching Owners Found</h3>
            <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest max-w-md mx-auto">
              No owner accounts match your search filter. Try clearing your search keyword.
            </p>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="mt-4 btn-netflix-secondary px-5 py-2 rounded-xl font-black text-xs uppercase cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>
      )}

      {/* 3.5 COMMERCIAL AGREEMENTS & DEALS ROSTER (VIEW: DEALS) */}
      {mainView === 'deals' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-[#2a2a2a] shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#262626] pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/20 mb-2">
                  <Handshake size={12} /> Master Commercial Agreement Telemetry
                </div>
                <h2 className="text-xl sm:text-3xl font-black italic tracking-tight text-white">
                  Commercial Agreements & Contracts Roster
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 max-w-xl">
                  Inspect and audit platform monetization agreements with verified landlords: Annual Token Plans (0% Commission) and Pay-As-You-Earn cuts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-[#202020] px-4 py-2 rounded-xl border border-amber-800/40 text-xs">
                  <span className="text-[9px] font-black uppercase text-amber-400 block tracking-wider">Annual Token</span>
                  <span className="font-black text-white text-base mt-0.5">
                    {owners.filter(o => o.deal?.status === 'ACTIVE' && o.deal?.dealType === 'ANNUAL_TOKEN').length} Active
                  </span>
                </div>
                <div className="bg-[#202020] px-4 py-2 rounded-xl border border-cyan-800/40 text-xs">
                  <span className="text-[9px] font-black uppercase text-cyan-400 block tracking-wider">Pay-As-You-Earn</span>
                  <span className="font-black text-white text-base mt-0.5">
                    {owners.filter(o => o.deal?.status === 'ACTIVE' && o.deal?.dealType === 'COMMISSION_PERCENTAGE').length} Active
                  </span>
                </div>
              </div>
            </div>

            {/* List of owners with deal cards */}
            <div className="space-y-3">
              {filteredOwners.length > 0 ? (
                filteredOwners.map((owner) => {
                  const deal = owner.deal || {};
                  const isActive = deal.status === 'ACTIVE';

                  return (
                    <div 
                      key={owner._id}
                      className="p-5 sm:p-6 rounded-2xl bg-[#202020] border border-[#2e2e2e] hover:border-[#404040] transition space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex items-center gap-3.5">
                          <img 
                            src={owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.firstName + ' ' + (owner.lastName || ''))}&background=E50914&color=fff`} 
                            alt={owner.firstName}
                            className="w-12 h-12 rounded-xl object-cover border border-primary/30"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                                {owner.firstName} {owner.lastName || ''}
                              </h3>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                owner.kycStatus === 'VERIFIED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-[#242424] text-gray-400'
                              }`}>
                                KYC: {owner.kycStatus || 'NOT_SUBMITTED'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 flex flex-wrap items-center gap-3 mt-0.5">
                              <span>{owner.email}</span>
                              {owner.phone && <span>• {owner.phone}</span>}
                              <span>• {owner.properties?.length || 0} Listed PGs</span>
                            </p>
                          </div>
                        </div>

                        {/* Agreement status badge & actions */}
                        <div className="flex items-center gap-2 self-end lg:self-auto">
                          <button
                            onClick={() => openDealModal(owner, 'certificate')}
                            className="btn-netflix-secondary px-3.5 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <FileText size={14} />
                            <span>View Certificate</span>
                          </button>
                          <button
                            onClick={() => openDealModal(owner, 'edit')}
                            className="btn-netflix px-3.5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-red-950/30 transition cursor-pointer"
                          >
                            <span>Adjust Terms</span>
                          </button>
                          <button
                            onClick={(e) => handleChatWithOwner(e, owner._id)}
                            className="p-2 bg-[#252525] hover:bg-primary text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                            title={`Chat with ${owner.firstName}`}
                          >
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Agreement Details Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[#2a2a2a]">
                        <div className="bg-[#181818] p-3 rounded-xl border border-[#303030]">
                          <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Contract Model</span>
                          <span className={`font-black block mt-0.5 ${
                            isActive && deal.dealType === 'ANNUAL_TOKEN' ? 'text-amber-400' : 
                            isActive ? 'text-cyan-400' : 'text-gray-300'
                          }`}>
                            {isActive ? (
                              deal.dealType === 'ANNUAL_TOKEN' ? '⚡ Annual Token Plan' : '📈 Pay-As-You-Earn'
                            ) : owner.kycStatus === 'VERIFIED' ? (
                              '⏳ Awaiting Selection'
                            ) : (
                              '🔒 KYC Required'
                            )}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {deal.dealType === 'ANNUAL_TOKEN' ? `₹${deal.annualTokenAmount || 9999}/yr` : `${deal.commissionRate || 6}% Platform Cut`}
                          </span>
                        </div>

                        <div className="bg-[#181818] p-3 rounded-xl border border-[#303030]">
                          <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Booking Commission</span>
                          <span className="font-black text-emerald-400 block mt-0.5">
                            {isActive ? (
                              deal.dealType === 'ANNUAL_TOKEN' ? '0% Commission (100% to Host)' : `${deal.commissionRate || 6}% per booking`
                            ) : (
                              '—'
                            )}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {deal.dealType === 'ANNUAL_TOKEN' ? '0% Platform Fee' : 'Deducted on check-in'}
                          </span>
                        </div>

                        <div className="bg-[#181818] p-3 rounded-xl border border-[#303030]">
                          <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Agreement Reference</span>
                          <span className="font-mono font-black text-gray-200 block mt-0.5 text-[11px] truncate">
                            {deal.agreementReference || 'Not Executed Yet'}
                          </span>
                          <span className="text-[10px] text-gray-400 block truncate">
                            Signatory: {deal.signatureName || `${owner.firstName} ${owner.lastName || ''}`}
                          </span>
                        </div>

                        <div className="bg-[#181818] p-3 rounded-xl border border-[#303030]">
                          <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Validity Period</span>
                          <span className="font-black text-white block mt-0.5">
                            {deal.validUntil ? new Date(deal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (owner.kycStatus === 'VERIFIED' ? 'Pending Signature' : 'Locked')}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {deal.agreedAt ? `Signed: ${new Date(deal.agreedAt).toLocaleDateString()}` : '365 Days upon signing'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-[#202020] rounded-2xl border border-[#2e2e2e]">
                  <Handshake size={36} className="mx-auto text-gray-500 mb-2" />
                  <p className="text-sm font-bold text-white">No Matching Commercial Agreements</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or filter pills above.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* REJECTION / REVOCATION MODAL */}
      {rejectingProp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#181818] max-w-md w-full rounded-2xl border border-[#2e2e2e] shadow-2xl p-6 text-white space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded">
                  {isRevokeMode ? "Revoke Property Listing" : "Reject Property Listing"}
                </span>
                <h3 className="text-lg font-black text-white tracking-tight mt-1.5">
                  {rejectingProp.title}
                </h3>
              </div>
              <button 
                onClick={() => setRejectingProp(null)} 
                className="p-1.5 bg-[#252525] rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={16}/>
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Select or provide a reason explaining why this listing is being {isRevokeMode ? "revoked" : "rejected"}:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {[
                "Incomplete ownership deed",
                "Room specs mismatch description",
                "Safety & hygiene compliance issue",
                "Landlord unreachable / invalid phone"
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectionNote(preset)}
                  className="text-[9px] font-bold bg-[#251a1a] text-red-200 hover:bg-red-950 px-2.5 py-1 rounded-lg border border-red-900/50 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Detailed reason for owner notification..."
              className="w-full bg-[#202020] p-3 rounded-xl text-xs text-white placeholder-gray-500 border border-[#333] outline-none focus:border-primary"
            />

            <div className="flex gap-2.5 pt-2 border-t border-[#262626]">
              <button
                disabled={verifyingPropId === rejectingProp._id}
                onClick={async () => {
                  const reason = rejectionNote.trim() || (isRevokeMode ? 'Listing revoked by administrator.' : 'Listing details require revision.');
                  const pId = rejectingProp._id;
                  setRejectingProp(null);
                  await handleVerifyProperty(pId, 'REJECTED', reason);
                }}
                className="flex-1 btn-netflix py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isRevokeMode ? "Confirm Revocation" : "Confirm Rejection"}
              </button>
              <button
                onClick={() => setRejectingProp(null)}
                className="px-4 bg-[#252525] text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADMIN COMMERCIAL DEAL & AGREEMENT MODAL */}
      {dealModalOwner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#181818] border border-[#2a2a2a] w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#262626] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                  <Handshake size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white italic tracking-tight">
                    Manage Commercial Deal & Terms
                  </h3>
                  <p className="text-xs text-gray-400">
                    Owner: <span className="text-white font-bold">{dealModalOwner.firstName} {dealModalOwner.lastName || ''}</span> ({dealModalOwner.email})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDealModalOwner(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252525] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#262626] gap-4">
              <button
                type="button"
                onClick={() => setModalTab('certificate')}
                className={`pb-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  modalTab === 'certificate'
                    ? 'border-primary text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Award size={14} className={modalTab === 'certificate' ? 'text-primary' : 'text-gray-500'} />
                <span>Agreement Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('edit')}
                className={`pb-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  modalTab === 'edit'
                    ? 'border-primary text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Handshake size={14} className={modalTab === 'edit' ? 'text-primary' : 'text-gray-500'} />
                <span>Adjust Terms & Override</span>
              </button>
            </div>

            {/* KYC Pre-check alert */}
            {dealModalOwner.kycStatus !== 'VERIFIED' && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Notice: This owner has not completed KYC verification yet ({dealModalOwner.kycStatus}).</span>
              </div>
            )}

            {modalTab === 'certificate' ? (
              dealModalOwner.deal?.status === 'ACTIVE' ? (
                <div className="relative overflow-hidden rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-[#181818] to-black space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle2 size={12} /> Legally Enforced & Signed
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {dealModalOwner.deal?.agreementDate ? new Date(dealModalOwner.deal.agreementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}
                    </span>
                  </div>

                  <div className="p-3 bg-black/50 border border-[#303030] rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">Agreement Ref ID</span>
                      <span className="font-mono text-white font-black text-xs">{dealModalOwner.deal?.agreementReference || 'DEAL-PARTNERSHIP'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(dealModalOwner.deal?.agreementReference || '');
                        toast.info("Agreement reference copied to clipboard");
                      }}
                      className="p-1.5 bg-[#252525] hover:bg-[#333] text-gray-300 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl">
                      <span className="text-gray-400 text-[10px] block uppercase font-bold">Monetization Model</span>
                      <span className="text-amber-400 font-black mt-0.5 block">
                        {dealModalOwner.deal?.dealType === 'ANNUAL_TOKEN' ? '⚡ Annual Token' : '📈 Pay-As-You-Earn'}
                      </span>
                    </div>
                    <div className="p-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl">
                      <span className="text-gray-400 text-[10px] block uppercase font-bold">Rate / Fee</span>
                      <span className="text-white font-black mt-0.5 block">
                        {dealModalOwner.deal?.dealType === 'ANNUAL_TOKEN' ? `₹${(dealModalOwner.deal?.annualTokenAmount || 9999).toLocaleString('en-IN')}/yr` : `${dealModalOwner.deal?.commissionRate || 6}% per booking`}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>Signatory Landlord:</span>
                      <span className="text-white font-bold">{dealModalOwner.firstName} {dealModalOwner.lastName || ''}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>Valid Through:</span>
                      <span className="text-white font-bold">
                        {dealModalOwner.deal?.validUntil ? new Date(dealModalOwner.deal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Annual Term'}
                      </span>
                    </div>
                    {dealModalOwner.deal?.adminNotes && (
                      <div className="pt-2 border-t border-[#333] text-gray-400 text-[11px]">
                        <span className="font-bold text-gray-300">Notes:</span> {dealModalOwner.deal.adminNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setModalTab('edit')}
                      className="btn-netflix-secondary px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Modify Terms & Status →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-[#333] bg-[#1a1a1a] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Agreement Not Yet Sealed</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {dealModalOwner.kycStatus === 'VERIFIED'
                        ? "This owner is KYC verified. They can select and seal their commercial deal directly from their Owner Dashboard."
                        : `This owner's KYC status is ${dealModalOwner.kycStatus}. KYC verification is recommended before sealing agreements.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalTab('edit')}
                    className="btn-netflix px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Configure & Override Terms
                  </button>
                </div>
              )
            ) : (
              /* Deal Settings Form */
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                    Monetization Structure
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDealFormData({ ...dealFormData, dealType: 'ANNUAL_TOKEN' })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        dealFormData.dealType === 'ANNUAL_TOKEN'
                          ? 'bg-amber-950/30 border-amber-500 text-white'
                          : 'bg-[#202020] border-[#303030] text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-black block text-amber-400">⚡ Annual Token</span>
                      <span className="text-[10px] block mt-0.5">Fixed fee • 0% booking commission</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDealFormData({ ...dealFormData, dealType: 'COMMISSION_PERCENTAGE' })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        dealFormData.dealType === 'COMMISSION_PERCENTAGE'
                          ? 'bg-cyan-950/30 border-cyan-500 text-white'
                          : 'bg-[#202020] border-[#303030] text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-black block text-cyan-400">📈 Pay-As-You-Earn</span>
                      <span className="text-[10px] block mt-0.5">₹0 upfront • % Cut on bookings</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Inputs depending on deal type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                      Annual Token Amount (₹)
                    </label>
                    <input 
                      type="number"
                      value={dealFormData.annualTokenAmount}
                      onChange={e => setDealFormData({ ...dealFormData, annualTokenAmount: Number(e.target.value) })}
                      className="w-full bg-[#202020] text-white p-2.5 rounded-xl text-xs font-bold outline-none focus:border-primary border border-[#303030]"
                      placeholder="9999"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                      Booking Commission (%)
                    </label>
                    <input 
                      type="number"
                      value={dealFormData.commissionRate}
                      onChange={e => setDealFormData({ ...dealFormData, commissionRate: Number(e.target.value) })}
                      className="w-full bg-[#202020] text-white p-2.5 rounded-xl text-xs font-bold outline-none focus:border-primary border border-[#303030]"
                      placeholder="6"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                    Deal Status
                  </label>
                  <select
                    value={dealFormData.status}
                    onChange={e => setDealFormData({ ...dealFormData, status: e.target.value })}
                    className="w-full bg-[#202020] text-white p-2.5 rounded-xl text-xs font-bold outline-none focus:border-primary border border-[#303030] cursor-pointer"
                  >
                    <option value="NOT_ELIGIBLE">NOT_ELIGIBLE (KYC Required)</option>
                    <option value="PENDING_SELECTION">PENDING_SELECTION (Awaiting Owner Signature)</option>
                    <option value="ACTIVE">ACTIVE (Agreement Signed & Enforced)</option>
                    <option value="EXPIRED">EXPIRED (Needs Renewal)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                    Admin Agreement Notes
                  </label>
                  <textarea
                    value={dealFormData.adminNotes}
                    onChange={e => setDealFormData({ ...dealFormData, adminNotes: e.target.value })}
                    className="w-full bg-[#202020] text-white p-2.5 rounded-xl text-xs outline-none focus:border-primary border border-[#303030] h-20 resize-none"
                    placeholder="E.g. Custom commercial agreement approved by Admin."
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#262626]">
              {modalTab === 'certificate' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDealModalOwner(null)}
                    className="btn-netflix-secondary px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('edit')}
                    className="btn-netflix px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Handshake size={14} />
                    <span>Adjust Terms</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDealModalOwner(null)}
                    className="btn-netflix-secondary px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDeal}
                    disabled={savingDeal}
                    className="btn-netflix px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
                  >
                    {savingDeal ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Save & Notify Landlord</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminHome;
