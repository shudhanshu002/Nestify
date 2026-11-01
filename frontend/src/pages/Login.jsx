import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Mail, Lock, Loader2, LogIn, Eye, EyeOff, 
  Sparkles, ShieldCheck, UserCheck, Check 
} from 'lucide-react';
import Logo from '../components/Logo';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, setUser, refreshWishlist } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(formData.email.trim(), formData.password);
      navigate(user.role === 'OWNER' ? '/owner/dashboard' : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSuccess = (userData) => {
    setUser(userData);
    refreshWishlist && refreshWishlist();
    navigate(userData.role === 'OWNER' ? '/owner/dashboard' : from, { replace: true });
  };

  const handleQuickDemoFill = (role) => {
    if (role === 'TENANT') {
      setFormData({ email: 'rahul.sharma@example.com', password: 'password123' });
    } else if (role === 'OWNER') {
      setFormData({ email: 'suresh.patel@example.com', password: 'password123' });
    } else if (role === 'ADMIN') {
      setFormData({ email: 'support@nestify.com', password: 'password123' });
    }
    setError('');
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8 sm:py-12 text-white">
      <div className="w-full max-w-md space-y-7 bg-[#181818]/95 backdrop-blur-xl p-7 sm:p-9 rounded-[2.5rem] shadow-2xl border border-[#2a2a2a] text-white relative overflow-hidden">
        
        {/* Subtle Netflix Ambient Red Backlight Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-netflix-pulse"></div>

        {/* Brand Header */}
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="mb-3 hover:scale-105 transition-transform duration-200">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-1 text-gray-400 font-medium text-xs sm:text-sm">
            Sign in to manage leases, escrow stays, & grievances
          </p>
        </div>

        {/* Social Authentication: Google & Facebook */}
        <div className="space-y-2">
          <SocialAuthButtons 
            role="TENANT"
            onSuccess={handleSocialSuccess}
            onError={(msg) => setError(msg)}
          />
        </div>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#2a2a2a]"></span>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#181818] px-3 text-gray-400 font-bold tracking-widest">
              Or Sign In With Email
            </span>
          </div>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="p-3.5 bg-red-950/40 text-red-300 rounded-xl text-xs sm:text-sm border border-red-800/40 font-medium flex items-start gap-2.5 animate-in fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
            <span>{error}</span>
          </div>
        )}

        {/* Standard Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={17} />
              <input
                type="email"
                required
                value={formData.email}
                className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3.5 pl-11 pr-4 text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium"
                placeholder="name@email.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase text-gray-400">
                Password
              </label>
              <Link 
                to="/help" 
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3.5 pl-11 pr-11 text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium"
                placeholder="••••••••"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white transition cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 font-medium select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#333333] bg-[#222222] text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <span>Remember this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-netflix py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-lg shadow-red-950/40"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            <span>Sign In</span>
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="p-3 bg-[#1e1e1e] rounded-2xl border border-[#2b2b2b]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" /> Fast Fill Demo Account
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('TENANT')}
              className="py-1 px-2 rounded-xl bg-[#262626] hover:bg-[#303030] border border-[#383838] text-[11px] font-bold text-gray-300 hover:text-white transition text-center"
            >
              Tenant
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('OWNER')}
              className="py-1 px-2 rounded-xl bg-[#262626] hover:bg-[#303030] border border-[#383838] text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition text-center"
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('ADMIN')}
              className="py-1 px-2 rounded-xl bg-[#262626] hover:bg-[#303030] border border-[#383838] text-[11px] font-bold text-primary hover:text-red-300 transition text-center"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Bottom Switch Link */}
        <p className="text-center text-xs sm:text-sm font-medium text-gray-400">
          New to Nestify?{' '}
          <Link to="/register" className="text-primary font-black hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
