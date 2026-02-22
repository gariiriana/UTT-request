import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { db } from '../lib/firebase';
import { onSnapshotsInSync } from 'firebase/firestore';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [_firestoreSynced, setFirestoreSynced] = useState(true);

  useEffect(() => {
    // Monitor browser online/offline status
    const handleOnline = () => {
      console.log('🌐 Browser is ONLINE');
      setIsOnline(true);
      setJustReconnected(true);
      setShowBanner(true);

      // Hide banner after 3 seconds when back online
      setTimeout(() => {
        setShowBanner(false);
        setJustReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      console.log('📴 Browser is OFFLINE');
      setIsOnline(false);
      setShowBanner(true);
      setJustReconnected(false);
    };

    // Set initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ✅ Monitor Firestore sync status (no permissions needed)
    const unsubscribeFirestore = onSnapshotsInSync(db, () => {
      console.log('✅ Firestore is in sync');
      setFirestoreSynced(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeFirestore();
    };
  }, []);

  // Don't show banner if online and not just reconnected
  if (!showBanner) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}>
      <div className={`px-4 py-3 flex items-center justify-center gap-3 ${!isOnline
          ? 'bg-red-500/90 backdrop-blur-sm'
          : 'bg-green-500/90 backdrop-blur-sm'
        }`}>
        {!isOnline ? (
          <>
            <WifiOff className="text-white" size={20} />
            <span className="text-white text-sm font-medium">
              ⚠️ No internet connection. Working offline - data will sync when reconnected.
            </span>
          </>
        ) : justReconnected ? (
          <>
            <Wifi className="text-white" size={20} />
            <span className="text-white text-sm font-medium">
              ✅ Back online! Syncing data...
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}