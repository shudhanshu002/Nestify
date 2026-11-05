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

const SocialAuthButtons = ({ role = 'TENANT', onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  // Helper to load Google Identity Services client script
  const ensureGoogleSDK = () => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) return resolve(window.google.accounts.oauth2);
      
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.google?.accounts?.oauth2));
        existing.addEventListener('error', () => reject(new Error('Failed to load Google SDK')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google?.accounts?.oauth2);
      script.onerror = () => reject(new Error('Unable to connect to Google Identity Services'));
      document.head.appendChild(script);
    });
  };

  // Real Google OAuth 2.0 Popup
  const handleGooglePopup = async () => {
    const googleClientId = (
      import.meta.env.CLIENT_ID_GOOGLE || 
      import.meta.env.VITE_GOOGLE_CLIENT_ID
    )?.trim();

    if (!googleClientId) {
      onError && onError('Google Client ID is not configured. Please paste your Google OAuth 2.0 Client ID in frontend/.env (CLIENT_ID_GOOGLE).');
      return;
    }

    setLoading(true);
    try {
      const googleOAuth = await ensureGoogleSDK();

      if (!googleOAuth) {
        throw new Error('Google Identity Services SDK is unavailable');
      }

      const tokenClient = googleOAuth.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setLoading(false);
            onError && onError(tokenResponse.error_description || tokenResponse.error || 'Google sign-in was cancelled');
            return;
          }

          try {
            const { data } = await API.post('/auth/google', {
              accessToken: tokenResponse.access_token,
              role
            });
            localStorage.setItem('token', data.token);
            onSuccess && onSuccess(data.user || data);
          } catch (err) {
            onError && onError(err.response?.data?.message || err.message || 'Google account verification failed');
          } finally {
            setLoading(false);
          }
        },
      });

      // Opens Google's native OAuth 2.0 popup dialog
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setLoading(false);
      onError && onError(err.message || 'Failed to open Google login popup');
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGooglePopup}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-[#333333] hover:border-gray-500/50 text-gray-200 hover:text-white font-bold text-xs sm:text-sm transition-all duration-150 active:scale-98 cursor-pointer disabled:opacity-60 shadow-sm"
        title="Sign in with Google OAuth 2.0"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin text-primary" />
        ) : (
          <GoogleIcon size={18} />
        )}
        <span>Continue with Google</span>
      </button>
    </div>
  );
};

export default SocialAuthButtons;
