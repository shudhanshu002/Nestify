import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { 
  ShieldCheck, Upload, FileText, CheckCircle2, 
  AlertCircle, Loader2, ArrowLeft, Lock, Sparkles, X, Clock, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const KYCVerification = () => {
  const { user, setUser } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [docType, setDocType] = useState('AADHAAR');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(user?.kycStatus || 'NOT_STARTED');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleClearFile = (e) => {
    e.preventDefault();
    setFile(null);
    setPreview(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a document image first.");

    setLoading(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);
    formData.append('documentType', docType);

    try {
      const { data } = await API.post('/users/kyc-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('PENDING');
      if (setUser) {
        setUser(data.data || { ...user, kycStatus: 'PENDING' });
      }
      alert("Identity document uploaded successfully! Our compliance team will review your document within 24 hours.");
    } catch (err) {
      alert(err.response?.data?.message || "Identity document submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-white space-y-6">
      
      {/* Back Button */}
      <Link 
        to="/profile" 
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition"
      >
        <ArrowLeft size={14} /> Back to Profile
      </Link>

      {/* Main Container Card (Netflix Dark Palette) */}
      <div className="bg-[#181818] rounded-3xl p-6 sm:p-10 border border-[#2a2a2a] shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Glow ambient accent */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Header Strip */}
        <div className="flex items-start gap-4 pb-6 border-b border-[#262626]">
          <div className="p-3 bg-primary/15 text-primary border border-primary/30 rounded-2xl shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/15 px-2.5 py-0.5 rounded-full border border-primary/30">
                Official Compliance
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                AES-256 Encrypted
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white">
              Identity Verification (KYC)
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Verify your official government identity to list properties, sign digital agreements, and unlock full access.
            </p>
          </div>
        </div>

        {/* 1. STATE: VERIFIED */}
        {status === 'VERIFIED' ? (
          <div className="text-center py-12 px-4 bg-[#141414] rounded-2xl border border-emerald-900/40 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black italic text-white">
                Identity Verified Successfully!
              </h2>
              <p className="text-xs text-emerald-400/90 font-medium max-w-md mx-auto mt-1">
                Your government identity has been authenticated and approved. Your account is fully compliant with zero listing or booking restrictions.
              </p>
            </div>
            <div className="pt-2">
              <Link 
                to={user?.role === 'OWNER' ? "/owner/dashboard" : "/profile"} 
                className="btn-netflix px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-red-950/40"
              >
                Go to {user?.role === 'OWNER' ? 'Owner Console' : 'Profile'}
              </Link>
            </div>
          </div>
        ) : status === 'PENDING' ? (
          /* 2. STATE: PENDING */
          <div className="text-center py-12 px-4 bg-[#141414] rounded-2xl border border-amber-900/40 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Clock size={36} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black italic text-white">
                Verification in Progress
              </h2>
              <p className="text-xs text-amber-300 font-medium max-w-md mx-auto mt-1">
                Our verification compliance team is reviewing your uploaded documents. Verification is usually completed within 12 to 24 hours.
              </p>
            </div>
            <div className="inline-block bg-[#1f1f1f] border border-[#2e2e2e] px-4 py-2 rounded-xl text-xs text-gray-300">
              Submitted Document: <span className="text-white font-mono font-bold uppercase">{docType}</span>
            </div>
          </div>
        ) : (
          /* 3. STATE: FORM SUBMISSION */
          <form onSubmit={handleUpload} className="space-y-6">
            
            {/* Show Rejection Warning if applicable */}
            {status === 'REJECTED' && (
              <div className="bg-red-950/50 border border-red-800/50 p-4 rounded-xl flex items-start gap-3 text-red-300">
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block text-red-200 uppercase tracking-wider mb-0.5">Previous Submission Rejected</span>
                  {user?.kycRejectionReason || "The document provided was unclear or expired. Please upload a clear photo or scanned copy."}
                </div>
              </div>
            )}

            {/* Document Type Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
                Select Government ID Type
              </label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-[#202020] border border-[#333333] focus:border-primary text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none transition cursor-pointer"
              >
                <option value="AADHAAR">🇮🇳 Aadhaar Card (Front & Back)</option>
                <option value="PAN">💳 PAN Card (Permanent Account Number)</option>
                <option value="PASSPORT">🌐 Passport (Information Page)</option>
              </select>
            </div>

            {/* Upload Dropzone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
                Upload Document Photo / Scan
              </label>

              {preview ? (
                /* Preview Container */
                <div className="relative rounded-2xl overflow-hidden border border-[#333333] bg-[#141414] p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={preview} 
                      alt="ID Preview" 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-[#2a2a2a]" 
                    />
                    <div>
                      <span className="text-xs font-bold text-white block truncate max-w-xs">{file?.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{(file?.size / (1024 * 1024)).toFixed(2)} MB • Ready for review</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleClearFile}
                    className="p-2 bg-[#222222] hover:bg-[#333333] text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                    title="Remove File"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                /* Empty Dropzone */
                <label className="border-2 border-dashed border-[#333333] hover:border-primary/60 bg-[#1f1f1f] hover:bg-[#242424] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition group">
                  <div className="p-3 bg-[#262626] group-hover:bg-primary/20 text-gray-400 group-hover:text-primary rounded-2xl mb-3 transition">
                    <Upload size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-200 group-hover:text-white transition">
                    Click to browse or drag & drop document
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    PNG, JPG, or PDF up to 5MB
                  </p>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept="image/*,application/pdf" 
                  />
                </label>
              )}
            </div>

            {/* Privacy & Security Guarantee Note */}
            <div className="bg-[#151515] p-4 rounded-xl border border-[#262626] flex items-start gap-3">
              <Lock size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                Your legal documents are encrypted with end-to-end security and used exclusively for identity verification and anti-fraud compliance under IT Act regulations. Your data is never sold or shared.
              </p>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full btn-netflix py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading Encrypted File...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Submit Document for Verification</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default KYCVerification;
