import { useState, useEffect, useMemo, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/client';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import { 
  BarChart3, ShieldAlert, Users, Building, AlertCircle, CheckCircle2, 
  Clock, ArrowLeft, RefreshCw, Search, ExternalLink, MessageSquare, 
  AlertTriangle, Check, X, ShieldCheck, Calendar, Award, Handshake, 
  ChevronDown, ChevronUp, Copy, Shield, FileText, Percent, Sparkles, 
  Filter, Eye, Lock, UserPlus, UserMinus, UserCheck, ShieldOff, Trash2
} from 'lucide-react';

const AdminDashboard = () => {
  const { setSelectedChat, setIsChatOpen } = useChat();
  const toast = useToast();
  const navigate = useNavigate();

  // Top Section Switcher: 'owners' | 'deals' | 'analytics'
  const [activeTab, setActiveTab] = useState('owners');

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [owners, setOwners] = useState([]);
  
  // Tab 1 (Owners) states
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('ALL'); // 'ALL', 'KYC_VERIFIED', 'DEAL_ACTIVE', 'DEAL_PENDING', 'KYC_PENDING', 'WITH_PGS'
  const [expandedOwnerIds, setExpandedOwnerIds] = useState(new Set());

  // Tab 2 (Deals) states
  const [dealSearch, setDealSearch] = useState('');

  // Tab 3 (Analytics) states
  const [analyticsSubtab, setAnalyticsSubtab] = useState('sla'); // 'sla' or 'recent'
  const [ticketFilter, setTicketFilter] = useState('ALL'); // 'ALL', 'BREACHED', 'OPEN', 'RESOLVED'
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  
  // Action states
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const { user } = useContext(AuthContext);

  // Tab 4 (Staff & Admins) states
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('ALL');
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [adminActionLoadingId, setAdminActionLoadingId] = useState(null);

  const fetchAdmins = async () => {
    try {
      setAdminsLoading(true);
      const { data } = await API.get('/admin/manage-admins');
      setAdmins(data.data || []);
    } catch (err) {
      console.error("Failed to load administrators:", err);
      if (activeTab === 'admins') {
        toast.error(err.response?.data?.message || "Failed to load administrators list.");
      }
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isSuperAdmin) {
      fetchAdmins();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'admins' && user?.isSuperAdmin) {
      fetchAdmins();
    }
  }, [activeTab]);

  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      const q = adminSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        `${admin.firstName} ${admin.lastName || ''}`.toLowerCase().includes(q) ||
        admin.email?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (adminStatusFilter === 'ACTIVE') return !admin.adminSuspended;
      if (adminStatusFilter === 'SUSPENDED') return admin.adminSuspended;
      if (adminStatusFilter === 'SUPERADMIN') return admin.isSuperAdmin;

      return true;
    });
  }, [admins, adminSearch, adminStatusFilter]);

  const handleToggleSuspendAdmin = async (targetAdmin) => {
    const isSuspended = targetAdmin.adminSuspended;
    const actionName = isSuspended ? 'reactivate' : 'suspend';
    const endpoint = isSuspended 
      ? `/admin/manage-admins/${targetAdmin._id}/activate` 
      : `/admin/manage-admins/${targetAdmin._id}/close`;

    try {
      setAdminActionLoadingId(targetAdmin._id);
      await API.patch(endpoint);
      toast.success(`Administrator ${targetAdmin.email} has been ${isSuspended ? 'reactivated' : 'suspended'}.`);
      await fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionName} administrator.`);
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  const handleDemoteAdmin = async (targetAdmin) => {
    if (!window.confirm(`Are you sure you want to revoke Administrator privileges from ${targetAdmin.email}?\n\nThey will be demoted to a standard Tenant and removed from the Administrator team.`)) {
      return;
    }

    try {
      setAdminActionLoadingId(targetAdmin._id);
      await API.patch(`/admin/manage-admins/${targetAdmin._id}/demote`, { targetRole: 'TENANT' });
      toast.success(`Admin privileges revoked for ${targetAdmin.email}.`);
      await fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke admin privileges.");
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  // Modal states
  const [selectedCertificateOwner, setSelectedCertificateOwner] = useState(null);
  const [adjustingDealOwner, setAdjustingDealOwner] = useState(null);
  const [rejectingProperty, setRejectingProperty] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch both owners directory and platform analytics in parallel
  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, ownersRes] = await Promise.all([
        API.get('/admin/dashboard').catch(() => API.get('/admin/analytics')),
        API.get('/admin/owners-directory').catch(() => API.get('/admin/owners-overview'))
      ]);

      setAnalytics(analyticsRes.data?.data || null);
      setOwners(ownersRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
      toast.error("Failed to synchronize admin console data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary Metrics
  const overview = analytics?.overview || {};
  const maintenanceStats = overview.maintenance || {};
  const tickets = analytics?.maintenanceTickets || [];
  const recentBookings = analytics?.recentBookings || [];

  const totalRegisteredOwners = owners.length;
  const totalPlatformProperties = useMemo(() => {
    return owners.reduce((acc, o) => acc + (o.properties?.length || 0), 0);
  }, [owners]);

  const liveVerifiedProperties = useMemo(() => {
    return owners.reduce((acc, o) => {
      const verified = (o.properties || []).filter(p => p.verificationStatus === 'VERIFIED');
      return acc + verified.length;
    }, 0);
  }, [owners]);

  const pendingApprovalsCount = useMemo(() => {
    const pendingProps = owners.reduce((acc, o) => {
      const pending = (o.properties || []).filter(p => p.verificationStatus === 'PENDING');
      return acc + pending.length;
    }, 0);
    const pendingKYC = owners.filter(o => o.kycStatus === 'PENDING').length;
    return pendingProps + pendingKYC;
  }, [owners]);

  const activeDealsCount = useMemo(() => {
    return owners.filter(o => o.deal?.status === 'ACTIVE').length;
  }, [owners]);

  const tokenDealsCount = useMemo(() => {
    return owners.filter(o => o.deal?.status === 'ACTIVE' && o.deal?.dealType === 'ANNUAL_TOKEN').length;
  }, [owners]);

  const commissionDealsCount = useMemo(() => {
    return owners.filter(o => o.deal?.status === 'ACTIVE' && o.deal?.dealType === 'COMMISSION_PERCENTAGE').length;
  }, [owners]);

  // Expand / Collapse Owner Handlers
  const toggleOwnerExpand = (ownerId) => {
    setExpandedOwnerIds(prev => {
      const next = new Set(prev);
      if (next.has(ownerId)) {
        next.delete(ownerId);
      } else {
        next.add(ownerId);
      }
      return next;
    });
  };

  const expandAllOwners = () => {
    setExpandedOwnerIds(new Set(owners.map(o => o._id)));
  };

  const collapseAllOwners = () => {
    setExpandedOwnerIds(new Set());
  };

  // 1. Direct Chat with user
  const handleDirectChat = async (userId, targetName = "User") => {
    if (!userId) return;
    try {
      const { data } = await API.post('/chat/access', { receiverId: userId });
      if (data.data) {
        setSelectedChat(data.data);
      }
      setIsChatOpen(true);
      toast.info(`Opened direct chat with ${targetName}`);
    } catch (err) {
      toast.error("Could not initiate direct conversation with this user.");
    }
  };

  // 2. Approve Property
  const handleApproveProperty = async (propertyId, propTitle = "Property") => {
    try {
      setActionLoadingId(propertyId);
      await API.patch(`/admin/verify-property/${propertyId}`, { status: 'VERIFIED' });
      toast.success(`"${propTitle}" is now verified and live on Nestify!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve property.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Reject Property with Reason
  const handleConfirmRejectProperty = async () => {
    if (!rejectingProperty) return;
    try {
      setActionLoadingId(rejectingProperty._id);
      await API.patch(`/admin/verify-property/${rejectingProperty._id}`, { 
        status: 'REJECTED',
        rejectionReason: rejectReason.trim() || 'Property documents did not meet verification criteria.'
      });
      toast.warning(`Property marked as rejected. Landlord has been notified.`);
      setRejectingProperty(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject property.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Update Property Experience Tier
  const handleUpdatePropertyTier = async (propertyId, newTier) => {
    try {
      setActionLoadingId(propertyId);
      await API.patch(`/admin/verify-property/${propertyId}`, { tier: newTier });
      toast.success(`Property tier updated to ${newTier}!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update property tier.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Escalate SLA-breached ticket
  const handleEscalateToOwner = async (ticketId) => {
    try {
      setActionLoadingId(ticketId);
      const res = await API.post(`/admin/tickets/${ticketId}/escalate`, {
        note: "Admin notice: Maintenance ticket has breached standard 24h SLA. Urgent landlord resolution required."
      });
      toast.info(res.data?.message || "Escalation notice dispatched to landlord.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to escalate ticket.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 6. Resolve Maintenance Ticket
  const handleConfirmResolve = async () => {
    if (!resolvingTicket) return;
    try {
      setActionLoadingId(resolvingTicket._id);
      await API.patch(`/maintenance/${resolvingTicket._id}/respond`, {
        status: 'RESOLVED',
        resolutionNote: resolutionNote.trim() || 'Issue marked as resolved by Administrator.'
      });
      toast.success("Ticket marked as RESOLVED and tenant notified.");
      setResolvingTicket(null);
      setResolutionNote('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve ticket.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter Owners
  const filteredOwners = useMemo(() => {
    return owners.filter(o => {
      // 1. Search
      const q = ownerSearch.toLowerCase().trim();
      const fullName = `${o.firstName || ''} ${o.lastName || ''}`.toLowerCase();
      const email = (o.email || '').toLowerCase();
      const phone = (o.phone || '').toLowerCase();
      const hasPropMatch = (o.properties || []).some(p => 
        (p.title || '').toLowerCase().includes(q) ||
        (p.location?.city || '').toLowerCase().includes(q) ||
        (p.tier || '').toLowerCase().includes(q)
      );

      const matchesSearch = !q || fullName.includes(q) || email.includes(q) || phone.includes(q) || hasPropMatch;
      if (!matchesSearch) return false;

      // 2. Filter Pills
      if (ownerFilter === 'KYC_VERIFIED' && o.kycStatus !== 'VERIFIED') return false;
      if (ownerFilter === 'DEAL_ACTIVE' && o.deal?.status !== 'ACTIVE') return false;
      if (ownerFilter === 'DEAL_PENDING' && o.deal?.status !== 'PENDING_SELECTION') return false;
      if (ownerFilter === 'KYC_PENDING' && o.kycStatus !== 'PENDING') return false;
      if (ownerFilter === 'WITH_PGS' && (!o.properties || o.properties.length === 0)) return false;

      return true;
    });
  }, [owners, ownerSearch, ownerFilter]);

  // Filter Deals Tab
  const dealsOwners = useMemo(() => {
    return owners.filter(o => {
      const q = dealSearch.toLowerCase().trim();
      if (!q) return true;
      const fullName = `${o.firstName || ''} ${o.lastName || ''}`.toLowerCase();
      const email = (o.email || '').toLowerCase();
      const ref = (o.deal?.agreementReference || '').toLowerCase();
      const plan = (o.deal?.dealType || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || ref.includes(q) || plan.includes(q);
    });
  }, [owners, dealSearch]);

  const calculateHours = (dateStr) => {
    if (!dateStr) return 0;
    return Math.abs(new Date() - new Date(dateStr)) / 36e5;
  };

  // Filter Maintenance Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const hours = calculateHours(ticket.createdAt);
      const isBreached = hours > 24 && ticket.status !== 'RESOLVED';

      if (ticketFilter === 'BREACHED' && !isBreached) return false;
      if (ticketFilter === 'OPEN' && ticket.status !== 'OPEN') return false;
      if (ticketFilter === 'RESOLVED' && ticket.status !== 'RESOLVED') return false;

      const q = analyticsSearch.toLowerCase().trim();
      if (!q) return true;
      const tenantName = `${ticket.tenant?.firstName || ''} ${ticket.tenant?.lastName || ''}`.toLowerCase();
      const ownerName = `${ticket.property?.owner?.firstName || ''} ${ticket.property?.owner?.lastName || ''}`.toLowerCase();
      const propTitle = (ticket.property?.title || '').toLowerCase();
      const issue = (ticket.issueType || '').toLowerCase();
      const desc = (ticket.description || '').toLowerCase();
      return tenantName.includes(q) || ownerName.includes(q) || propTitle.includes(q) || issue.includes(q) || desc.includes(q);
    });
  }, [tickets, ticketFilter, analyticsSearch]);

  // Filter Recent Bookings
  const filteredBookings = useMemo(() => {
    return recentBookings.filter(b => {
      const q = analyticsSearch.toLowerCase().trim();
      if (!q) return true;
      const tenantName = `${b.tenant?.firstName || ''} ${b.tenant?.lastName || ''}`.toLowerCase();
      const propTitle = (b.property?.title || '').toLowerCase();
      const status = (b.status || '').toLowerCase();
      return tenantName.includes(q) || propTitle.includes(q) || status.includes(q);
    });
  }, [recentBookings, analyticsSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 text-white space-y-6">
      
      {/* 1. MASTER COMMAND CONSOLE HERO BANNER */}
      <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div>
            <span className="bg-red-950/80 border border-red-600/50 text-[#E50914] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse"></span>
              MASTER PLATFORM OVERSIGHT • ADMIN COMMAND CENTER
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-wide">
              Admin Command Console
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              Real-time management of registered landlords, property compliance, commercial deals, and system-wide verification queues.
            </p>
          </div>

          {/* Top 3 Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link 
              to="/admin/verify-users" 
              className="btn-red-glow text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>KYC QUEUE ({pendingApprovalsCount})</span>
            </Link>

            <button 
              type="button"
              onClick={() => setActiveTab('deals')} 
              className={`text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'deals'
                  ? 'bg-neutral-800 text-white border border-neutral-600'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#E50914]" />
              <span>COMMERCIAL AGREEMENTS ({activeDealsCount})</span>
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('analytics')} 
              className={`text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-neutral-800 text-white border border-neutral-600'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-neutral-400" />
              <span>PERFORMANCE & ANALYTICS</span>
            </button>

            {user?.isSuperAdmin && (
              <button 
                type="button"
                onClick={() => setActiveTab('admins')} 
                className={`text-xs font-bold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'admins'
                    ? 'bg-neutral-800 text-white border border-neutral-600'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>MANAGE ADMINS ({admins.length})</span>
              </button>
            )}

            <button 
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="ml-auto bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 p-2.5 rounded-xl transition cursor-pointer"
              title="Refresh Console Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#E50914]" : ""}`} />
            </button>
          </div>

          {/* 5 Platform KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">REGISTERED OWNERS</span>
              <span className="text-2xl sm:text-3xl font-black text-white italic mt-1 block">{totalRegisteredOwners}</span>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-[#E50914] block tracking-wider">TOTAL PLATFORM PGS</span>
              <span className="text-2xl sm:text-3xl font-black text-[#E50914] italic mt-1 block">{totalPlatformProperties}</span>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">LIVE & VERIFIED PGS</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 italic mt-1 block">{liveVerifiedProperties}</span>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">PENDING APPROVALS</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 italic mt-1 block">{pendingApprovalsCount}</span>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">ACTIVE DEALS</span>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('deals')}
                  className="text-[9px] font-extrabold text-neutral-400 hover:text-white uppercase transition cursor-pointer"
                >
                  VIEW ALL &gt;
                </button>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 italic mt-1 block">{activeDealsCount}</span>
              <span className="text-[9px] text-neutral-500 block">
                {tokenDealsCount} Token • {commissionDealsCount} Comm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION SWITCHER RIBBON */}
      <div className="flex flex-wrap items-center gap-2">
        <button 
          type="button"
          onClick={() => setActiveTab('owners')} 
          className={`text-xs font-black uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'owners' 
              ? 'btn-red-glow text-white shadow' 
              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>OWNERS & PG DIRECTORY</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('deals')} 
          className={`text-xs font-black uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'deals' 
              ? 'btn-red-glow text-white shadow' 
              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>COMMERCIAL DEALS & AGREEMENTS</span>
          <span className="bg-black/80 text-white text-[9px] px-1.5 py-0.2 rounded font-extrabold border border-white/20">
            {activeDealsCount} ACTIVE
          </span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('analytics')} 
          className={`text-xs font-black uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'analytics' 
              ? 'btn-red-glow text-white shadow' 
              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>PERFORMANCE & ANALYTICS</span>
        </button>

        {user?.isSuperAdmin && (
          <button 
            type="button"
            onClick={() => setActiveTab('admins')} 
            className={`text-xs font-black uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'admins' 
                ? 'btn-red-glow text-white shadow' 
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>STAFF & ADMINS</span>
            <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-extrabold border border-amber-500/30">
              SUPERADMIN
            </span>
          </button>
        )}
      </div>

      {/* 3. TAB CONTENT */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="animate-spin text-[#E50914]" size={40} />
          <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Loading Command Console Data...</p>
        </div>
      ) : activeTab === 'owners' ? (
        
        /* -------------------------------------------------------------
           TAB 1: OWNERS & PG DIRECTORY STREAM
        -------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Search & Filter Ribbon */}
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input 
                type="text" 
                placeholder="Search owners, PG title, tier, city..." 
                value={ownerSearch}
                onChange={e => setOwnerSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-neutral-600 transition"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-extrabold w-full md:w-auto">
              <button 
                type="button"
                onClick={() => setOwnerFilter('ALL')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  ownerFilter === 'ALL' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                ALL OWNERS ({owners.length})
              </button>
              <button 
                type="button"
                onClick={() => setOwnerFilter('KYC_VERIFIED')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  ownerFilter === 'KYC_VERIFIED' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                KYC VERIFIED ({owners.filter(o => o.kycStatus === 'VERIFIED').length})
              </button>
              <button 
                type="button"
                onClick={() => setOwnerFilter('DEAL_ACTIVE')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  ownerFilter === 'DEAL_ACTIVE' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                DEAL ACTIVE ({activeDealsCount})
              </button>
              <button 
                type="button"
                onClick={() => setOwnerFilter('DEAL_PENDING')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  ownerFilter === 'DEAL_PENDING' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                DEAL PENDING ({owners.filter(o => o.deal?.status === 'PENDING_SELECTION').length})
              </button>
              <button 
                type="button"
                onClick={() => setOwnerFilter('KYC_PENDING')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  ownerFilter === 'KYC_PENDING' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                KYC PENDING ({owners.filter(o => o.kycStatus === 'PENDING').length})
              </button>
              <button 
                type="button"
                onClick={() => setOwnerFilter('WITH_PGS')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  ownerFilter === 'WITH_PGS' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                WITH LISTED PGS ({owners.filter(o => o.properties && o.properties.length > 0).length})
              </button>
            </div>
          </div>

          {/* Section Header & Expand/Collapse Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white italic">Owner Directory & Portfolios</h2>
              <p className="text-[10px] uppercase font-extrabold text-neutral-500 tracking-wider">
                SHOWING {filteredOwners.length} OF {owners.length} REGISTERED OWNERS ACROSS PLATFORM
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={expandAllOwners} 
                className="text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-wider transition cursor-pointer"
              >
                EXPAND ALL
              </button>
              <span className="text-neutral-700">•</span>
              <button 
                type="button"
                onClick={collapseAllOwners} 
                className="text-xs font-bold text-[#E50914] hover:underline uppercase tracking-wider transition cursor-pointer"
              >
                COLLAPSE ALL
              </button>
            </div>
          </div>

          {/* Owner Accordion Stream */}
          <div className="space-y-4">
            {filteredOwners.length === 0 ? (
              <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-16 text-center space-y-3">
                <Users className="w-12 h-12 text-neutral-600 mx-auto" />
                <h3 className="text-lg font-black text-white italic">No Owners Found</h3>
                <p className="text-xs text-neutral-500">No registered landlords match your current search and filter criteria.</p>
              </div>
            ) : (
              filteredOwners.map(owner => {
                const isExpanded = expandedOwnerIds.has(owner._id);
                const ownerProps = owner.properties || [];
                const liveCount = ownerProps.filter(p => p.verificationStatus === 'VERIFIED').length;
                const initials = `${owner.firstName?.[0] || 'O'}${owner.lastName?.[0] || ''}`.toUpperCase();

                return (
                  <div 
                    key={owner._id}
                    className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 transition-all"
                  >
                    {/* Header Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-2xl bg-[#E50914] text-white font-black text-base flex items-center justify-center shrink-0">
                          {initials}
                          {owner.kycStatus === 'VERIFIED' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#141414]" title="KYC Verified"></span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-white">
                              {owner.firstName} {owner.lastName || ''}
                            </h4>
                            <span className="bg-neutral-800 text-neutral-300 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                              {owner.role || 'OWNER'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500">{owner.email}</p>
                        </div>
                      </div>

                      {/* Stat Pills & Actions */}
                      <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">KYC STATUS</span>
                          <span className={`text-[10px] font-bold uppercase ${
                            owner.kycStatus === 'VERIFIED' ? 'text-emerald-400' :
                            owner.kycStatus === 'PENDING' ? 'text-amber-400' :
                            owner.kycStatus === 'REJECTED' ? 'text-red-400' : 'text-neutral-400'
                          }`}>
                            {owner.kycStatus || 'NOT_STARTED'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">PLATFORM DEAL</span>
                          {owner.deal?.status === 'ACTIVE' ? (
                            <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              {owner.deal.dealType === 'ANNUAL_TOKEN' ? '0% TOKEN' : `${owner.deal.commissionRate || 6}% COMM/BK`}
                            </span>
                          ) : owner.kycStatus !== 'VERIFIED' ? (
                            <span className="bg-neutral-900 border border-amber-900/50 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> KYC REQ
                            </span>
                          ) : (
                            <span className="bg-neutral-900 border border-neutral-700 text-neutral-400 text-[9px] font-black px-2 py-0.5 rounded">
                              PENDING SIGN
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">PORTFOLIO</span>
                          <span className="bg-red-950/80 border border-[#E50914]/40 text-[#E50914] text-[9px] font-black px-2 py-0.5 rounded">
                            {ownerProps.length} PG{ownerProps.length === 1 ? '' : 'S'} ({liveCount} LIVE)
                          </span>
                        </div>

                        <div className="flex items-center gap-1 pl-2">
                          <button 
                            type="button"
                            onClick={() => setAdjustingDealOwner(owner)}
                            className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
                            title="Manage Commercial Deal"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleDirectChat(owner._id, `${owner.firstName} ${owner.lastName || ''}`)}
                            className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
                            title="Direct Concierge Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            type="button"
                            onClick={() => toggleOwnerExpand(owner._id)}
                            className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
                            title={isExpanded ? "Collapse Portfolio" : "Expand Portfolio"}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED ACCORDION VIEW */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-neutral-800 space-y-6 animate-in fade-in duration-200">
                        
                        {/* 1. Commercial Partnership Agreement Box */}
                        <div className="bg-black/50 border border-neutral-800 rounded-2xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <Shield className="w-5 h-5 text-[#E50914]" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-black uppercase text-white tracking-wide">
                                    COMMERCIAL PARTNERSHIP AGREEMENT
                                  </h4>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded ${
                                    owner.deal?.status === 'ACTIVE' 
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                                      : 'bg-neutral-800 text-neutral-400'
                                  }`}>
                                    {owner.deal?.status || (owner.kycStatus === 'VERIFIED' ? 'PENDING_SELECTION' : 'KYC UNVERIFIED')}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-0.5">
                                  Governs booking commission cuts, settlement timelines, and listing placement tiers.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <button 
                                type="button"
                                onClick={() => setSelectedCertificateOwner(owner)}
                                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              >
                                <FileText className="w-3 h-3" /> VIEW CERTIFICATE
                              </button>
                              
                              <button 
                                type="button"
                                onClick={() => setAdjustingDealOwner(owner)}
                                className="btn-red-glow text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
                              >
                                ADJUST TERMS
                              </button>
                            </div>
                          </div>

                          {/* 4 Agreement Terms Blocks */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                              <span className="text-[9px] uppercase font-bold text-neutral-500 block">AGREED PLAN</span>
                              <span className="text-xs font-black text-white block mt-0.5">
                                {owner.deal?.dealType === 'ANNUAL_TOKEN' ? 'Annual Token Plan' : 'Pay-As-You-Earn'}
                              </span>
                              <span className="text-[9px] text-neutral-500">
                                {owner.deal?.dealType === 'ANNUAL_TOKEN' ? '₹9,999/yr fixed' : '6% Platform Cut'}
                              </span>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                              <span className="text-[9px] uppercase font-bold text-neutral-500 block">BOOKING COMMISSION</span>
                              <span className="text-xs font-black text-emerald-400 block mt-0.5">
                                {owner.deal?.dealType === 'ANNUAL_TOKEN' ? '0% Commission' : `${owner.deal?.commissionRate || 6}% Per Booking`}
                              </span>
                              <span className="text-[9px] text-neutral-500">
                                {owner.deal?.dealType === 'ANNUAL_TOKEN' ? 'Zero deduction' : 'Escrow deduction'}
                              </span>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                              <span className="text-[9px] uppercase font-bold text-neutral-500 block">AGREEMENT REFERENCE</span>
                              <span className="text-xs font-black text-white block mt-0.5 truncate font-mono">
                                {owner.deal?.agreementReference || 'Not Executed Yet'}
                              </span>
                              <span className="text-[9px] text-neutral-500 truncate block">
                                Signatory: {owner.deal?.signatureName || `${owner.firstName} ${owner.lastName || ''}`}
                              </span>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                              <span className="text-[9px] uppercase font-bold text-neutral-500 block">AGREEMENT VALIDITY</span>
                              <span className="text-xs font-black text-white block mt-0.5">
                                {owner.deal?.validUntil 
                                  ? new Date(owner.deal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : '365 Days upon signing'}
                              </span>
                              <span className="text-[9px] text-neutral-500">
                                {owner.deal?.status === 'ACTIVE' ? 'Active & Enforced' : 'Pending Activation'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Properties Listed by Owner */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
                            PROPERTIES LISTED BY {owner.firstName.toUpperCase()} ({ownerProps.length})
                          </span>

                          {ownerProps.length === 0 ? (
                            <div className="bg-black/40 border border-neutral-800/80 rounded-2xl p-6 text-center text-neutral-500 text-xs">
                              No properties listed by this owner yet.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {ownerProps.map(prop => {
                                const rooms = prop.rooms || [];
                                const minPrice = rooms.length > 0 
                                  ? Math.min(...rooms.map(r => r.basePrice || 99999)) 
                                  : prop.startingRent || null;

                                return (
                                  <div 
                                    key={prop._id}
                                    className="bg-black/60 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center text-neutral-500 font-black text-xs text-center shrink-0">
                                        {prop.images?.[0] ? (
                                          <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="p-1 leading-tight">{prop.title}</span>
                                        )}
                                      </div>

                                      <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="bg-neutral-800 text-neutral-300 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                            {prop.category || 'PG'}
                                          </span>
                                          <span className="bg-red-950 text-[#E50914] text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                            {prop.tier || 'FLAGSHIP'}
                                          </span>
                                          <span className={`text-[9px] font-black px-2 py-0.2 rounded uppercase ${
                                            prop.verificationStatus === 'VERIFIED'
                                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                              : prop.verificationStatus === 'REJECTED'
                                              ? 'bg-red-950 text-red-400 border border-red-500/40'
                                              : 'bg-amber-950/80 border border-amber-500/50 text-amber-400'
                                          }`}>
                                            {prop.verificationStatus || 'PENDING'}
                                          </span>
                                        </div>

                                        <h4 className="text-sm font-black text-white">{prop.title}</h4>
                                        <p className="text-xs text-neutral-400 flex items-center gap-1">
                                          <span className="text-[#E50914]">📍</span> {prop.location?.address ? `${prop.location.address}, ` : ''}{prop.location?.city || 'Location Pending'}
                                        </p>
                                        <p className="text-xs text-neutral-300">
                                          From <strong>₹{(minPrice || 0).toLocaleString()}/mo</strong>{' '}
                                          <span className="text-neutral-500 text-[10px]">
                                            {prop.rating ? `★ ${prop.rating.toFixed(1)}` : 'New (Unrated)'}
                                          </span>
                                        </p>

                                        {/* Configured Rooms & Inventory */}
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-[11px] mt-2">
                                          <span className="text-[9px] font-black uppercase text-[#E50914] block">
                                            CONFIGURED ROOMS & INVENTORY ({rooms.length})
                                          </span>
                                          {rooms.length === 0 ? (
                                            <p className="text-neutral-500 text-[10px] mt-0.5">No room units configured yet.</p>
                                          ) : (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {rooms.map((r, i) => (
                                                <span key={i} className="bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                                  {r.roomType} • ₹{r.basePrice?.toLocaleString()} • {r.capacity} Bed (Inv: {r.availableInventory ?? r.totalInventory})
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                                      {/* Tier Selector Dropdown */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase">TIER:</span>
                                        <select
                                          value={prop.tier || 'FLAGSHIP'}
                                          onChange={e => handleUpdatePropertyTier(prop._id, e.target.value)}
                                          className="bg-neutral-900 border border-neutral-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                                        >
                                          <option value="FLAGSHIP">⭐ Flagship</option>
                                          <option value="LUXURY">💎 Luxury</option>
                                          <option value="BUDGET">🎓 Budget</option>
                                          <option value="STANDARD">🏠 Standard</option>
                                        </select>
                                      </div>

                                      <Link
                                        to={`/property/${prop._id}`}
                                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-bold uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                                      >
                                        VIEW <ExternalLink className="w-3 h-3" />
                                      </Link>

                                      {prop.verificationStatus !== 'VERIFIED' && (
                                        <button 
                                          type="button"
                                          disabled={actionLoadingId === prop._id}
                                          onClick={() => handleApproveProperty(prop._id, prop.title)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase px-3.5 py-1.5 rounded-lg shadow flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                        >
                                          <Check className="w-3 h-3 stroke-[3]" /> APPROVE
                                        </button>
                                      )}

                                      {prop.verificationStatus !== 'REJECTED' && (
                                        <button 
                                          type="button"
                                          disabled={actionLoadingId === prop._id}
                                          onClick={() => {
                                            setRejectingProperty(prop);
                                            setRejectReason('');
                                          }}
                                          className="bg-red-950/80 hover:bg-red-900 text-[#E50914] border border-[#E50914]/40 text-xs font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                        >
                                          <X className="w-3 h-3 stroke-[3]" /> REJECT
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : activeTab === 'deals' ? (

        /* -------------------------------------------------------------
           TAB 2: COMMERCIAL DEALS & AGREEMENTS OVERVIEW
        -------------------------------------------------------------- */
        <div className="space-y-6">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white italic">Commercial Deals & Agreements</h2>
              <p className="text-[10px] uppercase font-extrabold text-neutral-500 tracking-wider">
                MONETIZATION PORTFOLIO & REVENUE SHARE CONTRACTS
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input 
                type="text" 
                placeholder="Search deals by owner, reference, or plan..." 
                value={dealSearch}
                onChange={e => setDealSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-neutral-600 transition"
              />
            </div>
          </div>

          {/* Deals Table */}
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-black text-neutral-500 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-3">LANDLORD / OWNER</th>
                  <th className="py-3 px-3">KYC STATUS</th>
                  <th className="py-3 px-3">COMMERCIAL PLAN</th>
                  <th className="py-3 px-3">RATE / FEE</th>
                  <th className="py-3 px-3">AGREEMENT REF</th>
                  <th className="py-3 px-3">VALIDITY</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {dealsOwners.map(owner => {
                  const deal = owner.deal || {};
                  return (
                    <tr key={owner._id} className="hover:bg-neutral-900/50 transition">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#E50914] text-white font-black text-xs flex items-center justify-center shrink-0">
                            {owner.firstName?.[0] || 'O'}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{owner.firstName} {owner.lastName || ''}</span>
                            <span className="text-[10px] text-neutral-500">{owner.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          owner.kycStatus === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400' :
                          owner.kycStatus === 'PENDING' ? 'bg-amber-950 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {owner.kycStatus || 'NOT_STARTED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-white block">
                          {deal.dealType === 'ANNUAL_TOKEN' ? '⚡ Annual Token' : '📈 Pay-As-You-Earn'}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {deal.dealType === 'ANNUAL_TOKEN' ? '365 Days Fixed' : 'Per Confirmed Booking'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-black text-amber-400 block">
                          {deal.dealType === 'ANNUAL_TOKEN' ? `₹${deal.annualTokenAmount || 9999}/yr` : `${deal.commissionRate || 6}%`}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {deal.dealType === 'ANNUAL_TOKEN' ? '0% Commission' : 'Per booking cut'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs text-neutral-300 block">
                          {deal.agreementReference || '—'}
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate block">
                          Signatory: {deal.signatureName || owner.firstName}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-neutral-300">
                        {deal.validUntil 
                          ? new Date(deal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          deal.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                          deal.status === 'PENDING_SELECTION' ? 'bg-blue-950 text-blue-400 border border-blue-500/40' :
                          'bg-neutral-800 text-neutral-400'
                        }`}>
                          {deal.status || (owner.kycStatus === 'VERIFIED' ? 'PENDING_SELECTION' : 'NOT_ELIGIBLE')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            type="button"
                            onClick={() => setSelectedCertificateOwner(owner)}
                            className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
                            title="View Agreement Certificate"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setAdjustingDealOwner(owner)}
                            className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            ADJUST
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* -------------------------------------------------------------
           TAB 3: PERFORMANCE & PLATFORM ANALYTICS
        -------------------------------------------------------------- */
        <div className="space-y-6">
          {/* 6 Telemetry Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">GROSS REVENUE</span>
              <span className="text-xl font-black text-emerald-400 italic mt-0.5 block">
                ₹{(overview.paidVolume || 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-neutral-500">From Paid Tokens</span>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">TOTAL BOOKINGS</span>
              <span className="text-xl font-black text-white italic mt-0.5 block">
                {overview.totalBookings || 0}
              </span>
              <span className="text-[9px] text-emerald-400">{overview.confirmedBookingsCount || 0} Confirmed</span>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-[#E50914] block tracking-wider">ACTIVE STAYS</span>
              <span className="text-xl font-black text-[#E50914] italic mt-0.5 block">
                {overview.activeCheckedIn || 0}
              </span>
              <span className="text-[9px] text-neutral-500">Checked-In Tenants</span>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">LANDLORDS</span>
              <span className="text-xl font-black text-white italic mt-0.5 block">
                {totalRegisteredOwners}
              </span>
              <span className="text-[9px] text-neutral-500">{liveVerifiedProperties} Verified PGs</span>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">KYC BACKLOG</span>
              <span className="text-xl font-black text-amber-400 italic mt-0.5 block">
                {pendingApprovalsCount}
              </span>
              <span className="text-[9px] text-neutral-500">Pending Approvals</span>
            </div>

            <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-[#E50914] block tracking-wider">SLA BREACHES</span>
              <span className="text-xl font-black text-[#E50914] italic mt-0.5 block">
                {maintenanceStats.slaBreached || 0}
              </span>
              <span className="text-[9px] text-neutral-500">{maintenanceStats.open || 0} Open Tickets</span>
            </div>
          </div>

          {/* Subtab Switcher & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setAnalyticsSubtab('sla')} 
                className={`text-xs font-black uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                  analyticsSubtab === 'sla' 
                    ? 'btn-red-glow text-white shadow' 
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>MAINTENANCE SLA BOARD ({tickets.length})</span>
              </button>

              <button 
                type="button"
                onClick={() => setAnalyticsSubtab('recent')} 
                className={`text-xs font-black uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                  analyticsSubtab === 'recent' 
                    ? 'btn-red-glow text-white shadow' 
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>RECENT BOOKINGS ({recentBookings.length})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder={analyticsSubtab === 'sla' ? 'Search ticket, issue, PG, tenant...' : 'Search bookings by tenant, PG...'} 
                value={analyticsSearch}
                onChange={e => setAnalyticsSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          {/* Analytics Subtab 1: SLA Incidents */}
          {analyticsSubtab === 'sla' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-black">
                <button 
                  type="button"
                  onClick={() => setTicketFilter('ALL')}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                    ticketFilter === 'ALL' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                  }`}
                >
                  ALL INCIDENTS ({tickets.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setTicketFilter('BREACHED')}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1 ${
                    ticketFilter === 'BREACHED' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  SLA BREACHED &gt;24H ({maintenanceStats.slaBreached || 0})
                </button>
                <button 
                  type="button"
                  onClick={() => setTicketFilter('OPEN')}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                    ticketFilter === 'OPEN' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                  }`}
                >
                  OPEN ({maintenanceStats.open || 0})
                </button>
                <button 
                  type="button"
                  onClick={() => setTicketFilter('RESOLVED')}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                    ticketFilter === 'RESOLVED' ? 'bg-[#E50914] text-white shadow' : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                  }`}
                >
                  RESOLVED ({maintenanceStats.resolved || 0})
                </button>
              </div>

              <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-black text-neutral-500 border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">TENANT</th>
                      <th className="py-2.5 px-3">PG & LANDLORD</th>
                      <th className="py-2.5 px-3">ISSUE TYPE</th>
                      <th className="py-2.5 px-3">ELAPSED & SLA</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {filteredTickets.map(inc => {
                      const hours = Math.round(calculateHours(inc.createdAt));
                      const isBreached = hours > 24 && inc.status !== 'RESOLVED';

                      return (
                        <tr key={inc._id} className="hover:bg-neutral-900/50 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#E50914] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                {inc.tenant?.firstName?.[0] || 'T'}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{inc.tenant?.firstName} {inc.tenant?.lastName || ''}</span>
                                <span className="text-[10px] text-neutral-500">{inc.tenant?.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{inc.property?.title || 'PG Stay'}</span>
                            <span className="text-[10px] text-neutral-500">
                              Landlord: {inc.property?.owner?.firstName || 'Owner'} {inc.property?.owner?.lastName || ''}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="bg-red-950/80 border border-[#E50914]/40 text-[#E50914] text-[9px] font-black uppercase px-2 py-0.5 rounded">
                              {inc.issueType || 'OTHER'}
                            </span>
                            <span className="text-xs text-neutral-300 block mt-0.5 italic truncate max-w-xs">
                              "{inc.description}"
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-neutral-300 font-bold block flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-500" /> {hours} Hours
                            </span>
                            {isBreached ? (
                              <span className="bg-red-950 text-[#E50914] text-[8px] font-black uppercase px-1.5 py-0.2 rounded block w-fit mt-0.5">
                                SLA BREACHED
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-400 font-bold">Within Target SLA</span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              inc.status === 'OPEN' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
                              inc.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-400 border border-blue-500/40' :
                              'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            }`}>
                              {inc.status}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleDirectChat(inc.tenant?._id, inc.tenant?.firstName)}
                                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
                                title="Chat with Tenant"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {inc.status !== 'RESOLVED' && (
                                <>
                                  <button 
                                    type="button"
                                    onClick={() => handleEscalateToOwner(inc._id)}
                                    className="bg-red-950/80 hover:bg-red-900 text-[#E50914] border border-[#E50914]/40 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <AlertTriangle className="w-3 h-3" /> ESCALATE
                                  </button>

                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setResolvingTicket(inc);
                                      setResolutionNote('');
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" /> RESOLVE
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Analytics Subtab 2: Recent Bookings */
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                  RECENT PLATFORM BOOKING TRANSACTIONS ({filteredBookings.length})
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-black text-neutral-500 border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">TENANT</th>
                      <th className="py-2.5 px-3">PG LISTING</th>
                      <th className="py-2.5 px-3">ROOM TYPE</th>
                      <th className="py-2.5 px-3">STAY WINDOW</th>
                      <th className="py-2.5 px-3">AMOUNT</th>
                      <th className="py-2.5 px-3">PAYMENT</th>
                      <th className="py-2.5 px-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {filteredBookings.map(b => (
                      <tr key={b._id} className="hover:bg-neutral-900/50 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#E50914] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              {b.tenant?.firstName?.[0] || 'T'}
                            </div>
                            <div>
                              <span className="font-bold text-white block">{b.tenant?.firstName} {b.tenant?.lastName || ''}</span>
                              <span className="text-[10px] text-neutral-500">{b.tenant?.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{b.property?.title || 'PG Residence'}</span>
                          <span className="text-[10px] text-neutral-500">{b.property?.location?.city || 'India'}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-white text-[11px]">{b.room?.roomType || 'CLASSIC'}</span>
                        </td>

                        <td className="py-3 px-3 text-neutral-300 text-xs">
                          {b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN') : '—'} →{' '}
                          {b.endDate ? new Date(b.endDate).toLocaleDateString('en-IN') : '—'}
                        </td>

                        <td className="py-3 px-3 font-black text-white italic">
                          ₹{(b.totalAmount || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-3">
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                            {b.paymentStatus || 'PAID'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            b.status === 'COMPLETED' ? 'bg-neutral-800 text-neutral-400' :
                            b.status === 'CHECKED_IN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                            'bg-blue-950 text-blue-400 border border-blue-500/40'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      ) : activeTab === 'admins' ? (
        /* -------------------------------------------------------------
           TAB 4: MAJOR ADMIN - STAFF & ADMIN GOVERNANCE
        -------------------------------------------------------------- */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Action Ribbon */}
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  SUPERADMIN CONSOLE
                </span>
                <span className="text-neutral-500 text-xs font-bold">• Full RBAC Governance</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-wide">
                Staff & Administrators Matrix
              </h2>
              <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                As Major Admin, you can provision new platform administrators, promote registered users, audit activity, suspend compromised accounts, or demote access back to normal users.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddAdminModalOpen(true)}
              className="btn-netflix px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Allot Administrator</span>
            </button>
          </div>

          {/* 4 Admin Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">TOTAL ADMINISTRATORS</span>
              <span className="text-2xl sm:text-3xl font-black text-white italic mt-1 block">{admins.length}</span>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">MAJOR ADMINS (SUPREME)</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 italic mt-1 block">
                {admins.filter(a => a.isSuperAdmin).length}
              </span>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">ACTIVE STAFF</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 italic mt-1 block">
                {admins.filter(a => !a.adminSuspended).length}
              </span>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
              <span className="text-[9px] uppercase font-bold text-[#E50914] block tracking-wider">SUSPENDED / CLOSED</span>
              <span className="text-2xl sm:text-3xl font-black text-[#E50914] italic mt-1 block">
                {admins.filter(a => a.adminSuspended).length}
              </span>
            </div>
          </div>

          {/* Search & Filter Ribbon */}
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                placeholder="Search administrator by name or email..."
                className="w-full bg-neutral-900 pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-neutral-500 border border-neutral-800 outline-none focus:border-[#E50914]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'ACTIVE', 'SUSPENDED', 'SUPERADMIN'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAdminStatusFilter(status)}
                  className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border transition cursor-pointer whitespace-nowrap ${
                    adminStatusFilter === status
                      ? 'bg-[#E50914] text-white border-[#E50914]'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}

              <button
                type="button"
                onClick={fetchAdmins}
                disabled={adminsLoading}
                className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                title="Refresh Admin Roster"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${adminsLoading ? 'animate-spin text-[#E50914]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Administrators Table */}
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            {adminsLoading && admins.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="animate-spin text-[#E50914]" size={32} />
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading Administrators...</p>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-sm font-black text-white">No Administrators Found</p>
                <p className="text-xs text-neutral-500">Try adjusting your search or status filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181818] border-b border-neutral-800 text-[10px] uppercase font-black tracking-wider text-neutral-400">
                    <tr>
                      <th className="py-3.5 px-4">Administrator</th>
                      <th className="py-3.5 px-4">Role & Authority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Allotted Date</th>
                      <th className="py-3.5 px-4">Provisioned By</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {filteredAdmins.map(admin => {
                      const isSelf = admin._id === user?._id;
                      const isSuper = !!admin.isSuperAdmin;
                      const isSuspended = !!admin.adminSuspended;
                      const isActionBusy = adminActionLoadingId === admin._id;

                      return (
                        <tr key={admin._id} className="hover:bg-neutral-900/50 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                                isSuper ? 'bg-amber-600 border border-amber-400/50 shadow' : 'bg-neutral-800 border border-neutral-700'
                              }`}>
                                {admin.firstName ? admin.firstName[0].toUpperCase() : 'A'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-white truncate">
                                    {admin.firstName} {admin.lastName || ''}
                                  </span>
                                  {isSelf && (
                                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-neutral-400 block truncate">{admin.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isSuper ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-sm">
                                <Award className="w-3 h-3 text-amber-400" /> MAJOR ADMIN
                              </span>
                            ) : (
                              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-black uppercase px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                <Shield className="w-3 h-3 text-blue-400" /> ADMIN
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {isSuspended ? (
                              <span className="bg-red-950/80 text-red-400 border border-red-500/40 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <ShieldOff className="w-3 h-3" /> SUSPENDED
                              </span>
                            ) : (
                              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> ACTIVE
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-neutral-300 text-xs">
                            {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-neutral-400 text-xs">
                            {admin.managedByAdmin ? (
                              <span className="font-bold text-neutral-300">
                                {admin.managedByAdmin.firstName} {admin.managedByAdmin.lastName || ''}
                              </span>
                            ) : (
                              <span className="italic text-neutral-500">Platform Seed / Root</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isSuper ? (
                              <span className="text-[10px] font-bold text-amber-400/80 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                                Protected Authority
                              </span>
                            ) : isSelf ? (
                              <span className="text-[10px] font-bold text-neutral-500 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                                Current Account
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={isActionBusy}
                                  onClick={() => handleToggleSuspendAdmin(admin)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer border ${
                                    isSuspended
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                                      : 'bg-amber-950 text-amber-300 border-amber-500/40 hover:bg-amber-900'
                                  }`}
                                  title={isSuspended ? "Reactivate administrator account" : "Temporarily close/suspend access"}
                                >
                                  {isActionBusy ? 'Updating...' : isSuspended ? 'Reactivate' : 'Suspend'}
                                </button>

                                <button
                                  type="button"
                                  disabled={isActionBusy}
                                  onClick={() => handleDemoteAdmin(admin)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-950 text-red-300 border border-red-500/40 hover:bg-red-900 transition cursor-pointer"
                                  title="Revoke Administrator privileges and demote back to normal Tenant"
                                >
                                  {isActionBusy ? '...' : 'Revoke Admin'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      {/* =============================================================
          MODAL 1: ADJUST COMMERCIAL DEAL TERMS
      ============================================================= */}
      {adjustingDealOwner && (
        <AdjustTermsModal
          owner={adjustingDealOwner}
          onClose={() => setAdjustingDealOwner(null)}
          onSuccess={() => {
            setAdjustingDealOwner(null);
            fetchData();
          }}
        />
      )}

      {/* =============================================================
          MODAL 2: OFFICIAL AGREEMENT CERTIFICATE
      ============================================================= */}
      {selectedCertificateOwner && (
        <AgreementCertificateModal
          owner={selectedCertificateOwner}
          onClose={() => setSelectedCertificateOwner(null)}
        />
      )}

      {/* =============================================================
          MODAL 3: REJECT PROPERTY MODAL
      ============================================================= */}
      {rejectingProperty && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-red-950 text-[#E50914] text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Listing Compliance Action
                </span>
                <h3 className="text-xl font-black text-white italic mt-1">Reject Property Listing</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Provide reason for rejecting "{rejectingProperty.title}".
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setRejectingProperty(null)}
                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-neutral-400 block">Preset Reasons</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Ownership deed missing or unclear",
                  "Photos do not meet platform quality standards",
                  "Property address or coordinates incorrect",
                  "Pricing inconsistency in room configurations"
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(reason)}
                    className="text-[9px] font-bold bg-neutral-900 text-neutral-300 hover:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-800 transition cursor-pointer text-left"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 block">Specific Note to Owner</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain what the landlord must update before re-submitting..."
                className="w-full bg-neutral-900 p-3 rounded-xl text-xs text-white placeholder-neutral-500 border border-neutral-800 outline-none focus:border-[#E50914] resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoadingId === rejectingProperty._id || !rejectReason.trim()}
                onClick={handleConfirmRejectProperty}
                className="flex-1 btn-netflix py-3 rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-50 transition cursor-pointer"
              >
                Confirm Rejection
              </button>
              <button
                type="button"
                onClick={() => setRejectingProperty(null)}
                className="btn-netflix-secondary px-5 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 4: RESOLVE TICKET MODAL
      ============================================================= */}
      {/* =============================================================
          MODAL 5: ALLOT / ADD ADMINISTRATOR MODAL
      ============================================================= */}
      {isAddAdminModalOpen && (
        <AddAdminModal
          onClose={() => setIsAddAdminModalOpen(false)}
          onSuccess={() => {
            setIsAddAdminModalOpen(false);
            fetchAdmins();
          }}
        />
      )}

      {resolvingTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Admin Resolution Action
                </span>
                <h3 className="text-xl font-black text-white italic mt-1">Resolve Maintenance Incident</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Confirm resolution for ticket #{resolvingTicket._id.slice(-6).toUpperCase()}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 block">Resolution Note</label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="Detail resolution steps taken or verified with landlord..."
                className="w-full bg-neutral-900 p-3 rounded-xl text-xs text-white placeholder-neutral-500 border border-neutral-800 outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoadingId === resolvingTicket._id}
                onClick={handleConfirmResolve}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Mark Resolved
              </button>
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="btn-netflix-secondary px-5 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* -----------------------------------------------------------------
   SUBCOMPONENT: ADJUST TERMS MODAL
------------------------------------------------------------------ */
const AdjustTermsModal = ({ owner, onClose, onSuccess }) => {
  const toast = useToast();
  const currentDeal = owner.deal || {};

  const [dealType, setDealType] = useState(currentDeal.dealType || 'COMMISSION_PERCENTAGE');
  const [commissionRate, setCommissionRate] = useState(currentDeal.commissionRate ?? 6);
  const [annualTokenAmount, setAnnualTokenAmount] = useState(currentDeal.annualTokenAmount ?? 9999);
  const [status, setStatus] = useState(currentDeal.status || 'ACTIVE');
  const [adminNotes, setAdminNotes] = useState(currentDeal.adminNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await API.patch(`/admin/owners/${owner._id}/deal`, {
        dealType,
        commissionRate: Number(commissionRate),
        annualTokenAmount: Number(annualTokenAmount),
        status,
        adminNotes: adminNotes.trim()
      });
      toast.success(`Commercial terms updated for ${owner.firstName}!`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update deal terms.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E50914]/20 border border-[#E50914]/30 text-[#E50914]">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic">Adjust Commercial Terms</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Landlord: {owner.firstName} {owner.lastName || ''} ({owner.email})
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
              Partnership Model
            </label>
            <select
              value={dealType}
              onChange={e => setDealType(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#E50914] cursor-pointer"
            >
              <option value="COMMISSION_PERCENTAGE">📈 Pay-As-You-Earn (Percentage Share)</option>
              <option value="ANNUAL_TOKEN">⚡ Annual Token Amount Plan (0% Commission)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
                Commission Rate (%)
              </label>
              <input 
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={commissionRate}
                onChange={e => setCommissionRate(e.target.value)}
                disabled={dealType === 'ANNUAL_TOKEN'}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#E50914] disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
                Annual Token Amount (₹)
              </label>
              <input 
                type="number"
                min="0"
                step="500"
                value={annualTokenAmount}
                onChange={e => setAnnualTokenAmount(e.target.value)}
                disabled={dealType !== 'ANNUAL_TOKEN'}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#E50914] disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
              Contract Enforced Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#E50914] cursor-pointer"
            >
              <option value="ACTIVE">ACTIVE (Enforced & Valid)</option>
              <option value="PENDING_SELECTION">PENDING_SELECTION (Owner Needs to Choose)</option>
              <option value="NOT_ELIGIBLE">NOT_ELIGIBLE (KYC Incomplete)</option>
              <option value="EXPIRED">EXPIRED (Annual Term Ended)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
              Admin Governance Note
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Internal compliance reason for adjustment..."
              className="w-full bg-neutral-900 p-3 rounded-xl text-xs text-white placeholder-neutral-500 border border-neutral-800 outline-none focus:border-[#E50914] resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-neutral-800">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-netflix py-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Terms..." : "Update Agreement"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-netflix-secondary px-5 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -----------------------------------------------------------------
   SUBCOMPONENT: AGREEMENT CERTIFICATE MODAL
------------------------------------------------------------------ */
const AgreementCertificateModal = ({ owner, onClose }) => {
  const [copied, setCopied] = useState(false);
  const deal = owner.deal || {};
  const refCode = deal.agreementReference || 'NEST-AGR-VERIFIED';

  const handleCopy = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1c1a] via-[#161616] to-[#1a1414] border border-emerald-900/50 rounded-3xl p-6 sm:p-10 max-w-2xl w-full space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Official Certificate
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    Ref: {refCode}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tight mt-0.5">
                  Commercial Partnership Certificate
                </h3>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Metrics Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block">Monetization Plan</span>
              <p className="text-sm font-black text-white mt-1">
                {deal.dealType === 'ANNUAL_TOKEN' ? '⚡ Annual Token' : '📈 Pay-As-You-Earn'}
              </p>
            </div>

            <div className="bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block">Commission Rate</span>
              <p className="text-sm font-black text-emerald-400 mt-1">
                {deal.dealType === 'ANNUAL_TOKEN' ? '0% Commission' : `${deal.commissionRate || 6}% Per Booking`}
              </p>
            </div>

            <div className="bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block">Platform Fee</span>
              <p className="text-sm font-black text-amber-400 mt-1">
                {deal.dealType === 'ANNUAL_TOKEN' ? `₹${deal.annualTokenAmount || 9999}/yr` : '₹0 Upfront'}
              </p>
            </div>

            <div className="bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800">
              <span className="text-[9px] uppercase font-bold text-neutral-400 block">Validity</span>
              <p className="text-sm font-black text-white mt-1">
                {deal.validUntil ? new Date(deal.validUntil).toLocaleDateString('en-IN') : '365 Days'}
              </p>
            </div>
          </div>

          {/* Legal Signatures */}
          <div className="bg-[#181818] p-4 rounded-2xl border border-neutral-800 space-y-2 text-xs text-neutral-400">
            <div className="flex flex-col sm:flex-row justify-between gap-1 border-b border-neutral-800/80 pb-2">
              <span><strong>Authorized Signatory:</strong> {deal.signatureName || `${owner.firstName} ${owner.lastName || ''}`}</span>
              <span><strong>Counterpart:</strong> Nestify Governance</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-1 pt-1">
              <span><strong>Executed At:</strong> {deal.agreedAt ? new Date(deal.agreedAt).toLocaleString() : 'Recent'}</span>
              <span><strong>Status:</strong> <span className="text-emerald-400 font-bold">{deal.status || 'ACTIVE'}</span></span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="btn-netflix-secondary px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Reference"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-netflix px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer shadow"
            >
              Close Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


/* -----------------------------------------------------------------
   SUBCOMPONENT: ADD / ALLOT ADMINISTRATOR MODAL
------------------------------------------------------------------ */
const AddAdminModal = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const [mode, setMode] = useState('PROMOTE'); // 'PROMOTE' | 'CREATE_NEW'
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast.error("Email address is required.");
    }
    if (mode === 'CREATE_NEW' && (!firstName.trim() || !password.trim())) {
      return toast.error("First name and password are required to create a new administrator.");
    }
    if (mode === 'CREATE_NEW' && password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    try {
      setSubmitting(true);
      const payload = mode === 'PROMOTE' 
        ? { mode: 'PROMOTE', email: email.trim().toLowerCase() }
        : { 
            mode: 'CREATE_NEW', 
            email: email.trim().toLowerCase(), 
            firstName: firstName.trim(), 
            lastName: lastName.trim(), 
            password 
          };

      const res = await API.post('/admin/manage-admins', payload);
      toast.success(res.data?.message || "Administrator allotted successfully!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to allot administrator.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Major Admin Authorization
            </span>
            <h3 className="text-xl font-black text-white italic mt-1.5">Allot Administrator Privileges</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Grant platform command & oversight authority to a trusted staff member.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setMode('PROMOTE')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'PROMOTE'
                ? 'btn-red-glow text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Promote Existing User
          </button>
          <button
            type="button"
            onClick={() => setMode('CREATE_NEW')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'CREATE_NEW'
                ? 'btn-red-glow text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create New Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'CREATE_NEW' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-400">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g., Rajesh"
                  className="w-full bg-neutral-900 p-3 rounded-xl text-xs text-white placeholder-neutral-600 border border-neutral-800 outline-none focus:border-[#E50914]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-400">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g., Kumar"
                  className="w-full bg-neutral-900 p-3 rounded-xl text-xs text-white placeholder-neutral-600 border border-neutral-800 outline-none focus:border-[#E50914]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-neutral-400">Admin Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g., admin.ops@pgfinder.com"
              className="w-full bg-neutral-900 p-3 rounded-xl text-xs text-white placeholder-neutral-600 border border-neutral-800 outline-none focus:border-[#E50914]"
            />
            {mode === 'PROMOTE' && (
              <p className="text-[10px] text-neutral-500 pt-1">
                Enter the email of an existing registered tenant or owner. Their role will be elevated to ADMIN.
              </p>
            )}
          </div>

          {mode === 'CREATE_NEW' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400">Initial Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-neutral-900 p-3 rounded-xl text-xs text-white placeholder-neutral-600 border border-neutral-800 outline-none focus:border-[#E50914]"
              />
            </div>
          )}

          <div className="bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              New administrators will receive access to verify listings, mediate tenant disputes, and handle KYC reviews. They cannot alter or close your Major Admin privileges.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-netflix py-3 rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-50 transition cursor-pointer shadow flex items-center justify-center gap-2"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Allotting Access...' : mode === 'PROMOTE' ? 'Promote to Admin' : 'Create Administrator'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-netflix-secondary px-5 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
