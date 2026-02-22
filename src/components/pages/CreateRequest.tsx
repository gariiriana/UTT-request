import { useState } from 'react';
import { FileText, Package, Hash, MapPin, AlignLeft } from 'lucide-react';
import { RequestType, Project } from '../../types';

interface CreateRequestProps {
  userSiteProject: string;
  onSubmit: (data: {
    siteProject: string;
    itemName: string;
    quantity: number;
    description: string;
    requestType: RequestType;
  }) => void;
  projects: Project[];
}

export function CreateRequest({ userSiteProject, onSubmit }: CreateRequestProps) {
  const [formData, setFormData] = useState({
    siteProject: userSiteProject || '',
    itemName: '',
    quantity: 1,
    description: '',
    requestType: 'Procurement' as RequestType
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.siteProject) newErrors.siteProject = 'Site/Project is required';
    if (!formData.itemName) newErrors.itemName = 'Item name is required';
    if (formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (!formData.description) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);

    // Reset form
    setFormData({
      siteProject: userSiteProject || '',
      itemName: '',
      quantity: 1,
      description: '',
      requestType: 'Procurement'
    });
    setErrors({});
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white mb-2">Create Material Request</h1>
          <p className="text-slate-400">Submit a new request for materials or equipment</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg border border-slate-800 p-6 lg:p-8">
          <div className="space-y-6">
            {/* Request Type */}
            <div>
              <label className="block text-slate-300 mb-2">Request Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, requestType: 'Procurement' })}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${formData.requestType === 'Procurement'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }
                  `}
                >
                  <Package className="mx-auto mb-2" size={24} />
                  <span className="block">Procurement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, requestType: 'Borrowing' })}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${formData.requestType === 'Borrowing'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }
                  `}
                >
                  <FileText className="mx-auto mb-2" size={24} />
                  <span className="block">Borrowing</span>
                </button>
              </div>
            </div>

            {/* Site/Project Selection */}
            <div>
              <label htmlFor="siteProject" className="block text-slate-300 mb-2">
                Site / Project <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <select
                  id="siteProject"
                  value={formData.siteProject}
                  onChange={(e) => setFormData({ ...formData, siteProject: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Site/Project</option>
                  <option value="Neutra DC Cikarang">Neutra DC Cikarang</option>
                  <option value="Neutra DC Surabaya">Neutra DC Surabaya</option>
                  <option value="LEN">LEN</option>
                  <option value="EDGE">EDGE</option>
                  <option value="BRI">BRI</option>
                </select>
              </div>
              {errors.siteProject && (
                <p className="mt-1 text-sm text-red-400">{errors.siteProject}</p>
              )}
            </div>

            {/* Item Name */}
            <div>
              <label htmlFor="itemName" className="block text-slate-300 mb-2">
                Item Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  id="itemName"
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g., Network Cable Cat6, Server Rack"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.itemName && (
                <p className="mt-1 text-sm text-red-400">{errors.itemName}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-slate-300 mb-2">
                Quantity <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-slate-300 mb-2">
                Description / Specifications <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-4 top-4 text-slate-500" size={20} />
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed specifications and requirements"
                  rows={4}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                Submit Request
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}