import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/client';
import { FileText, MessageSquare, AlertTriangle, CheckCircle, Clock, ExternalLink, Receipt } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ReceiptModal from '../components/modals/ReceiptModal';

const TenantDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState(null);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const { data } = await API.get('/bookings/my-bookings');
        setBookings(data.data || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchMyData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4">
      {/* Header with KYC Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Welcome, {user?.firstName}</h1>
          <p className="text-gray-500 text-sm">Manage your stays and legal documents</p>
        </div>
        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-bold text-sm ${
          user?.kycStatus === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
        }`}>
          {user?.kycStatus === 'VERIFIED' ? <CheckCircle size={18} /> : <Clock size={18} />}
          Identity: {user?.kycStatus || 'PENDING'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Bookings List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 px-2">Your Active Stays</h2>

          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div key={booking._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <img src={booking.property?.images?.[0]?.url || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-xl object-cover" alt="" />
                    <div>
                      <h4 className="font-bold text-gray-900">{booking.property?.title}</h4>
                      <p className="text-xs text-gray-500">{booking.room?.roomType} • ₹{booking.totalAmount?.toLocaleString() || booking.totalPrice}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                    booking.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-6">
                  <button 
                    onClick={() => setSelectedReceiptBooking(booking)}
                    className="flex items-center justify-center gap-1.5 p-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-primary transition shadow-sm"
                  >
                    <Receipt size={14} /> Receipt
                  </button>
                  <Link to={`/agreement/${booking._id}`} className="flex items-center justify-center gap-1.5 p-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 hover:bg-primary hover:text-white transition">
                    <FileText size={14} /> Agreement
                  </Link>
                  <Link to="/my-bookings" className="flex items-center justify-center gap-1.5 p-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 hover:bg-primary hover:text-white transition">
                    <Clock size={14} /> My Stay
                  </Link>
                  <button className="flex items-center justify-center gap-1.5 p-2.5 bg-red-50 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition">
                    <AlertTriangle size={14} /> Dispute
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white py-20 text-center rounded-3xl border border-dashed border-gray-300">
              <p className="text-gray-400">No active bookings found. Ready to move in?</p>
              <Link to="/" className="text-primary font-bold mt-2 block hover:underline">Explore Properties</Link>
            </div>
          )}
        </div>

        {/* Right Sidebar: Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-4">
              <li 
                onClick={() => {
                  if (bookings.length > 0) {
                    setSelectedReceiptBooking(bookings[0]);
                  } else {
                    navigate('/my-bookings');
                  }
                }}
                className="flex items-center justify-between text-sm opacity-80 hover:opacity-100 cursor-pointer hover:text-primary transition"
              >
                <span className="flex items-center gap-2"><Receipt size={16}/> Payment Receipts</span>
                <ExternalLink size={14} />
              </li>
              <li 
                onClick={() => navigate('/my-bookings')}
                className="flex items-center justify-between text-sm opacity-80 hover:opacity-100 cursor-pointer hover:text-primary transition"
              >
                <span>My Bookings & Stays</span>
                <ExternalLink size={14} />
              </li>
              <li className="flex items-center justify-between text-sm opacity-80 hover:opacity-100 cursor-pointer">
                <span>House Rules PDF</span>
                <ExternalLink size={14} />
              </li>
              <li className="flex items-center justify-between text-sm opacity-80 hover:opacity-100 cursor-pointer">
                <span>Refer a Friend</span>
                <span className="bg-primary text-[8px] px-2 py-0.5 rounded-full font-black">EARN ₹500</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* OFFICIAL INDUSTRY-GRADE TAX INVOICE & RECEIPT */}
      {selectedReceiptBooking && (
        <ReceiptModal 
          booking={selectedReceiptBooking} 
          onClose={() => setSelectedReceiptBooking(null)} 
        />
      )}
    </div>
  );
};

export default TenantDashboard;
