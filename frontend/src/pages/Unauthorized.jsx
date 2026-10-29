import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => (
  <div className="h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <div className="p-6 bg-red-50 text-red-500 rounded-full mb-6">
      <ShieldAlert size={64} />
    </div>
    <h1 className="text-3xl font-black text-gray-900 mb-2">Access Denied</h1>
    <p className="text-gray-500 max-w-sm mb-8">
      You don't have the required permissions to view this page. This incident has been logged for security.
    </p>
    <Link to="/" className="flex items-center gap-2 text-primary font-bold hover:underline">
      <ArrowLeft size={18} /> Back to Safety
    </Link>
  </div>
);

export default Unauthorized;