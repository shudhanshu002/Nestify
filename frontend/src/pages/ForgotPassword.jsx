import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { 
  Mail, Lock, KeyRound, Loader2, Eye, EyeOff, 
  CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, ShieldCheck 
} from 'lucide-react';
import Logo from '../components/Logo';
import { checkPasswordStrength } from '../utils/passwordValidator';

const ForgotPassword = () => {
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP' | 'SUCCESS'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const passwordStrength = checkPasswordStrength(newPassword);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 1: Dispatch Password Reset OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-password/request', { email: cleanEmail });
      setSuccessMsg(data.message || 'Verification code sent to your email.');
      setStep('OTP');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch password reset code. Please verify the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const { data } = await API.post('/auth/forgot-password/resend', { email: email.trim().toLowerCase() });
      setSuccessMsg(data.message || 'A fresh verification code was sent.');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (!passwordStrength.isValid) {
      setError('Password does not satisfy all security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/forgot-password/reset', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
        confirmPassword
      });

      setStep('SUCCESS');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-[#181818] border border-[#2a2a2a] p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-red-500 to-primary"></div>

        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <div className="mb-3 hover:scale-105 transition-transform duration-200">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {step === 'SUCCESS' ? 'Password Reset Complete' : 'Reset Password'}
          </h2>
          <p className="mt-1 text-gray-400 font-medium text-xs sm:text-sm">
            {step === 'EMAIL' && 'Enter your registered email to receive a recovery code'}
            {step === 'OTP' && `Code dispatched to ${email}`}
            {step === 'SUCCESS' && 'Your credentials have been securely updated'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 bg-red-950/40 text-red-300 rounded-xl text-xs sm:text-sm border border-red-800/40 font-medium flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Email Input Form */}
        {step === 'EMAIL' && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={17} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3.5 pl-11 pr-4 text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium"
                  placeholder="name@email.com"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-netflix py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-lg shadow-red-950/40"
            >
              {loading ? <Loader2 className="animate-spin" size={19} /> : <KeyRound size={19} />}
              <span>Send Verification Code</span>
            </button>

            <div className="text-center pt-2">
              <Link 
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition font-medium"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Verification Code & Strong Password Reset Form */}
        {step === 'OTP' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            
            {/* 6-Digit OTP */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-gray-400">
                  Verification Code (OTP)
                </label>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || resending}
                  className="text-[11px] font-bold text-primary hover:underline disabled:text-gray-500 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} className={resending ? 'animate-spin' : ''} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 text-gray-400" size={17} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3.5 pl-11 pr-4 text-white text-base tracking-[0.35em] font-mono placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-bold"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3.5 pl-11 pr-11 text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium"
                  placeholder="Create strong password"
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

            {/* Live Password Strength Criteria Checklist */}
            {newPassword && (
              <div className="p-3 bg-[#111116] border border-[#22222d] rounded-2xl space-y-1.5 animate-in fade-in">
                <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Password Requirements
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {passwordStrength.rules.map((rule, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 text-xs transition-colors ${
                        rule.met ? 'text-green-400 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {rule.met ? (
                        <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-gray-600 shrink-0"></div>
                      )}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={17} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl bg-[#222222] border border-[#333333] py-3.5 pl-11 pr-11 text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition font-medium"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white transition cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-400 font-medium px-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordStrength.isValid || newPassword !== confirmPassword}
              className="w-full btn-netflix py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-red-950/40"
            >
              {loading ? <Loader2 className="animate-spin" size={19} /> : <ShieldCheck size={19} />}
              <span>Reset &amp; Save Password</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setStep('EMAIL'); setError(''); }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition font-medium cursor-pointer"
              >
                <ArrowLeft size={14} /> Change Email
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success Screen */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-6 py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Password Updated</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                Your password has been reset successfully. You can now access your account with your new credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full btn-netflix py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all cursor-pointer shadow-lg shadow-red-950/40"
            >
              Sign In Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;

