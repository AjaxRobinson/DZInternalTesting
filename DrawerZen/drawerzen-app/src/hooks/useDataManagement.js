import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing application data with automatic persistence
 * Customer info is completely isolated in separate storage
 */
export const useDataManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // State for all application data (EXCLUDING customer info)
  const [appData, setAppData] = useState({
    drawerDimensions: null,
    layoutConfig: null,
    orderData: null,
    uploadedImage: null
  });

  // Separate state for customer info
  const [customerInfo, setCustomerInfo] = useState({
    email: '', firstName: '', lastName: '', phone: '', address: '', 
    apartment: '', city: '', state: '', zipCode: '', country: 'US'
  });

  // Combined app data for external consumption
  const fullAppData = {
    customerInfo,
    ...appData
  };

  // Initialize data from storage
  useEffect(() => { initializeData(); }, []);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      // Initialize customer info separately
      initializeCustomerInfo();
      
      // Initialize other app data
      const sessionData = sessionStorage.getItem('drawerzen_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        setAppData({
          drawerDimensions: parsed.data.drawerDimensions || null,
          layoutConfig: parsed.data.layoutConfig || null,
          orderData: parsed.data.orderData || null,
          uploadedImage: parsed.data.uploadedImage || null
        });
        setSessionId(parsed.sessionId);
        setHasSubmitted(parsed.data.hasSubmitted || false);
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally { 
      setIsLoading(false); 
    }
  };

  // Separate customer info initialization
  const initializeCustomerInfo = useCallback(() => {
    try {
      const customerData = sessionStorage.getItem('drawerzen_customer_info');
      if (customerData) {
        const parsed = JSON.parse(customerData);
        setCustomerInfo(parsed);
      }
    } catch (err) {
      console.error('Error initializing customer info:', err);
    }
  }, []);

  // Separate customer info storage
  const saveCustomerInfoToStorage = useCallback((data) => {
    try {
      sessionStorage.setItem('drawerzen_customer_info', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save customer info:', e);
    }
  }, []);

  // Regular app data storage (unchanged)
  const saveSessionToLocal = useCallback((data) => {
    const basePayload = { 
      sessionId: sessionId || `session_${Date.now()}`, 
      data, 
      timestamp: Date.now() 
    };
    
    const tryWrite = (payload) => {
      sessionStorage.setItem('drawerzen_session', JSON.stringify(payload));
    };
    
    try {
      tryWrite(basePayload);
      if (!sessionId) setSessionId(basePayload.sessionId);
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message || ''))) {
        // Attempt truncation: remove large base64 images from uploadedImage
        try {
          const trimmed = { ...basePayload };
          if (trimmed.data?.uploadedImage) {
            const { underlay, url, ...rest } = trimmed.data.uploadedImage;
            trimmed.data.uploadedImage = { ...rest, truncated: true };
          }
          tryWrite(trimmed);
          console.warn('Session truncated due to quota; large image data not persisted');
          if (!sessionId) setSessionId(trimmed.sessionId);
        } catch (e2) {
          console.error('Session save failed after truncation', e2);
        }
      } else {
        console.error('Session save failed', e);
      }
    }
  }, [sessionId]);

  // Customer info update - COMPLETELY independent
  const updateCustomerInfo = useCallback((updates) => {
    setCustomerInfo(prev => {
      const newCustomerInfo = { ...prev, ...updates };
      saveCustomerInfoToStorage(newCustomerInfo);
      return newCustomerInfo;
    });
  }, [saveCustomerInfoToStorage]);

  // Other update functions - ONLY affect appData, never touch customer info
  const updateDrawerDimensions = useCallback((dimensions) => {
    setAppData(prev => { 
      const d = { ...prev, drawerDimensions: dimensions }; 
      saveSessionToLocal({ ...d, hasSubmitted }); 
      return d; 
    });
  }, [hasSubmitted, saveSessionToLocal]);

  const updateLayoutConfig = useCallback((layout) => {
    setAppData(prev => { 
      const d = { ...prev, layoutConfig: layout }; 
      saveSessionToLocal({ ...d, hasSubmitted }); 
      return d; 
    });
  }, [hasSubmitted, saveSessionToLocal]);

  const updateOrderData = useCallback((order) => {
    setAppData(prev => { 
      const d = { ...prev, orderData: order }; 
      saveSessionToLocal({ ...d, hasSubmitted }); 
      return d; 
    });
  }, [hasSubmitted, saveSessionToLocal]);

  const updateUploadedImage = useCallback((imageData) => {
    setAppData(prev => {
      const prevImg = prev.uploadedImage && typeof prev.uploadedImage === 'object' ? prev.uploadedImage : {};
      const d = { ...prev, uploadedImage: { ...prevImg, ...imageData } };
      saveSessionToLocal({ ...d, hasSubmitted });
      return d;
    });
  }, [hasSubmitted, saveSessionToLocal]);

  const submitAllData = useCallback(async () => {
    setHasSubmitted(true);
    
    // Save submitted status with current app data
    const currentAppData = { ...appData, hasSubmitted: true };
    saveSessionToLocal(currentAppData);
    
    return { success: true, sessionId };
  }, [appData, saveSessionToLocal, sessionId]);

  const clearAllData = useCallback(() => {
    try { 
      sessionStorage.removeItem('drawerzen_session'); 
      // DON'T remove customer info - keep it persistent
    } catch {}
    
    setAppData({
      drawerDimensions: null,
      layoutConfig: null,
      orderData: null,
      uploadedImage: null
    });
    
    setSessionId(null); 
    setHasSubmitted(false); 
    setError(null);
    
    // Save cleared state but preserve customer info
    saveSessionToLocal({
      drawerDimensions: null,
      layoutConfig: null,
      orderData: null,
      uploadedImage: null,
      hasSubmitted: false
    });
  }, [saveSessionToLocal]);

  return { 
    appData: fullAppData, 
    isLoading, 
    error, 
    sessionId, 
    hasSubmitted,
    updateCustomerInfo, 
    updateDrawerDimensions, 
    updateLayoutConfig, 
    updateOrderData, 
    updateUploadedImage, 
    submitAllData, 
    clearAllData, 
    setError: (e) => setError(e)
  };
};