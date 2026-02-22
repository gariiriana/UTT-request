import { useState, useEffect } from 'react';
import { Calendar, FileText, X, Package } from 'lucide-react'; // ✅ REMOVE DollarSign
import { PurchasingRecommendation } from '../../types';


interface PurchasingRecommendationModalProps {
  isOpen: boolean;
  requestId: string;
  quantity: number; // ✅ ADD: Quantity from material request
  onClose: () => void;
  onSubmit: (requestId: string, recommendation: Omit<PurchasingRecommendation, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>) => void; // ✅ Update to exclude id
}

export function PurchasingRecommendationModal({
  isOpen,
  requestId,
  quantity, // ✅ ADD: Accept quantity
  onClose,
  onSubmit
}: PurchasingRecommendationModalProps) {
  const [formData, setFormData] = useState({
    itemType: '', // ✅ ADD: Item Type field
    estimatedArrival: '',
    unitPrice: '', // ✅ CHANGE: from 0 to empty string
    totalPrice: '', // ✅ CHANGE: from 0 to empty string
    paymentTerms: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ AUTO-CALCULATE: Total Price = Unit Price × Quantity
  useEffect(() => {
    const unitPrice = parseFloat(formData.unitPrice as string);
    if (!isNaN(unitPrice) && unitPrice > 0) {
      const calculatedTotal = unitPrice * quantity;
      setFormData(prev => ({ ...prev, totalPrice: calculatedTotal.toString() }));
    } else {
      setFormData(prev => ({ ...prev, totalPrice: '' }));
    }
  }, [formData.unitPrice, quantity]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.itemType) newErrors.itemType = 'Item type is required';
    if (!formData.estimatedArrival) newErrors.estimatedArrival = 'Estimated arrival is required';

    // ✅ Validate that estimated arrival is not in the past
    const selectedDate = new Date(formData.estimatedArrival);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    if (selectedDate < today) {
      newErrors.estimatedArrival = 'Estimated arrival date cannot be in the past';
    }

    const unitPrice = parseFloat(formData.unitPrice as string);
    const totalPrice = parseFloat(formData.totalPrice as string);

    if (!formData.unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
      newErrors.unitPrice = 'Unit price must be greater than 0';
    }
    if (!formData.totalPrice || isNaN(totalPrice) || totalPrice <= 0) {
      newErrors.totalPrice = 'Total price must be greater than 0';
    }
    if (!formData.paymentTerms) newErrors.paymentTerms = 'Payment terms are required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit with parsed numbers
    onSubmit(requestId, {
      ...formData,
      unitPrice,
      totalPrice
    });

    // Reset form
    setFormData({
      itemType: '',
      estimatedArrival: '',
      unitPrice: '',
      totalPrice: '',
      paymentTerms: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-white">Add Purchasing Recommendation</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Type */}
          <div>
            <label htmlFor="itemType" className="block text-slate-300 mb-2">
              Jenis Barang / Item Type <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                id="itemType"
                type="text"
                placeholder="Contoh: Kabel Fiber Optic 100m, Server Dell PowerEdge, dll"
                value={formData.itemType}
                onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.itemType && (
              <p className="mt-1 text-sm text-red-400">{errors.itemType}</p>
            )}
          </div>

          {/* Estimated Arrival */}
          <div>
            <label htmlFor="estimatedArrival" className="block text-slate-300 mb-2">
              Waktu Tiba / Estimated Arrival <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                id="estimatedArrival"
                type="date"
                min={new Date().toISOString().split('T')[0]} // ✅ Prevent selecting past dates
                value={formData.estimatedArrival}
                onChange={(e) => setFormData({ ...formData, estimatedArrival: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.estimatedArrival && (
              <p className="mt-1 text-sm text-red-400">{errors.estimatedArrival}</p>
            )}
          </div>

          {/* Unit Price */}
          <div>
            <label htmlFor="unitPrice" className="block text-slate-300 mb-2">
              Harga Satuan (Rp) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
              <input
                id="unitPrice"
                type="number"
                min="0"
                step="1000"
                placeholder="Masukkan harga satuan"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.unitPrice && (
              <p className="mt-1 text-sm text-red-400">{errors.unitPrice}</p>
            )}
          </div>

          {/* Total Price */}
          <div>
            <label htmlFor="totalPrice" className="block text-slate-300 mb-2">
              Total Harga (Rp) <span className="text-red-400">*</span>
              <span className="text-xs text-blue-400 ml-2">(Otomatis: Harga Satuan × {quantity})</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
              <input
                id="totalPrice"
                type="text"
                readOnly
                placeholder="Auto-calculated"
                value={formData.totalPrice ? parseFloat(formData.totalPrice).toLocaleString('id-ID') : ''}
                className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 cursor-not-allowed"
              />
            </div>
            {errors.totalPrice && (
              <p className="mt-1 text-sm text-red-400">{errors.totalPrice}</p>
            )}
          </div>

          {/* Payment Terms */}
          <div>
            <label htmlFor="paymentTerms" className="block text-slate-300 mb-2">
              Jangka Waktu Pembayaran / Payment Terms <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                id="paymentTerms"
                type="text"
                placeholder="Masukkan jangka waktu pembayaran"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.paymentTerms && (
              <p className="mt-1 text-sm text-red-400">{errors.paymentTerms}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="notes" className="block text-slate-300 mb-2">
              Catatan Tambahan (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informasi tambahan mengenai rekomendasi ini..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Submit Recommendation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}