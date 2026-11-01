import { useEffect, useState } from 'react';
import API from '../../api/client';
import { 
  Plus, Loader2, ChevronRight, ArrowLeft, 
  CheckCircle2, Clock, AlertOctagon, UploadCloud, FileText, X, MapPin, Calendar 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('VERIFIED');
  const [selectedProp, setSelectedProp] = useState(null);

  const fetchMyProperties = async () => {
    try {
      const { data } = await API.get('/properties/my-listings'); 
      setProperties(data.data || []);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchMyProperties(); 
  }, []);

  const filteredProperties = properties.filter(p => p.verificationStatus === activeTab);

  const stats = {
    verified: properties.filter(p => p.verificationStatus === 'VERIFIED').length,
    pending: properties.filter(p => p.verificationStatus === 'PENDING').length,
    rejected: properties.filter(p => p.verificationStatus === 'REJECTED').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-white">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <Link to="/owner/dashboard" className="flex items-center gap-1.5 text-gray-400 font-bold text-xs uppercase mb-2 hover:text-white transition">
            <ArrowLeft size={14}/> Back to Occupancy
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-white italic tracking-tight">
            Inventory & Buildings
          </h1>
        </div>
        <Link 
          to="/owner/add-property" 
          className="btn-netflix px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition"
        >
          <Plus size={16} /> List New PG
        </Link>
      </div>

      {/* TAB SYSTEM: COMPACT BADGES */}
      <div className="flex bg-[#1e1e1e] p-1.5 rounded-xl border border-[#2e2e2e] mb-6 w-fit gap-1">
        <button 
          onClick={() => setActiveTab('VERIFIED')}
          className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'VERIFIED' 
              ? 'btn-netflix text-white shadow-sm' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CheckCircle2 size={13}/> Live ({stats.verified})
        </button>
        <button 
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'PENDING' 
              ? 'bg-amber-600 text-white shadow-sm' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Clock size={13}/> Pending ({stats.pending})
        </button>
        <button 
          onClick={() => setActiveTab('REJECTED')}
          className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'REJECTED' 
              ? 'bg-red-600 text-white shadow-sm' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <AlertOctagon size={13}/> Rejected ({stats.rejected})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-primary" size={36} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProperties.length > 0 ? filteredProperties.map(pg => (
            <div 
              key={pg._id} 
              className="bg-[#181818] p-5 sm:p-6 rounded-2xl border border-[#2a2a2a] shadow-xl hover:border-[#383838] transition-all group"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                
                {/* BUILDING INFO */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <img 
                      src={pg.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300'} 
                      alt={pg.title}
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md border border-[#333333] ${
                        pg.verificationStatus === 'REJECTED' ? 'grayscale opacity-60' : ''
                      }`} 
                    />
                    {pg.verificationStatus === 'VERIFIED' && (
                      <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#181818]">
                        <CheckCircle2 size={11} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-base sm:text-lg text-white leading-tight mb-1 truncate">{pg.title}</h3>
                    <p className="text-gray-400 text-xs font-medium flex items-center gap-1 mb-2">
                      <MapPin size={12} className="text-primary shrink-0"/> 
                      <span className="truncate">{pg.location?.address ? `${pg.location.address}, ` : ''}{pg.location?.city || "Location Pending"}</span>
                    </p>
                    
                    {/* SHOW REASON IF REJECTED */}
                    {pg.verificationStatus === 'REJECTED' && (
                      <div className="inline-block px-2.5 py-1 bg-red-950/40 border border-red-900/40 rounded-lg">
                        <p className="text-[10px] font-bold text-red-400">
                          Reason: <span className="text-gray-300 font-medium">"{pg.rejectionReason || "Documents unclear."}"</span>
                        </p>
                      </div>
                    )}

                    {/* SHOW PENDING NOTICE */}
                    {pg.verificationStatus === 'PENDING' && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Clock size={11}/> Currently Under Review
                      </span>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {pg.verificationStatus === 'REJECTED' ? (
                    <button 
                      onClick={() => setSelectedProp(pg)}
                      className="btn-netflix px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
                    >
                      <UploadCloud size={14} /> Resubmit
                    </button>
                  ) : (
                    <>
                      <Link 
                        to={`/owner/dashboard?tab=occupancy&propertyId=${pg._id}`} 
                        className="btn-netflix-secondary px-3.5 py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer text-gray-200 hover:text-white"
                        title="View Room & Date Schedule"
                      >
                        <Calendar size={13} /> Room Schedule
                      </Link>
                      <Link 
                        to={`/owner/add-room/${pg._id}`} 
                        className="btn-netflix-secondary px-3.5 py-2 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} /> Inventory
                      </Link>
                      {pg.verificationStatus === 'VERIFIED' && (
                        <Link 
                          to={`/property/${pg._id}`} 
                          className="px-3.5 py-2 rounded-xl bg-[#222222] hover:bg-[#282828] border border-[#333333] text-gray-200 hover:text-white font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          Preview <ChevronRight size={13} />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-[#181818] rounded-2xl border border-[#2a2a2a] p-8">
               <p className="font-bold text-gray-400 text-xs uppercase tracking-wider">
                 No {activeTab.toLowerCase()} listings in your inventory.
               </p>
            </div>
          )}
        </div>
      )}

      {/* RESUBMIT MODAL */}
      {selectedProp && (
        <ResubmitModal 
          property={selectedProp} 
          onClose={() => setSelectedProp(null)} 
          onSuccess={() => { 
            fetchMyProperties(); 
            setActiveTab('PENDING');
            setSelectedProp(null); 
          }}
        />
      )}
    </div>
  );
};

// --- MODAL COMPONENT (DARK THEME) ---
const ResubmitModal = ({ property, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [upLoading, setUpLoading] = useState(false);

  const handleAction = async () => {
    if(!file) return alert("Please select a valid document first.");
    setUpLoading(true);
    
    const formData = new FormData();
    formData.append('legalDocument', file);

    try {
      await API.put(`/properties/${property._id}/resubmit`, formData);
      alert("Documents Re-submitted! Your building is back in the queue.");
      onSuccess();
    } catch (err) { 
      alert(err.response?.data?.message || "Resubmission failed."); 
    } finally { 
      setUpLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[600] flex items-center justify-center p-4 animate-in fade-in duration-200 text-white">
      <div className="bg-[#181818] border border-[#2e2e2e] max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 relative shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black italic text-white">Fix Listing Proof</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{property.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252525] rounded-xl transition cursor-pointer">
            <X size={18}/>
          </button>
        </div>
        
        <div className="border-2 border-dashed border-[#383838] hover:border-primary/50 bg-[#202020] p-8 rounded-2xl text-center relative cursor-pointer group transition">
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={(e) => setFile(e.target.files[0])} 
          />
          <FileText size={32} className="mx-auto text-primary mb-2 transition-transform group-hover:scale-105" />
          <p className="text-xs font-bold text-gray-300">
            {file ? file.name : "Select Ownership Proof (Registry / Tax Receipt)"}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">PDF or image files</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleAction} 
            disabled={upLoading}
            className="btn-netflix px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-md shadow-red-950/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {upLoading ? <Loader2 className="animate-spin" size={14} /> : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProperties;
