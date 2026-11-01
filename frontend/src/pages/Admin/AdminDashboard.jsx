import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/client';
import { useChat } from '../../context/ChatContext';
import { 
  BarChart3, ShieldAlert, Users, Building, AlertCircle, CheckCircle2, 
  Clock, ArrowLeft, RefreshCw, Search, ExternalLink, MessageSquare, 
  Send, AlertTriangle, Check, X, ShieldCheck, DollarSign, Bed, Calendar
} from 'lucide-react';

const AdminDashboard = () => {
  const { setSelectedChat, setIsChatOpen } = useChat();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'bookings'
  const [ticketFilter, setTicketFilter] = useState('ALL'); // 'ALL', 'BREACHED', 'OPEN', 'IN_PROGRESS', 'RESOLVED'
  const [search, setSearch] = useState('');
  
  // Action states
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await API.get('/admin/dashboard');
      } catch (e1) {
        res = await API.get('/admin/analytics');
      }
      setAnalytics(res.data?.data || null);
    } catch (err) {
      console.error("Failed to load platform analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const calculateHours = (dateStr) => {
    if (!dateStr) return 0;
    return Math.abs(new Date() - new Date(dateStr)) / 36e5;
  };

  // 1. Escalate Ticket to Owner
  const handleEscalateToOwner = async (ticketId) => {
    try {
      setActionLoadingId(ticketId);
      const res = await API.post(`/admin/tickets/${ticketId}/escalate`, {
        note: "Admin notice: Maintenance ticket has breached standard 24h SLA. Urgent landlord resolution required."
      });
      setFeedbackMsg(res.data?.message || "Escalation notice dispatched to landlord.");
      setTimeout(() => setFeedbackMsg(''), 4500);
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to escalate ticket.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Resolve Ticket
  const handleConfirmResolve = async () => {
    if (!resolvingTicket) return;
    try {
      setActionLoadingId(resolvingTicket._id);
      await API.patch(`/maintenance/${resolvingTicket._id}/respond`, {
        status: 'RESOLVED',
        resolutionNote: resolutionNote.trim() || 'Issue marked as resolved by Administrator.'
      });
      setFeedbackMsg("Ticket marked as RESOLVED and tenant notified.");
      setTimeout(() => setFeedbackMsg(''), 4500);
      setResolvingTicket(null);
      setResolutionNote('');
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resolve ticket.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Direct Message Tenant or Landlord
  const handleDirectChat = async (userId) => {
    if (!userId) return;
    try {
      const { data } = await API.post('/chat/access', { receiverId: userId });
      if (data.data) {
        setSelectedChat(data.data);
      }
      setIsChatOpen(true);
    } catch (err) {
      alert("Could not start conversation with this user.");
    }
  };

  const overview = analytics?.overview || {};
  const maintenanceStats = overview.maintenance || {};
  const tickets = analytics?.maintenanceTickets || [];
  const recentBookings = analytics?.recentBookings || [];

  // Filtered maintenance tickets
  const filteredTickets = tickets.filter(ticket => {
    const hours = calculateHours(ticket.createdAt);
    const isBreached = hours > 24 && ticket.status !== 'RESOLVED';

    // Status / SLA Filter
    if (ticketFilter === 'BREACHED' && !isBreached) return false;
    if (ticketFilter === 'OPEN' && ticket.status !== 'OPEN') return false;
    if (ticketFilter === 'IN_PROGRESS' && ticket.status !== 'IN_PROGRESS') return false;
    if (ticketFilter === 'RESOLVED' && ticket.status !== 'RESOLVED') return false;

    // Search Filter
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const tenantName = `${ticket.tenant?.firstName || ''} ${ticket.tenant?.lastName || ''}`.toLowerCase();
    const ownerName = `${ticket.property?.owner?.firstName || ''} ${ticket.property?.owner?.lastName || ''}`.toLowerCase();
    const propTitle = (ticket.property?.title || '').toLowerCase();
    const issue = (ticket.issueType || '').toLowerCase();
    const desc = (ticket.description || '').toLowerCase();
    return tenantName.includes(q) || ownerName.includes(q) || propTitle.includes(q) || issue.includes(q) || desc.includes(q);
  });

  // Filtered recent bookings
  const filteredBookings = recentBookings.filter(b => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const tenantName = `${b.tenant?.firstName || ''} ${b.tenant?.lastName || ''}`.toLowerCase();
    const propTitle = (b.property?.title || '').toLowerCase();
    const status = (b.status || '').toLowerCase();
    return tenantName.includes(q) || propTitle.includes(q) || status.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-white space-y-8">
      
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#262626] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white transition"
            >
              <ArrowLeft size={14} /> Admin Home
            </Link>
            <span className="text-gray-600">•</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <BarChart3 size={12} /> Platform Telemetry & Performance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white">
            Performance & Platform Analytics
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm font-medium mt-1">
            System throughput, gross booking volume, landlord SLA compliance, and operational incident metrics.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="btn-netflix-secondary px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer active:scale-95"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
          Sync Telemetry
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 2. PLATFORM PERFORMANCE METRICS ROW (Concise & Aesthetic) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Gross Volume */}
        <div className="bg-[#181818] p-4 rounded-xl border border-[#2a2a2a] shadow-sm">
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Gross Revenue</span>
          <p className="text-xl sm:text-2xl font-black italic text-emerald-400 mt-0.5">
            ₹{(overview.paidVolume || 0).toLocaleString()}
          </p>
          <span className="text-[9px] text-gray-500 font-bold block mt-1">From Paid Tokens</span>
        </div>

        {/* Total Bookings */}
        <div className="bg-[#181818] p-4 rounded-xl border border-[#2a2a2a] shadow-sm">
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Total Bookings</span>
          <p className="text-xl sm:text-2xl font-black italic text-white mt-0.5">
            {overview.totalBookings || 0}
          </p>
          <span className="text-[9px] text-emerald-400 font-bold block mt-1">
            {overview.confirmedBookingsCount || 0} Confirmed
          </span>
        </div>

        {/* Active Residents */}
        <div className="bg-[#181818] p-4 rounded-xl border border-[#2a2a2a] shadow-sm">
          <span className="text-[9px] font-black uppercase text-primary tracking-wider block">Active Stays</span>
          <p className="text-xl sm:text-2xl font-black italic text-primary mt-0.5">
            {overview.activeCheckedIn || 0}
          </p>
          <span className="text-[9px] text-gray-500 font-bold block mt-1">Checked-In Tenants</span>
        </div>

        {/* Registered Landlords */}
        <div className="bg-[#181818] p-4 rounded-xl border border-[#2a2a2a] shadow-sm">
          <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Landlords</span>
          <p className="text-xl sm:text-2xl font-black italic text-white mt-0.5">
            {overview.totalOwners || 0}
          </p>
          <span className="text-[9px] text-gray-500 font-bold block mt-1">
            {overview.verifiedProperties || 0} Verified PGs
          </span>
        </div>

        {/* Verification Backlog */}
        <Link 
          to="/admin/verify-users" 
          className="bg-[#181818] p-4 rounded-xl border border-[#2a2a2a] shadow-sm hover:border-amber-500/50 transition group cursor-pointer block"
        >
          <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider block flex items-center justify-between">
            KYC Backlog <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition" />
          </span>
          <p className="text-xl sm:text-2xl font-black italic text-amber-400 mt-0.5">
            {(overview.pendingKYC || 0) + (overview.pendingProperties || 0)}
          </p>
          <span className="text-[9px] text-gray-500 font-bold block mt-1">Pending Approvals</span>
        </Link>

        {/* Maintenance SLA Breaches */}
        <div className="bg-[#181818] p-4 rounded-xl border border-[#2a2a2a] shadow-sm">
          <span className="text-[9px] font-black uppercase text-red-400 tracking-wider block">SLA Breaches</span>
          <p className="text-xl sm:text-2xl font-black italic text-red-400 mt-0.5">
            {maintenanceStats.slaBreached || 0}
          </p>
          <span className="text-[9px] text-gray-500 font-bold block mt-1">
            {maintenanceStats.open || 0} Open Tickets
          </span>
        </div>
      </div>

      {/* 3. SECTION TABS & SEARCH BAR */}
      <div className="bg-[#181818] p-4 sm:p-5 rounded-2xl border border-[#2a2a2a] shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* TABS */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => { setActiveTab('tickets'); setSearch(''); }} 
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tickets' 
                ? 'btn-netflix shadow-md text-white' 
                : 'bg-[#202020] text-gray-300 border border-[#303030] hover:text-white hover:bg-[#282828]'
            }`}
          >
            <AlertCircle size={14}/> Maintenance SLA Board ({tickets.length})
          </button>
          <button 
            onClick={() => { setActiveTab('bookings'); setSearch(''); }} 
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bookings' 
                ? 'btn-netflix shadow-md text-white' 
                : 'bg-[#202020] text-gray-300 border border-[#303030] hover:text-white hover:bg-[#282828]'
            }`}
          >
            <Calendar size={14}/> Recent Bookings ({recentBookings.length})
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder={activeTab === 'tickets' ? "Search ticket, issue, PG, tenant..." : "Search bookings by tenant, PG..."} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#202020] rounded-xl font-medium text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-primary border border-[#303030] transition"
          />
        </div>
      </div>

      {/* 4. ACTIVE TAB CONTENT */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="animate-spin text-primary" size={40} />
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Loading Operational Telemetry...</p>
        </div>
      ) : activeTab === 'tickets' ? (
        
        /* MAINTENANCE INCIDENTS BOARD */
        <div className="space-y-4">
          
          {/* TICKET SUB-FILTER PILLS */}
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { id: 'ALL', label: `All Incidents (${tickets.length})` },
              { id: 'BREACHED', label: `⚠️ SLA Breached >24h (${maintenanceStats.slaBreached || 0})` },
              { id: 'OPEN', label: `Open (${maintenanceStats.open || 0})` },
              { id: 'IN_PROGRESS', label: `In Progress (${maintenanceStats.inProgress || 0})` },
              { id: 'RESOLVED', label: `Resolved (${maintenanceStats.resolved || 0})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTicketFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  ticketFilter === f.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-[#202020] text-gray-400 border border-[#2e2e2e] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredTickets.length > 0 ? (
            <div className="bg-[#181818] rounded-2xl border border-[#2a2a2a] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#202020] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Tenant</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">PG & Landlord</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Issue Type</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Elapsed & SLA</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {filteredTickets.map(ticket => {
                      const hours = calculateHours(ticket.createdAt);
                      const isBreached = hours > 24 && ticket.status !== 'RESOLVED';
                      const owner = ticket.property?.owner;

                      return (
                        <tr 
                          key={ticket._id} 
                          className={`hover:bg-[#202020]/60 transition-colors ${
                            isBreached ? 'bg-red-950/20' : ''
                          }`}
                        >
                          {/* TENANT INFO */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={ticket.tenant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.tenant?.firstName || 'Tenant')}&background=E50914&color=fff`} 
                                alt="Tenant"
                                className="w-8 h-8 rounded-lg object-cover border border-[#333]" 
                              />
                              <div>
                                <p className="font-black text-white text-xs">{ticket.tenant?.firstName} {ticket.tenant?.lastName}</p>
                                <p className="text-[10px] text-gray-400">{ticket.tenant?.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* PG & OWNER */}
                          <td className="px-5 py-4">
                            <p className="font-bold text-white text-xs truncate max-w-[180px]">
                              {ticket.property?.title || 'Unknown PG'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Landlord: {owner?.firstName ? `${owner.firstName} ${owner.lastName || ''}` : 'Unassigned'}
                            </p>
                          </td>

                          {/* ISSUE & DESCRIPTION */}
                          <td className="px-5 py-4">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#242424] text-primary border border-primary/30">
                              {ticket.issueType}
                            </span>
                            <p className="text-xs text-gray-300 truncate max-w-[220px] mt-1 font-medium" title={ticket.description}>
                              {ticket.description}
                            </p>
                          </td>

                          {/* TIME ELAPSED & SLA */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs font-black">
                              <Clock size={12} className={isBreached ? 'text-red-400 animate-pulse' : 'text-gray-400'} />
                              <span className={isBreached ? 'text-red-400 font-black' : 'text-gray-300'}>
                                {Math.floor(hours)} Hours
                              </span>
                            </div>
                            {isBreached ? (
                              <span className="inline-block text-[9px] font-black uppercase text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded mt-0.5">
                                SLA Breached
                              </span>
                            ) : ticket.status === 'RESOLVED' ? (
                              <span className="inline-block text-[9px] font-bold text-emerald-400">Resolved</span>
                            ) : (
                              <span className="inline-block text-[9px] font-bold text-gray-400">Within 24h SLA</span>
                            )}
                          </td>

                          {/* STATUS BADGE */}
                          <td className="px-5 py-4">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              ticket.status === 'RESOLVED' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' :
                              ticket.status === 'IN_PROGRESS' ? 'bg-blue-950/60 text-blue-400 border-blue-800/40' :
                              'bg-amber-950/60 text-amber-400 border-amber-800/40'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct Chat with Landlord */}
                              {owner?._id && (
                                <button
                                  onClick={() => handleDirectChat(owner._id)}
                                  className="p-1.5 bg-[#252525] hover:bg-primary text-gray-300 hover:text-white rounded-lg transition cursor-pointer"
                                  title={`Message Landlord ${owner.firstName}`}
                                >
                                  <MessageSquare size={13} />
                                </button>
                              )}

                              {/* Escalate button if SLA is breached and open */}
                              {ticket.status !== 'RESOLVED' && (
                                <button 
                                  disabled={actionLoadingId === ticket._id}
                                  onClick={() => handleEscalateToOwner(ticket._id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
                                    isBreached 
                                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95' 
                                      : 'bg-[#252525] text-gray-300 hover:text-white hover:bg-[#303030]'
                                  }`}
                                  title="Send formal escalation notice to Landlord"
                                >
                                  <AlertTriangle size={11} /> Escalate
                                </button>
                              )}

                              {/* Resolve button */}
                              {ticket.status !== 'RESOLVED' && (
                                <button 
                                  onClick={() => {
                                    setResolvingTicket(ticket);
                                    setResolutionNote('');
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                                >
                                  <Check size={11} /> Resolve
                                </button>
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
            <div className="py-20 text-center bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
              <CheckCircle2 size={44} className="mx-auto text-emerald-500 mb-3" />
              <h3 className="text-xl font-black text-white tracking-tight">No Matching Incidents</h3>
              <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest max-w-md mx-auto">
                No maintenance tickets match the selected filter or search keyword.
              </p>
            </div>
          )}
        </div>
      ) : (

        /* RECENT PLATFORM BOOKINGS STREAM */
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
            Recent Platform Booking Transactions ({filteredBookings.length})
          </p>

          {filteredBookings.length > 0 ? (
            <div className="bg-[#181818] rounded-2xl border border-[#2a2a2a] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#202020] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Tenant</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">PG Listing</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Room Type</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Stay Window</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Amount</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Payment</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {filteredBookings.map(b => (
                      <tr key={b._id} className="hover:bg-[#202020]/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={b.tenant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.tenant?.firstName || 'User')}&background=E50914&color=fff`} 
                              alt="Tenant"
                              className="w-8 h-8 rounded-lg object-cover border border-[#333]" 
                            />
                            <div>
                              <p className="font-black text-white text-xs">{b.tenant?.firstName} {b.tenant?.lastName}</p>
                              <p className="text-[10px] text-gray-400">{b.tenant?.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-white text-xs truncate max-w-[200px]">
                            {b.property?.title || 'Unknown PG'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {b.property?.location?.city || 'City'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-[10px] font-bold text-gray-200">
                            {b.room?.roomType || 'Standard Room'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-gray-300">
                          {new Date(b.checkInDate).toLocaleDateString()} &rarr; {new Date(b.checkOutDate).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono font-black text-white text-sm">
                            ₹{(b.totalAmount || 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            b.paymentStatus === 'PAID' 
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          }`}>
                            {b.paymentStatus || 'UNPAID'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' :
                            b.status === 'COMPLETED' ? 'bg-blue-950/60 text-blue-400 border-blue-800/40' :
                            b.status === 'CANCELLED' ? 'bg-red-950/60 text-red-400 border-red-800/40' :
                            'bg-[#242424] text-gray-400'
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
          ) : (
            <div className="py-20 text-center bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
              <Calendar size={44} className="mx-auto text-gray-500 mb-3" />
              <h3 className="text-xl font-black text-white tracking-tight">No Bookings Recorded Yet</h3>
              <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest max-w-md mx-auto">
                As tenants confirm bookings, transactions will populate this stream in real-time.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL: RESOLVE TICKET */}
      {resolvingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#181818] max-w-md w-full rounded-2xl border border-[#2e2e2e] shadow-2xl p-6 text-white space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Admin Resolution
                </span>
                <h3 className="text-lg font-black text-white tracking-tight mt-1.5">
                  Resolve Incident #{resolvingTicket._id.toString().slice(-6).toUpperCase()}
                </h3>
              </div>
              <button 
                onClick={() => setResolvingTicket(null)} 
                className="p-1.5 bg-[#252525] rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={16}/>
              </button>
            </div>

            <div className="bg-[#202020] p-3 rounded-xl border border-[#2e2e2e] text-xs space-y-1">
              <p className="text-gray-400"><strong>PG:</strong> {resolvingTicket.property?.title}</p>
              <p className="text-gray-400"><strong>Tenant:</strong> {resolvingTicket.tenant?.firstName} {resolvingTicket.tenant?.lastName}</p>
              <p className="text-gray-400"><strong>Issue:</strong> {resolvingTicket.issueType} - {resolvingTicket.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Resolution Note (Sent to Tenant):
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Explain how the issue was fixed or addressed..."
                className="w-full bg-[#202020] p-3 rounded-xl text-xs text-white placeholder-gray-500 border border-[#333] outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#262626]">
              <button
                disabled={actionLoadingId === resolvingTicket._id}
                onClick={handleConfirmResolve}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 disabled:opacity-50 transition"
              >
                <Check size={14} /> Confirm Resolution
              </button>
              <button
                onClick={() => setResolvingTicket(null)}
                className="px-4 bg-[#252525] text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase cursor-pointer"
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

export default AdminDashboard;
