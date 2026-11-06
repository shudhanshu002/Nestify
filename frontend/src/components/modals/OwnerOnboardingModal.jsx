import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '../../api/client';
import { 
  Building2, ShieldCheck, CheckCircle2, AlertCircle, 
  X, Loader2, Landmark, FileText, UserCheck, Phone, 
  Upload, Mail, AlertTriangle, FileSpreadsheet, Lock
} from 'lucide-react';

const INDIAN_CITIES = [
  'Bangalore', 'Delhi-NCR', 'Mumbai', 'Pune', 'Hyderabad', 
  'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh'
];

const OwnerOnboardingModal = ({ isOpen, onClose, onSuccess, user, switchRole }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    entityType: 'INDIVIDUAL',
    businessName: '',
    operatingCity: 'Bangalore',
    panNumber: user?.ownerDetails?.panNumber || '',
    gstin: user?.ownerDetails?.gstin || '',
    accountHolderName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    bankName: user?.ownerDetails?.bankDetails?.bankName || '',
    accountNumber: user?.ownerDetails?.bankDetails?.accountNumber || '',
    confirmAccountNumber: user?.ownerDetails?.bankDetails?.accountNumber || '',
    ifscCode: user?.ownerDetails?.bankDetails?.ifscCode || '',
    ownershipDeclaration: false,
    legalAgreementAccepted: false
  });

  // KYC Document Upload State
  const [kycDocType, setKycDocType] = useState('AADHAAR');
  const [kycFile, setKycFile] = useState(null);
  const [kycFileName, setKycFileName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Sync latest user details
      if (user) {
        setFormData(prev => ({
          ...prev,
          firstName: prev.firstName || user.firstName || '',
          lastName: prev.lastName || user.lastName || '',
          phone: prev.phone || user.phone || '',
          accountHolderName: prev.accountHolderName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
        }));
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Real-time format validators
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const isPanValid = panRegex.test(formData.panNumber.toUpperCase().trim());

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const isIfscValid = ifscRegex.test(formData.ifscCode.toUpperCase().trim());

  const isPhoneValid = (formData.phone || '').trim().length >= 10;
  const isAccountValid = formData.accountNumber.trim().length >= 8 && 
    formData.accountNumber === formData.confirmAccountNumber;

  const isNameValid = !!formData.firstName.trim();
  const isEmailVerified = !!user?.isEmailVerified;

  const hasExistingKyc = user?.kycStatus === 'VERIFIED' || user?.kycStatus === 'PENDING' || (user?.kycDocuments && user?.kycDocuments.length > 0);
  const isKycSatisfied = hasExistingKyc || !!kycFile;

  const canSubmit = isEmailVerified && isNameValid && isPanValid && isIfscValid && 
    isPhoneValid && isAccountValid && isKycSatisfied &&
    formData.accountHolderName.trim() && formData.ownershipDeclaration && 
    formData.legalAgreementAccepted;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Document file size must be less than 5MB.');
        return;
      }
      setKycFile(file);
      setKycFileName(file.name);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEmailVerified) {
      setError('Email verification is required before converting to a Landlord account. Please verify your email first.');
      return;
    }

    if (!isNameValid) {
      setError('Please provide your legal first name.');
      return;
    }

    if (!isPhoneValid) {
      setError('Please provide a valid 10-digit primary phone contact number.');
      return;
    }

    if (!hasExistingKyc && !kycFile) {
      setError('Government Identity Document (Aadhaar / PAN / Passport) upload is required to verify your identity.');
      return;
    }

    if (!isPanValid) {
      setError('Invalid PAN Number. Please enter a valid 10-character PAN (e.g. ABCDE1234F).');
      return;
    }

    if (!isAccountValid) {
      setError('Bank Account numbers must match and be at least 8 digits.');
      return;
    }

    if (!isIfscValid) {
      setError('Invalid IFSC Code format (e.g. HDFC0001234).');
      return;
    }

    if (!formData.ownershipDeclaration || !formData.legalAgreementAccepted) {
      setError('You must accept the legal declarations and Landlord Terms of Service.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload KYC Document if user has newly selected a document file
      if (kycFile) {
        const kycFormData = new FormData();
        kycFormData.append('document', kycFile);
        kycFormData.append('docType', kycDocType);
        kycFormData.append('documentType', kycDocType);

        await API.post('/users/kyc-upload', kycFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 2. Prepare Verified Landlord Payload
      const ownerPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        entityType: formData.entityType,
        businessName: formData.businessName.trim(),
        operatingCity: formData.operatingCity,
        panNumber: formData.panNumber.toUpperCase().trim(),
        gstin: formData.gstin.toUpperCase().trim(),
        bankDetails: {
          accountHolderName: formData.accountHolderName.trim(),
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifscCode.toUpperCase().trim()
        },
        ownershipDeclaration: true,
        legalAgreementAccepted: true
      };

      // 3. Switch role to OWNER with complete verification data
      const res = await switchRole('OWNER', ownerPayload);
      if (res.success) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Failed to complete owner verification.');
      }
    } catch (err) {
      console.error('Owner onboarding error:', err);
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#16161a] border border-[#262838] rounded-3xl p-6 sm:p-8 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-t-3xl"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#222432] transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
            <Building2 size={24} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1">
              <ShieldCheck size={12} /> Host Identity &amp; Business Verification
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Convert to Landlord Account
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Before converting, your user profile, government identity, and banking payout details must be fully verified.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/40 text-red-300 rounded-xl text-xs sm:text-sm border border-red-800/40 font-medium flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Warning Notice */}
        {(!isEmailVerified || !isPhoneValid || !hasExistingKyc) && (
          <div className="mb-5 p-4 bg-amber-950/40 border border-amber-600/50 rounded-2xl flex items-start gap-3 text-amber-200">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-black uppercase tracking-wider block text-amber-300 mb-0.5">
                Warning: Verification Required Before Landlord Switch
              </span>
              You must verify your resident details (Email, Phone Number, and Government Identity) before switching to a Landlord account. Complete the required fields below or visit the <a href="/verify-identity" className="underline font-bold text-amber-300 hover:text-white">Verification Hub</a>.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: User Level Verification Checklist & Identity */}
          <div className="p-4 bg-[#111218] border border-[#232635] rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <UserCheck size={14} className="text-emerald-400" />
                Step 1: User Identity &amp; Contact Verification
              </span>
              <span className="text-[10px] font-bold text-gray-500">MANDATORY</span>
            </div>

            {/* Email Verification Status */}
            <div className="flex items-center justify-between p-2.5 bg-[#181a24] rounded-xl border border-[#282b3c] text-xs">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-gray-400" />
                <span className="text-gray-300 font-medium">{user?.email || 'Registered Email'}</span>
              </div>
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 size={12} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px] bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  <AlertTriangle size={12} /> Action Required
                </span>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Legal First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-xl bg-[#1d1f2b] border border-[#2e3245] py-2 px-3 text-white text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Legal Last Name
                </label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-xl bg-[#1d1f2b] border border-[#2e3245] py-2 px-3 text-white text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center justify-between">
                  <span>Primary Host Contact Phone *</span>
                  {isPhoneValid && (
                    <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> 10 Digits Validated
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-2.5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full rounded-xl bg-[#1d1f2b] border border-[#2e3245] py-2 pl-9 pr-3 text-white text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* KYC Government Document Verification Section */}
            <div className="pt-2 border-t border-[#232635] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                  <FileText size={13} className="text-emerald-400" />
                  Government Identity Document (KYC)
                </span>
                {user?.kycStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={11} /> KYC Cleared
                  </span>
                ) : user?.kycStatus === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    ⏳ Document Under Review
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold text-[10px]">Upload Required</span>
                )}
              </div>

              {user?.kycStatus !== 'VERIFIED' && (
                <div className="p-3 bg-[#181a24] rounded-xl border border-[#282b3c] space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Document Type:</span>
                    <select
                      value={kycDocType}
                      onChange={(e) => setKycDocType(e.target.value)}
                      className="rounded-lg bg-[#222432] border border-[#33374c] py-1 px-2.5 text-white text-[11px] font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option value="AADHAAR">Aadhaar Card (Front/Back)</option>
                      <option value="PAN">PAN Card</option>
                      <option value="PASSPORT">Passport</option>
                    </select>
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      id="owner-kyc-upload"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="owner-kyc-upload"
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-[#3a3f57] hover:border-emerald-500/60 bg-[#14151e] hover:bg-[#1a1c29] text-gray-300 hover:text-white transition cursor-pointer text-xs font-medium"
                    >
                      <Upload size={14} className="text-emerald-400" />
                      <span>{kycFileName ? `Selected: ${kycFileName}` : 'Click to Upload Aadhaar / Govt ID (Max 5MB)'}</span>
                    </label>
                  </div>
                  {kycFileName && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 font-medium px-1">
                      <span>✓ Document attached: {kycFileName}</span>
                      <button
                        type="button"
                        onClick={() => { setKycFile(null); setKycFileName(''); }}
                        className="text-red-400 hover:underline text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Entity & Operations */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <Building2 size={14} className="text-emerald-400" />
              <span>Step 2: Landlord &amp; Business Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Entity Category
                </label>
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="INDIVIDUAL">Individual Property Host</option>
                  <option value="REGISTERED_BUSINESS">Commercial Real Estate Firm</option>
                  <option value="AUTHORIZED_MANAGER">Authorized Property Manager</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Primary Operating City
                </label>
                <select
                  value={formData.operatingCity}
                  onChange={(e) => setFormData({ ...formData, operatingCity: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Brand / Business Name {formData.entityType === 'INDIVIDUAL' && '(Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={formData.entityType === 'INDIVIDUAL' ? "e.g. Skyline Residency (or leave blank)" : "Registered Enterprise Name"}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Legal Tax (PAN) & Escrow Banking */}
          <div className="space-y-3.5 pt-2 border-t border-[#232535]">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
              <Landmark size={14} className="text-emerald-400" />
              <span>Step 3: Legal Tax (PAN) &amp; Escrow Payout Banking</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center justify-between">
                  <span>Permanent Account Number (PAN) *</span>
                  {isPanValid && (
                    <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Valid PAN
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono font-bold tracking-wider placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="29AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Beneficiary Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Official Name matching Bank Account"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-medium placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center justify-between">
                  <span>IFSC Code *</span>
                  {isIfscValid && (
                    <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Valid IFSC
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="HDFC0001234"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono font-bold placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">
                  Bank Account Number *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Account Number"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center justify-between">
                  <span>Confirm Account Number *</span>
                  {isAccountValid && (
                    <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Matched
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Re-enter Account Number"
                  value={formData.confirmAccountNumber}
                  onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full rounded-xl bg-[#20222e] border border-[#2e3245] py-2.5 px-3 text-white text-xs font-mono placeholder-gray-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Legal Affirmations */}
          <div className="space-y-3 pt-2 border-t border-[#232535]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Step 4: Legal Declarations &amp; Lease Authority
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300 select-none">
              <input
                type="checkbox"
                required
                checked={formData.ownershipDeclaration}
                onChange={(e) => setFormData({ ...formData, ownershipDeclaration: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-[#333333] bg-[#222222] text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer shrink-0"
              />
              <span className="leading-relaxed">
                I confirm and declare that I hold legal property title ownership or authorized leasehold power of attorney for all co-living rooms and units I will list on Nestify.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300 select-none">
              <input
                type="checkbox"
                required
                checked={formData.legalAgreementAccepted}
                onChange={(e) => setFormData({ ...formData, legalAgreementAccepted: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-[#333333] bg-[#222222] text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer shrink-0"
              />
              <span className="leading-relaxed">
                I accept the Nestify Landlord Code of Conduct, Escrow Settlement Guidelines (6% fee or Annual Plan), and Tenant Anti-Discrimination Policy.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#232535]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-[#1e202b] hover:bg-[#282a39] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              <span>Verify All Details &amp; Activate Landlord</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default OwnerOnboardingModal;
