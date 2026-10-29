import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { Printer, Download, ShieldCheck, FileText, ArrowLeft, Loader2 } from 'lucide-react';

const AgreementDetail = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const { data } = await API.get(`/bookings/${bookingId}/agreement`);
        setAgreement(data.data);
      } catch (err) {
        console.error("Agreement not found");
      } finally {
        setLoading(false);
      }
    };
    fetchAgreement();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!agreement) return <div className="text-center py-20">Agreement not found or still being generated.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <div className="flex justify-between items-center mb-8 no-print">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary transition">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
            <Printer size={16} /> Print PDF
          </button>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      <div ref={printRef} className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 text-gray-800 leading-relaxed printable-area">
        {/* Document Header */}
        <div className="text-center border-b-2 border-gray-900 pb-8 mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Residential Rental Agreement</h1>
          <p className="text-sm font-bold text-gray-500">Document ID: {agreement._id.toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">The Landlord (Owner)</h3>
            <p className="font-bold text-lg">{agreement.owner?.firstName} {agreement.owner?.lastName}</p>
            <p className="text-sm text-gray-600">{agreement.owner?.email}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">The Tenant</h3>
            <p className="font-bold text-lg">{agreement.tenant?.firstName} {agreement.tenant?.lastName}</p>
            <p className="text-sm text-gray-600">{agreement.tenant?.email}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm">
          <section>
            <h4 className="font-black text-gray-900 mb-2">1. PROPERTY DESCRIPTION</h4>
            <p>This agreement pertains to the property located at: <span className="font-bold">{agreement.property?.location?.address}, {agreement.property?.location?.city}</span>. Room Type: <span className="font-bold">{agreement.room?.roomType}</span>.</p>
          </section>

          <section>
            <h4 className="font-black text-gray-900 mb-2">2. RENT & DEPOSIT</h4>
            <p>The monthly rent is fixed at <span className="font-bold">₹{agreement.totalPrice}</span>. The tenant has paid a security deposit of <span className="font-bold">₹{agreement.totalPrice * 2}</span> which is refundable upon successful inspection at the end of the term.</p>
          </section>

          <section>
            <h4 className="font-black text-gray-900 mb-2">3. TERMS & CONDITIONS</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>The agreement is valid for a period of 11 months from the date of booking.</li>
              <li>Monthly rent must be paid by the 5th of every month.</li>
              <li>A notice period of 30 days is required before vacating.</li>
              <li>Subletting the premises is strictly prohibited.</li>
            </ul>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-dashed border-gray-200 grid grid-cols-2 gap-20">
          <div className="text-center">
            <div className="h-16 flex items-center justify-center italic text-gray-400 border-b border-gray-100 mb-2">
              <ShieldCheck size={32} className="opacity-20" /> Digitally Signed
            </div>
            <p className="text-[10px] font-bold uppercase text-gray-400">Landlord Signature</p>
          </div>
          <div className="text-center">
            <div className="h-16 flex items-center justify-center italic text-gray-400 border-b border-gray-100 mb-2">
               <ShieldCheck size={32} className="opacity-20" /> Digitally Signed
            </div>
            <p className="text-[10px] font-bold uppercase text-gray-400">Tenant Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementDetail;