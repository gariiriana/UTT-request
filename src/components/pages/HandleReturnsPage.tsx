import { useState } from 'react';
import { MaterialRequest, ReturnRecord } from '../../types';
import { RotateCcw, Package, Calendar, MapPin, CheckCircle, XCircle, Camera, X } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

interface HandleReturnsPageProps {
  requests: MaterialRequest[];
  onAcceptReturn: (requestId: string, returnRecordId: string, notes: string) => void; // ✅ Remove proofPhotos parameter
  onRejectReturn: (requestId: string, returnRecordId: string, notes: string, rejectionPhotos?: string[]) => void; // ✅ Add rejectionPhotos parameter
  onViewDetails: (requestId: string) => void;
}

export function HandleReturnsPage({ requests, onAcceptReturn, onRejectReturn, onViewDetails }: HandleReturnsPageProps) {
  const [selectedReturn, setSelectedReturn] = useState<{ requestId: string; returnRecord: ReturnRecord } | null>(null);
  const [modalType, setModalType] = useState<'accept' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionPhotos, setRejectionPhotos] = useState<string[]>([]); // ✅ Rename to rejectionPhotos

  // Get all requests with pending returns
  const requestsWithPendingReturns = requests.filter(req =>
    req.returnRecords && req.returnRecords.some(record => record.returnStatus === 'Pending')
  );

  const openAcceptModal = (requestId: string, returnRecord: ReturnRecord) => {
    setSelectedReturn({ requestId, returnRecord });
    setModalType('accept');
    setNotes('');
  };

  const openRejectModal = (requestId: string, returnRecord: ReturnRecord) => {
    setSelectedReturn({ requestId, returnRecord });
    setModalType('reject');
    setNotes('');
    setRejectionPhotos([]);
  };

  const closeModal = () => {
    setSelectedReturn(null);
    setModalType(null);
    setNotes('');
    setRejectionPhotos([]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRejectionPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setRejectionPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAccept = () => {
    if (selectedReturn) {
      onAcceptReturn(selectedReturn.requestId, selectedReturn.returnRecord.id, notes);
      closeModal();
    }
  };

  const handleReject = () => {
    if (selectedReturn && notes.trim()) {
      onRejectReturn(selectedReturn.requestId, selectedReturn.returnRecord.id, notes, rejectionPhotos);
      closeModal();
    }
  };

  if (requestsWithPendingReturns.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-white mb-2">Handle Item Returns</h1>
          <p className="text-slate-400">Review and process item returns from Project Managers</p>
        </div>

        <div className="flex items-center justify-center h-64 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="text-green-400" size={32} />
            </div>
            <p className="text-slate-300 mb-2">No pending returns</p>
            <p className="text-sm text-slate-400">
              All return requests have been processed
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-white mb-2">Handle Item Returns</h1>
        <p className="text-slate-400">Review and process item returns from Project Managers</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-300 mb-1">Pending Returns</p>
              <p className="text-3xl text-white">
                {requestsWithPendingReturns.reduce((sum, req) =>
                  sum + (req.returnRecords?.filter(r => r.returnStatus === 'Pending').length || 0), 0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/30 rounded-lg flex items-center justify-center">
              <RotateCcw className="text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300 mb-1">Total Requests</p>
              <p className="text-3xl text-white">{requestsWithPendingReturns.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
              <Package className="text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300 mb-1">Items to Process</p>
              <p className="text-3xl text-white">
                {requestsWithPendingReturns.reduce((sum, req) =>
                  sum + (req.returnRecords?.filter(r => r.returnStatus === 'Pending')
                    .reduce((qty, r) => qty + r.returnedQuantity, 0) || 0), 0
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
              <Package className="text-blue-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Return Requests List */}
      <div className="space-y-4">
        {requestsWithPendingReturns.map(request => {
          const pendingReturns = request.returnRecords?.filter(r => r.returnStatus === 'Pending') || [];

          return pendingReturns.map(returnRecord => (
            <div
              key={returnRecord.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-green-500/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Return Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                    <h3 className="text-white">{request.itemName}</h3>
                    <StatusBadge status="Return Requested" size="sm" />
                    <div className={`px-3 py-1 rounded-full text-xs border ${returnRecord.itemCondition === 'Good'
                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                      : returnRecord.itemCondition === 'Minor Damage'
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}>
                      {returnRecord.itemCondition}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Package size={16} className="text-green-400" />
                      <span>Return Qty: {returnRecord.returnedQuantity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={16} className="text-blue-400" />
                      <span>{request.siteProject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={16} className="text-purple-400" />
                      <span>{new Date(returnRecord.returnDate).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-slate-400">Requested by: </span>
                      <span className="text-white">{returnRecord.requestedByName}</span>
                    </div>
                    {returnRecord.returnReason && (
                      <div className="text-sm">
                        <span className="text-slate-400">Reason: </span>
                        <span className="text-slate-300">{returnRecord.returnReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 lg:w-48">
                  <button
                    onClick={() => openAcceptModal(request.id, returnRecord)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/20"
                  >
                    <CheckCircle size={16} />
                    Accept Return
                  </button>
                  <button
                    onClick={() => openRejectModal(request.id, returnRecord)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all shadow-lg shadow-red-500/20"
                  >
                    <XCircle size={16} />
                    Reject Return
                  </button>
                  <button
                    onClick={() => onViewDetails(request.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ));
        })}
      </div>

      {/* Accept Modal */}
      {modalType === 'accept' && selectedReturn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-green-500/30 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between border-b border-green-500/30">
              <h3 className="text-xl text-white">Accept Return</h3>
              <button onClick={closeModal} className="text-green-200 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Returning Item</p>
                <p className="text-white mb-3">{selectedReturn.returnRecord.itemName}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Quantity: </span>
                    <span className="text-white">{selectedReturn.returnRecord.returnedQuantity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Condition: </span>
                    <span className="text-white">{selectedReturn.returnRecord.itemCondition}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  placeholder="Add any notes about the returned item..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/20"
                >
                  Confirm Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modalType === 'reject' && selectedReturn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-lg shadow-2xl max-w-md w-full">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between border-b border-red-500/30">
              <h3 className="text-xl text-white">Reject Return</h3>
              <button onClick={closeModal} className="text-red-200 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">
                Please provide a reason for rejecting this return request.
              </p>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={4}
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Upload Proof Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-green-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="mx-auto text-slate-500 mb-2" size={32} />
                    <p className="text-sm text-slate-400">Click to upload photos</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB each</p>
                  </label>
                </div>

                {rejectionPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {rejectionPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Proof ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-slate-700"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!notes.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}