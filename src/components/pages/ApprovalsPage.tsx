import { useState } from 'react';
import { MaterialRequest, UserRole } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { Search, Filter, CheckCircle, XCircle, Eye } from 'lucide-react';
import { ConfirmationModal } from '../ConfirmationModal';
import { BODApprovalModal } from '../BODApprovalModal';

interface ApprovalsPageProps {
  requests: MaterialRequest[];
  userRole: UserRole;
  onApprove: (requestId: string, remark?: string) => void; // ✅ Add optional remark
  onBODApprove?: (requestId: string, recommendationId?: string, remark?: string) => void; // ✅ NEW
  onReject: (requestId: string, reason: string) => void;
  onViewDetails: (requestId: string) => void;
}

export function ApprovalsPage({ requests, userRole, onApprove, onBODApprove, onReject, onViewDetails }: ApprovalsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [selectedRequestForBOD, setSelectedRequestForBOD] = useState<MaterialRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveRemark, setApproveRemark] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showBODApprovalModal, setShowBODApprovalModal] = useState(false);
  const [isProcessing] = useState(false);

  const isBODRole = userRole === 'BOD Director' || userRole === 'BOD Finance' || userRole === 'BOD Procurement';

  // Filter requests based on user role
  const pendingRequests = requests.filter(request => {
    if (userRole === 'PMO') {
      return request.status === 'Pending - PMO Review';
    } else if (userRole === 'Sales/Pre-Sales') {
      return request.status === 'Pending - Sales Verification';
    } else if (isBODRole) {
      return request.status === 'Pending - BOD Final Approval';
    }
    return false;
  });

  // Search filter
  const filteredRequests = pendingRequests.filter(request =>
    request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.siteProject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReject = () => {
    if (selectedRequest && rejectReason.trim()) {
      onReject(selectedRequest, rejectReason);
      setShowRejectConfirm(false);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason('');
    }
  };

  const handleApprove = () => {
    if (selectedRequest) {
      onApprove(selectedRequest, approveRemark); // ✅ Pass remark (optional)
      setShowApproveConfirm(false);
      setShowApproveModal(false); // ✅ Close modal
      setSelectedRequest(null);
      setApproveRemark(''); // ✅ Reset remark
    }
  };

  const handleBODApprove = (recommendationId?: string, remarkParam?: string) => {
    if (selectedRequestForBOD) {
      onBODApprove?.(selectedRequestForBOD.id, recommendationId, remarkParam);
      setShowBODApprovalModal(false);
      setSelectedRequestForBOD(null);
    }
  };

  const getPageTitle = () => {
    if (userRole === 'PMO') return 'PMO Approvals';
    if (userRole === 'Sales/Pre-Sales') return 'Sales Verification';
    return 'BOD Final Approvals';
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white mb-2">{getPageTitle()}</h1>
        <p className="text-slate-400">Review and approve pending requests</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by item, project, or manager..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-green-500/30 transition-colors flex items-center gap-2">
          <Filter size={20} />
          <span className="hidden md:inline">Filter</span>
        </button>
      </div>

      {/* Pending Count */}
      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-400">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} pending your approval
        </p>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-12 text-center">
            <CheckCircle className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No pending approvals</p>
            <p className="text-slate-500 text-sm mt-2">All requests have been processed</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900 rounded-lg border border-slate-800 p-6 hover:border-green-500/30 transition-colors"
            >
              <div className="flex flex-col gap-4">
                {/* Top section: Item info only */}
                <div>
                  <h3 className="text-white mb-1">{request.itemName}</h3>
                  <p className="text-sm text-slate-400">
                    {request.siteProject} • Qty: {request.quantity}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-4">
                    <span>Requested by: {request.requestedBy}</span>
                    <span>•</span>
                    <span>Type: {request.requestType}</span>
                    <span>•</span>
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                  {request.totalPrice && (
                    <div className="mt-2">
                      <span className="text-green-400">
                        Total Price: Rp {request.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom section: Status badge + Action buttons (horizontal aligned) */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <StatusBadge status={request.status} size="sm" />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetails(request.id)}
                      className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:border-blue-500/50 hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      <Eye size={16} />
                      <span className="hidden md:inline">View</span>
                    </button>
                    <button
                      onClick={() => {
                        if (isBODRole) {
                          // ✅ BOD uses special approval modal with recommendation selection
                          setSelectedRequestForBOD(request);
                          setShowBODApprovalModal(true);
                        } else {
                          // ✅ Other roles use normal approve modal
                          setSelectedRequest(request.id);
                          setShowApproveModal(true);
                        }
                      }}
                      className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
                    >
                      <CheckCircle size={16} />
                      <span className="hidden md:inline">Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request.id);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                    >
                      <XCircle size={16} />
                      <span className="hidden md:inline">Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full">
            <h3 className="text-white mb-4">Reject Request</h3>
            <p className="text-slate-400 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    setShowRejectModal(false);
                    setShowRejectConfirm(true);
                  }
                }}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full">
            <h3 className="text-white mb-4">Approve Request</h3>
            <p className="text-slate-400 mb-2">Add a remark (optional):</p>
            <p className="text-slate-500 text-sm mb-4">You can provide additional notes about your approval decision.</p>
            <textarea
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              placeholder="Enter approval remark (optional)..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setApproveRemark('');
                }}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setShowApproveConfirm(true);
                }}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApproveConfirm}
        title="Confirm Approval"
        message="Apakah Anda yakin ingin approve request ini?"
        type="approve"
        onConfirm={handleApprove}
        onClose={() => {
          setShowApproveConfirm(false);
          setSelectedRequest(null);
        }}
        loading={isProcessing}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectConfirm}
        title="Confirm Rejection"
        message={`Apakah Anda yakin ingin reject request ini dengan alasan: "${rejectReason}" ? `}
        type="reject"
        onConfirm={handleReject}
        onClose={() => {
          setShowRejectConfirm(false);
          setShowRejectModal(true);
        }}
        loading={isProcessing}
      />

      {/* BOD Approval Modal */}
      <BODApprovalModal
        isOpen={showBODApprovalModal}
        request={selectedRequestForBOD}
        onApprove={handleBODApprove}
        onClose={() => {
          setShowBODApprovalModal(false);
          setSelectedRequestForBOD(null);
        }}
        loading={isProcessing}
      />
    </div>
  );
}