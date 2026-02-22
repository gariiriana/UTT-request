import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, X, AlertCircle, Package, History as HistoryIcon, Edit2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { BOQItem, BOQUsage, RequestType } from '../../types';
import { createBOQItem, updateBOQItem, deactivateBOQItem, subscribeToAllBOQItems, getBOQUsageHistory } from '../../lib/firebaseBOQ';

interface BOQManagementProps {
  userId: string;
  userName: string;
}

export function BOQManagement({ userId, userName }: BOQManagementProps) {
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedBOQ, setSelectedBOQ] = useState<BOQItem | null>(null);
  const [usageHistory, setUsageHistory] = useState<BOQUsage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('all');
  const [filterCategory, setFilterCategory] = useState<'all' | RequestType>('all');

  const [formData, setFormData] = useState({
    siteProject: '',
    itemName: '',
    specification: '',
    category: 'Procurement' as RequestType,
    totalQuantity: 1
  });

  // Subscribe to BOQ items
  useEffect(() => {
    console.log('🔵 [BOQManagement] Setting up real-time subscription...');

    const unsubscribe = subscribeToAllBOQItems((items) => {
      console.log('🔵 [BOQManagement] Received BOQ items update:', items.length);
      console.log('📊 BOQ Items:', items.map(i => ({
        name: i.itemName,
        total: i.totalQuantity,
        used: i.usedQuantity,
        remaining: i.remainingQuantity
      })));
      setBoqItems(items);
    });

    return () => {
      console.log('🔴 [BOQManagement] Unsubscribing from BOQ items');
      unsubscribe();
    };
  }, []);

  // Filter BOQ items
  const filteredBOQItems = boqItems.filter(item => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = filterSite === 'all' || item.siteProject === filterSite;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;

    return matchesSearch && matchesSite && matchesCategory;
  });

  const handleCreateBOQ = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.itemName || !formData.specification) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.totalQuantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    // Set siteProject to "All Projects" since we removed the selector
    const { error } = await createBOQItem(userId, userName, {
      ...formData,
      siteProject: 'All Projects'
    });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('BOQ item created successfully');
    setShowCreateModal(false);
    setFormData({
      siteProject: '',
      itemName: '',
      specification: '',
      category: 'Procurement',
      totalQuantity: 1
    });
  };

  const handleEditBOQ = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBOQ) return;

    const { error } = await updateBOQItem(selectedBOQ.id, {
      itemName: formData.itemName,
      specification: formData.specification,
      category: formData.category,
      totalQuantity: formData.totalQuantity
    });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('BOQ item updated successfully');
    setShowEditModal(false);
    setSelectedBOQ(null);
  };

  const handleDeleteBOQ = async (boqId: string) => {
    if (!confirm('Are you sure you want to delete this BOQ item?')) return;

    const { error } = await deactivateBOQItem(boqId);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('BOQ item deleted successfully');
  };

  const handleViewUsage = async (boq: BOQItem) => {
    setSelectedBOQ(boq);
    const history = await getBOQUsageHistory(boq.id);
    setUsageHistory(history);
    setShowUsageModal(true);
  };

  const openEditModal = (boq: BOQItem) => {
    setSelectedBOQ(boq);
    setFormData({
      siteProject: boq.siteProject,
      itemName: boq.itemName,
      specification: boq.specification,
      category: boq.category,
      totalQuantity: boq.totalQuantity
    });
    setShowEditModal(true);
  };

  const uniqueSites = Array.from(new Set(boqItems.map(item => item.siteProject)));

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white mb-2">BOQ Management</h1>
            <p className="text-slate-400">Manage Bill of Quantities for all projects</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                siteProject: '',
                itemName: '',
                specification: '',
                category: 'Procurement',
                totalQuantity: 1
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Add BOQ Item</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
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

          {/* Site Filter */}
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sites</option>
            {uniqueSites.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>

          {/* Category Filter */}
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
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-300">Item Name</th>
                  <th className="px-4 py-3 text-left text-slate-300">Site/Project</th>
                  <th className="px-4 py-3 text-left text-slate-300">Category</th>
                  <th className="px-4 py-3 text-left text-slate-300">Total Qty</th>
                  <th className="px-4 py-3 text-left text-slate-300">Used Qty</th>
                  <th className="px-4 py-3 text-left text-slate-300">Remaining Qty</th>
                  <th className="px-4 py-3 text-left text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBOQItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No BOQ items found
                    </td>
                  </tr>
                ) : (
                  filteredBOQItems.map((boq) => (
                    <tr key={boq.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-white">{boq.itemName}</div>
                          <div className="text-xs text-slate-500">{boq.specification}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{boq.siteProject}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${boq.category === 'Procurement'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                          }`}>
                          {boq.category === 'Procurement' ? <Package size={12} /> : <FileText size={12} />}
                          {boq.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{boq.totalQuantity}</td>
                      <td className="px-4 py-3 text-slate-300">{boq.usedQuantity}</td>
                      <td className="px-4 py-3">
                        <span className={`${boq.remainingQuantity === 0
                          ? 'text-red-400'
                          : boq.remainingQuantity < boq.totalQuantity * 0.2
                            ? 'text-yellow-400'
                            : 'text-green-400'
                          }`}>
                          {boq.remainingQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {boq.remainingQuantity === 0 ? (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                            Depleted
                          </span>
                        ) : boq.remainingQuantity < boq.totalQuantity * 0.2 ? (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewUsage(boq)}
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="View Usage History"
                          >
                            <HistoryIcon size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(boq)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteBOQ(boq.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Deactivate"
                            disabled={boq.usedQuantity > 0}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create BOQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-white">Add BOQ Item</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateBOQ} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-slate-300 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g., Ethernet Cable Cat6"
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Specification */}
              <div>
                <label className="block text-slate-300 mb-2">Specification *</label>
                <textarea
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  placeholder="Detailed specifications..."
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-300 mb-2">Category *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'Procurement' })}
                    className={`p-3 rounded-lg border-2 transition-all ${formData.category === 'Procurement'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                  >
                    <Package className="mx-auto mb-1" size={20} />
                    <span className="block text-sm">Procurement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'Borrowing' })}
                    className={`p-3 rounded-lg border-2 transition-all ${formData.category === 'Borrowing'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                  >
                    <FileText className="mx-auto mb-1" size={20} />
                    <span className="block text-sm">Borrowing</span>
                  </button>
                </div>
              </div>

              {/* Total Quantity */}
              <div>
                <label className="block text-slate-300 mb-2">Total Quantity (from Contract) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Create BOQ Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit BOQ Modal */}
      {showEditModal && selectedBOQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-white">Edit BOQ Item</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBOQ(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {selectedBOQ.usedQuantity > 0 && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-2">
                <AlertCircle className="text-yellow-400 flex-shrink-0" size={20} />
                <p className="text-yellow-400 text-sm">
                  This BOQ item has been used. Changes to quantity will adjust remaining quantity accordingly.
                </p>
              </div>
            )}

            <form onSubmit={handleEditBOQ} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-slate-300 mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Specification */}
              <div>
                <label className="block text-slate-300 mb-2">Specification *</label>
                <textarea
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Total Quantity */}
              <div>
                <label className="block text-slate-300 mb-2">Total Quantity *</label>
                <input
                  type="number"
                  min={selectedBOQ.usedQuantity}
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used: {selectedBOQ.usedQuantity} | Remaining will be: {formData.totalQuantity - selectedBOQ.usedQuantity}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBOQ(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Update BOQ Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage History Modal */}
      {showUsageModal && selectedBOQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl text-white">Usage History</h2>
                <p className="text-slate-400 text-sm">{selectedBOQ.itemName}</p>
              </div>
              <button
                onClick={() => {
                  setShowUsageModal(false);
                  setSelectedBOQ(null);
                  setUsageHistory([]);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {usageHistory.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                No usage history yet
              </div>
            ) : (
              <div className="space-y-3">
                {usageHistory.map((usage) => (
                  <div
                    key={usage.id}
                    className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-white">Quantity Used: {usage.quantityUsed}</div>
                        <div className="text-sm text-slate-400">By: {usage.usedByName}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${usage.status === 'Completed'
                        ? 'bg-green-500/20 text-green-400'
                        : usage.status === 'Reserved'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}>
                        {usage.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Created: {new Date(usage.createdAt).toLocaleString()}
                      {usage.completedAt && ` | Completed: ${new Date(usage.completedAt).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}