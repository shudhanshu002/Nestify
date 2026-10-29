import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { User, ShieldCheck, Mail, Lock, UserPlus, Chrome, Facebook, Loader2 } from 'lucide-react';

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
      <div className="w-full max-w-xl space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-50">
        <div className="text-center">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Join PG-Finder</h2>
          <p className="mt-2 text-gray-500 font-medium">Start your journey today</p>
        </div>

        {/* Role Switcher */}
        <div className="flex p-1.5 bg-gray-100 rounded-[1.25rem]">
          <button 
            onClick={() => setRole('TENANT')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${role === 'TENANT' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            <User size={18} /> I'm a Tenant
          </button>
          <button 
            onClick={() => setRole('OWNER')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${role === 'OWNER' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}
          >
            <ShieldCheck size={18} /> I'm an Owner
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 py-3 font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <Chrome className="text-blue-500" size={18} /> <span className="text-xs">Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 py-3 font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <Facebook className="text-blue-600" size={18} /> <span className="text-xs">Facebook</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">First Name</label>
            <input required className="w-full rounded-2xl bg-gray-50 border-none py-3.5 px-4 focus:ring-2 focus:ring-primary outline-none" placeholder="John" onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Last Name</label>
            <input required className="w-full rounded-2xl bg-gray-50 border-none py-3.5 px-4 focus:ring-2 focus:ring-primary outline-none" placeholder="Doe" onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</label>
            <input type="email" required className="w-full rounded-2xl bg-gray-50 border-none py-3.5 px-4 focus:ring-2 focus:ring-primary outline-none" placeholder="john@example.com" onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</label>
            <input type="password" required className="w-full rounded-2xl bg-gray-50 border-none py-3.5 px-4 focus:ring-2 focus:ring-primary outline-none" placeholder="••••••••" onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          
          <button
            disabled={loading}
            className={`col-span-2 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 text-white ${role === 'OWNER' ? 'bg-secondary hover:bg-green-700 shadow-green-100' : 'bg-primary hover:bg-blue-700 shadow-blue-100'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={22} />}
            Create {role.toLowerCase()} account
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-500">
          Already have an account? <Link to="/login" className="text-primary font-black hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;