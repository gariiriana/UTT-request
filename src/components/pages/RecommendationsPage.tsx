import { useState } from 'react';
import { MaterialRequest } from '../../types';
import { ShoppingBag, Package, MapPin, Calendar, Plus, Eye, Info, CheckCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { PurchasingRecommendationModal } from './PurchasingRecommendationModal';

interface RecommendationsPageProps {
  requests: MaterialRequest[];
  onAddRecommendation: (requestId: string, recommendation: any) => void;
  onApprove: (requestId: string, remark?: string) => void; // ✅ ADD remark parameter
  onReject: (requestId: string, remark: string) => void; // ✅ ADD
  onViewDetails: (requestId: string) => void;
}

export function RecommendationsPage({ 
  requests, 
  onAddRecommendation,
  onApprove, // ✅ ADD
  onReject, // ✅ ADD
  onViewDetails 
}: RecommendationsPageProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectRemark, setRejectRemark] = useState('');
  
  // ✅ ADD: Approve modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveRequestId, setApproveRequestId] = useState<string | null>(null);
  const [approveRemark, setApproveRemark] = useState('');

  // ✅ FIX: Tampilkan semua request yang relevan untuk Purchasing (tidak hanya yang perlu pricing)
  const eligibleRequests = requests.filter(
    req => 
      req.status !== 'Rejected' && 
      req.status !== 'Completed - Delivered' &&
      req.requestType === 'Procurement' // Only procurement needs recommendations
  );

  const openModal = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsModalOpen(true);
  };

  const handleSubmit = (requestId: string, recommendation: any) => {
    onAddRecommendation(requestId, recommendation);
    setIsModalOpen(false);
  };

  const openRejectModal = (requestId: string) => {
    setRejectRequestId(requestId);
    setRejectRemark('');
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    if (rejectRequestId) {
      onReject(rejectRequestId, rejectRemark);
      setRejectModalOpen(false);
    }
  };

  const openApproveModal = (requestId: string) => {
    setApproveRequestId(requestId);
    setApproveRemark('');
    setApproveModalOpen(true);
  };

  const handleApprove = () => {
    if (approveRequestId) {
      onApprove(approveRequestId, approveRemark);
      setApproveModalOpen(false);
    }
  };

  if (eligibleRequests.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-white mb-2">Add Recommendations</h1>
          <p className="text-slate-400">
            Berikan rekomendasi vendor/supplier untuk material request yang diajukan Project Manager
          </p>
        </div>

        <div className="flex items-center justify-center h-64 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="text-purple-400" size={32} />
            </div>
            <p className="text-slate-300 mb-2">Tidak ada request yang memerlukan rekomendasi</p>
            <p className="text-sm text-slate-400">
              Semua procurement requests sudah memiliki rekomendasi atau sudah completed
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-white mb-2">Procurement Management</h1>
        <p className="text-slate-400">
          Berikan rekomendasi vendor/supplier, add pricing, dan approve material request
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-300 mb-1">Total Requests</p>
              <p className="text-3xl text-white">{eligibleRequests.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
              <Package className="text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300 mb-1">With Recommendations</p>
              <p className="text-3xl text-white">
                {eligibleRequests.filter(r => r.purchasingRecommendations && r.purchasingRecommendations.length > 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
              <ShoppingBag className="text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300 mb-1">Need Recommendations</p>
              <p className="text-3xl text-white">
                {eligibleRequests.filter(r => !r.purchasingRecommendations || r.purchasingRecommendations.length === 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
              <Plus className="text-green-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {eligibleRequests.map((request) => {
          const recommendationCount = request.purchasingRecommendations?.length || 0;
          const hasRecommendation = recommendationCount > 0;
          
          // ✅ Check if Purchasing can approve this request
          const canApprove = request.status === 'Pending - Purchasing Pricing';
          const alreadyProcessed = request.status === 'Pending - BOD Final Approval' || 
                                   request.status === 'Approved - Purchasing Processing';

          return (
            <div
              key={request.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-purple-500/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Request Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                    <h3 className="text-white">{request.itemName}</h3>
                    <StatusBadge status={request.status} />
                    {hasRecommendation && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full">
                        <ShoppingBag size={14} className="text-purple-400" />
                        <span className="text-xs text-purple-300">
                          {recommendationCount} Recommendation{recommendationCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={16} className="text-green-400" />
                      <span>{request.siteProject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Package size={16} className="text-blue-400" />
                      <span>Qty: {request.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={16} className="text-purple-400" />
                      <span>{new Date(request.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                    {request.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openModal(request.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20"
                  >
                    <Plus size={16} />
                    Add Recommendation
                  </button>
                  
                  {/* ✅ Warning if cannot approve */}
                  {!canApprove && alreadyProcessed && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <Info size={14} className="text-amber-400 flex-shrink-0" />
                      <span className="text-xs text-amber-300">
                        Request sudah melewati tahap Purchasing
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => canApprove ? openApproveModal(request.id) : null}
                      disabled={!canApprove}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        canApprove
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/20 cursor-pointer'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => canApprove ? openRejectModal(request.id) : null}
                      disabled={!canApprove}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        canApprove
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20 cursor-pointer'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                  
                  <button
                    onClick={() => onViewDetails(request.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedRequestId && (() => {
        const selectedRequest = requests.find(r => r.id === selectedRequestId);
        return selectedRequest ? (
          <PurchasingRecommendationModal
            isOpen={isModalOpen}
            requestId={selectedRequestId}
            quantity={selectedRequest.quantity}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
          />
        ) : null;
      })()}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-white">Reject Request</h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">
              Apakah Anda yakin ingin menolak request ini? Silakan berikan alasan penolakan.
            </p>
            
            <textarea
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Alasan penolakan..."
              rows={4}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectRemark.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-white">Approve Request</h3>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">
              Apakah Anda yakin ingin menyetujui request ini? Silakan berikan alasan jika diperlukan.
            </p>
            
            <textarea
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Alasan (opsional)..."
              rows={4}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/20"
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}