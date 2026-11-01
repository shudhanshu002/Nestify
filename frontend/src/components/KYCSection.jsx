import { useState } from 'react';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, FileText, Clock, XCircle, Building } from 'lucide-react';
import API from '../api/client';

const KYCSection = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState('AADHAAR');
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a document image.");

    setLoading(true);
    const formData = new FormData();
    formData.append('docType', docType);
    formData.append('document', file);

    try {
      const { data } = await API.post('/users/kyc-upload', formData);
      alert("Documents uploaded for review.");
      if (onUpdate) onUpdate(data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusUI = () => {
    switch (user?.kycStatus) {
      case 'VERIFIED':
        return {
          icon: <CheckCircle2 className="text-emerald-400" size={32} />,
          bg: 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300',
          text: 'Identity Verified & Compliant',
          desc: 'Your identity has been authenticated. You have unrestricted access to all platform features.'
        };
      case 'PENDING':
        return {
          icon: <Clock className="text-amber-400" size={32} />,
          bg: 'bg-amber-950/40 border border-amber-800/40 text-amber-300',
          text: 'Under Review',
          desc: 'Our compliance team is verifying your document. Approval typically completes within 12-24 hours.'
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="text-red-400" size={32} />,
          bg: 'bg-red-950/40 border border-red-800/40 text-red-300',
          text: 'Verification Incomplete',
          desc: user.kycRejectionReason || 'The uploaded file was unclear. Please upload a clear photo or scan.'
        };
      default:
        return null;
    }
  };

  const statusUI = getStatusUI();

  return (
    <section className="bg-[#181818] rounded-2xl p-6 sm:p-8 border border-[#2a2a2a] text-white shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Identity Compliance</span>
          <h3 className="text-xl sm:text-2xl font-black italic tracking-tight text-white">Trust & Verification</h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${user?.kycStatus === 'VERIFIED' ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-400' : 'bg-[#222222] border-[#333333] text-gray-400'}`}>
          <ShieldCheck size={24} />
        </div>
      </div>

      {statusUI ? (
        <div className={`${statusUI.bg} p-6 rounded-xl flex items-center gap-4 animate-in fade-in duration-200`}>
          {statusUI.icon}
          <div>
            <h4 className="font-bold text-sm text-white">{statusUI.text}</h4>
            <p className="text-xs text-gray-300 font-medium leading-relaxed mt-0.5">{statusUI.desc}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 block">Select ID Type</label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-[#202020] border border-[#333333] focus:border-primary text-white p-3 rounded-xl outline-none font-bold text-xs cursor-pointer"
              >
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 block">Upload Document Image</label>
              <div className="relative flex items-center justify-center w-full h-[46px] bg-[#202020] rounded-xl border border-dashed border-[#383838] hover:border-primary transition group">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-white text-xs font-bold">
                  <Upload size={14} className="text-primary" />
                  <span className="truncate max-w-[200px]">{file ? file.name : 'Choose File'}</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !file}
            className="w-full btn-netflix py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Submitting File...' : 'Submit Identity Document'}
          </button>
        </form>
      )}

      {user?.role === 'OWNER' && user?.kycStatus === 'VERIFIED' && (
        <div className="pt-4 border-t border-[#262626]">
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <Building size={14}/>
            <span className="text-[10px] font-black uppercase tracking-wider">Property Ownership Verification</span>
          </div>
          <p className="text-xs text-gray-400">
            Ownership documents (Electricity bills, registry, property tax receipts) can be submitted directly during the "List New PG" flow.
          </p>
        </div>
      )}
    </section>
  );
};

export default KYCSection;
