import { useState, useEffect } from 'react';
import { Bug, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { auth, db, storage } from '../lib/firebase';
import { User } from 'firebase/auth';

export function FirebaseDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    authInitialized: false,
    dbInitialized: false,
    storageInitialized: false,
    isOnline: navigator.onLine,
    currentUser: null as User | null
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        authInitialized: !!auth,
        dbInitialized: !!db,
        storageInitialized: !!storage,
        isOnline: navigator.onLine,
        currentUser: auth?.currentUser
      });
    };

    updateDebugInfo();

    // Listen to online/offline events
    window.addEventListener('online', updateDebugInfo);
    window.addEventListener('offline', updateDebugInfo);

    // Update every 2 seconds
    const interval = setInterval(updateDebugInfo, 2000);

    return () => {
      window.removeEventListener('online', updateDebugInfo);
      window.removeEventListener('offline', updateDebugInfo);
      clearInterval(interval);
    };
  }, []);

  // Only show in development (you can remove this in production)
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[90] p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition-colors"
        title="Firebase Debug Panel"
      >
        <Bug size={20} />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[90] w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-purple-500 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug size={18} className="text-white" />
              <h3 className="text-white font-medium">Firebase Debug</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-purple-600 p-1 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 text-sm">
            {/* Network Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Network:</span>
              <div className="flex items-center gap-2">
                {debugInfo.isOnline ? (
                  <>
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400">Online</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-400" />
                    <span className="text-red-400">Offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Auth Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Auth:</span>
              <div className="flex items-center gap-2">
                {debugInfo.authInitialized ? (
                  <>
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400">Ready</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-400" />
                    <span className="text-red-400">Not Init</span>
                  </>
                )}
              </div>
            </div>

            {/* Firestore Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Firestore:</span>
              <div className="flex items-center gap-2">
                {debugInfo.dbInitialized ? (
                  <>
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400">Ready</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-400" />
                    <span className="text-red-400">Not Init</span>
                  </>
                )}
              </div>
            </div>

            {/* Storage Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Storage:</span>
              <div className="flex items-center gap-2">
                {debugInfo.storageInitialized ? (
                  <>
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400">Ready</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-400" />
                    <span className="text-red-400">Not Init</span>
                  </>
                )}
              </div>
            </div>

            {/* Current User */}
            <div className="pt-3 border-t border-slate-700">
              <span className="text-slate-400 block mb-2">Current User:</span>
              {debugInfo.currentUser ? (
                <div className="bg-slate-800 p-2 rounded text-xs">
                  <div className="text-green-400">✓ Logged In</div>
                  <div className="text-slate-300 mt-1">
                    {debugInfo.currentUser.email}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 p-2 rounded text-xs text-slate-400">
                  Not logged in
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-700 space-y-2">
              <button
                onClick={() => {
                  console.log('=== FIREBASE DEBUG INFO ===');
                  console.log('Auth:', auth);
                  console.log('DB:', db);
                  console.log('Storage:', storage);
                  console.log('Current User:', auth?.currentUser);
                  console.log('Online:', navigator.onLine);
                }}
                className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
              >
                Log to Console
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
              >
                Refresh Page
              </button>
            </div>

            {/* Warning */}
            {!debugInfo.authInitialized && (
              <div className="pt-3 border-t border-slate-700">
                <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-400">
                    Firebase Auth not initialized. Check console for errors.
                  </div>
                </div>
              </div>
            )}

            {!debugInfo.isOnline && (
              <div className="pt-3 border-t border-slate-700">
                <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-400">
                    You are offline. Check your internet connection.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
