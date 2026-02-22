import { useState } from 'react';
import { MaterialRequest } from '../../types';
import { CheckCircle, Image as ImageIcon, ExternalLink, Download, X } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { ConfirmationModal } from '../ConfirmationModal';

interface ConfirmDeliveryPageProps {
  requests: MaterialRequest[];
  onConfirmDelivery: (requestId: string) => void;
}

export function ConfirmDeliveryPage({ requests, onConfirmDelivery }: ConfirmDeliveryPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageType, setPreviewImageType] = useState<'purchase' | 'delivery'>('purchase');
  const [currentRequestData, setCurrentRequestData] = useState<MaterialRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const awaitingConfirmationRequests = requests.filter(r => r.status === 'Delivered - Awaiting PM Confirmation');

  const handleConfirm = (requestId: string) => {
    setIsProcessing(true);
    onConfirmDelivery(requestId);
    setShowConfirmModal(false);
    setSelectedRequest(null);
    setIsProcessing(false);
  };

  const openModal = (requestId: string) => {
    setSelectedRequest(requestId);
    setShowConfirmModal(true);
  };

  const openImagePreview = (imageUrl: string, type: 'purchase' | 'delivery', request: MaterialRequest) => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageType(type);
    setCurrentRequestData(request);
    setShowImagePreview(true);
  };
  
  const downloadImage = () => {
    if (!previewImageUrl || !currentRequestData) return;
    
    const link = document.createElement('a');
    link.href = previewImageUrl;
    link.download = `${previewImageType === 'purchase' ? 'purchase_proof' : 'delivery_proof'}_${currentRequestData.id}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white mb-2">Confirm Delivery</h1>
        <p className="text-slate-400">Confirm receipt of delivered items</p>
      </div>

      {/* Pending Count */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400">
          {awaitingConfirmationRequests.length} item{awaitingConfirmationRequests.length !== 1 ? 's' : ''} awaiting confirmation
        </p>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {awaitingConfirmationRequests.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <CheckCircle className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No items awaiting confirmation</p>
            <p className="text-slate-500 text-sm mt-2">All delivered items have been confirmed</p>
          </div>
        ) : (
          awaitingConfirmationRequests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900 rounded-lg border border-slate-800 p-6 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white mb-1">{request.itemName}</h3>
                      <p className="text-sm text-slate-400">
                        {request.siteProject} • Qty: {request.quantity}
                      </p>
                    </div>
                    <StatusBadge status={request.status} size="sm" />
                  </div>

                  {/* Description */}
                  <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400 mb-2">Description:</p>
                    <p className="text-white">{request.description}</p>
                  </div>
                  
                  {/* Request Type Badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      request.requestType === 'Procurement' 
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                        : 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                    }`}>
                      {request.requestType}
                    </div>
                    {request.requestType === 'Borrowing' && (
                      <p className="text-xs text-slate-500">No purchase proof required</p>
                    )}
                  </div>

                  {/* Purchase Proof - Uploaded by Purchasing */}
                  {request.purchaseProofBase64 && (
                    <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="text-purple-400 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-purple-400 mb-2">Purchase Proof:</p>
                          
                          <button
                            onClick={() => openImagePreview(request.purchaseProofBase64!, 'purchase', request)}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm mb-2"
                          >
                            <ExternalLink size={16} />
                            View Purchase Proof
                          </button>

                          <div className="text-xs text-slate-400">
                            {request.purchaseProofUploadedAt && (
                              <p className="mt-1">
                                Uploaded at: {new Date(request.purchaseProofUploadedAt).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Information */}
                  {request.deliveryProof && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-blue-400 mb-2">Delivery Proof:</p>
                          
                          {/* View Button Only */}
                          <button
                            onClick={() => openImagePreview(request.deliveryProof!, 'delivery', request)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm mb-3"
                          >
                            <ExternalLink size={16} />
                            View Image
                          </button>

                          {request.deliveryNotes && (
                            <>
                              <p className="text-sm text-blue-400 mb-1">Delivery Notes:</p>
                              <p className="text-white text-sm">{request.deliveryNotes}</p>
                            </>
                          )}
                          <div className="mt-3 text-xs text-slate-400">
                            <p>Delivered by: {request.deliveredBy}</p>
                            {request.deliveredAt && (
                              <p className="mt-1">
                                Delivered at: {new Date(request.deliveredAt).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Delivery Notes Only (if no photo) */}
                  {!request.deliveryProof && request.deliveryNotes && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-sm text-blue-400 mb-1">Delivery Notes:</p>
                          <p className="text-white text-sm">{request.deliveryNotes}</p>
                          <div className="mt-3 text-xs text-slate-400">
                            <p>Delivered by: {request.deliveredBy}</p>
                            {request.deliveredAt && (
                              <p className="mt-1">
                                Delivered at: {new Date(request.deliveredAt).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-4">
                    <span>Requested by: {request.requestedBy}</span>
                    <span>•</span>
                    <span>Type: {request.requestType}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(request.id)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <CheckCircle size={20} />
                    Confirm Receipt
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedRequest && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={() => handleConfirm(selectedRequest)}
          title="Konfirmasi Penerimaan Barang"
          message="Apakah Anda yakin sudah menerima barang ini dan sesuai dengan permintaan?"
          type="confirm"
          loading={isProcessing}
        />
      )}

      {/* Image Preview Modal */}
      {showImagePreview && previewImageUrl && currentRequestData && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowImagePreview(false)}>
          <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-4xl w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${previewImageType === 'purchase' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                  <ImageIcon className={previewImageType === 'purchase' ? 'text-purple-400' : 'text-blue-400'} size={20} />
                </div>
                <div>
                  <h3 className="text-white">
                    {previewImageType === 'purchase' ? 'Bukti Pembelian' : 'Bukti Pengiriman'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentRequestData.itemName} - {currentRequestData.siteProject}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImagePreview(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Image Container */}
            <div className="relative bg-slate-950 p-6 flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '60vh' }}>
              <img
                src={previewImageUrl}
                alt={previewImageType === 'purchase' ? 'Purchase Proof' : 'Delivery Proof'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ maxHeight: '55vh' }}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="text-xs text-slate-400">
                {previewImageType === 'purchase' ? (
                  <>
                    <p>Uploaded: {currentRequestData.purchaseProofUploadedAt ? new Date(currentRequestData.purchaseProofUploadedAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }) : 'N/A'}</p>
                  </>
                ) : (
                  <>
                    <p>Delivered: {currentRequestData.deliveredAt ? new Date(currentRequestData.deliveredAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }) : 'N/A'}</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowImagePreview(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20"
                >
                  <Download size={18} />
                  Download Foto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}