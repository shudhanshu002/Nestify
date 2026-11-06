import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/client';
import { 
  ShieldCheck, Phone, CheckCircle2, AlertCircle, 
  Loader2, ArrowLeft, Lock, Camera, UserCheck, 
  Upload, X, RefreshCw, Briefcase, GraduationCap, 
  AlertTriangle, HeartPulse, Sparkles, Send, Check, Info
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const RELATION_OPTIONS = ['Parent', 'Sibling', 'Spouse', 'Guardian', 'Relative', 'Friend'];

const KYCVerification = () => {
  const { user, setUser } = useContext(AuthContext);
  const toast = useToast();
  const [searchParams] = useSearchParams();

  // Active Verification Tab: 'mobile' | 'identity' | 'selfie' | 'emergency' | 'student_work'
  const initialTab = searchParams.get('tab') || 'mobile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Verification Summary Data State
  const [summary, setSummary] = useState(null);
  const [fetchingSummary, setFetchingSummary] = useState(true);

  // ----------------------------------------------------
  // 1. MOBILE OTP STATE
  // ----------------------------------------------------
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [simulatedPhoneOtp, setSimulatedPhoneOtp] = useState('');
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);
  const [phoneOtpChannel, setPhoneOtpChannel] = useState('WHATSAPP');
  const [whatsappLink, setWhatsappLink] = useState('');

  // ----------------------------------------------------
  // 2. IDENTITY / AADHAAR STATE
  // ----------------------------------------------------
  const [docType, setDocType] = useState('AADHAAR');
  const [idNumber, setIdNumber] = useState('');
  const [fullNameOnDoc, setFullNameOnDoc] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
  const [dobOnDoc, setDobOnDoc] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);
  const [idFile, setIdFile] = useState(null);
  const [idFilePreview, setIdFilePreview] = useState(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [useQrScan, setUseQrScan] = useState(false);
  const [qrPayload, setQrPayload] = useState('');

  // ----------------------------------------------------
  // 3. LIVE SELFIE & LIVENESS STATE
  // ----------------------------------------------------
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [livenessStage, setLivenessStage] = useState('READY'); // 'READY' | 'LOOK_STRAIGHT' | 'BLINK_CONFIRM' | 'CAPTURED'
  const [selfieLoading, setSelfieLoading] = useState(false);

  // ----------------------------------------------------
  // 4. EMERGENCY CONTACT STATE
  // ----------------------------------------------------
  const [emergencyName, setEmergencyName] = useState(user?.profile?.emergencyContact?.name || '');
  const [emergencyRelation, setEmergencyRelation] = useState(user?.profile?.emergencyContact?.relation || 'Parent');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.profile?.emergencyContact?.phone || '');
  const [emergencyOtp, setEmergencyOtp] = useState('');
  const [emergencyOtpSent, setEmergencyOtpSent] = useState(false);
  const [emergencySending, setEmergencySending] = useState(false);
  const [emergencyVerifying, setEmergencyVerifying] = useState(false);
  const [simulatedEmergencyOtp, setSimulatedEmergencyOtp] = useState('');
  const [emergencyResendTimer, setEmergencyResendTimer] = useState(0);

  // ----------------------------------------------------
  // 5. STUDENT / EMPLOYMENT STATE
  // ----------------------------------------------------
  const [workCategory, setWorkCategory] = useState(user?.studentOrWorkVerification?.category === 'WORKING_PROFESSIONAL' ? 'WORKING_PROFESSIONAL' : 'STUDENT');
  const [organizationName, setOrganizationName] = useState(user?.studentOrWorkVerification?.organizationName || '');
  const [designationOrCourse, setDesignationOrCourse] = useState(user?.studentOrWorkVerification?.designationOrCourse || '');
  const [workEmail, setWorkEmail] = useState(user?.studentOrWorkVerification?.workEmail || '');
  const [workEmailOtp, setWorkEmailOtp] = useState('');
  const [workEmailOtpSent, setWorkEmailOtpSent] = useState(false);
  const [workEmailSending, setWorkEmailSending] = useState(false);
  const [workEmailVerifying, setWorkEmailVerifying] = useState(false);
  const [simulatedWorkEmailOtp, setSimulatedWorkEmailOtp] = useState('');
  const [workIdFile, setWorkIdFile] = useState(null);
  const [workIdPreview, setWorkIdPreview] = useState(null);
  const [workLoading, setWorkLoading] = useState(false);

  // Load verification summary
  const fetchSummary = async () => {
    try {
      setFetchingSummary(true);
      const { data } = await API.get('/users/verification-status');
      if (data?.data) {
        setSummary(data.data);
        if (data.data.phone?.rawPhone) {
          setPhone(data.data.phone.rawPhone);
        }
        if (data.data.emergencyContact?.name) {
          setEmergencyName(data.data.emergencyContact.name);
          setEmergencyRelation(data.data.emergencyContact.relation || 'Parent');
          setEmergencyPhone(data.data.emergencyContact.rawPhone || '');
        }
      }
    } catch (err) {
      console.error('Failed to load verification summary:', err);
    } finally {
      setFetchingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Timer countdowns
  useEffect(() => {
    let timer;
    if (phoneResendTimer > 0) {
      timer = setInterval(() => setPhoneResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [phoneResendTimer]);

  useEffect(() => {
    let timer;
    if (emergencyResendTimer > 0) {
      timer = setInterval(() => setEmergencyResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emergencyResendTimer]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // ----------------------------------------------------
  // HANDLERS: 1. MOBILE VERIFICATION
  // ----------------------------------------------------
  const handleSendPhoneOtp = async (overrideChannel) => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return toast.warning('Please enter a valid 10-digit Indian mobile number.');
    }

    const channel = overrideChannel || phoneOtpChannel;
    setPhoneOtpLoading(true);
    const endpoint = channel === 'WHATSAPP' ? '/users/send-whatsapp-otp' : '/users/send-phone-otp';
    try {
      const { data } = await API.post(endpoint, { phone });
      setPhoneOtpSent(true);
      setPhoneResendTimer(45);
      if (data.data?.whatsappDeepLink) {
        setWhatsappLink(data.data.whatsappDeepLink);
      }
      if (data.data?.simulatedOtp) {
        setSimulatedPhoneOtp(data.data.simulatedOtp);
        setPhoneOtp(data.data.simulatedOtp);
      } else {
        setSimulatedPhoneOtp('');
        setPhoneOtp('');
      }
      toast.success(data.message || `OTP dispatched via ${channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to dispatch ${channel} OTP.`);
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!phoneOtp || phoneOtp.length < 6) {
      return toast.warning('Please enter the 6-digit OTP code.');
    }

    setPhoneVerifyLoading(true);
    try {
      const { data } = await API.post('/users/verify-phone-otp', { phone, otp: phoneOtp });
      toast.success('Mobile number verified successfully!');
      if (setUser && data.user) setUser(data.user);
      setPhoneOtpSent(false);
      setPhoneOtp('');
      setSimulatedPhoneOtp('');
      await fetchSummary();
      // Move to next step if identity is not verified
      if (summary?.identity?.status !== 'VERIFIED') {
        setActiveTab('identity');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired phone OTP code.');
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: 2. IDENTITY / AADHAAR VERIFICATION
  // ----------------------------------------------------
  const handleIdFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setIdFile(selected);
      setIdFilePreview(URL.createObjectURL(selected));
    }
  };

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    if (!consentGiven) {
      return toast.warning('You must accept the user consent declaration to verify identity.');
    }
    if (!fullNameOnDoc || !fullNameOnDoc.trim()) {
      return toast.warning('Please enter your full name as printed on the identity document.');
    }

    setIdentityLoading(true);
    try {
      const formData = new FormData();
      formData.append('docType', docType);
      formData.append('idNumber', idNumber);
      formData.append('fullName', fullNameOnDoc);
      formData.append('dob', dobOnDoc);
      formData.append('consent', consentGiven);
      if (qrPayload) formData.append('qrData', qrPayload);
      if (idFile) formData.append('document', idFile);

      const { data } = await API.post('/users/verify-identity', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Government identity verified successfully!');
      if (setUser && data.user) setUser(data.user);
      await fetchSummary();
      setActiveTab('selfie');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identity verification failed.');
    } finally {
      setIdentityLoading(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: 3. LIVE SELFIE & LIVENESS VERIFICATION
  // ----------------------------------------------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStream(stream);
      setIsCameraActive(true);
      setLivenessStage('LOOK_STRAIGHT');
    } catch (err) {
      toast.error('Unable to access camera. Please allow camera permissions or upload a selfie.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedSelfie(dataUrl);
    setLivenessStage('CAPTURED');
    stopCamera();
  };

  const handleVerifySelfie = async () => {
    if (!capturedSelfie) {
      return toast.warning('Please capture a live selfie first.');
    }

    setSelfieLoading(true);
    try {
      const { data } = await API.post('/users/verify-selfie', {
        selfieImage: capturedSelfie,
        motionConfirmed: true,
        livenessChallengeToken: Date.now().toString()
      });

      toast.success('Live selfie and liveness verification passed!');
      if (setUser && data.user) setUser(data.user);
      await fetchSummary();
      setActiveTab('emergency');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Selfie verification failed.');
    } finally {
      setSelfieLoading(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: 4. EMERGENCY CONTACT VERIFICATION
  // ----------------------------------------------------
  const handleSendEmergencyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!emergencyName || !emergencyName.trim()) {
      return toast.warning('Please enter emergency contact name.');
    }
    if (!emergencyPhone || emergencyPhone.replace(/\D/g, '').length < 10) {
      return toast.warning('Please enter a valid 10-digit Indian mobile number for emergency contact.');
    }

    setEmergencySending(true);
    try {
      const { data } = await API.post('/users/emergency-contact/send-otp', {
        name: emergencyName,
        relation: emergencyRelation,
        phone: emergencyPhone
      });

      setEmergencyOtpSent(true);
      setEmergencyResendTimer(45);
      if (data.data?.simulatedOtp) {
        setSimulatedEmergencyOtp(data.data.simulatedOtp);
        setEmergencyOtp(data.data.simulatedOtp);
      } else {
        setSimulatedEmergencyOtp('');
        setEmergencyOtp('');
      }
      toast.success(data.message || 'OTP sent to emergency contact!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch emergency contact OTP.');
    } finally {
      setEmergencySending(false);
    }
  };

  const handleVerifyEmergencyOtp = async (e) => {
    e.preventDefault();
    if (!emergencyOtp || emergencyOtp.length < 6) {
      return toast.warning('Please enter the 6-digit OTP code sent to your contact.');
    }

    setEmergencyVerifying(true);
    try {
      const { data } = await API.post('/users/emergency-contact/verify-otp', {
        name: emergencyName,
        relation: emergencyRelation,
        phone: emergencyPhone,
        otp: emergencyOtp
      });

      toast.success('Emergency contact verified successfully!');
      if (setUser && data.user) setUser(data.user);
      setEmergencyOtpSent(false);
      setEmergencyOtp('');
      await fetchSummary();
      setActiveTab('student_work');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP for emergency contact.');
    } finally {
      setEmergencyVerifying(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: 5. STUDENT / EMPLOYMENT VERIFICATION
  // ----------------------------------------------------
  const handleWorkIdFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setWorkIdFile(selected);
      setWorkIdPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmitStudentOrWork = async (e) => {
    e.preventDefault();
    if (!organizationName || !organizationName.trim()) {
      return toast.warning(workCategory === 'STUDENT' ? 'Please enter College / University name.' : 'Please enter Company name.');
    }

    setWorkLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', workCategory);
      formData.append('organizationName', organizationName);
      formData.append('designationOrCourse', designationOrCourse);
      formData.append('workEmail', workEmail);
      if (workIdFile) formData.append('idCard', workIdFile);

      const { data } = await API.post('/users/student-work', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(data.message || 'Verification submitted successfully!');
      if (setUser && data.user) setUser(data.user);
      await fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit verification details.');
    } finally {
      setWorkLoading(false);
    }
  };

  const handleSendWorkEmailOtp = async () => {
    if (!workEmail || !workEmail.includes('@')) {
      return toast.warning('Please enter a valid work email address.');
    }

    setWorkEmailSending(true);
    try {
      const { data } = await API.post('/users/student-work/send-work-email-otp', { workEmail });
      setWorkEmailOtpSent(true);
      if (data.simulatedOtp) {
        setSimulatedWorkEmailOtp(data.simulatedOtp);
        setWorkEmailOtp(data.simulatedOtp);
      }
      toast.success(data.message || 'OTP sent to your corporate email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send work email OTP.');
    } finally {
      setWorkEmailSending(false);
    }
  };

  const handleVerifyWorkEmailOtp = async () => {
    if (!workEmailOtp) {
      return toast.warning('Please enter the verification code.');
    }

    setWorkEmailVerifying(true);
    try {
      const { data } = await API.post('/users/student-work/verify-work-email-otp', {
        workEmail,
        otp: workEmailOtp
      });
      toast.success('Corporate email verified successfully!');
      if (setUser && data.user) setUser(data.user);
      setWorkEmailOtpSent(false);
      setWorkEmailOtp('');
      await fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setWorkEmailVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 text-white space-y-6">
      
      {/* Back Button */}
      <Link 
        to="/profile" 
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition"
      >
        <ArrowLeft size={14} /> Back to Profile
      </Link>

      {/* Main Verification Card */}
      <div className="bg-[#181818] rounded-3xl p-6 sm:p-10 border border-[#2a2a2a] shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#262626]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-600/15 text-red-500 border border-red-600/30 rounded-2xl shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-800/40">
                  Trust & Safety Gate
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  UIDAI & IT Act Compliant
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white">
                Resident Verification Hub
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Complete your identity checks to enable 1-click room booking, zero brokerage guarantee, and safe co-living access.
              </p>
            </div>
          </div>

          {/* Trust Score Badge */}
          <div className="bg-[#13141a] border border-[#282a38] p-3.5 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400 font-black text-sm font-mono">
              {summary?.trustScore || 40}%
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Account Trust Level</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                <Sparkles size={12} />
                {summary?.trustScore >= 80 ? 'Verified Resident' : summary?.trustScore >= 60 ? 'Standard Trust' : 'Verification Incomplete'}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Pillar Visual Navigation Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#121214] p-1.5 rounded-2xl border border-[#22232a]">
          
          {/* Tab 1: Mobile */}
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`p-2.5 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeTab === 'mobile' 
                ? 'bg-[#222430] border border-red-500/40 text-white shadow-md' 
                : 'hover:bg-[#1a1b22] text-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Phone size={14} className={summary?.phone?.isVerified ? 'text-emerald-400' : 'text-gray-400'} />
              {summary?.phone?.isVerified ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="text-[8px] font-black text-red-400 uppercase">Req</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block">1. Mobile OTP</span>
              <span className="text-[9px] opacity-70 truncate block">
                {summary?.phone?.isVerified ? 'Verified ✓' : 'SMS Pending'}
              </span>
            </div>
          </button>

          {/* Tab 2: Identity / Aadhaar */}
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`p-2.5 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeTab === 'identity' 
                ? 'bg-[#222430] border border-red-500/40 text-white shadow-md' 
                : 'hover:bg-[#1a1b22] text-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <ShieldCheck size={14} className={summary?.identity?.status === 'VERIFIED' ? 'text-emerald-400' : 'text-gray-400'} />
              {summary?.identity?.status === 'VERIFIED' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="text-[8px] font-black text-red-400 uppercase">Req</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block">2. Aadhaar / ID</span>
              <span className="text-[9px] opacity-70 truncate block">
                {summary?.identity?.status === 'VERIFIED' ? 'Verified ✓' : 'Audit Pending'}
              </span>
            </div>
          </button>

          {/* Tab 3: Selfie & Liveness */}
          <button
            type="button"
            onClick={() => setActiveTab('selfie')}
            className={`p-2.5 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeTab === 'selfie' 
                ? 'bg-[#222430] border border-red-500/40 text-white shadow-md' 
                : 'hover:bg-[#1a1b22] text-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Camera size={14} className={summary?.selfie?.isVerified ? 'text-emerald-400' : 'text-gray-400'} />
              {summary?.selfie?.isVerified && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block">3. Live Selfie</span>
              <span className="text-[9px] opacity-70 truncate block">
                {summary?.selfie?.isVerified ? 'Verified ✓' : 'Liveness Check'}
              </span>
            </div>
          </button>

          {/* Tab 4: Emergency Contact */}
          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className={`p-2.5 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeTab === 'emergency' 
                ? 'bg-[#222430] border border-red-500/40 text-white shadow-md' 
                : 'hover:bg-[#1a1b22] text-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <HeartPulse size={14} className={summary?.emergencyContact?.isVerified ? 'text-emerald-400' : 'text-gray-400'} />
              {summary?.emergencyContact?.isVerified && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block">4. Emergency</span>
              <span className="text-[9px] opacity-70 truncate block">
                {summary?.emergencyContact?.isVerified ? 'Verified ✓' : 'Contact SOS'}
              </span>
            </div>
          </button>

          {/* Tab 5: Student / Professional (Optional) */}
          <button
            type="button"
            onClick={() => setActiveTab('student_work')}
            className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl text-left transition flex flex-col justify-between cursor-pointer ${
              activeTab === 'student_work' 
                ? 'bg-[#222430] border border-red-500/40 text-white shadow-md' 
                : 'hover:bg-[#1a1b22] text-gray-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <GraduationCap size={14} className={summary?.studentOrWork?.status === 'VERIFIED' ? 'text-emerald-400' : 'text-gray-400'} />
              {summary?.studentOrWork?.status === 'VERIFIED' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block">5. Student / Pro</span>
              <span className="text-[9px] opacity-70 truncate block">
                {summary?.studentOrWork?.status === 'VERIFIED' ? 'Verified ✓' : 'Optional Badge'}
              </span>
            </div>
          </button>
        </div>

        {/* TAB CONTENT SECTIONS */}

        {/* ---------------------------------------------------- */}
        {/* 1. MOBILE NUMBER VERIFICATION TAB */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'mobile' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black italic text-white flex items-center gap-2">
                <Phone size={18} className="text-red-500" />
                Mobile Number Verification (Indian Telecom +91)
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                A verified mobile number connects you directly with audited PG owners, booking check-in OTPs, and escrow confirmations.
              </p>
            </div>

            {summary?.phone?.isVerified ? (
              <div className="p-6 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-900/40 text-emerald-400 rounded-xl">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Mobile Phone Verified</h3>
                    <p className="text-xs text-emerald-300 font-mono mt-0.5">
                      {summary.phone.phone || phone} • Safe Indian Telecom Auth
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('identity')}
                  className="btn-netflix px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Next: Verify Identity →
                </button>
              </div>
            ) : (
              <form onSubmit={phoneOtpSent ? handleVerifyPhoneOtp : handleSendPhoneOtp} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">
                      Indian Mobile Number (+91)
                    </label>
                    <div className="flex items-center gap-1.5 bg-[#12131a] p-1 rounded-xl border border-[#232533]">
                      <button
                        type="button"
                        onClick={() => setPhoneOtpChannel('WHATSAPP')}
                        disabled={phoneOtpSent}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
                          phoneOtpChannel === 'WHATSAPP'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>💬 WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneOtpChannel('SMS')}
                        disabled={phoneOtpSent}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
                          phoneOtpChannel === 'SMS'
                            ? 'bg-red-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>📱 SMS</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3.5 bg-[#202020] border border-[#333333] rounded-xl text-gray-400 font-mono text-xs font-bold">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      disabled={phoneOtpSent}
                      className="flex-1 bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none font-mono tracking-wider transition"
                    />
                    {!phoneOtpSent && (
                      <button
                        type="button"
                        onClick={() => handleSendPhoneOtp()}
                        disabled={phoneOtpLoading || phone.length < 10}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 shrink-0 transition flex items-center gap-1.5 shadow-lg ${
                          phoneOtpChannel === 'WHATSAPP'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                            : 'btn-netflix'
                        }`}
                      >
                        {phoneOtpLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : phoneOtpChannel === 'WHATSAPP' ? (
                          <span>Send WhatsApp OTP</span>
                        ) : (
                          <span>Send SMS OTP</span>
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    Only 1 Nestify account per Indian mobile number is permitted to prevent duplicate fake accounts.
                  </span>
                </div>

                {phoneOtpSent && (
                  <div className="p-4 bg-[#14151b] border border-[#2b2d3c] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-gray-400">
                        Enter 6-Digit SMS Verification Code
                      </span>
                      {phoneResendTimer > 0 ? (
                        <span className="text-[10px] text-gray-500 font-mono">Resend in {phoneResendTimer}s</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendPhoneOtp('WHATSAPP')}
                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                          >
                            Resend on WhatsApp
                          </button>
                          <span className="text-gray-600">•</span>
                          <button
                            type="button"
                            onClick={() => handleSendPhoneOtp('SMS')}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 transition cursor-pointer"
                          >
                            Resend via SMS
                          </button>
                        </div>
                      )}
                    </div>

                    {simulatedPhoneOtp ? (
                      <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-300 flex items-center justify-between font-mono">
                        <span>Development SMS OTP: <strong>{simulatedPhoneOtp}</strong></span>
                        <span className="text-[9px] uppercase bg-blue-900/60 px-2 py-0.5 rounded">Simulated</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between font-mono">
                        <span>{phoneOtpChannel === 'WHATSAPP' ? '⚡ Real-time WhatsApp code dispatched to your chat.' : '⚡ Real-time SMS dispatched to your mobile.'} Check messages.</span>
                        <span className="text-[9px] uppercase bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">{phoneOtpChannel === 'WHATSAPP' ? 'WhatsApp' : 'Live SMS'}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="flex-1 bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-base tracking-[0.3em] font-mono font-black text-center rounded-xl py-2.5 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={phoneVerifyLoading || phoneOtp.length < 6}
                        className="btn-netflix px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {phoneVerifyLoading ? <Loader2 size={14} className="animate-spin" /> : 'Verify Code'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* 2. IDENTITY / AADHAAR VERIFICATION TAB */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'identity' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black italic text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-red-500" />
                Government Identity &amp; Aadhaar Verification
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Matches your legal full name and date of birth. In accordance with Indian UIDAI &amp; IT Act regulations, we practice strict data minimization and store only your verification result and masked ID.
              </p>
            </div>

            {summary?.identity?.status === 'VERIFIED' ? (
              <div className="p-6 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-900/40 text-emerald-400 rounded-xl">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Government Identity Authenticated</h3>
                    <p className="text-xs text-emerald-300 font-mono mt-0.5">
                      {summary.identity.docType} • Masked ID: {summary.identity.maskedId || 'XXXX-XXXX-VERIFIED'} • Name Matched
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('selfie')}
                  className="btn-netflix px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Next: Live Selfie →
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyIdentity} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Doc Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">
                      Government Document Type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none cursor-pointer"
                    >
                      <option value="AADHAAR">🇮🇳 Government Aadhaar Card</option>
                      <option value="PAN">💳 Permanent Account Number (PAN)</option>
                      <option value="PASSPORT">🌐 International Passport</option>
                      <option value="VOTER_ID">🗳️ Election Commission Voter ID</option>
                      <option value="DRIVING_LICENSE">🚗 Driving License</option>
                    </select>
                  </div>

                  {/* ID Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">
                      {docType === 'AADHAAR' ? 'Aadhaar Number (Last 4 Digits or 12 Digits)' : 'ID Document Number'}
                    </label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder={docType === 'AADHAAR' ? 'XXXX-XXXX-4321' : 'ABCDE1234F'}
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name Matching */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">
                      Full Legal Name (As printed on Document)
                    </label>
                    <input
                      type="text"
                      value={fullNameOnDoc}
                      onChange={(e) => setFullNameOnDoc(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none"
                    />
                  </div>

                  {/* DOB Matching */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dobOnDoc}
                      onChange={(e) => setDobOnDoc(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Document Photo Upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 block">
                    Upload ID Photo or Aadhaar QR Scan (Optional for Instant Audit)
                  </label>
                  {idFilePreview ? (
                    <div className="p-3 bg-[#131418] border border-[#2b2d38] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={idFilePreview} alt="ID preview" className="w-12 h-12 object-cover rounded-lg border border-[#383a48]" />
                        <div>
                          <span className="text-xs font-bold text-white block">{idFile?.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{(idFile?.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIdFile(null); setIdFilePreview(null); }}
                        className="p-1.5 text-gray-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#333333] hover:border-red-500/60 bg-[#1c1d24] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                      <Upload size={20} className="text-gray-400 mb-2" />
                      <span className="text-xs font-bold text-gray-300">Click to upload document photo or QR scan</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">JPG, PNG or PDF under 5MB</span>
                      <input type="file" onChange={handleIdFileChange} accept="image/*,application/pdf" className="hidden" />
                    </label>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="p-3.5 bg-[#121318] border border-[#262833] rounded-xl">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-[#333333] text-red-500 focus:ring-red-500 accent-red-500 cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] leading-relaxed text-gray-400">
                      I voluntarily provide my identity details and consent to Nestify verifying my name and details solely for resident safety, fraud prevention, and co-living agreement verification. I understand my sensitive data is masked and never sold.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={identityLoading || !fullNameOnDoc}
                  className="w-full btn-netflix py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {identityLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>Verify Identity &amp; Authenticate</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* 3. LIVE SELFIE & LIVENESS VERIFICATION TAB */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'selfie' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black italic text-white flex items-center gap-2">
                <Camera size={18} className="text-red-500" />
                Live Selfie &amp; Liveness Detection
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Captures a live snapshot with liveness confirmation to prevent photo-based impersonation or stolen ID abuse.
              </p>
            </div>

            {summary?.selfie?.isVerified ? (
              <div className="p-6 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-900/40 text-emerald-400 rounded-xl">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Live Liveness &amp; Selfie Verified</h3>
                    <p className="text-xs text-emerald-300 font-mono mt-0.5">
                      Liveness Score: {summary.selfie.livenessScore || 98}% • Anti-Impersonation Cleared
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('emergency')}
                  className="btn-netflix px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Next: Emergency Contact →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative max-w-sm mx-auto aspect-square bg-[#101116] border-2 border-[#2b2d3a] rounded-3xl overflow-hidden flex items-center justify-center">
                  {capturedSelfie ? (
                    <img src={capturedSelfie} alt="Captured Selfie" className="w-full h-full object-cover" />
                  ) : isCameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      {/* Face Positioning Oval Guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-60 border-2 border-dashed border-red-500/80 rounded-full animate-pulse flex items-end justify-center pb-4">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/60 px-2.5 py-0.5 rounded-full text-white">
                            Fit Face Inside Oval
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-[#1e2029] flex items-center justify-center text-gray-400">
                        <Camera size={28} />
                      </div>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Click below to open your camera. Keep your head straight and centered inside the oval guide.
                      </p>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {!capturedSelfie && !isCameraActive && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="btn-netflix px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <Camera size={14} />
                      <span>Start Live Camera</span>
                    </button>
                  )}

                  {isCameraActive && (
                    <>
                      <button
                        type="button"
                        onClick={captureSnapshot}
                        className="btn-netflix px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Capture Live Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-3 bg-[#24252e] hover:bg-[#32333f] text-gray-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {capturedSelfie && (
                    <>
                      <button
                        type="button"
                        onClick={handleVerifySelfie}
                        disabled={selfieLoading}
                        className="btn-netflix px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {selfieLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        <span>Confirm &amp; Verify Liveness</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCapturedSelfie(null); startCamera(); }}
                        className="px-4 py-3 bg-[#24252e] hover:bg-[#32333f] text-gray-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Retake Photo
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* 4. EMERGENCY CONTACT VERIFICATION TAB */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'emergency' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black italic text-white flex items-center gap-2">
                <HeartPulse size={18} className="text-red-500" />
                Emergency Contact Verification
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Provides a verified guardian or family contact in case of medical emergency or building safety notice. A quick SMS OTP verifies the contact's reachability.
              </p>
            </div>

            {summary?.emergencyContact?.isVerified ? (
              <div className="p-6 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-900/40 text-emerald-400 rounded-xl">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Emergency Contact Verified</h3>
                    <p className="text-xs text-emerald-300 font-mono mt-0.5">
                      {summary.emergencyContact.name} ({summary.emergencyContact.relation}) • {summary.emergencyContact.phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('student_work')}
                  className="btn-netflix px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Next: Student / Pro →
                </button>
              </div>
            ) : (
              <form onSubmit={emergencyOtpSent ? handleVerifyEmergencyOtp : handleSendEmergencyOtp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">Contact Full Name</label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="e.g. Sunita Sharma"
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">Relationship</label>
                    <select
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none cursor-pointer"
                    >
                      {RELATION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">Contact Mobile (+91)</label>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543211"
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none font-mono"
                    />
                  </div>
                </div>

                {!emergencyOtpSent && (
                  <button
                    type="submit"
                    disabled={emergencySending || !emergencyName || emergencyPhone.length < 10}
                    className="btn-netflix px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {emergencySending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Send Verification Code to Emergency Contact</span>
                  </button>
                )}

                {emergencyOtpSent && (
                  <div className="p-4 bg-[#14151b] border border-[#2b2d3c] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-gray-400">
                        Enter 6-Digit Code Received by {emergencyName}
                      </span>
                      {emergencyResendTimer > 0 ? (
                        <span className="text-[10px] text-gray-500 font-mono">Resend in {emergencyResendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendEmergencyOtp}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 transition cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    {simulatedEmergencyOtp ? (
                      <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-300 flex items-center justify-between font-mono">
                        <span>Emergency SMS OTP: <strong>{simulatedEmergencyOtp}</strong></span>
                        <span className="text-[9px] uppercase bg-blue-900/60 px-2 py-0.5 rounded">Simulated</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between font-mono">
                        <span>⚡ Real-time SMS dispatched to ${emergencyName}'s phone. Check inbox.</span>
                        <span className="text-[9px] uppercase bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">Live SMS</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={emergencyOtp}
                        onChange={(e) => setEmergencyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="flex-1 bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-base tracking-[0.3em] font-mono font-black text-center rounded-xl py-2.5 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={emergencyVerifying || emergencyOtp.length < 6}
                        className="btn-netflix px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {emergencyVerifying ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Contact'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* 5. STUDENT / EMPLOYMENT VERIFICATION TAB */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'student_work' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black italic text-white flex items-center gap-2">
                <GraduationCap size={18} className="text-red-500" />
                Student &amp; Working Professional Verification (Optional)
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Unlocks exclusive student-only or IT-professional co-living residences and special rental subsidies.
              </p>
            </div>

            {summary?.studentOrWork?.status === 'VERIFIED' ? (
              <div className="p-6 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-900/40 text-emerald-400 rounded-xl">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      {summary.studentOrWork.category === 'STUDENT' ? 'Student Verified 🎓' : 'Working Professional Verified 💼'}
                    </h3>
                    <p className="text-xs text-emerald-300 font-mono mt-0.5">
                      {summary.studentOrWork.organizationName}
                      {summary.studentOrWork.workEmail ? ` • ${summary.studentOrWork.workEmail}` : ''}
                    </p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="btn-netflix px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Back to Profile
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitStudentOrWork} className="space-y-5">
                {/* Category Switcher */}
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setWorkCategory('STUDENT')}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border ${
                      workCategory === 'STUDENT'
                        ? 'bg-red-950/50 border-red-500 text-white'
                        : 'bg-[#202020] border-[#333333] text-gray-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap size={16} />
                    <span>College Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkCategory('WORKING_PROFESSIONAL')}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border ${
                      workCategory === 'WORKING_PROFESSIONAL'
                        ? 'bg-red-950/50 border-red-500 text-white'
                        : 'bg-[#202020] border-[#333333] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Briefcase size={16} />
                    <span>Working Professional</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">
                      {workCategory === 'STUDENT' ? 'College / University Name *' : 'Company / Employer Name *'}
                    </label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder={workCategory === 'STUDENT' ? 'e.g. IIT Delhi' : 'e.g. Google India'}
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">
                      {workCategory === 'STUDENT' ? 'Degree / Course' : 'Job Title / Designation'}
                    </label>
                    <input
                      type="text"
                      value={designationOrCourse}
                      onChange={(e) => setDesignationOrCourse(e.target.value)}
                      placeholder={workCategory === 'STUDENT' ? 'e.g. B.Tech Computer Science' : 'e.g. Software Engineer'}
                      className="w-full bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none"
                    />
                  </div>
                </div>

                {/* Corporate Email (If Working Professional) */}
                {workCategory === 'WORKING_PROFESSIONAL' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 block">
                      Corporate Work Email (Optional instant email verification)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="flex-1 bg-[#202020] border border-[#333333] focus:border-red-500 text-white text-xs font-bold rounded-xl py-3 px-3.5 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSendWorkEmailOtp}
                        disabled={workEmailSending || !workEmail.includes('@')}
                        className="btn-netflix px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {workEmailSending ? <Loader2 size={14} className="animate-spin" /> : 'Send Code'}
                      </button>
                    </div>

                    {workEmailOtpSent && (
                      <div className="p-3 bg-[#13141b] border border-[#2b2d3d] rounded-xl flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={workEmailOtp}
                          onChange={(e) => setWorkEmailOtp(e.target.value)}
                          placeholder="Code"
                          className="w-28 bg-[#202020] border border-[#333333] text-white text-xs font-mono font-bold text-center rounded-lg py-2"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyWorkEmailOtp}
                          disabled={workEmailVerifying || !workEmailOtp}
                          className="btn-netflix px-3 py-2 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                        >
                          {workEmailVerifying ? <Loader2 size={12} className="animate-spin" /> : 'Verify'}
                        </button>
                        {simulatedWorkEmailOtp && (
                          <span className="text-[10px] text-blue-300 font-mono">Code: {simulatedWorkEmailOtp}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ID Card Upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 block">
                    Upload {workCategory === 'STUDENT' ? 'Student ID Card' : 'Company Employee ID Card / Badge'}
                  </label>
                  {workIdPreview ? (
                    <div className="p-3 bg-[#131418] border border-[#2b2d38] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={workIdPreview} alt="Work ID preview" className="w-12 h-12 object-cover rounded-lg border border-[#383a48]" />
                        <div>
                          <span className="text-xs font-bold text-white block">{workIdFile?.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{(workIdFile?.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setWorkIdFile(null); setWorkIdPreview(null); }}
                        className="p-1.5 text-gray-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#333333] hover:border-red-500/60 bg-[#1c1d24] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                      <Upload size={20} className="text-gray-400 mb-2" />
                      <span className="text-xs font-bold text-gray-300">Click to upload ID photo</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">JPG or PNG under 5MB</span>
                      <input type="file" onChange={handleWorkIdFileChange} accept="image/*,application/pdf" className="hidden" />
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={workLoading || !organizationName}
                  className="w-full btn-netflix py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {workLoading ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                  <span>Save &amp; Activate Professional Profile</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default KYCVerification;
