import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Tenant Routes */}
          <Route path="/my-bookings" element={
            <ProtectedRoute allowedRoles={['TENANT']}>
              <div>My Bookings Page</div>
            </ProtectedRoute>
          } />

          {/* Owner Routes */}
          <Route path="/owner/dashboard" element={
            <ProtectedRoute allowedRoles={['OWNER', 'COMPANY_ADMIN']}>
              <div>Owner Dashboard - Manage Properties</div>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <div>Super Admin Panel</div>
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;