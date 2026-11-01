import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext'; 

// --- CORE COMPONENTS ---
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ChatLauncher from './components/chat/ChatLauncher'; 
import Footer from './components/Footer'; 
import ScrollToTop from './components/ScrollToTop';

// --- PAGES ---
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from './pages/Logout';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import KYCVerification from './pages/KYCVerification';
import MyBookings from './pages/MyBookings';
import BookingConfirmation from './pages/BookingConfirmation';
import PaymentSuccess from './pages/PaymentSuccess';
import AgreementDetail from './pages/AgreementDetail';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AddProperty from './pages/owner/AddProperty';
import AddRooms from './pages/owner/AddRooms';
import MyProperties from './pages/owner/MyProperties';
import AdminDashboard from './pages/Admin/AdminDashboard'; 
import AdminKYC from './pages/AdminKYC';
import Notifications from './pages/Notifications';
import HelpCenter from './pages/HelpCenter';

function App() {
  const { loading, user } = useContext(AuthContext);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#141414]">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary rounded-full animate-spin"></div>
      </div>
    </div>
  );

  return (
    <ChatProvider>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col justify-between bg-[#141414] text-white font-sans antialiased selection:bg-primary selection:text-white">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/help-center" element={<Navigate to="/help" replace />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/verify-identity" element={<KYCVerification />} />
              {user?.role === 'ADMIN' && (
                <Route path="/admin/verify-users" element={<AdminKYC />} />
              )}
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['TENANT']} />}>
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/booking/confirm/:propertyId" element={<BookingConfirmation />} />
              <Route path="/booking/success" element={<PaymentSuccess />} />
              <Route path="/agreement/:bookingId" element={<AgreementDetail />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/my-properties" element={<MyProperties />} />
              <Route path="/owner/add-property" element={<AddProperty />} />
              <Route path="/owner/add-room/:propertyId" element={<AddRooms />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>

          {/* Floating Chat Launcher Drawer */}
          <ChatLauncher />
        </main>
        <Footer />
      </div>
    </ChatProvider>
  );
}

export default App;
