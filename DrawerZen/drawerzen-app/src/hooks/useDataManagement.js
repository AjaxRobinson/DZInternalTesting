import { useState, useEffect, useCallback } from 'react';
import GoogleDriveService from '../services/GoogleDriveServiceNoCORS';

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
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    drawerDimensions: null,
    layoutConfig: null,
    orderData: null,
    uploadedImage: null // { url, fileId, fileName, crop, zoom, croppedAreaPixels, originalUrl }
  });

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  /**
   * Initialize data from sessionStorage or server
   */
  const initializeData = async () => {
    setIsLoading(true);
    try {
      // First try to load from sessionStorage
      const localData = GoogleDriveService.loadSessionFromLocal();
      if (localData) {
        setAppData(localData);
        setSessionId(GoogleDriveService.getSessionId());
        setHasSubmitted(true);
        
        // Also try to get latest data from server
        const serverResponse = await GoogleDriveService.getCustomerData();
        if (serverResponse.success && serverResponse.data) {
          const mergedData = mergeServerData(localData, serverResponse.data);
          setAppData(mergedData);
          GoogleDriveService.saveSessionToLocal(mergedData);
        }
      } else {
        // Check if there's a session ID in URL params (for returning customers)
        const urlParams = new URLSearchParams(window.location.search);
        const urlSessionId = urlParams.get('session');
        
        if (urlSessionId) {
          const serverResponse = await GoogleDriveService.getCustomerData(urlSessionId);
          if (serverResponse.success && serverResponse.data) {
            const restoredData = mapServerDataToAppData(serverResponse.data);
            setAppData(restoredData);
            setSessionId(urlSessionId);
            setHasSubmitted(true);
            GoogleDriveService.saveSessionToLocal(restoredData);
          }
        }
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update customer information
   */
  const updateCustomerInfo = useCallback((updates) => {
    setAppData(prev => {
      const newData = {
        ...prev,
        customerInfo: { ...prev.customerInfo, ...updates }
      };
      GoogleDriveService.saveSessionToLocal(newData);
      
      // If we've already submitted data, update the server
      if (hasSubmitted) {
        debouncedServerUpdate(updates);
      }
      
      return newData;
    });
  }, [hasSubmitted]);

  /**
   * Update drawer dimensions
   */
  const updateDrawerDimensions = useCallback((dimensions) => {
    setAppData(prev => {
      const newData = {
        ...prev,
        drawerDimensions: dimensions
      };
      GoogleDriveService.saveSessionToLocal(newData);
      
      if (hasSubmitted) {
        debouncedServerUpdate({
          drawerWidth: dimensions.width,
          drawerLength: dimensions.length,
          drawerHeight: dimensions.height
        });
      }
      
      return newData;
    });
  }, [hasSubmitted]);

  /**
   * Update layout configuration
   */
  const updateLayoutConfig = useCallback((layout) => {
    setAppData(prev => {
      const newData = {
        ...prev,
        layoutConfig: layout
      };
      GoogleDriveService.saveSessionToLocal(newData);
      
      if (hasSubmitted) {
        debouncedServerUpdate({
          binCount: layout?.length || 0,
          orderDetails: JSON.stringify(layout)
        });
      }
      
      return newData;
    });
  }, [hasSubmitted]);

  /**
   * Update order data
   */
  const updateOrderData = useCallback((order) => {
    setAppData(prev => {
      const newData = {
        ...prev,
        orderData: order
      };
      GoogleDriveService.saveSessionToLocal(newData);
      
      if (hasSubmitted) {
        debouncedServerUpdate({
          totalPrice: order.total,
          status: 'review'
        });
      }
      
      return newData;
    });
  }, [hasSubmitted]);

  /**
   * Upload and store image
   */
  const uploadImage = useCallback(async (imageFile) => {
    setIsLoading(true);
    try {
      const result = await GoogleDriveService.uploadImage(imageFile);
      if (result.success) {
        setAppData(prev => {
          const newData = {
            ...prev,
            uploadedImage: {
              url: result.imageUrl,
              fileId: result.fileId,
              fileName: imageFile.name
            }
          };
          GoogleDriveService.saveSessionToLocal(newData);
          return newData;
        });

        // Update server if we've already submitted
        if (hasSubmitted) {
          await GoogleDriveService.updateCustomerData({
            imageUrl: result.imageUrl
          });
        }

        return result;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [hasSubmitted]);

  /**
   * Update uploaded image with crop parameters or new URL
   */
  const updateUploadedImage = useCallback((imageData) => {
    setAppData(prev => {
      const newData = {
        ...prev,
        uploadedImage: {
          ...prev.uploadedImage,
          ...imageData
        }
      };
      GoogleDriveService.saveSessionToLocal(newData);
      return newData;
    });
  }, []);

  /**
   * Submit all data to server for the first time
   */
  const submitAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const customerData = {
        ...appData.customerInfo,
        drawerDimensions: appData.drawerDimensions,
        bins: appData.layoutConfig,
        totalPrice: appData.orderData?.total,
        imageUrl: appData.uploadedImage?.url || ''
      };

      const result = await GoogleDriveService.submitCustomerData(customerData);
      if (result.success) {
        setSessionId(result.sessionId);
        setHasSubmitted(true);
        
        // Update URL with session ID for future reference
        const url = new URL(window.location);
        url.searchParams.set('session', result.sessionId);
        window.history.replaceState({}, '', url);
        
        return result;
      } else {
        throw new Error('Failed to submit data');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [appData]);

  /**
   * Clear all data and start fresh
   */
  const clearAllData = useCallback(() => {
    GoogleDriveService.clearSession();
    setAppData({
      customerInfo: {
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      },
      drawerDimensions: null,
      layoutConfig: null,
      orderData: null,
      uploadedImage: null
    });
    setSessionId(null);
    setHasSubmitted(false);
    setError(null);
    
    // Clear session from URL
    const url = new URL(window.location);
    url.searchParams.delete('session');
    window.history.replaceState({}, '', url);
  }, []);

  // Debounced server update function
  const debouncedServerUpdate = useCallback(
    debounce(async (updates) => {
      try {
        await GoogleDriveService.updateCustomerData(updates);
      } catch (err) {
        console.error('Error updating server data:', err);
      }
    }, 1000),
    []
  );

  /**
   * Merge server data with local data (server takes precedence for most fields)
   */
  const mergeServerData = (localData, serverData) => {
    return {
      ...localData,
      customerInfo: {
        email: serverData.email || localData.customerInfo.email,
        firstName: serverData.firstname || localData.customerInfo.firstName,
        lastName: serverData.lastname || localData.customerInfo.lastName,
        phone: serverData.phone || localData.customerInfo.phone,
        address: serverData.address || localData.customerInfo.address,
        apartment: serverData.apartment || localData.customerInfo.apartment,
        city: serverData.city || localData.customerInfo.city,
        state: serverData.state || localData.customerInfo.state,
        zipCode: serverData.zipcode || localData.customerInfo.zipCode,
        country: serverData.country || localData.customerInfo.country
      },
      drawerDimensions: serverData.drawerwidth ? {
        width: serverData.drawerwidth,
        length: serverData.drawerlength,
        height: serverData.drawerheight
      } : localData.drawerDimensions,
      layoutConfig: serverData.orderdetails ? JSON.parse(serverData.orderdetails) : localData.layoutConfig,
      orderData: serverData.totalprice ? { total: serverData.totalprice } : localData.orderData,
      uploadedImage: serverData.imageurl ? { url: serverData.imageurl } : localData.uploadedImage
    };
  };

  /**
   * Map server data format to app data format
   */
  const mapServerDataToAppData = (serverData) => {
    return {
      customerInfo: {
        email: serverData.email || '',
        firstName: serverData.firstname || '',
        lastName: serverData.lastname || '',
        phone: serverData.phone || '',
        address: serverData.address || '',
        apartment: serverData.apartment || '',
        city: serverData.city || '',
        state: serverData.state || '',
        zipCode: serverData.zipcode || '',
        country: serverData.country || 'US'
      },
      drawerDimensions: serverData.drawerwidth ? {
        width: serverData.drawerwidth,
        length: serverData.drawerlength,
        height: serverData.drawerheight
      } : null,
      layoutConfig: serverData.orderdetails ? JSON.parse(serverData.orderdetails) : null,
      orderData: serverData.totalprice ? { total: serverData.totalprice } : null,
      uploadedImage: serverData.imageurl ? { url: serverData.imageurl } : null
    };
  };

  return {
    // State
    appData,
    isLoading,
    error,
    sessionId,
    hasSubmitted,
    
    // Actions
    updateCustomerInfo,
    updateDrawerDimensions,
    updateLayoutConfig,
    updateOrderData,
    uploadImage,
    updateUploadedImage,
    submitAllData,
    clearAllData,
    
    // Utilities
    setError: (err) => setError(err)
  };
};

/**
 * Simple debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
