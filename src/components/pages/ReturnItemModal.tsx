import { useState } from 'react';
import { X, RotateCcw, Package, Calendar, Upload, AlertCircle } from 'lucide-react';

interface ReturnItemModalProps {
  requestId: string;
  itemName: string;
  siteProject: string;
  quantity: number;
  onClose: () => void;
  onRequestReturn?: (requestId: string, returnData: {
    returnedQuantity: number;
    itemCondition: 'Good' | 'Minor Damage' | 'Damaged';
    returnReason?: string;
    returnDate: string;
    returnProofPhotos?: string[]; // ✅ Add photos
  }) => void;
}

export function ReturnItemModal({ requestId, itemName, siteProject, quantity, onClose, onRequestReturn }: ReturnItemModalProps) {
  const [returnedQuantity, setReturnedQuantity] = useState<number>(quantity);
  const [itemCondition, setItemCondition] = useState<'Good' | 'Minor Damage' | 'Damaged'>('Good');
  const [returnReason, setReturnReason] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [proofPhotos, setProofPhotos] = useState<string[]>([]); // ✅ Add photo state

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should not exceed 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProofPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setProofPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (returnedQuantity <= 0) {
      setError('Returned quantity must be greater than 0');
      return;
    }

    if (returnedQuantity > quantity) {
      setError(`Cannot return more than ${quantity} items`);
      return;
    }

    if (!returnDate) {
      setError('Return date is required');
      return;
    }

    if (onRequestReturn) {
      onRequestReturn(requestId, {
        returnedQuantity,
        itemCondition,
        returnReason,
        returnDate,
        returnProofPhotos: proofPhotos // ✅ Include photos
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-green-500/30 rounded-xl shadow-2xl shadow-green-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between border-b border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <RotateCcw className="text-green-300" size={20} />
            </div>
            <div>
              <h2 className="text-xl text-white">Return Item to Central</h2>
              <p className="text-sm text-green-200">Return borrowed/purchased item to Purchasing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-green-200 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Item Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Item Name</label>
                <div className="flex items-center gap-2 text-white">
                  <Package size={16} className="text-green-400" />
                  <span>{itemName}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Original Quantity</label>
                <div className="text-white">{quantity} units</div>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Site/Project</label>
                <div className="text-white">{siteProject}</div>
              </div>
            </div>
          </div>

          {/* Return Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Returned Quantity <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={quantity}
                value={returnedQuantity}
                onChange={(e) => setReturnedQuantity(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter quantity to return"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Max returnable: {quantity} units
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Item Condition <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setItemCondition('Good')}
                  className={`px-4 py-3 rounded-lg border transition-all ${itemCondition === 'Good'
                    ? 'bg-green-500/20 border-green-500 text-green-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-green-500/50'
                    }`}
                >
                  Good
                </button>
                <button
                  type="button"
                  onClick={() => setItemCondition('Minor Damage')}
                  className={`px-4 py-3 rounded-lg border transition-all ${itemCondition === 'Minor Damage'
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-yellow-500/50'
                    }`}
                >
                  Minor Damage
                </button>
                <button
                  type="button"
                  onClick={() => setItemCondition('Damaged')}
                  className={`px-4 py-3 rounded-lg border transition-all ${itemCondition === 'Damaged'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-red-500/50'
                    }`}
                >
                  Damaged
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Return Date <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Return Reason (Optional)
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
                placeholder="Enter reason for returning this item..."
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Upload Proof Photos (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="px-4 py-3 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="mr-2" size={16} />
                  Upload
                </label>
                <button
                  type="button"
                  onClick={() => setProofPhotos([])}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
              {proofPhotos.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {proofPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Proof ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500/20 border border-red-500 text-red-300 hover:text-white hover:bg-red-500 rounded-full p-1 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Warning for damaged items */}
          {itemCondition !== 'Good' && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm text-amber-300">
                  Items marked as <strong>{itemCondition}</strong> will be reviewed by Purchasing before being added back to inventory.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="text-red-400" size={20} />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/20"
            >
              Submit Return Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}