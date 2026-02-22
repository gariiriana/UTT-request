import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function FirebaseConnectionStatus() {
  const [_isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineWarning(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineWarning(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      setShowOfflineWarning(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineWarning) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
      <div className="bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-2xl border border-red-400 flex items-center gap-3">
        <WifiOff size={20} className="animate-pulse" />
        <div>
          <p className="font-medium">Tidak ada koneksi internet</p>
          <p className="text-sm text-red-100">Periksa koneksi Anda dan refresh halaman</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="ml-4 p-2 hover:bg-red-600 rounded-lg transition-colors"
          title="Refresh halaman"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  );
}
