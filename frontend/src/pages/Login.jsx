import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, Loader2, LogIn, Chrome, Facebook } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, socialLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(formData.email, formData.password);
      navigate(user.role === 'OWNER' ? '/owner/dashboard' : from);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-50">
        <div className="text-center">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-gray-500 font-medium">Choose your way to sign in</p>
        </div>

        {/* Social Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 py-3 font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
            <Chrome className="text-blue-500" size={20} />
            <span className="text-sm">Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 rounded-2xl bg-[#1877F2] py-3 font-bold text-white hover:bg-[#166fe5] transition-all active:scale-95">
            <Facebook size={20} fill="white" />
            <span className="text-sm">Facebook</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Or Email</span></div>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">{error}</div>}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-300" size={18} />
              <input
                type="email" required
                className="w-full rounded-2xl bg-gray-50 border-none py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition"
                placeholder="name@email.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Password</label>
              <Link to="/forgot" className="text-[10px] font-bold text-primary hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-300" size={18} />
              <input
                type="password" required
                className="w-full rounded-2xl bg-gray-50 border-none py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition"
                placeholder="••••••••"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn size={22} />}
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-gray-500">
          New here? <Link to="/register" className="text-primary font-black hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;