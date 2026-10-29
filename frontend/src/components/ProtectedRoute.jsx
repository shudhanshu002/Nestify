import { useContext } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom'; // 󾠮 Import Outlet
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/404" replace />; // Or an unauthorized page
  }

  // 󾠯 FIX: Render 'children' if passed directly, otherwise render the 'Outlet'
  return children ? children : <Outlet />;
};

export default ProtectedRoute;