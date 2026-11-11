import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { 
  User, Mail, ShieldCheck, Heart, Settings, Loader2, 
  Check, AlertCircle, Clock, 
  ArrowRight, Building2, Shield, Calendar, RefreshCw,
  Smartphone, UserCheck, PhoneCall, GraduationCap, FileText
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import OwnerOnboardingModal from '../components/modals/OwnerOnboardingModal';
import OwnerVerificationWarningModal from '../components/modals/OwnerVerificationWarningModal';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const Profile = () => {
  const { user, loading, setUser, switchRole } = useContext(AuthContext);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleNotice, setRoleNotice] = useState('');
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const handleRoleSwitch = async () => {
    if (switchingRole || !user || user.role === 'ADMIN') return;
    setSwitchingRole(true);
    setRoleNotice('');
    try {
      if (user.role === 'OWNER') {
        const res = await switchRole('TENANT');
        if (res.success) {
          setRoleNotice('Persona switched to Resident / Tenant!');
          setTimeout(() => setRoleNotice(''), 4000);
          navigate('/');
        }
        return;
      }

      // Verification Warning: User must be verified before switching to Owner
      const isUserVerified = !!(
        user?.isEmailVerified && 
        (user?.isPhoneVerified || (user?.phone && user.phone.length >= 10)) && 
        (user?.kycStatus === 'VERIFIED' || user?.kycStatus === 'PENDING' || (user?.kycDocuments && user?.kycDocuments.length > 0))
      );

      if (!isUserVerified) {
        setShowWarningModal(true);
        return;
      }

      const isOwnerOnboarded = user.isOwnerOnboarded || (user.ownerDetails?.legalAgreementAccepted && user.ownerDetails?.panNumber);
      if (!isOwnerOnboarded) {
        setShowOwnerModal(true);
        return;
      }
      const nextRole = 'OWNER';
      const res = await switchRole(nextRole);
      if (res.success) {
        setRoleNotice(`Persona switched to ${nextRole === 'OWNER' ? 'Landlord / PG Owner' : 'Resident / Tenant'}!`);
        setTimeout(() => setRoleNotice(''), 4000);
        navigate('/owner/dashboard');
      } else {
        alert(res.error || "Failed to switch role.");
      }
    } finally {
      setSwitchingRole(false);
    }
  };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Set initial tab from URL if present (e.g., /profile?tab=wishlist or /profile?tab=kyc)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details'); 
  const [wishlistItems, setWishlistItems] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // KYC & 5-Pillar Verification Summary
  const [verificationSummary, setVerificationSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const fetchVerificationSummary = async () => {
      if (activeTab !== 'kyc' || !user) return;
      setSummaryLoading(true);
      try {
        const { data } = await API.get('/users/verification-status');
        if (data?.success && data?.data) {
          setVerificationSummary(data.data);
        }
      } catch (err) {
        console.error("Verification Summary Error:", err);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchVerificationSummary();
  }, [activeTab, user]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (activeTab !== 'wishlist' || !user || user.role === 'OWNER') return;
      setDataLoading(true);
      try {
        const { data } = await API.get('/users/wishlist');
        setWishlistItems(Array.isArray(data) ? data : []); 
      } catch (err) {
        console.error("Wishlist Error:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchWishlist();
  }, [activeTab, user]);

  
  const getInitials = () => {
    if (!user) return 'SS';
    const first = user.firstName ? user.firstName[0].toUpperCase() : '';
    const last = user.lastName ? user.lastName[0].toUpperCase() : '';
    return `${first}${last}` || 'SS';
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d]">
      <Loader2 className="animate-spin text-[#E50914]" size={40} />
    </div>
  );

  if (!user) return (
    <div className="max-w-md mx-auto my-20 p-8 bg-[#141414] border border-neutral-800 rounded-3xl text-center space-y-4 shadow-2xl">
      <p className="text-lg font-black text-white">Please log in to view your profile</p>
      <Link to="/login" className="btn-red-glow inline-block px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow">
        Sign In
      </Link>
    </div>
  );

  return (
    <div className="pt-2 px-2 sm:px-4 md:px-8 max-w-5xl mx-auto space-y-6 text-white pb-20">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: Avatar & Quick Protocol */}
        <aside className="md:col-span-4 bg-[#141414] border border-neutral-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
          <div className="relative w-24 h-24 mx-auto">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile Avatar"
                className="w-full h-full rounded-2xl object-cover border-2 border-[#E50914]/40 shadow-lg"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-[#E50914] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {getInitials()}
              </div>
            )}
            
            {user.kycStatus === 'VERIFIED' ? (
              <div 
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#141414] text-black flex items-center justify-center shadow"
                title="Verified Identity"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            ) : (
              <div 
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-[#141414] text-black flex items-center justify-center shadow"
                title="Verification Pending"
              >
                <Clock className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-black text-white italic tracking-wide">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
              <span className="bg-red-950/80 border border-[#E50914]/50 text-[#E50914] text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]"></span> {user.role} ACCOUNT
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                user.kycStatus === 'VERIFIED'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-400'
              }`}>
                {user.kycStatus || 'NOT VERIFIED'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-2 truncate">{user.email}</p>

            {user.role !== 'ADMIN' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRoleSwitch}
                  disabled={switchingRole}
                  className="w-full text-[11px] font-bold py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white flex items-center justify-between transition cursor-pointer group shadow"
                  title={user.role === 'OWNER' ? "Switch to Resident Persona to browse and book stays" : "Switch to Landlord Persona to list properties and manage rooms"}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className={`w-3.5 h-3.5 text-[#E50914] ${switchingRole ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                    <span>{switchingRole ? 'Switching...' : user.role === 'OWNER' ? 'Switch to Resident' : 'Switch to Landlord'}</span>
                  </div>
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    {user.role === 'OWNER' ? 'Tenant' : 'Owner'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 text-left">
            <button 
              onClick={() => setActiveTab('details')}
              className={`w-full text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer font-extrabold ${
                activeTab === 'details' 
                  ? 'btn-red-glow text-white shadow' 
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <User className="w-4 h-4" /> PROFILE DETAILS
            </button>
            <button 
              onClick={() => setActiveTab('kyc')}
              className={`w-full text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer font-extrabold ${
                activeTab === 'kyc' 
                  ? 'btn-red-glow text-white shadow' 
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> IDENTITY VERIFICATION
            </button>
            {user.role === 'TENANT' && (
              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`w-full text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer font-extrabold ${
                  activeTab === 'wishlist' 
                    ? 'btn-red-glow text-white shadow' 
                    : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                <Heart className="w-4 h-4" /> SAVED STAYS
              </button>
            )}
          </div>

          <div className="bg-black/50 border border-neutral-800/80 rounded-2xl p-4 text-left flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#E50914] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Direct Landlord Protocol</h4>
              <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">
                Your credentials and tenancy contracts are protected by 256-bit encryption.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="md:col-span-8 space-y-6">
          {/* Dual Persona Protocol Banner */}
          {user.role !== 'ADMIN' && (
            <div className="bg-gradient-to-r from-neutral-900 via-[#181818] to-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-150">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                  user.role === 'OWNER' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30'
                }`}>
                  {user.role === 'OWNER' ? <Building2 size={24} /> : <User size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                      DUAL-PERSONA ENABLED
                    </span>
                    <span className={`text-[10px] font-black uppercase ${user.role === 'OWNER' ? 'text-amber-400' : 'text-[#E50914]'}`}>
                      {user.role === 'OWNER' ? '• Currently Landlord Console' : '• Currently Resident Mode'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white italic mt-1">
                    {user.role === 'OWNER' ? 'Landlord / Property Owner Persona' : 'Resident / Tenant Persona'}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    {user.role === 'OWNER' 
                      ? 'You can list PGs, manage room inventory, and sign commercial deals. Switch anytime to Resident to browse and book personal stays.' 
                      : 'You can explore verified PGs, reserve rooms, and manage personal stays. Switch anytime to Landlord to list your own buildings.'}
                  </p>
                  {roleNotice && (
                    <p className="text-xs font-bold text-emerald-400 mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" /> {roleNotice}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRoleSwitch}
                disabled={switchingRole}
                className="btn-red-glow text-white text-xs font-black uppercase px-5 py-3 rounded-xl shadow cursor-pointer whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-2 transition"
              >
                <RefreshCw size={14} className={switchingRole ? 'animate-spin' : ''} />
                <span>{switchingRole ? 'Switching...' : user.role === 'OWNER' ? 'Switch to Resident' : 'Switch to Landlord'}</span>
              </button>
            </div>
          )}
          
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#E50914] tracking-widest block">RESIDENT PROFILE</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-wide mt-0.5">Account Information</h1>
                  <p className="text-xs text-neutral-400 mt-1">Manage your credentials, trust status, and coliving preferences.</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">FIRST NAME</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#E50914]" />
                    <span className="font-bold">{user.firstName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">LAST NAME</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#E50914]" />
                    <span className="font-bold">{user.lastName}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">EMAIL ADDRESS</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <span className="bg-emerald-950/80 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">ACTIVE</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">IDENTITY & TRUST STATUS</label>
                  <div className={`rounded-xl px-3.5 py-3 text-xs font-bold flex items-center justify-between border ${
                    user.kycStatus === 'VERIFIED'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{user.kycStatus || 'NOT VERIFIED'}</span>
                    </div>
                    {user.kycStatus !== 'VERIFIED' && (
                      <button 
                        onClick={() => setActiveTab('kyc')} 
                        className="text-[10px] uppercase font-black underline hover:text-white cursor-pointer"
                      >
                        Verify Now
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">ACCOUNT ROLE</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#E50914]" />
                      <span className="font-bold">{user.role}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500">Standard Access</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">MEMBER SINCE</label>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-3 text-xs text-white flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Mar 2026'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner at Bottom of Profile: Active Residency */}
              <div className="bg-black/50 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                <div>
                  <h4 className="text-sm font-bold text-white">Active Residency & Rent Extensions</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    View current stay agreements, download tax invoices, or extend your move-out date.
                  </p>
                </div>
                <Link 
                  to="/my-bookings" 
                  className="btn-red-glow text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow flex-shrink-0"
                >
                  MY BOOKINGS <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          )}

          {/* TAB 2: KYC & IDENTITY VERIFICATION */}
          {activeTab === 'kyc' && (
            <div className="bg-[#141414] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#E50914] tracking-widest block">TRUST & COMPLIANCE</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-wide mt-0.5">
                    Identity Verification Center
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                    Nestify uses real-time 5-pillar verification (WhatsApp OTP, Government ID, Liveness Selfie, Emergency Contact, and Academic/Work Credential) for instant fraud prevention.
                  </p>
                </div>
                {verificationSummary?.trustScore !== undefined && (
                  <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-2xl flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-tight">Trust Score</span>
                      <span className="text-sm font-black text-white">{verificationSummary.trustScore}% Verified</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Banner */}
              <div className={`p-4 sm:p-5 rounded-2xl flex items-start gap-4 border ${
                (user.kycStatus === 'VERIFIED' || verificationSummary?.mandatoryPassed) ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' :
                user.kycStatus === 'PENDING' ? 'bg-amber-950/30 border-amber-500/40 text-amber-400' :
                user.kycStatus === 'REJECTED' ? 'bg-rose-950/30 border-rose-500/40 text-rose-400' :
                'bg-neutral-900 border-neutral-800 text-neutral-300'
              }`}>
                {(user.kycStatus === 'VERIFIED' || verificationSummary?.mandatoryPassed) ? (
                  <Check className="w-6 h-6 stroke-[3] shrink-0 mt-0.5 text-emerald-400" />
                ) : user.kycStatus === 'PENDING' ? (
                  <Clock className="w-6 h-6 shrink-0 mt-0.5 text-amber-400 animate-spin" />
                ) : (
                  <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-amber-400" />
                )}
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wide">
                    {(user.kycStatus === 'VERIFIED' || verificationSummary?.mandatoryPassed)
                      ? 'IDENTITY VERIFIED ✅'
                      : user.kycStatus === 'PENDING'
                      ? 'AUDIT IN PROGRESS ⏳'
                      : user.kycStatus === 'REJECTED'
                      ? 'VERIFICATION REJECTED ❌'
                      : 'VERIFICATION IN PROGRESS'}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {(user.kycStatus === 'VERIFIED' || verificationSummary?.mandatoryPassed)
                      ? 'Your profile is authenticated with full Move-in Escrow Protection and verified lease privileges.'
                      : user.kycStatus === 'PENDING'
                      ? 'Your verification documents are being processed. Verification completes instantly in the Verification Hub.'
                      : user.kycStatus === 'REJECTED'
                      ? (user.kycRejectionReason || 'Previous verification was declined. Please verify via the 5-Pillar Verification Hub.')
                      : 'Complete your instant mobile and identity verification to unlock one-click bookings and zero-brokerage guarantees.'}
                  </p>
                </div>
              </div>

              {/* 5-Pillar Verification Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                    5-PILLAR VERIFICATION STATUS
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">Real-time instant checks</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pillar 1: Phone */}
                  <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-300">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">WhatsApp / Mobile OTP</h5>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {verificationSummary?.phone?.phone || (user.phone ? user.phone.slice(-10) : 'Mobile verification')}
                        </p>
                      </div>
                    </div>
                    {(verificationSummary?.phone?.isVerified || user.isPhoneVerified) ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Pillar 2: Govt ID */}
                  <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-300">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">Government ID / Aadhaar</h5>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {verificationSummary?.identity?.maskedId || user.identityVerification?.maskedId || 'Aadhaar QR / Govt ID'}
                        </p>
                      </div>
                    </div>
                    {(verificationSummary?.identity?.status === 'VERIFIED' || user.kycStatus === 'VERIFIED') ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Pillar 3: Live Selfie */}
                  <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-300">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">Live Facial Liveness</h5>
                        <p className="text-[11px] text-neutral-400 truncate">Anti-spoofing camera check</p>
                      </div>
                    </div>
                    {(verificationSummary?.selfie?.isVerified || user.selfieVerification?.isVerified) ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                        Optional
                      </span>
                    )}
                  </div>

                  {/* Pillar 4: Emergency Contact */}
                  <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-300">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">Emergency Contact</h5>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {user.profile?.emergencyContact?.name 
                            ? `${user.profile.emergencyContact.name} (${user.profile.emergencyContact.relation || 'Contact'})` 
                            : 'Family / Guardian contact'}
                        </p>
                      </div>
                    </div>
                    {(verificationSummary?.emergencyContact?.isVerified || user.profile?.emergencyContact?.isVerified) ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                        Optional
                      </span>
                    )}
                  </div>

                  {/* Pillar 5: Student/Work */}
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-300">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">Student / Professional Badge</h5>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {user.studentOrWorkVerification?.organizationName || 'College ID card or corporate work email'}
                        </p>
                      </div>
                    </div>
                    {verificationSummary?.studentOrWork?.status === 'VERIFIED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                        Optional Badge
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Hub CTA */}
              <div className="bg-gradient-to-r from-red-950/30 via-neutral-900 to-neutral-900 border border-red-500/30 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-red-500 tracking-wider block">
                    INSTANT 5-PILLAR VERIFICATION
                  </span>
                  <h4 className="text-sm font-black text-white mt-0.5">Manage Your Identity in the Verification Hub</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    No waiting 24 hours for manual document audits. Verify your phone, Aadhaar QR, and selfie in real time.
                  </p>
                </div>
                <Link
                  to="/verify-identity"
                  className="btn-red-glow text-white font-extrabold text-xs uppercase px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shrink-0"
                >
                  OPEN VERIFICATION HUB <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Uploaded Documents if any exist */}
              {(user.kycDocuments || []).length > 0 && (
                <div className="pt-4 border-t border-neutral-800 space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
                    ATTACHED CREDENTIALS
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {user.kycDocuments.map((doc, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-neutral-800 h-24 bg-neutral-900 group">
                        <img src={doc.fileUrl} className="w-full h-full object-cover" alt="ID Document" />
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition p-2 text-center">
                          <FileText className="w-5 h-5 text-[#E50914] mb-1" />
                          <span className="text-[9px] font-bold text-white uppercase">{doc.docType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#E50914] tracking-wider block">SAVED STAYS</span>
                  <h2 className="text-xl font-black text-white italic">Your Wishlist</h2>
                </div>
                <span className="bg-red-950/80 border border-[#E50914]/40 text-[#E50914] text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-current" /> {wishlistItems.length} Stays Saved
                </span>
              </div>

              {dataLoading ? (
                <div className="py-20 text-center bg-[#141414] rounded-2xl border border-neutral-800">
                  <Loader2 className="animate-spin text-[#E50914] mx-auto" size={36}/>
                  <p className="text-xs text-neutral-400 mt-2 font-bold">Loading your saved stays...</p>
                </div>
              ) : wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {wishlistItems.map(item => (
                    <PropertyCard 
                      key={item._id} 
                      property={item.property} 
                      onWishlistToggle={(propId) => {
                        setWishlistItems(prev => 
                          prev.filter(w => (w.property?._id || w.property).toString() !== propId.toString())
                        );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#141414] rounded-3xl border border-neutral-800 space-y-4 px-6 shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914] flex items-center justify-center mx-auto">
                    <Heart size={26} />
                  </div>
                  <h4 className="text-base font-black text-white italic">Your wishlist is empty</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto font-medium leading-relaxed">
                    Explore top audited rooms, student housing, and luxury coliving suites across India and save your favorites.
                  </p>
                  <Link 
                    to="/search" 
                    className="btn-red-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow"
                  >
                    Browse Stays <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}

        </main>

        {/* Verification Warning Modal before Landlord Switch */}
        <OwnerVerificationWarningModal
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          onProceedToOnboarding={() => setShowOwnerModal(true)}
          user={user}
        />

        {/* Landlord Onboarding & Verification Modal */}
        <OwnerOnboardingModal 
          isOpen={showOwnerModal}
          onClose={() => setShowOwnerModal(false)}
          user={user}
          switchRole={switchRole}
          onSuccess={() => {
            setRoleNotice('Landlord verification complete! Welcome to your Owner Portal.');
            setTimeout(() => setRoleNotice(''), 4000);
            navigate('/owner/dashboard');
          }}
        />
      </div>
    </div>
  );
};

export default Profile;
