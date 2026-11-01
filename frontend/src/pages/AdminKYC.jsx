import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/client';
import { 
  CheckCircle2, XCircle, FileText, Loader2, ShieldCheck, 
  User, Building, MapPin, ExternalLink, X, Eye, AlertCircle,
  Search, ArrowLeft, Check, Sparkles, Filter, RefreshCw
} from 'lucide-react';

const AdminKYC = () => {
  const [view, setView] = useState('users'); // 'users' or 'properties'
  const [userQueue, setUserQueue] = useState([]);
  const [propQueue, setPropQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState(null); // Modal state
  const [actionInProgress, setActionInProgress] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        API.get('/users/admin/kyc-queue'),
        API.get('/properties/admin/pending')
      ]);
      setUserQueue(uRes.data.data || []);
      setPropQueue(pRes.data.data || []);
    } catch (err) {
      console.error("KYC Queue Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (type, id, status, reason = "") => {
    try {
      setActionInProgress(true);
      const endpoint = type === 'user' 
        ? `/users/admin/verify/${id}` 
        : `/properties/admin/verify/${id}`;

      await API.put(endpoint, { status, reason });
      
      setActionSuccessMsg(
        status === 'VERIFIED' 
          ? `Successfully approved ${type === 'user' ? 'user identity' : 'property listing'}!` 
          : `Item marked as rejected with reason provided.`
      );
      setTimeout(() => setActionSuccessMsg(''), 4000);

      setSelectedReview(null);
      setShowRejectInput(false);
      setRejectionReason('');
      fetchData(); // Refresh counts and queues
    } catch (err) {
      alert(err.response?.data?.message || "Action failed. Please verify network connection.");
    } finally {
      setActionInProgress(false);
    }
  };

  // Filter queues by search query
  const filteredUsers = userQueue.filter(u => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const docType = (u.kycDocuments?.[0]?.docType || '').toLowerCase();
    const role = (u.role || '').toLowerCase();
    return name.includes(q) || email.includes(q) || docType.includes(q) || role.includes(q);
  });

  const filteredProps = propQueue.filter(p => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const title = (p.title || '').toLowerCase();
    const city = (p.location?.city || '').toLowerCase();
    const address = (p.location?.address || '').toLowerCase();
    const ownerName = `${p.owner?.firstName || ''} ${p.owner?.lastName || ''}`.toLowerCase();
    return title.includes(q) || city.includes(q) || address.includes(q) || ownerName.includes(q);
  });

  const rejectionPresets = [
    "Blurry or unreadable photo / document",
    "Name on ID does not match account name",
    "Document is expired or invalid",
    "Unsupported government document type",
    "Ownership proof deed is missing or incomplete"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-white space-y-8">
      
      {/* 1. TOP HEADER & BREADCRUMB */}
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
              <ShieldCheck size={12} /> Compliance & Verification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white">
            Identity & Property Verification
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm font-medium mt-1">
            Audit government IDs, inspect ownership deeds, and approve pending platform listings.
          </p>
        </div>

        {/* REFRESH QUEUE BUTTON */}
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-netflix-secondary px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer active:scale-95"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
          Refresh Queue
        </button>
      </div>

      {/* SUCCESS TOAST MESSAGE */}
      {actionSuccessMsg && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 2. TAB CONTROLS & SEARCH BAR */}
      <div className="bg-[#181818] p-4 sm:p-5 rounded-2xl border border-[#2a2a2a] shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* VIEW PILLS */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => { setView('users'); setSearch(''); }} 
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              view === 'users' 
                ? 'btn-netflix shadow-md text-white' 
                : 'bg-[#202020] text-gray-300 border border-[#303030] hover:text-white hover:bg-[#282828]'
            }`}
          >
            <User size={14}/> User Identity ({userQueue.length})
          </button>
          <button 
            onClick={() => { setView('properties'); setSearch(''); }} 
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              view === 'properties' 
                ? 'btn-netflix shadow-md text-white' 
                : 'bg-[#202020] text-gray-300 border border-[#303030] hover:text-white hover:bg-[#282828]'
            }`}
          >
            <Building size={14}/> Property Deeds ({propQueue.length})
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder={view === 'users' ? "Search users by name, email, role..." : "Search PGs by title, city, owner..."} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#202020] rounded-xl font-medium text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-primary border border-[#303030] transition"
          />
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Loading Compliance Queue...</p>
        </div>
      ) : view === 'users' ? (
        
        /* USER KYC QUEUE */
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Pending User Identities ({filteredUsers.length})
            </p>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="bg-[#181818] rounded-2xl border border-[#2a2a2a] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#202020] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">User Account</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Role</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Document Type</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">Submitted</th>
                      <th className="px-5 py-3.5 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {filteredUsers.map(u => {
                      const doc = u.kycDocuments?.[0];
                      return (
                        <tr key={u._id} className="hover:bg-[#202020]/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.firstName + ' ' + (u.lastName || ''))}&background=E50914&color=fff`} 
                                alt={u.firstName}
                                className="w-10 h-10 rounded-xl object-cover border border-[#333]" 
                              />
                              <div>
                                <p className="font-black text-white text-sm">{u.firstName} {u.lastName}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              u.role === 'OWNER' 
                                ? 'bg-primary/20 text-primary border-primary/30' 
                                : 'bg-blue-950/60 text-blue-400 border-blue-800/40'
                            }`}>
                              {u.role || 'TENANT'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="bg-[#242424] text-gray-200 border border-[#383838] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {doc?.docType || 'GOVT_ID'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs font-medium text-gray-400">
                            {doc?.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedReview({ type: 'user', data: u });
                                  setShowRejectInput(false);
                                  setRejectionReason('');
                                }}
                                className="btn-netflix px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                              >
                                <Eye size={12}/> Inspect ID
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
            <div className="py-20 text-center bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
              <ShieldCheck size={44} className="mx-auto text-emerald-500 mb-3" />
              <h3 className="text-xl font-black text-white tracking-tight">Identity Queue is Clear</h3>
              <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest max-w-md mx-auto">
                No user KYC submissions are currently pending approval.
              </p>
            </div>
          )}
        </div>
      ) : (

        /* PROPERTY VERIFICATION QUEUE */
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Pending Property Listings ({filteredProps.length})
            </p>
          </div>

          {filteredProps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProps.map(prop => {
                const legalDoc = prop.legalDocuments?.[0];
                return (
                  <div 
                    key={prop._id} 
                    className="bg-[#181818] p-5 sm:p-6 rounded-2xl border border-[#2a2a2a] shadow-xl space-y-4 text-white hover:border-primary/40 transition"
                  >
                    {/* PROPERTY & OWNER HEADER */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-950/60 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40">
                          {prop.category || 'PG'} • Pending Review
                        </span>
                        <h4 className="text-lg font-black text-white tracking-tight mt-1.5">{prop.title}</h4>
                        <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-primary shrink-0"/> 
                          <span>{prop.location?.address ? `${prop.location.address}, ` : ''}{prop.location?.city || 'Address Pending'}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Listed By</span>
                        <p className="text-xs font-bold text-white mt-0.5">{prop.owner?.firstName} {prop.owner?.lastName}</p>
                        <p className="text-[10px] text-gray-400">{prop.owner?.email}</p>
                      </div>
                    </div>

                    {/* LEGAL DOCUMENT PREVIEW */}
                    <div className="bg-[#141414] rounded-xl overflow-hidden border border-[#2e2e2e] relative group aspect-[16/9] flex items-center justify-center">
                      {legalDoc?.fileUrl ? (
                        <>
                          <img 
                            src={legalDoc.fileUrl} 
                            className="w-full h-full object-contain p-3" 
                            alt="Legal Proof Deed" 
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                            <button 
                              onClick={() => window.open(legalDoc.fileUrl, '_blank')} 
                              className="btn-netflix px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-xl cursor-pointer"
                            >
                              <ExternalLink size={14} /> View Full Document
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500 py-10">
                          <AlertCircle size={28} className="mb-1 text-gray-400" />
                          <p className="font-black text-xs uppercase">No Deed Attached</p>
                        </div>
                      )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2.5 pt-2 border-t border-[#262626]">
                      <button 
                        disabled={actionInProgress}
                        onClick={() => handleAction('property', prop._id, 'VERIFIED')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Check size={14} /> Approve PG
                      </button>
                      <button 
                        disabled={actionInProgress}
                        onClick={() => {
                          setSelectedReview({ type: 'property', data: prop });
                          setShowRejectInput(true);
                          setRejectionReason('');
                        }}
                        className="bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
              <Building size={44} className="mx-auto text-emerald-500 mb-3" />
              <h3 className="text-xl font-black text-white tracking-tight">Property Queue is Clear</h3>
              <p className="font-bold text-gray-400 text-xs mt-1 uppercase tracking-widest max-w-md mx-auto">
                No pending property listings waiting for verification.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: DETAILED IDENTITY / DEED INSPECTION */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#181818] max-w-4xl w-full rounded-2xl border border-[#2e2e2e] shadow-2xl overflow-hidden flex flex-col md:flex-row text-white animate-in zoom-in-95 duration-200">
            
            {/* LEFT: DOCUMENT IMAGE PREVIEW */}
            <div className="md:w-3/5 bg-[#121212] flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[#262626] relative">
              {(() => {
                const docUrl = selectedReview.type === 'user' 
                  ? selectedReview.data.kycDocuments?.[0]?.fileUrl 
                  : selectedReview.data.legalDocuments?.[0]?.fileUrl;

                return docUrl ? (
                  <>
                    <img 
                      src={docUrl} 
                      className="max-h-[460px] w-full object-contain rounded-xl border border-[#333]" 
                      alt="Document Proof"
                    />
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => window.open(docUrl, '_blank')}
                        className="btn-netflix-secondary px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink size={12}/> Open Full Resolution
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-gray-500 space-y-2">
                    <AlertCircle size={36} className="mx-auto" />
                    <p className="text-xs font-black uppercase">Document File Missing</p>
                  </div>
                );
              })()}
            </div>
            
            {/* RIGHT: METADATA & ACTIONS */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2.5 py-0.5 rounded border border-primary/30">
                      {selectedReview.type === 'user' 
                        ? `${selectedReview.data.kycDocuments?.[0]?.docType || 'GOVT_ID'} Verification`
                        : `${selectedReview.data.category || 'PG'} Deed Inspection`}
                    </span>
                    <h3 className="text-xl font-black text-white tracking-tight mt-2">
                      {selectedReview.type === 'user' 
                        ? `${selectedReview.data.firstName} ${selectedReview.data.lastName}`
                        : selectedReview.data.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      {selectedReview.type === 'user' 
                        ? selectedReview.data.email
                        : `${selectedReview.data.location?.address ? selectedReview.data.location.address + ', ' : ''}${selectedReview.data.location?.city || ''}`}
                    </p>
                    {selectedReview.type === 'user' && selectedReview.data.phone && (
                      <p className="text-xs text-gray-500 font-medium">{selectedReview.data.phone}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => { setSelectedReview(null); setShowRejectInput(false); }} 
                    className="p-1.5 bg-[#252525] rounded-xl text-gray-400 hover:text-white hover:bg-primary transition cursor-pointer"
                  >
                    <X size={16}/>
                  </button>
                </div>

                <div className="bg-[#202020] p-3 rounded-xl border border-[#2e2e2e] space-y-1 text-xs">
                  {selectedReview.type === 'user' ? (
                    <>
                      <div className="flex justify-between text-gray-400 font-bold">
                        <span>Account Role:</span>
                        <span className="text-white uppercase font-black">{selectedReview.data.role}</span>
                      </div>
                      <div className="flex justify-between text-gray-400 font-bold">
                        <span>KYC Status:</span>
                        <span className="text-amber-400 font-black">{selectedReview.data.kycStatus || 'PENDING'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-gray-400 font-bold">
                        <span>Owner:</span>
                        <span className="text-white font-black">{selectedReview.data.owner?.firstName} {selectedReview.data.owner?.lastName || ''}</span>
                      </div>
                      <div className="flex justify-between text-gray-400 font-bold">
                        <span>Current Status:</span>
                        <span className="text-amber-400 font-black">{selectedReview.data.verificationStatus || 'PENDING'}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* REJECTION REASON SECTION */}
                {showRejectInput && (
                  <div className="space-y-2.5 p-3.5 bg-[#241a1a] rounded-xl border border-red-900/40 animate-in fade-in">
                    <p className="text-[10px] font-black uppercase tracking-wider text-red-400">Select or Enter Reason:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {rejectionPresets.slice(0, 3).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRejectionReason(preset)}
                          className="text-[9px] font-bold bg-[#331c1c] text-red-200 hover:bg-red-950 px-2 py-1 rounded border border-red-900/60 transition cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specific note explaining what must be re-submitted..."
                      className="w-full bg-[#1c1414] p-2.5 rounded-lg text-xs text-white placeholder-gray-500 border border-red-900/40 outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-2.5 pt-4 border-t border-[#262626]">
                {!showRejectInput ? (
                  <>
                    <button 
                      disabled={actionInProgress}
                      onClick={() => handleAction(selectedReview.type, selectedReview.data._id, 'VERIFIED')} 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 transition"
                    >
                      <CheckCircle2 size={16}/> {selectedReview.type === 'user' ? 'Confirm & Verify Identity' : 'Approve & Publish PG'}
                    </button>
                    <button 
                      disabled={actionInProgress}
                      onClick={() => setShowRejectInput(true)} 
                      className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition active:scale-95"
                    >
                      Reject Submission
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      disabled={actionInProgress || !rejectionReason.trim()}
                      onClick={() => handleAction(selectedReview.type, selectedReview.data._id, 'REJECTED', rejectionReason)} 
                      className="flex-1 btn-netflix py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      Submit Rejection
                    </button>
                    <button 
                      onClick={() => setShowRejectInput(false)} 
                      className="px-4 bg-[#252525] text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-gray-500 font-bold text-center">
                  Verification updates status across the platform immediately.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminKYC;
