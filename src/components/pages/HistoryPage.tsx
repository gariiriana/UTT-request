import { useState } from 'react';
import { MaterialRequest, RequestStatus } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { Search, Filter, Calendar, Eye } from 'lucide-react';
import { CheckCircle, XCircle } from 'lucide-react';

interface HistoryPageProps {
  requests: MaterialRequest[];
  onViewDetails: (requestId: string) => void;
  showAllRequests?: boolean;
  userRole?: string;
}

export function HistoryPage({ requests, onViewDetails, showAllRequests = false, userRole }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('');
  const [filterSite, setFilterSite] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Only Purchasing and BOD roles can see pricing
  const canSeePricing = userRole === 'Purchasing' || userRole === 'BOD Director' || userRole === 'BOD Finance' || userRole === 'BOD Procurement';

  // Get unique values for filters
  const uniqueSites = Array.from(new Set(requests.map(r => r.siteProject)));
  const statuses: (RequestStatus | '')[] = [
    '',
    'Pending PM Approval',
    'Pending PMO Approval',
    'Pending Sales Verification',
    'Pricing Needed',
    'Pending - BOD Final Approval',
    'Approved - Purchasing Processing',
    'Completed - Delivered',
    'Rejected'
  ];

  // Filter requests
  const filteredRequests = requests.filter(request => {
    // Search filter
    if (searchTerm && !request.itemName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Status filter
    if (filterStatus && request.status !== filterStatus) {
      return false;
    }
    // Site filter
    if (filterSite && request.siteProject !== filterSite) {
      return false;
    }
    // Date range filter
    if (startDate && new Date(request.createdAt) < new Date(startDate)) {
      return false;
    }
    if (endDate && new Date(request.createdAt) > new Date(endDate)) {
      return false;
    }
    return true;
  });

  // Sort by date (newest first)
  const sortedRequests = [...filteredRequests].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white mb-2">Request History</h1>
        <p className="text-slate-400">
          {showAllRequests ? 'View all material requests' : 'Search and filter your request history'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-slate-900 rounded-lg border border-slate-800 p-6">
        <h3 className="text-white mb-4 flex items-center gap-2">
          <Filter size={20} />
          Filters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-slate-400 text-sm mb-2">Search Item Name</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by item name..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-slate-400 text-sm mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as RequestStatus | '')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Statuses</option>
              {statuses.slice(1).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Site Filter */}
          <div>
            <label className="block text-slate-400 text-sm mb-2">Site/Project</label>
            <select
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Sites</option>
              {uniqueSites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || filterStatus || filterSite || startDate || endDate) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterSite('');
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-slate-400">
          Showing {sortedRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {sortedRequests.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <Search className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No requests found</p>
            <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          sortedRequests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900 rounded-lg border border-slate-800 p-6 hover:border-green-500/30 transition-colors"
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

                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <span className="text-slate-500">Type: {request.requestType}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-500">By: {request.requestedBy}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                    {canSeePricing && request.totalPrice && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-blue-400">Rp {request.totalPrice.toLocaleString('id-ID')}</span>
                      </>
                    )}
                  </div>

                  {/* Show approval/rejection info */}
                  {request.bodApprovedBy && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <CheckCircle size={14} className="text-blue-400" />
                      <span className="text-xs text-blue-400">
                        BOD Approved by: <strong>{request.bodApprovedBy}</strong>
                      </span>
                    </div>
                  )}
                  {request.status === 'Rejected' && request.rejectedBy && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <XCircle size={14} className="text-red-400" />
                      <span className="text-xs text-red-400">
                        Rejected by: <strong>{request.rejectedBy}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onViewDetails(request.id)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:border-green-500/50 hover:text-green-400 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}