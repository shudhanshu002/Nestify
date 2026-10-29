const ResubmitDocsModal = ({ property, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResubmit = async () => {
    if (!file) return alert("Select a new document.");
    setLoading(true);
    
    const formData = new FormData();
    formData.append('legalDocument', file);

    try {
      await API.put(`/properties/${property._id}/resubmit`, formData);
      alert("Successfully resubmitted. Status is now PENDING.");
      onSuccess();
      onClose();
    } catch (err) { alert("Resubmission failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
      <div className="bg-white max-w-lg w-full rounded-[3.5rem] p-10 space-y-8 shadow-2xl">
        <div className="flex justify-between items-start">
          <h3 className="text-3xl font-black italic">Fix Listing.</h3>
          <button onClick={onClose}><X size={24}/></button>
        </div>
        
        <p className="text-gray-400 font-bold text-sm">Upload a clear photo of your Property Deed or Tax Receipt to fix the rejection.</p>
        
        <div className="border-4 border-dashed border-blue-50 bg-blue-50/30 p-10 rounded-[2.5rem] text-center relative cursor-pointer">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
          <FileText size={32} className="mx-auto text-blue-300 mb-2" />
          <p className="text-xs font-black uppercase text-gray-500">{file ? file.name : "Select New File"}</p>
        </div>

        <button 
          disabled={loading}
          onClick={handleResubmit}
          className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black shadow-xl"
        >
          {loading ? "Uploading to Matrix..." : "Send to Admin"}
        </button>
      </div>
    </div>
  );
};

export default ResubmitDocsModal;