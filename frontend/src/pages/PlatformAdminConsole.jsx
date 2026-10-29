import { ShieldAlert, Landmark, Building, Gavel, Trash2, CheckCircle } from 'lucide-react';

const PlatformAdminConsole = () => {
  const [globalDisputes, setGlobalDisputes] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-12">
      {/* 1. SYSTEM HEALTH HEADER */}
      <div className="bg-gray-900 p-12 rounded-[4rem] text-white flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter">Supreme Console.</h1>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.3em] mt-2">Platform Governance & Global Disputes</p>
        </div>
        <div className="flex gap-10">
          <div className="text-center">
             <p className="text-3xl font-black">₹12.8L</p>
             <p className="text-[10px] text-gray-500 font-black">PLATFORM COMMISSION</p>
          </div>
          <div className="text-center">
             <p className="text-3xl font-black text-orange-500">24</p>
             <p className="text-[10px] text-gray-500 font-black">PENDING DISPUTES</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-12">
        {/* 󾠯 DISPUTE QUEUE (ESCALATED TO YOU) */}
        <section className="space-y-6">
          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Gavel className="text-primary"/> Escalated Cases
          </h3>
          <div className="space-y-4">
            {globalDisputes.map(dispute => (
              <div key={dispute._id} className="bg-white p-8 rounded-[3rem] border-2 border-orange-100 shadow-xl shadow-orange-50/50">
                <div className="flex justify-between mb-4">
                   <span className="bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Severity: High</span>
                   <p className="text-gray-400 font-black text-xs">ID: {dispute.ticketId}</p>
                </div>
                <h4 className="text-xl font-black text-gray-900">Refund Denied: {dispute.property.title}</h4>
                <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">{dispute.description}</p>
                
                <div className="mt-8 flex gap-3">
                  <button className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-sm hover:shadow-lg transition">FORCE REFUND</button>
                  <button className="flex-1 border-2 border-gray-100 py-4 rounded-2xl font-black text-sm text-gray-400 hover:bg-gray-50 transition">REJECT CASE</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 󾠰 COMPANY VERIFICATION QUEUE */}
        <section className="space-y-6">
          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Building className="text-primary"/> Verify New Partners
          </h3>
          <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-gray-50 space-y-6">
             <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Needs Approval</p>
             <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black">R</div>
                  <div>
                    <h5 className="font-black text-gray-900">Royal Hotel Series</h5>
                    <p className="text-[10px] font-bold text-gray-400 italic">Admin: Rajesh Singh</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition"><CheckCircle size={20}/></button>
                   <button className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 size={20}/></button>
                </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlatformAdminConsole;