import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { ShieldCheck, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const KYCVerification = () => {
  const { user, setUser } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [docType, setDocType] = useState('AADHAAR');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(user?.kycStatus || 'NOT_STARTED');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

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
      alert("KYC documents submitted successfully! Our admins will review your submission.");
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 pb-20 px-4">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-50 text-primary rounded-2xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Identity Verification</h1>
            <p className="text-sm text-gray-500">Secure your account and gain community trust.</p>
          </div>
        </div>

        {status === 'VERIFIED' ? (
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 size={60} className="mx-auto text-secondary" />
            <h2 className="text-xl font-bold text-gray-900">You are Verified!</h2>
            <p className="text-gray-500 max-w-sm mx-auto">Your identity has been confirmed. You now have full access to all enterprise features.</p>
          </div>
        ) : status === 'PENDING' ? (
          <div className="text-center py-10 space-y-4">
            <Loader2 size={60} className="mx-auto text-primary animate-spin" />
            <h2 className="text-xl font-bold text-gray-900">Verification in Progress</h2>
            <p className="text-gray-500">Our admins are reviewing your documents. This usually takes 24-48 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-bold text-gray-700 mb-2 block">Document Type</span>
                <select 
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold text-gray-700 block">Upload Document Image</span>
              <label className="relative border-2 border-dashed border-gray-200 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50/30 transition group overflow-hidden">
                {preview ? (
                  <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20" alt="Preview" />
                ) : null}
                <div className="relative z-10 flex flex-col items-center">
                  <Upload className="text-gray-400 group-hover:text-primary mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-500 group-hover:text-primary">Click to upload or drag & drop</p>
                  <p className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 border border-blue-100">
              <AlertCircle className="text-primary shrink-0" size={20} />
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                Your data is encrypted and used only for verification purposes. As a B.Tech CS candidate, we ensure your information is handled with Enterprise-grade security protocols.
              </p>
            </div>

            <button
              disabled={loading || !file}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
              Submit for Verification
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default KYCVerification;