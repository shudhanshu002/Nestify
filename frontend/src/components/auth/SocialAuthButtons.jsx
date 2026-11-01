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

  // Helper to load Facebook SDK
  const ensureFacebookSDK = (appId) => {
    return new Promise((resolve, reject) => {
      if (window.FB) return resolve(window.FB);

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        resolve(window.FB);
      };

      const existing = document.querySelector('script[src*="connect.facebook.net"]');
      if (existing) return;

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Unable to connect to Facebook SDK'));
      document.head.appendChild(script);
    });
  };

  // Real Google OAuth 2.0 Popup
  const handleGooglePopup = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

    if (!googleClientId) {
      onError && onError('Google Client ID is not configured. Please paste your Google OAuth 2.0 Client ID in frontend/.env (VITE_GOOGLE_CLIENT_ID).');
      return;
    }

    setLoadingProvider('google');
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
            setLoadingProvider(null);
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
            setLoadingProvider(null);
          }
        },
      });

      // Opens Google's native OAuth 2.0 popup dialog
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setLoadingProvider(null);
      onError && onError(err.message || 'Failed to open Google login popup');
    }
  };

  // Real Facebook OAuth Popup
  const handleFacebookPopup = async () => {
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID?.trim();

    if (!fbAppId) {
      onError && onError('Facebook App ID is not configured. Please paste your Facebook App ID in frontend/.env (VITE_FACEBOOK_APP_ID).');
      return;
    }

    setLoadingProvider('facebook');
    try {
      const FB = await ensureFacebookSDK(fbAppId);

      if (!FB) {
        throw new Error('Facebook SDK is unavailable');
      }

      FB.login((response) => {
        if (response.authResponse?.accessToken) {
          API.post('/auth/facebook', {
            accessToken: response.authResponse.accessToken,
            role
          })
          .then(({ data }) => {
            localStorage.setItem('token', data.token);
            onSuccess && onSuccess(data.user || data);
          })
          .catch((err) => {
            onError && onError(err.response?.data?.message || err.message || 'Facebook account verification failed');
          })
          .finally(() => {
            setLoadingProvider(null);
          });
        } else {
          setLoadingProvider(null);
          if (response.status !== 'connected') {
            onError && onError('Facebook sign-in was cancelled or closed');
          }
        }
      }, { scope: 'email,public_profile' });
    } catch (err) {
      setLoadingProvider(null);
      onError && onError(err.message || 'Failed to open Facebook login popup');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3.5">
      <button
        type="button"
        onClick={handleGooglePopup}
        disabled={loadingProvider !== null}
        className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-[#333333] hover:border-gray-500/50 text-gray-200 hover:text-white font-bold text-xs sm:text-sm transition-all duration-150 active:scale-98 cursor-pointer disabled:opacity-60 shadow-sm"
        title="Sign in with Google OAuth 2.0 Popup"
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
        onClick={handleFacebookPopup}
        disabled={loadingProvider !== null}
        className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-[#333333] hover:border-gray-500/50 text-gray-200 hover:text-white font-bold text-xs sm:text-sm transition-all duration-150 active:scale-98 cursor-pointer disabled:opacity-60 shadow-sm"
        title="Sign in with Facebook OAuth Popup"
      >
        {loadingProvider === 'facebook' ? (
          <Loader2 size={18} className="animate-spin text-[#1877F2]" />
        ) : (
          <FacebookIcon size={18} />
        )}
        <span>Facebook</span>
      </button>
    </div>
  );
};

export default SocialAuthButtons;
