/**
 * useOnlineStatus Hook
 * Detects network connectivity and provides online/offline state
 */

import { useState, useEffect } from 'react';
import { announceToScreenReader } from '../utils/accessibility';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      announceToScreenReader('Connection restored. You are now online.', 'polite');
    };

    const handleOffline = () => {
      setIsOnline(false);
      announceToScreenReader('Connection lost. You are now offline.', 'polite');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default useOnlineStatus;
