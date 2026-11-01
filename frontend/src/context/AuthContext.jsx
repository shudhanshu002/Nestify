import { createContext, useState, useEffect, useCallback } from 'react';
import API from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Fetch and sync user's wishlist IDs
  const fetchWishlistIds = useCallback(async () => {
    try {
      const { data } = await API.get('/users/wishlist');
      if (Array.isArray(data)) {
        const ids = new Set(
          data
            .filter(item => item && item.property)
            .map(item => (item.property._id || item.property).toString())
        );
        setWishlistIds(ids);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await API.get('/users/profile'); 
        const userData = data.data || data;
        setUser(userData);
        fetchWishlistIds();
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
        setWishlistIds(new Set());
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('token')) checkUser();
    else setLoading(false);
  }, [fetchWishlistIds]);

  const login = useCallback(async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    const userData = data.user || data;
    setUser(userData);
    fetchWishlistIds();
    return userData;
  }, [fetchWishlistIds]);

  const googleLogin = useCallback(async (credentialOrToken, role = 'TENANT') => {
    const payload = typeof credentialOrToken === 'string'
      ? { credential: credentialOrToken, role }
      : { ...credentialOrToken, role };
    const { data } = await API.post('/auth/google', payload);
    localStorage.setItem('token', data.token);
    const userData = data.user || data;
    setUser(userData);
    fetchWishlistIds();
    return userData;
  }, [fetchWishlistIds]);

  const facebookLogin = useCallback(async (authData, role = 'TENANT') => {
    const payload = typeof authData === 'string'
      ? { accessToken: authData, role }
      : { ...authData, role };
    const { data } = await API.post('/auth/facebook', payload);
    localStorage.setItem('token', data.token);
    const userData = data.user || data;
    setUser(userData);
    fetchWishlistIds();
    return userData;
  }, [fetchWishlistIds]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setWishlistIds(new Set());
  }, []);

  // Central toggle wishlist with optimistic UI updates
  const toggleWishlist = useCallback(async (propertyId) => {
    if (!user) {
      return { success: false, requireLogin: true };
    }
    if (!propertyId) return { success: false };

    const propIdStr = propertyId.toString();
    const wasLiked = wishlistIds.has(propIdStr);

    setWishlistIds(prev => {
      const updated = new Set(prev);
      if (wasLiked) {
        updated.delete(propIdStr);
      } else {
        updated.add(propIdStr);
      }
      return updated;
    });

    try {
      const { data } = await API.post('/users/wishlist', { propertyId: propIdStr });
      return { 
        success: true, 
        isLiked: data.isFavorite !== undefined ? data.isFavorite : !wasLiked 
      };
    } catch (err) {
      setWishlistIds(prev => {
        const rollback = new Set(prev);
        if (wasLiked) rollback.add(propIdStr);
        else rollback.delete(propIdStr);
        return rollback;
      });
      console.error('Toggle Wishlist Error:', err);
      return { success: false, error: err };
    }
  }, [user, wishlistIds]);

  const isWishlisted = useCallback((propertyId) => {
    if (!propertyId) return false;
    return wishlistIds.has(propertyId.toString());
  }, [wishlistIds]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      googleLogin,
      facebookLogin,
      logout, 
      loading,
      wishlistIds,
      toggleWishlist,
      isWishlisted,
      refreshWishlist: fetchWishlistIds
    }}>
      {children}
    </AuthContext.Provider>
  );
};
