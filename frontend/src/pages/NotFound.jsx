import { Link } from 'react-router-dom';
import { Ghost, Home } from 'lucide-react';

const NotFound = () => (
  <div className="h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <div className="text-gray-200 mb-6">
      <Ghost size={120} />
    </div>
    <h1 className="text-4xl font-black text-gray-900 mb-2">404 - Lost in the City?</h1>
    <p className="text-gray-500 max-w-sm mb-8">
      The property or page you are looking for doesn't exist or has moved.
    </p>
    <Link to="/" className="bg-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
      <Home size={18} /> Take Me Home
    </Link>
  </div>
);

export default NotFound;