import { useState, useEffect } from 'react';
import API from '../api/client';
import { 
  CheckCircle2, XCircle, FileText, Loader2, ShieldCheck, 
  User, Building, MapPin, ExternalLink, X, Eye, AlertCircle 
} from 'lucide-react';

const AdminKYC = () => {
  const [view, setView] = useState('users'); // Switch between 'users' and 'properties'
  const [userQueue, setUserQueue] = useState([]);
  const [propQueue, setPropQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null); // Modal state for detailed review

  const fetchData = async () => {
    setLoading(true);
    try {
      // 󾠮 Concurrent fetching for both queues
      const [uRes, pRes] = await Promise.all([
        API.get('/users/admin/kyc-queue'),
        API.get('/properties/admin/pending')
      ]);
      
      setUserQueue(uRes.data.data || []);
      setPropQueue(pRes.data.data || []);
    } catch (err) {
      console.error("Matrix Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (type, id, status, reason = "") => {
    try {
      // 󾠯 Dynamic endpoint selection
      const endpoint = type === 'user' 
        ? `/users/admin/verify/${id}` 
        : `/properties/admin/verify/${id}`;

      await API.put(endpoint, { status, reason });
      
      alert(`Action recorded: ${status}`);
      setSelectedReview(null);
      fetchData(); // Refresh both counts and lists
    } catch (err) {
      alert("Matrix Action Failed. Check your connection.");
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary mb-4" size={48}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Syncing with Matrix...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* HEADER & VIEW TOGGLE */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h1 className="text-6xl font-black italic tracking-tighter">The Matrix.</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Compliance & Platform Integrity</p>
        </div>
        
        <div className="flex bg-white p-2 rounded-[2rem] shadow-2xl shadow-blue-100/50 border border-gray-100">
          <button 
            onClick={() => setView('users')} 
            className={`px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase transition-all flex items-center gap-2 ${view === 'users' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <User size={14}/> Users ({userQueue.length})
          </button>
          <button 
            onClick={() => setView('properties')} 
            className={`px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase transition-all flex items-center gap-2 ${view === 'properties' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Building size={14}/> Properties ({propQueue.length})
          </button>
        </div>
      </div>

      {/* VIEW: USERS */}
      {view === 'users' ? (
        <div className="bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Identity Details</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">Doc Type</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-gray-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {userQueue.map(u => (
                <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-8">
                    <p className="font-black text-gray-900 text-lg">{u.firstName} {u.lastName}</p>
                    <p className="text-xs font-medium text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-10 py-8">
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-wider border border-blue-100">
                      {u.kycDocuments?.[0]?.docType || 'GOVT_ID'}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button 
                      onClick={() => setSelectedReview({ type: 'user', data: u })}
                      className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-primary hover:shadow-lg transition-all"
                    >
                      Review Identity
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {userQueue.length === 0 && (
            <div className="py-24 text-center">
              <ShieldCheck size={48} className="mx-auto text-gray-100 mb-4" />
              <p className="font-black text-gray-200 italic uppercase text-xl">User Queue is Clear.</p>
            </div>
          )}
        </div>
      ) : (
        /* VIEW: PROPERTIES */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {propQueue.map(prop => (
            <div key={prop._id} className="bg-white p-10 rounded-[4rem] shadow-2xl border border-gray-100 flex flex-col gap-8 group">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-3xl font-black italic tracking-tighter text-gray-900">{prop.title}</h4>
                  <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin size={12}/> {prop.location?.city || 'Address Pending'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Listed By</p>
                  <p className="text-sm font-bold text-gray-900">{prop.owner?.firstName} {prop.owner?.lastName}</p>
                </div>
              </div>

              {/* 󾠰 LEGAL DOCUMENT PREVIEW */}
              <div className="aspect-video bg-gray-50 rounded-[3rem] overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-primary/30 transition-colors relative">
                 {prop.legalDocuments?.[0]?.fileUrl ? (
                   <>
                    <img src={prop.legalDocuments[0].fileUrl} className="w-full h-full object-contain p-6" alt="Legal Proof" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                        <button 
                          onClick={() => window.open(prop.legalDocuments[0].fileUrl, '_blank')} 
                          className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-2xl"
                        >
                          <ExternalLink size={16} /> Open Document
                        </button>
                    </div>
                   </>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <AlertCircle size={32} className="mb-2" />
                      <p className="font-black text-[10px] uppercase">No Document Found</p>
                   </div>
                 )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleAction('property', prop._id, 'VERIFIED')}
                  className="flex-1 bg-green-500 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase shadow-xl shadow-green-100 hover:bg-green-600 transition-all"
                >
                  Approve PG
                </button>
                <button 
                  onClick={() => {
                    const r = prompt("Enter Rejection Reason (sent to owner):");
                    if(r) handleAction('property', prop._id, 'REJECTED', r);
                  }}
                  className="px-8 bg-red-50 text-red-500 rounded-[2rem] font-black text-[10px] uppercase hover:bg-red-100 transition-all"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {propQueue.length === 0 && (
            <div className="col-span-2 py-32 bg-white rounded-[4rem] border-2 border-dashed border-gray-100 text-center">
              <Building size={48} className="mx-auto text-gray-100 mb-4" />
              <p className="font-black text-gray-200 italic uppercase text-xl">Property Queue is Clear.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL FOR USER IDENTITY REVIEW */}
      {selectedReview && selectedReview.type === 'user' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
          <div className="bg-white max-w-5xl w-full rounded-[4rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in duration-300">
             {/* LEFT: IMAGE VIEW */}
             <div className="md:w-3/5 bg-gray-100 flex items-center justify-center p-12 border-r border-gray-100">
                <img 
                  src={selectedReview.data.kycDocuments?.[0]?.fileUrl} 
                  className="max-h-[600px] rounded-3xl shadow-2xl border-8 border-white object-contain" 
                  alt="Govt ID Proof"
                />
             </div>
             
             {/* RIGHT: ACTIONS */}
             <div className="md:w-2/5 p-16 space-y-10 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                   <div>
                    <h3 className="text-4xl font-black italic tracking-tighter text-gray-900 leading-none">
                      {selectedReview.data.firstName}'s Identity
                    </h3>
                    <p className="text-primary font-black uppercase text-[10px] tracking-[0.3em] mt-4">
                      {selectedReview.data.kycDocuments?.[0]?.docType || 'ID'} VERIFICATION
                    </p>
                   </div>
                   <button 
                    onClick={() => setSelectedReview(null)} 
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                   >
                    <X size={24}/>
                   </button>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => handleAction('user', selectedReview.data._id, 'VERIFIED')} 
                    className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase flex items-center justify-center gap-3 hover:bg-primary hover:shadow-2xl transition-all"
                  >
                    <CheckCircle2 size={20}/> Confirm & Verify
                  </button>
                  <button 
                    onClick={() => {
                      const r = prompt("Reason for rejection:");
                      if(r) handleAction('user', selectedReview.data._id, 'REJECTED', r);
                    }} 
                    className="w-full bg-red-50 text-red-500 py-6 rounded-[2rem] font-black text-sm uppercase hover:bg-red-100 transition-all"
                  >
                    Mark as Invalid
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 font-bold text-center italic">
                  Approving this will instantly unlock full platform features for this user.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYC;