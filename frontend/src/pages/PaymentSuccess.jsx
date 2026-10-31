import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Calendar, Receipt } from 'lucide-react';

const PaymentSuccess = () => {
  return (
    <div className="h-[75vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <CheckCircle size={48} />
      </div>
      <h1 className="text-4xl font-black text-gray-900 mb-2 italic tracking-tighter">Stay Confirmed!</h1>
      <p className="text-gray-500 font-medium max-w-sm mb-8">
        Your room is booked, payment settled, and the host has been notified. Your official tax receipt is ready.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link to="/my-bookings" className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary transition shadow-xl">
          <Receipt size={18}/> View Receipt
        </Link>
        <Link to="/" className="flex-1 bg-white text-gray-900 border border-gray-100 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
          Home <ArrowRight size={18}/>
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;
