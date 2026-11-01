import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import API from '../../api/client';

export const GoogleIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const FacebookIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
  </svg>
);

const SocialAuthButtons = ({ role = 'TENANT', onSuccess, onError }) => {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [modalProvider, setModalProvider] = useState(null);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');

  // Handle Google Auth Login
  const handleGoogleAuth = async () => {
    setLoadingProvider('google');
    try {
      // Check if real Google Client ID is configured in frontend environment
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (googleClientId && window.google?.accounts?.id) {
        // Use standard Google Identity Services prompt
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const { data } = await API.post('/auth/google', {
                credential: response.credential,
                role
              });
              localStorage.setItem('token', data.token);
              onSuccess && onSuccess(data.user || data);
            } catch (err) {
              onError && onError(err.response?.data?.message || 'Google authentication failed');
            } finally {
              setLoadingProvider(null);
            }
          }
        });
        window.google.accounts.id.prompt();
        return;
      }

      // If no external Google API script or dev mode, show quick Google one-click dialog
      setModalProvider('google');
    } catch (err) {
      onError && onError(err.message || 'Google login initiation failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Handle Facebook Auth Login
  const handleFacebookAuth = async () => {
    setLoadingProvider('facebook');
    try {
      const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

      if (fbAppId && window.FB) {
        window.FB.login(async (response) => {
          if (response.authResponse?.accessToken) {
            try {
              const { data } = await API.post('/auth/facebook', {
                accessToken: response.authResponse.accessToken,
                role
              });
              localStorage.setItem('token', data.token);
              onSuccess && onSuccess(data.user || data);
            } catch (err) {
              onError && onError(err.response?.data?.message || 'Facebook authentication failed');
            } finally {
              setLoadingProvider(null);
            }
          } else {
            setLoadingProvider(null);
          }
        }, { scope: 'email,public_profile' });
        return;
      }

      // If FB App ID is not yet configured or dev mode, open quick Facebook one-click dialog
      setModalProvider('facebook');
    } catch (err) {
      onError && onError(err.message || 'Facebook login initiation failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Submit simulated or client-side social verification
  const handleQuickSocialSubmit = async (e) => {
    e.preventDefault();
    if (!socialEmail) return;

    setLoadingProvider(modalProvider);
    try {
      const endpoint = modalProvider === 'google' ? '/auth/google' : '/auth/facebook';
      const nameParts = (socialName || (modalProvider === 'google' ? 'Google Resident' : 'Facebook Resident')).split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Resident';

      const payload = modalProvider === 'google' 
        ? {
            role,
            profile: {
              email: socialEmail.toLowerCase().trim(),
              given_name: firstName,
              family_name: lastName,
              avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=${modalProvider === 'google' ? 'EA4335' : '1877F2'}&color=fff`
            }
          }
        : {
            role,
            email: socialEmail.toLowerCase().trim(),
            firstName,
            lastName,
            avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=1877F2&color=fff`,
            id: `fb_${Date.now()}`
          };

      const { data } = await API.post(endpoint, payload);
      localStorage.setItem('token', data.token);
      setModalProvider(null);
      onSuccess && onSuccess(data.user || data);
    } catch (err) {
      onError && onError(err.response?.data?.message || `${modalProvider} authentication failed`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-[#333333] hover:border-gray-500/50 text-gray-200 hover:text-white font-bold text-xs sm:text-sm transition-all duration-150 active:scale-98 cursor-pointer disabled:opacity-60 shadow-sm"
        >
          {loadingProvider === 'google' ? (
            <Loader2 size={18} className="animate-spin text-primary" />
          ) : (
            <GoogleIcon size={18} />
          )}
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={handleFacebookAuth}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-[#333333] hover:border-gray-500/50 text-gray-200 hover:text-white font-bold text-xs sm:text-sm transition-all duration-150 active:scale-98 cursor-pointer disabled:opacity-60 shadow-sm"
        >
          {loadingProvider === 'facebook' ? (
            <Loader2 size={18} className="animate-spin text-[#1877F2]" />
          ) : (
            <FacebookIcon size={18} />
          )}
          <span>Facebook</span>
        </button>
      </div>

      {/* Quick Social Modal for direct 1-click connect */}
      {modalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#181818] border border-[#2e2e2e] rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-[#222222] border border-[#333333]">
                {modalProvider === 'google' ? <GoogleIcon size={24} /> : <FacebookIcon size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Continue with {modalProvider === 'google' ? 'Google' : 'Facebook'}
                </h3>
                <p className="text-xs text-gray-400">
                  Authenticate your account as <span className="font-bold text-primary">{role}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleQuickSocialSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  className="w-full rounded-xl bg-[#222222] border border-[#333333] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">
                  {modalProvider === 'google' ? 'Google Email' : 'Facebook Email'}
                </label>
                <input
                  type="email"
                  required
                  placeholder={modalProvider === 'google' ? 'alex@gmail.com' : 'alex@facebook.com'}
                  value={socialEmail}
                  onChange={(e) => setSocialEmail(e.target.value)}
                  className="w-full rounded-xl bg-[#222222] border border-[#333333] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalProvider(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingProvider !== null}
                  className={`btn-netflix px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer ${
                    modalProvider === 'facebook' ? 'bg-[#1877F2] hover:bg-[#166fe5]' : ''
                  }`}
                >
                  {loadingProvider !== null && <Loader2 size={14} className="animate-spin" />}
                  <span>Connect & Sign In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialAuthButtons;
