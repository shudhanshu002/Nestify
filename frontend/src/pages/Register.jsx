import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { 
  User, ShieldCheck, Mail, Lock, UserPlus, 
  Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, 
  KeyRound, ArrowLeft, RefreshCw 
} from 'lucide-react';
import Logo from '../components/Logo';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';

const Register = () => {
  const [step, setStep] = useState('FORM'); // 'FORM' | 'OTP'
  const [role, setRole] = useState('TENANT');
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, refreshWishlist } = useContext(AuthContext);
  const navigate = useNavigate();

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 1: Send Registration OTP to Email
  const handleInitiateRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/send-register-otp', {
        email: formData.email.trim(),
        firstName: formData.firstName.trim()
      });


      setStep('OTP');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const { data } = await API.post('/auth/resend-register-otp', {
        email: formData.email.trim(),
        firstName: formData.firstName.trim()
      });


      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  // Step 3: Verify OTP and finalize Account Creation
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', { 
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role,
        otp: otp.trim()
      });

      // Auto sign-in if token is returned
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user || data);
        refreshWishlist && refreshWishlist();
        navigate(role === 'OWNER' ? '/owner/dashboard' : '/');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSuccess = (userData) => {
    setUser(userData);
    refreshWishlist && refreshWishlist();
    navigate(userData.role === 'OWNER' ? '/owner/dashboard' : '/');
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-8 sm:py-12 text-white">
      <div className="w-full max-w-xl space-y-7 bg-[#181818]/95 backdrop-blur-xl p-7 sm:p-10 rounded-[2.5rem] shadow-2xl border border-[#2a2a2a] text-white relative overflow-hidden">
        
        {/* Subtle Netflix Ambient Red Backlight Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-36 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-netflix-pulse"></div>

        {/* Brand Header */}
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="mb-3 hover:scale-105 transition-transform duration-200">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {step === 'FORM' ? 'Join Nestify' : 'Email Verification'}
          </h2>
          <p className="mt-1 text-gray-400 font-medium text-xs sm:text-sm">
            {step === 'FORM' 
              ? 'Zero brokerage, verified rooms, & escrow move-in security' 
              : 'Protecting your identity and escrow move-in guarantee'}
          </p>
        </div>

        {step === 'FORM' ? (
          <>
            {/* Role Selector Cards */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#202020] rounded-2xl border border-[#303030]">
              <button 
                type="button"
                onClick={() => setRole('TENANT')}
                className={`flex flex-col items-center sm:flex-row sm:items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  role === 'TENANT' 
                    ? 'btn-netflix shadow-md text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User size={18} />
                <span>I'm a Tenant</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setRole('OWNER')}
                className={`flex flex-col items-center sm:flex-row sm:items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  role === 'OWNER' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShieldCheck size={18} />
                <span>I'm a Property Owner</span>
              </button>
            </div>

            {/* Social Authentication: Google */}
            <div className="space-y-2">
              <SocialAuthButtons 
                role={role}
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
                  Or Register With Email
                </span>
              </div>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="p-3.5 bg-red-950/40 text-red-300 rounded-xl text-xs sm:text-sm border border-red-800/40 font-medium flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleInitiateRegistration} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                  First Name
                </label>
                <input 
                  type="text"
                  required 
                  value={formData.firstName}
                  className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3 px-4 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium" 
                  placeholder="e.g. John" 
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                  Last Name
                </label>
                <input 
                  type="text"
                  required 
                  value={formData.lastName}
                  className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3 px-4 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium" 
                  placeholder="e.g. Doe" 
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                />
              </div>

              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 text-gray-400" size={17} />
                  <input 
                    type="email" 
                    required 
                    value={formData.email}
                    className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium" 
                    placeholder="john@example.com" 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 text-gray-400" size={17} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required 
                    value={formData.password}
                    className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3 pl-11 pr-10 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium" 
                    placeholder="••••••••" 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 text-gray-400" size={17} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required 
                    value={formData.confirmPassword}
                    className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium" 
                    placeholder="••••••••" 
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
                  />
                </div>
              </div>

              {/* Terms Agreement Checkbox */}
              <div className="col-span-1 sm:col-span-2 px-1 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-[#333333] bg-[#222222] text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                  />
                  <span>
                    I agree to the <Link to="/help" className="text-primary hover:underline">Terms of Service</Link>, Resident Grievance Policy, and Escrow Move-in Guarantee.
                  </span>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`col-span-1 sm:col-span-2 py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 text-white cursor-pointer shadow-lg ${
                  role === 'OWNER' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30' 
                    : 'btn-netflix shadow-red-950/40'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
                <span>Verify Email & Continue</span>
              </button>
            </form>
          </>
        ) : (
          /* STEP 2: EMAIL OTP VERIFICATION SCREEN */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4">
              <button
                type="button"
                onClick={() => {
                  setStep('FORM');
                  setError('');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft size={16} /> Edit Details
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                STEP 2 OF 2
              </span>
            </div>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto shadow-inner">
                <KeyRound size={28} className="animate-pulse" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-wide">
                Verify Your Email
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                We have sent a 6-digit confirmation code to:
                <br />
                <span className="text-white font-extrabold text-sm">{formData.email}</span>
              </p>
            </div>

            {/* Error Notification Banner in OTP Step */}
            {error && (
              <div className="p-3.5 bg-red-950/40 text-red-300 rounded-xl text-xs sm:text-sm border border-red-800/40 font-medium flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}


            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                  }}
                  className="w-full text-center tracking-[0.4em] sm:tracking-[0.6em] font-mono font-black text-2xl sm:text-3xl rounded-2xl bg-[#222222] border-2 border-[#333333] focus:border-primary focus:ring-2 focus:ring-primary/20 py-4 text-white outline-none transition"
                  placeholder="••••••"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>Didn't receive the email?</span>
                {resendTimer > 0 ? (
                  <span className="font-bold text-gray-500">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resending}
                    className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 text-white cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  role === 'OWNER' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30' 
                    : 'btn-netflix shadow-red-950/40'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                <span>Verify & Create {role === 'OWNER' ? 'Owner' : 'Tenant'} Account</span>
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-xs sm:text-sm font-medium text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-black hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
