import { useState } from 'react';
import { MaterialRequest } from '../../types';
import { DollarSign, Package } from 'lucide-react';

interface PricingPageProps {
  requests: MaterialRequest[];
  onAddPricing: (requestId: string, unitPrice: number, totalPrice: number) => void;
}

export function PricingPage({ requests, onAddPricing }: PricingPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [unitPrice, setUnitPrice] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setUnitPrice(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !unitPrice) return;

    const request = requests.find(r => r.id === selectedRequest);
    if (!request) return;

    const price = parseInt(unitPrice);
    onAddPricing(selectedRequest, price, price * request.quantity);

    setShowModal(false);
    setSelectedRequest(null);
    setUnitPrice('');
  };

  const pricingRequests = requests.filter(r => r.status === 'Pricing Needed');

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-white mb-2">Pricing Needed</h1>
        <p className="text-slate-400">Add unit price for procurement requests</p>
      </div>

      <div className="space-y-4">
        {pricingRequests.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <Package className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No requests need pricing at this time</p>
          </div>
        ) : (
          pricingRequests.map((request) => (
            <div key={request.id} className="bg-slate-900 rounded-lg border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-white mb-1">{request.itemName}</h3>
                <p className="text-sm text-slate-400">{request.siteProject} • Qty: {request.quantity}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(request.id);
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <DollarSign size={20} />
                Add Pricing
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-white mb-4">Add Pricing</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">Unit Price (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                  <input
                    type="text"
                    value={unitPrice}
                    onChange={handleUnitPriceChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter price"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!unitPrice}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all font-medium"
                >
                  Save Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}