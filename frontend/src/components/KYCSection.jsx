import { useState } from 'react';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, FileText, Clock, XCircle } from 'lucide-react';
import API from '../../api/client';

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
    formData.append('document', file); // Your backend should handle this via Multer/Cloudinary

    try {
      const { data } = await API.post('/users/submit-kyc', formData);
      alert("Documents uploaded for review.");
      if (onUpdate) onUpdate(data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusUI = () => {
    switch (user.kycStatus) {
      case 'VERIFIED':
        return {
          icon: <CheckCircle2 className="text-green-500" size={40} />,
          bg: 'bg-green-50',
          text: 'Verification Complete',
          desc: 'Your identity has been verified by the Matrix. You have full access.'
        };
      case 'PENDING':
        return {
          icon: <Clock className="text-blue-500" size={40} />,
          bg: 'bg-blue-50',
          text: 'Under Review',
          desc: 'Our admins are checking your documents. Expect a result in 24 hours.'
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="text-red-500" size={40} />,
          bg: 'bg-red-50',
          text: 'Verification Failed',
          desc: user.kycRejectionReason || 'Documents were unclear. Please re-upload.'
        };
      default:
        return null;
    }
  };

  const statusUI = getStatusUI();

  return (
    <section className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-black italic tracking-tighter">Trust & Identity.</h3>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">KYC Compliance</p>
        </div>
        <ShieldCheck size={32} className={user.kycStatus === 'VERIFIED' ? 'text-primary' : 'text-gray-200'} />
      </div>

      {statusUI ? (
        <div className={`${statusUI.bg} p-8 rounded-[2.5rem] flex items-center gap-6 animate-in fade-in zoom-in duration-500`}>
          {statusUI.icon}
          <div>
            <h4 className="font-black text-gray-900">{statusUI.text}</h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">{statusUI.desc}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Select ID Type</label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold text-sm"
              >
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>
            
            <div className="relative group">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Document Image</label>
              <div className="mt-2 flex items-center justify-center w-full h-[56px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-primary transition-all">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-primary">
                  <Upload size={16} />
                  <span className="text-xs font-black uppercase">{file ? file.name.substring(0, 15) + '...' : 'Choose File'}</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black hover:bg-primary transition shadow-xl disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Submit Identity Proof'}
          </button>
        </form>
      )}

      {user.role === 'OWNER' && user.kycStatus === 'VERIFIED' && (
        <div className="mt-8 pt-8 border-t border-gray-100">
           <div className="flex items-center gap-2 text-primary mb-4">
             <Building size={16}/>
             <span className="text-[10px] font-black uppercase tracking-widest">Property Ownership Proofs</span>
           </div>
           <p className="text-xs text-gray-400 font-medium mb-4">You can upload property-specific documents during the "Add Property" flow for admin verification.</p>
        </div>
      )}
    </section>
  );
};

export default KYCSection;