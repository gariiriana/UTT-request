import { useState, useEffect } from 'react';
import { FileText, Package, Hash, MapPin, AlignLeft, AlertCircle, Search, X, Upload, File as FileIcon, Trash2 } from 'lucide-react';
// ✅ Add Upload, File, Trash2
import { RequestType, BOQItem, RequestAttachment } from '../../types'; // ✅ Import RequestAttachment
import { subscribeToAllBOQItems } from '../../lib/firebaseBOQ';
import { toast } from 'sonner';

interface CreateRequestFromBOQProps {
  userSiteProject: string;
  onSubmit: (data: {
    siteProject: string;
    itemName: string;
    quantity: number;
    description: string;
    requestType: RequestType;
    boqItemId: string;
    attachments?: RequestAttachment[]; // ✅ Add attachments
  }) => void;
}

export function CreateRequestFromBOQ({ userSiteProject, onSubmit }: CreateRequestFromBOQProps) {
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [selectedBOQ, setSelectedBOQ] = useState<BOQItem | null>(null);
  const [showBOQModal, setShowBOQModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | RequestType>('all');
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]); // ✅ File attachments state

  const [formData, setFormData] = useState({
    siteProject: userSiteProject || '',
    quantity: 1,
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, Word, and Excel files are allowed');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const attachment: RequestAttachment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        fileSize: file.size,
        fileBase64: base64,
        uploadedBy: 'current-user', // Will be updated in App.tsx
        uploadedByName: 'Current User', // Will be updated in App.tsx
        uploadedAt: new Date().toISOString()
      };

      setAttachments([...attachments, attachment]);
      toast.success('File uploaded successfully');
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
    };

    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
    toast.success('File removed');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Subscribe to BOQ items for user's site
  useEffect(() => {
    if (!formData.siteProject) {
      setBoqItems([]);
      return;
    }

    console.log('🔵 [CreateRequestFromBOQ] Setting up BOQ subscription...');

    const unsubscribe = subscribeToAllBOQItems((items) => {
      console.log('🔵 [CreateRequestFromBOQ] Received BOQ items:', items.length);
      console.log('📊 BOQ Items for PM:', items.map(i => ({
        name: i.itemName,
        total: i.totalQuantity,
        used: i.usedQuantity,
        remaining: i.remainingQuantity
      })));
      setBoqItems(items);
    });

    return () => {
      console.log('🔴 [CreateRequestFromBOQ] Unsubscribing');
      unsubscribe();
    };
  }, [formData.siteProject]);

  // Reset selected BOQ when site changes
  useEffect(() => {
    setSelectedBOQ(null);
  }, [formData.siteProject]);

  const filteredBOQItems = boqItems.filter(item => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const availableBOQItems = filteredBOQItems.filter(item => item.remainingQuantity > 0);

  const handleSelectBOQ = (boq: BOQItem) => {
    setSelectedBOQ(boq);
    setShowBOQModal(false);
    setSearchTerm('');
    setFilterCategory('all');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.siteProject) newErrors.siteProject = 'Site/Project is required';
    if (!selectedBOQ) newErrors.boqItem = 'Please select a BOQ item';
    if (formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (!formData.description) newErrors.description = 'Description is required';

    // Check if quantity exceeds remaining BOQ
    if (selectedBOQ && formData.quantity > selectedBOQ.remainingQuantity) {
      newErrors.quantity = `Quantity exceeds available BOQ (${selectedBOQ.remainingQuantity} remaining)`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedBOQ) return;

    onSubmit({
      siteProject: formData.siteProject,
      itemName: selectedBOQ.itemName,
      quantity: formData.quantity,
      description: formData.description,
      requestType: selectedBOQ.category,
      boqItemId: selectedBOQ.id,
      attachments: attachments // ✅ Add attachments
    });

    // Reset form
    setSelectedBOQ(null);
    setFormData({
      siteProject: userSiteProject || '',
      quantity: 1,
      description: ''
    });
    setAttachments([]); // ✅ Reset attachments
    setErrors({});
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white mb-2">Request Material from BOQ</h1>
          <p className="text-slate-400">Create material request from approved BOQ items</p>
        </div>

        {/* Info Notice */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-3">
          <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-blue-400 mb-1">BOQ-Based Request</p>
            <p className="text-blue-300 text-sm">
              All material requests must be sourced from approved BOQ (Bill of Quantities) items.
              Contact Presales/Sales if you need items that are not in the BOQ.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg border border-slate-800 p-6 lg:p-8">
          <div className="space-y-6">
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

            {/* BOQ Item Selection */}
            <div>
              <label className="block text-slate-300 mb-2">
                BOQ Item <span className="text-red-400">*</span>
              </label>

              {!formData.siteProject ? (
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-500 text-center">
                  Please select a site/project first
                </div>
              ) : selectedBOQ ? (
                <div className="p-4 bg-slate-800 border border-blue-500/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white">{selectedBOQ.itemName}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${selectedBOQ.category === 'Procurement'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                          }`}>
                          {selectedBOQ.category === 'Procurement' ? <Package size={12} /> : <FileText size={12} />}
                          {selectedBOQ.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{selectedBOQ.specification}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-400">
                          Available: <span className={`${selectedBOQ.remainingQuantity < selectedBOQ.totalQuantity * 0.2
                            ? 'text-yellow-400'
                            : 'text-green-400'
                            }`}>
                            {selectedBOQ.remainingQuantity}
                          </span> / {selectedBOQ.totalQuantity}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBOQ(null)}
                      className="ml-3 text-slate-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBOQModal(true)}
                  className="w-full p-4 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-all"
                >
                  <Package className="mx-auto mb-2" size={24} />
                  <span className="block">Click to select BOQ item</span>
                  {boqItems.length > 0 && (
                    <span className="block text-sm mt-1">{availableBOQItems.length} items available</span>
                  )}
                </button>
              )}
              {errors.boqItem && (
                <p className="mt-1 text-sm text-red-400">{errors.boqItem}</p>
              )}
            </div>

            {/* Quantity */}
            {selectedBOQ && (
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
                    max={selectedBOQ.remainingQuantity}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Maximum available: {selectedBOQ.remainingQuantity}
                </p>
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-slate-300 mb-2">
                Description / Additional Notes <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-4 top-4 text-slate-500" size={20} />
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide usage details and any additional requirements"
                  rows={4}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-slate-300 mb-2">
                Attachments
              </label>
              <div className="relative">
                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {attachments.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm text-slate-400 mb-2">Uploaded Files:</h3>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileIcon className="text-slate-500" size={20} />
                          <span className="text-slate-400">{attachment.fileName}</span>
                          <span className="text-slate-500 text-xs">({formatFileSize(attachment.fileSize)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={!selectedBOQ}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* BOQ Selection Modal */}
      {showBOQModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-white">Select BOQ Item</h2>
              <button
                onClick={() => {
                  setShowBOQModal(false);
                  setSearchTerm('');
                  setFilterCategory('all');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Procurement">Procurement</option>
                <option value="Borrowing">Borrowing</option>
              </select>
            </div>

            {/* BOQ Items List */}
            <div className="flex-1 overflow-y-auto">
              {availableBOQItems.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  {boqItems.length === 0
                    ? 'No BOQ items found for this site/project. Contact Presales/Sales to add BOQ items.'
                    : 'No available items. All BOQ items are depleted.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {availableBOQItems.map((boq) => (
                    <button
                      key={boq.id}
                      onClick={() => handleSelectBOQ(boq)}
                      className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-lg text-left transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white">{boq.itemName}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${boq.category === 'Procurement'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                              }`}>
                              {boq.category === 'Procurement' ? <Package size={12} /> : <FileText size={12} />}
                              {boq.category}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mb-2">{boq.specification}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-400">
                          Available: <span className={`${boq.remainingQuantity < boq.totalQuantity * 0.2
                            ? 'text-yellow-400'
                            : 'text-green-400'
                            }`}>
                            {boq.remainingQuantity}
                          </span> / {boq.totalQuantity}
                        </span>
                        {boq.remainingQuantity < boq.totalQuantity * 0.2 && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}