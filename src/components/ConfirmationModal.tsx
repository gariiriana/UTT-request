import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type: 'approve' | 'reject' | 'confirm';
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  loading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'approve':
        return <CheckCircle className="text-green-400" size={48} />;
      case 'reject':
        return <XCircle className="text-red-400" size={48} />;
      case 'confirm':
        return <AlertCircle className="text-blue-400" size={48} />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'approve':
        return 'bg-green-500 hover:bg-green-600 focus:ring-green-500';
      case 'reject':
        return 'bg-red-500 hover:bg-red-600 focus:ring-red-500';
      case 'confirm':
        return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
    }
  };

  const getConfirmText = () => {
    switch (type) {
      case 'approve':
        return 'Ya, Approve';
      case 'reject':
        return 'Ya, Reject';
      case 'confirm':
        return 'Ya, Confirm';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6 sm:p-8">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Title */}
        <h3 className="text-white text-xl sm:text-2xl text-center mb-3">
          {title}
        </h3>

        {/* Message */}
        <p className="text-slate-300 text-center mb-6 sm:mb-8">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
          >
            {loading ? 'Processing...' : getConfirmText()}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}