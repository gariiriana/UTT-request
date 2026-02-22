import { useState } from 'react';
import { MaterialRequest } from '../../types';
import { CheckCircle2, ImageIcon, Loader2, Upload } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { compressImageToBase64, validateImageFile } from '../../lib/imageUtils';

interface UploadPurchaseProofPageProps {
  requests: MaterialRequest[];
  onUploadProof: (requestId: string, base64Image: string) => void;
  onCompleteDelivery: (requestId: string, notes: string) => void;
}

export function UploadPurchaseProofPage({ requests, onUploadProof, onCompleteDelivery }: UploadPurchaseProofPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Filter requests that need purchase proof upload (BOD approved but no proof yet)
  const needProofRequests = requests.filter(
    r => r.status === 'Approved - Purchasing Processing' && !r.purchaseProofBase64
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);

    try {
      const base64 = await compressImageToBase64(file);
      setImagePreview(base64);
    } catch (error) {
      alert('Gagal memproses gambar. Silakan coba lagi.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (requestId: string) => {
    if (!imagePreview) {
      alert('Mohon upload foto bukti pembelian terlebih dahulu');
      return;
    }

    if (!deliveryNotes.trim()) {
      alert('Mohon isi catatan pengiriman terlebih dahulu');
      return;
    }

    setUploading(true);

    try {
      // Upload proof dan complete delivery sekaligus
      onUploadProof(requestId, imagePreview);
      onCompleteDelivery(requestId, deliveryNotes);

      // Reset form
      setShowModal(false);
      setSelectedRequest(null);
      setImagePreview(null);
      setDeliveryNotes('');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Gagal menyelesaikan pembelian. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const openModal = (requestId: string) => {
    setSelectedRequest(requestId);
    setImagePreview(null);
    setDeliveryNotes('');
    setShowModal(true);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white mb-2">Complete Purchase</h1>
        <p className="text-slate-400">Upload foto bukti pembelian dan lengkapi delivery notes untuk finalisasi pembelian</p>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <ImageIcon className="text-blue-400 mt-1 flex-shrink-0" size={20} />
          <div>
            <p className="text-blue-400 mb-1">Tentang Foto Bukti Pembelian</p>
            <p className="text-blue-300 text-sm">
              Foto tidak disimpan ke storage eksternal, melainkan dikompresi dan disimpan langsung di database sebagai data.
              Project Manager dapat melihat bukti bahwa barang sudah dibeli.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Count */}
      <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <p className="text-orange-400">
          {needProofRequests.length} item{needProofRequests.length !== 1 ? 's' : ''} belum ada bukti pembelian
        </p>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {needProofRequests.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <CheckCircle2 className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">Semua item sudah ada bukti pembelian</p>
            <p className="text-slate-500 text-sm mt-2">Tidak ada item yang memerlukan upload bukti</p>
          </div>
        ) : (
          needProofRequests.map((request) => (
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

                  {/* 🎯 Display BOD Selected Recommendation */}
                  {request.purchasingRecommendations && request.purchasingRecommendations.length > 0 && (() => {
                    const selectedRec = request.purchasingRecommendations.find(rec => rec.selectedByBod);

                    // Debug info - will remove after testing
                    console.log('🔍 Complete Purchase - Request:', request.itemName);
                    console.log('📦 Total Recommendations:', request.purchasingRecommendations.length);
                    console.log('✅ Selected by BOD:', selectedRec ? 'YES' : 'NO');
                    if (selectedRec) {
                      console.log('📋 Selected Recommendation:', selectedRec);
                    }

                    if (selectedRec) {
                      return (
                        <div className="mt-4 p-5 bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-500/40 rounded-lg shadow-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-green-500/20 rounded-full">
                              <CheckCircle2 className="text-green-400" size={16} />
                            </div>
                            <p className="text-green-400 font-medium">✅ Rekomendasi yang Dipilih BOD</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-1">📦 Item Type</p>
                              <p className="text-sm text-white">{selectedRec.itemType}</p>
                            </div>
                            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-1">💰 Unit Price</p>
                              <p className="text-sm text-green-400 font-medium">Rp {selectedRec.unitPrice.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                              <p className="text-xs text-green-400 mb-1">💵 Total Price</p>
                              <p className="text-sm text-green-400 font-bold">Rp {selectedRec.totalPrice.toLocaleString('id-ID')}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-1">📅 Estimasi Kedatangan</p>
                              <p className="text-sm text-white">{new Date(selectedRec.estimatedArrival).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                            </div>
                            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
                              <p className="text-xs text-slate-400 mb-1">💳 Payment Terms</p>
                              <p className="text-sm text-white">{selectedRec.paymentTerms}</p>
                            </div>
                          </div>

                          {selectedRec.notes && (
                            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-xs text-blue-400 mb-1">📝 Catatan Tambahan</p>
                              <p className="text-sm text-slate-300">{selectedRec.notes}</p>
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-green-500/20">
                            <p className="text-xs text-slate-400">
                              <span className="text-green-400">✓</span> Silakan lakukan pembelian sesuai rekomendasi ini dan upload bukti pembelian
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      // Show warning if no recommendation selected
                      return (
                        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-400 text-sm">⚠️ BOD belum memilih rekomendasi untuk item ini</p>
                        </div>
                      );
                    }
                  })()}

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Purchase Details</p>
                      <p className="text-white">Unit Price: Rp {request.unitPrice?.toLocaleString('id-ID')}</p>
                      <p className="text-blue-400">Total: Rp {request.totalPrice?.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">BOD Approval</p>
                      <p className="text-white text-sm">
                        Approved by: {request.bodApprovedBy || 'BOD'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {request.bodApprovedAt && new Date(request.bodApprovedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(request.id)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Upload size={20} />
                    Upload Proof
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showModal && selectedRequest && (() => {
        const request = needProofRequests.find(r => r.id === selectedRequest);
        if (!request) return null;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full">
              <h3 className="text-white mb-4">Upload Bukti Pembelian</h3>

              <div className="mb-4 p-4 bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-400">Item:</p>
                <p className="text-white">{request.itemName}</p>
                <p className="text-sm text-blue-400 mt-2">
                  Total: Rp {request.totalPrice?.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-slate-300 mb-2">Foto Bukti Pembelian *</label>
                <p className="text-xs text-slate-500 mb-3">
                  Upload foto invoice, nota, atau bukti transfer. Max 10MB, akan di-compress otomatis.
                </p>

                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-64 mx-auto rounded-lg border border-slate-700"
                      />
                      <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 size={16} />
                        <span>Foto siap di-upload</span>
                      </div>
                      <label
                        htmlFor={`file-input-${request.id}`}
                        className="inline-block px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer text-sm"
                      >
                        Ganti Foto
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor={`file-input-${request.id}`}
                      className="cursor-pointer block"
                    >
                      <Upload className="mx-auto text-slate-500 mb-3" size={48} />
                      <p className="text-slate-400 mb-1">
                        {uploading ? 'Memproses...' : 'Klik untuk upload foto'}
                      </p>
                      <p className="text-xs text-slate-500">JPG, PNG, atau WebP</p>
                    </label>
                  )}
                  <input
                    id={`file-input-${request.id}`}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-slate-300 mb-2">Catatan Pengiriman *</label>
                <p className="text-xs text-slate-500 mb-3">
                  Isi catatan pengiriman untuk melengkapi proses pembelian.
                </p>

                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-4 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Masukkan catatan pengiriman..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                    setImagePreview(null);
                    setDeliveryNotes('');
                  }}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(request.id)}
                  disabled={!imagePreview || !deliveryNotes.trim() || uploading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Complete Purchase
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}