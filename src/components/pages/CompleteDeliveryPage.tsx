import { useState } from 'react';
import { MaterialRequest } from '../../types';
import { CheckCircle, Package, Loader, Image as ImageIcon, Upload } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { compressImageToBase64, validateImageFile } from '../../lib/imageUtils';

interface CompleteDeliveryPageProps {
  requests: MaterialRequest[];
  onCompleteDelivery: (requestId: string, notes: string, deliveryPhotoBase64?: string) => void;
}

export function CompleteDeliveryPage({ requests, onCompleteDelivery }: CompleteDeliveryPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Only show requests that have purchase proof uploaded (for Procurement)
  const processingRequests = requests.filter(r =>
    r.status === 'Approved - Purchasing Processing' &&
    (r.requestType === 'Borrowing' || r.purchaseProofBase64) // Borrowing doesn't need proof, Procurement needs it
  );

  const handleSubmit = async (requestId: string) => {
    if (!deliveryNotes.trim()) {
      alert('Mohon isi catatan pengiriman');
      return;
    }

    setSubmitting(true);

    try {
      // Call parent handler
      onCompleteDelivery(requestId, deliveryNotes, imagePreview || undefined);

      // Reset form
      setShowModal(false);
      setSelectedRequest(null);
      setDeliveryNotes('');
      setImagePreview(null);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (requestId: string) => {
    setSelectedRequest(requestId);
    setShowModal(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      const base64 = await compressImageToBase64(file);
      setImagePreview(base64);
    } catch (error) {
      alert('Gagal memproses gambar. Silakan coba lagi.');
      console.error(error);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white mb-2">Complete Delivery</h1>
        <p className="text-slate-400">Mark purchases as delivered with delivery notes</p>
      </div>

      {/* Pending Count */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400">
          {processingRequests.length} purchase{processingRequests.length !== 1 ? 's' : ''} ready for completion
        </p>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {processingRequests.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <Package className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No items ready for delivery</p>
            <p className="text-slate-500 text-sm mt-2">Completed purchases will appear here</p>
          </div>
        ) : (
          processingRequests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900 rounded-lg border border-slate-800 p-6 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Purchase Details</p>
                      <p className="text-white">Unit Price: Rp {request.unitPrice?.toLocaleString('id-ID')}</p>
                      <p className="text-blue-400">Total: Rp {request.totalPrice?.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Request Info</p>
                      <p className="text-white text-sm">By: {request.requestedBy}</p>
                      <p className="text-slate-400 text-sm">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(request.id)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <CheckCircle size={20} />
                    Complete Delivery
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Completion Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full">
            {(() => {
              const request = processingRequests.find(r => r.id === selectedRequest);
              if (!request) return null;

              return (
                <>
                  <h3 className="text-white mb-4">Complete Delivery</h3>

                  <div className="mb-4 p-4 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400">Item:</p>
                    <p className="text-white">{request.itemName}</p>
                    <p className="text-sm text-slate-400 mt-2">Deliver to: {request.siteProject}</p>
                  </div>

                  {/* Show Purchase Proof if exists (for Procurement) */}
                  {request.purchaseProofBase64 && request.requestType === 'Procurement' && (
                    <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="text-purple-400" size={16} />
                        <p className="text-sm text-purple-400 font-medium">Purchase Proof Available</p>
                      </div>
                      <img
                        src={request.purchaseProofBase64}
                        alt="Purchase Proof"
                        className="w-full h-32 object-cover rounded-lg border border-purple-500/20 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = request.purchaseProofBase64!;
                          link.download = `purchase_proof_${request.id}.jpg`;
                          link.click();
                        }}
                      />
                      <p className="text-xs text-slate-400 mt-2">Click image to download</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-slate-300 mb-2">Delivery Notes *</label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Contoh: Barang sudah diterima dengan kondisi baik pada tanggal 18 Des 2024. Diterima oleh Bapak Joko."
                      rows={5}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Catatan wajib diisi: tanggal pengiriman, kondisi barang, nama penerima, dll.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-slate-300 mb-2">Upload Delivery Photo (Optional)</label>
                    <p className="text-xs text-slate-400 mb-2">Upload foto saat hand-over barang ke Project Manager</p>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={submitting}
                        className="hidden"
                        id={`upload-${request.id}`}
                      />
                      <label
                        htmlFor={`upload-${request.id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2 w-fit"
                      >
                        <Upload size={16} />
                        {imagePreview ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      {imagePreview && (
                        <div className="mt-2">
                          <img
                            src={imagePreview}
                            alt="Delivery Preview"
                            className="w-full h-48 object-cover rounded-lg border border-blue-500/30"
                          />
                          <p className="text-xs text-green-400 mt-2">✓ Foto siap di-upload</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedRequest(null);
                        setDeliveryNotes('');
                        setImagePreview(null);
                      }}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmit(request.id)}
                      disabled={!deliveryNotes.trim() || submitting}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      {submitting ? 'Menyimpan...' : 'Complete Delivery'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}