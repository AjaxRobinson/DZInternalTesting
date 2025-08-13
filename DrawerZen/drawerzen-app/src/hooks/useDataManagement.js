import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing application data with automatic persistence
 */
export const useDataManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // State for all application data
  const [appData, setAppData] = useState({
    customerInfo: {
      email: '', firstName: '', lastName: '', phone: '', address: '', apartment: '', city: '', state: '', zipCode: '', country: 'US'
    },
    drawerDimensions: null,
    layoutConfig: null,
    orderData: null,
    uploadedImage: null // { url, fileName, underlay, rectifyMeta, originalExif }
  });

  // Use sessionStorage directly (was previously wrapped in service)
  useEffect(() => { initializeData(); }, []);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      const sessionData = sessionStorage.getItem('drawerzen_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        setAppData(parsed.data);
        setSessionId(parsed.sessionId);
        setHasSubmitted(true);
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally { setIsLoading(false); }
  };

  const saveSessionToLocal = (data) => {
    try {
      const payload = { sessionId: sessionId || `session_${Date.now()}`, data, timestamp: Date.now() };
      sessionStorage.setItem('drawerzen_session', JSON.stringify(payload));
      if (!sessionId) setSessionId(payload.sessionId);
    } catch (e) { console.error('Session save failed', e); }
  };

  const updateCustomerInfo = useCallback((updates) => {
    setAppData(prev => { const d = { ...prev, customerInfo: { ...prev.customerInfo, ...updates } }; saveSessionToLocal(d); return d; });
  }, []);

  const updateDrawerDimensions = useCallback((dimensions) => {
    setAppData(prev => { const d = { ...prev, drawerDimensions: dimensions }; saveSessionToLocal(d); return d; });
  }, []);

  const updateLayoutConfig = useCallback((layout) => {
    setAppData(prev => { const d = { ...prev, layoutConfig: layout }; saveSessionToLocal(d); return d; });
  }, []);

  const updateOrderData = useCallback((order) => {
    setAppData(prev => { const d = { ...prev, orderData: order }; saveSessionToLocal(d); return d; });
  }, []);

  const updateUploadedImage = useCallback((imageData) => {
    setAppData(prev => {
      const prevImg = prev.uploadedImage && typeof prev.uploadedImage === 'object' ? prev.uploadedImage : {};
      const d = { ...prev, uploadedImage: { ...prevImg, ...imageData } };
      saveSessionToLocal(d);
      return d;
    });
  }, []);

  const submitAllData = useCallback(async () => {
    // Placeholder: could push to Supabase later
    setHasSubmitted(true);
    return { success: true, sessionId };
  }, [sessionId]);

  const clearAllData = useCallback(() => {
    try { sessionStorage.removeItem('drawerzen_session'); } catch {}
    setAppData({
      customerInfo: { email: '', firstName: '', lastName: '', phone: '', address: '', apartment: '', city: '', state: '', zipCode: '', country: 'US' },
      drawerDimensions: null, layoutConfig: null, orderData: null, uploadedImage: null
    });
    setSessionId(null); setHasSubmitted(false); setError(null);
  }, []);

  return { appData, isLoading, error, sessionId, hasSubmitted,
    updateCustomerInfo, updateDrawerDimensions, updateLayoutConfig, updateOrderData, updateUploadedImage, submitAllData, clearAllData, setError: (e) => setError(e)
  };
};
