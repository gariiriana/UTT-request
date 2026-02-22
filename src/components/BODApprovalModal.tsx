import { useState } from 'react';
import { MaterialRequest, PurchasingRecommendation } from '../types';
import { CheckCircle, X } from 'lucide-react';

interface BODApprovalModalProps {
  isOpen: boolean;
  request: MaterialRequest | null;
  onClose: () => void;
  onApprove: (recommendationId?: string, remark?: string) => void;
  loading?: boolean;
}

export function BODApprovalModal({ isOpen, request, onClose, onApprove, loading }: BODApprovalModalProps) {
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen || !request) return null;

  const hasRecommendations = request.purchasingRecommendations && request.purchasingRecommendations.length > 0;

  const handleNext = () => {
    if (hasRecommendations && !selectedRecommendationId) {
      alert('Pilih salah satu rekomendasi untuk melanjutkan approval');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmApproval = () => {
    onApprove(selectedRecommendationId || undefined, remark || undefined);
    onClose();
    setSelectedRecommendationId(null);
    setRemark('');
    setShowConfirm(false);
  };

  const handleCloseModal = () => {
    onClose();
    setSelectedRecommendationId(null);
    setRemark('');
    setShowConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {!showConfirm ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-white text-xl">BOD Final Approval</h3>
                <p className="text-slate-400 text-sm mt-1">{request.itemName} - {request.siteProject}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Info Section */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  {hasRecommendations 
                    ? '💡 Purchasing telah memberikan rekomendasi vendor/supplier. Pilih salah satu untuk approval.' 
                    : '💡 Tidak ada rekomendasi dari Purchasing. Anda dapat langsung approve request ini.'}
                </p>
              </div>

              {/* Recommendations Section */}
              {hasRecommendations && (
                <div className="mb-6">
                  <h4 className="text-white mb-4">Pilih Rekomendasi</h4>
                  <div className="space-y-4">
                    {request.purchasingRecommendations!.map((rec: PurchasingRecommendation, index: number) => (
                      <div
                        key={rec.id}
                        onClick={() => setSelectedRecommendationId(rec.id)}
                        className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedRecommendationId === rec.id
                            ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20'
                            : 'bg-slate-800 border-slate-700 hover:border-green-500/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedRecommendationId === rec.id 
                                ? 'bg-green-500/30 text-green-400' 
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              <span className="font-bold">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{rec.itemType}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                by {rec.createdByName}
                              </p>
                            </div>
                          </div>
                          {selectedRecommendationId === rec.id && (
                            <CheckCircle className="text-green-400" size={24} />
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="p-3 bg-slate-900 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">📦 Item Type</p>
                            <p className="text-sm text-white">{rec.itemType}</p>
                          </div>
                          <div className="p-3 bg-slate-900 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">📅 Est. Arrival</p>
                            <p className="text-sm text-white">{new Date(rec.estimatedArrival).toLocaleDateString('id-ID')}</p>
                          </div>
                          <div className="p-3 bg-slate-900 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">💰 Unit Price</p>
                            <p className="text-sm text-purple-400 font-medium">Rp {rec.unitPrice.toLocaleString('id-ID')}</p>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            selectedRecommendationId === rec.id 
                              ? 'bg-green-500/10 border border-green-500/30' 
                              : 'bg-purple-500/10 border border-purple-500/30'
                          }`}>
                            <p className={`text-xs mb-1 ${
                              selectedRecommendationId === rec.id ? 'text-green-400' : 'text-purple-400'
                            }`}>💵 Total Price</p>
                            <p className={`text-sm font-bold ${
                              selectedRecommendationId === rec.id ? 'text-green-400' : 'text-purple-400'
                            }`}>Rp {rec.totalPrice.toLocaleString('id-ID')}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <div className="p-3 bg-slate-900 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">💳 Payment Terms</p>
                            <p className="text-sm text-white">{rec.paymentTerms}</p>
                          </div>
                          {rec.notes && (
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-xs text-blue-400 mb-1">📝 Notes</p>
                              <p className="text-sm text-slate-300">{rec.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remark Section */}
              <div className="mb-6">
                <label className="block text-white mb-2">Remark (Optional)</label>
                <p className="text-slate-400 text-sm mb-3">
                  Tambahkan catatan atau komentar untuk approval ini
                </p>
                <textarea
                  value={remark}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemark(e.target.value)}
                  placeholder="Masukkan remark (opsional)..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                >
                  <CheckCircle size={20} />
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation View */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-400" size={32} />
                </div>
                <h3 className="text-white text-xl mb-2">Confirm BOD Approval</h3>
                <p className="text-slate-400">
                  Apakah Anda yakin ingin approve request ini?
                </p>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 mb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Request:</span>
                    <span className="text-white">{request.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Project:</span>
                    <span className="text-white">{request.siteProject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="text-white">{request.quantity}</span>
                  </div>
                  {hasRecommendations && selectedRecommendationId && (
                    <div className="pt-3 border-t border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-green-400">Selected Recommendation:</span>
                        <span className="text-green-400 font-bold">
                          Rp {request.purchasingRecommendations!.find(r => r.id === selectedRecommendationId)?.totalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                  {remark && (
                    <div className="pt-3 border-t border-slate-700">
                      <span className="text-slate-400 block mb-1">Remark:</span>
                      <span className="text-white">{remark}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmApproval}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                >
                  {loading ? 'Loading...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}