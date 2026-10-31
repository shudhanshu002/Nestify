import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { User, ShieldCheck, Mail, Lock, UserPlus, Chrome, Facebook, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

const Register = () => {
  const [role, setRole] = useState('TENANT');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', { ...formData, role });
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8 bg-[#181818]/95 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-[#2a2a2a] text-white relative overflow-hidden">
        
        {/* Subtle Netflix Ambient Red Backlight Glow at the top */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-netflix-pulse"></div>

        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="mb-4">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Join Nestify</h2>
          <p className="mt-1 text-gray-400 font-medium text-sm">Start your premium living journey today</p>
        </div>

        {/* Role Switcher */}
        <div className="flex p-1.5 bg-[#242424] rounded-2xl border border-[#333333]">
          <button 
            type="button"
            onClick={() => setRole('TENANT')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
              role === 'TENANT' 
                ? 'btn-netflix shadow-sm text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User size={18} /> I'm a Tenant
          </button>
          <button 
            type="button"
            onClick={() => setRole('OWNER')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
              role === 'OWNER' 
                ? 'bg-emerald-600 shadow-sm text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={18} /> I'm an Owner
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button type="button" className="flex items-center justify-center gap-2 rounded-2xl bg-[#242424] border border-[#333333] py-3 font-bold text-gray-200 hover:bg-[#2c2c2c] transition-all cursor-pointer">
            <Chrome className="text-primary" size={18} /> <span className="text-xs">Google</span>
          </button>
          <button type="button" className="flex items-center justify-center gap-2 rounded-2xl bg-[#1877F2]/90 hover:bg-[#1877F2] py-3 font-bold text-white transition-all cursor-pointer">
            <Facebook size={18} fill="white" /> <span className="text-xs">Facebook</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">First Name</label>
            <input 
              required 
              className="w-full rounded-2xl bg-[#242424] border border-[#333333] py-3.5 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium" 
              placeholder="John" 
              onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Last Name</label>
            <input 
              required 
              className="w-full rounded-2xl bg-[#242424] border border-[#333333] py-3.5 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium" 
              placeholder="Doe" 
              onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
            />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full rounded-2xl bg-[#242424] border border-[#333333] py-3.5 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium" 
              placeholder="john@example.com" 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full rounded-2xl bg-[#242424] border border-[#333333] py-3.5 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium" 
              placeholder="••••••••" 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          
          <button
            disabled={loading}
            className={`col-span-2 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 text-white cursor-pointer ${
              role === 'OWNER' 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-950/20' 
                : 'btn-netflix shadow-xl shadow-red-950/30'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={22} />}
            Create {role.toLowerCase()} account
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-400">
          Already have an account? <Link to="/login" className="text-primary font-black hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
