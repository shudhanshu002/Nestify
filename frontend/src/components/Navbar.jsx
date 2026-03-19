import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Home as HomeIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-primary font-bold text-2xl flex items-center gap-2">
          <HomeIcon /> PG-Finder
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-primary">Find PGs</Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                Hi, {user.firstName}
              </span>
              <Link to={user.role === 'OWNER' ? '/owner/dashboard' : '/my-bookings'} className="p-2 hover:bg-gray-100 rounded-full">
                <User size={20} />
              </Link>
              <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 font-medium">Login</Link>
              <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-lg font-medium">
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;