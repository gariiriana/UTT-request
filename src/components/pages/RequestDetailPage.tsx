import { ArrowLeft, Package, MapPin, FileText, User, Calendar, Paperclip, Download, DollarSign, CheckCircle, Upload, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { MaterialRequest } from '../../types';
import { StepProgress } from '../StepProgress';
import { StatusBadge } from '../StatusBadge';
import { ReturnItemModal } from './ReturnItemModal';
import { useState } from 'react';

interface RequestDetailPageProps {
  request: MaterialRequest;
  onBack: () => void;
  userRole?: string;
  onRequestReturn?: (requestId: string, returnData: {
    returnedQuantity: number;
    itemCondition: 'Good' | 'Minor Damage' | 'Damaged';
    returnReason?: string;
    returnDate: string;
    returnProofPhotos?: string[];
  }) => void;
}

export function RequestDetailPage({ request, onBack, userRole, onRequestReturn }: RequestDetailPageProps) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageType, setPreviewImageType] = useState<'purchase' | 'delivery'>('purchase');
  const [showReturnModal, setShowReturnModal] = useState(false);

  const canSeePricing = userRole === 'Purchasing' || userRole === 'BOD Director' || userRole === 'BOD Finance' || userRole === 'BOD Procurement';

  const openImagePreview = (imageUrl: string, type: 'purchase' | 'delivery' = 'purchase') => {
    setPreviewImageUrl(imageUrl);
    setPreviewImageType(type);
    setShowImagePreview(true);
  };

  const downloadImage = () => {
    if (!previewImageUrl) return;
    const link = document.createElement('a');
    link.href = previewImageUrl;
    link.download = `${previewImageType === 'purchase' ? 'purchase_proof' : 'delivery_proof'}_${request.id}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft size={20} />
          Back to List
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-white mb-2">{request.itemName}</h1>
            <p className="text-slate-400">Request ID: {request.id}</p>
          </div>
          <StatusBadge status={request.status} size="lg" />
        </div>
      </div>

      <div className="mb-8 bg-slate-900 rounded-lg border border-slate-800 p-8">
        <h2 className="text-white mb-6">Request Progress</h2>
        <StepProgress currentStatus={request.status} requestType={request.requestType} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-white mb-4">Request Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Package className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Item Name</p>
                <p className="text-white">{request.itemName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Site / Project</p>
                <p className="text-white">{request.siteProject}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Quantity</p>
                <p className="text-white">{request.quantity}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Type</p>
                <p className="text-white">{request.requestType}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Requested By</p>
                <p className="text-white">{request.requestedBy}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Request Date</p>
                <p className="text-white">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-white mb-4">Description</h3>
          <p className="text-slate-300 whitespace-pre-wrap">{request.description}</p>
        </div>
      </div>

      {request.attachments && request.attachments.length > 0 && (
        <div className="mb-6 bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-white mb-4 flex items-center gap-2">
            <Paperclip size={20} className="text-blue-400" />
            File Attachments ({request.attachments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {request.attachments.map((attachment) => (
              <div key={attachment.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">📎</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{attachment.fileName}</p>
                    <p className="text-xs text-slate-400 mt-1">{attachment.fileType.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = attachment.fileBase64;
                    link.download = attachment.fileName;
                    link.click();
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {canSeePricing && request.unitPrice && (
        <div className="mb-6 bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h3 className="text-white mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-green-400" />
            Pricing Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Unit Price</p>
              <p className="text-2xl text-white">Rp {request.unitPrice.toLocaleString('id-ID')}</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400 mb-2">Total Price</p>
              <p className="text-2xl text-green-400">Rp {request.totalPrice?.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 mb-6">
        <h3 className="text-white mb-4">Timeline</h3>
        <div className="space-y-4">
          {request.pmoApprovedBy && (
            <div className="flex items-start gap-3 p-4 bg-slate-800 rounded-lg">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-white">PMO Approved</p>
                <p className="text-sm text-slate-400">By {request.pmoApprovedBy} on {new Date(request.pmoApprovedAt!).toLocaleString()}</p>
                {request.pmoRemark && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-slate-300">{request.pmoRemark}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {request.salesApprovedBy && (
            <div className="flex items-start gap-3 p-4 bg-slate-800 rounded-lg">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-white">Sales Verified</p>
                <p className="text-sm text-slate-400">By {request.salesApprovedBy} on {new Date(request.salesApprovedAt!).toLocaleString()}</p>
                {request.salesRemark && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-slate-300">{request.salesRemark}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {request.purchasingApprovedBy && (
            <div className="flex items-start gap-3 p-4 bg-slate-800 rounded-lg">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-white">Purchasing Approved</p>
                <p className="text-sm text-slate-400">By {request.purchasingApprovedBy} on {new Date(request.purchasingApprovedAt!).toLocaleString()}</p>
                {request.purchasingRemark && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-slate-300">{request.purchasingRemark}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {request.bodApprovedBy && (
            <div className="flex items-start gap-3 p-4 bg-slate-800 rounded-lg">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-white">BOD Approved</p>
                <p className="text-sm text-slate-400">By {request.bodApprovedBy} on {new Date(request.bodApprovedAt!).toLocaleString()}</p>
                {request.bodRemark && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-slate-300">{request.bodRemark}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {request.purchaseProofBase64 && (
            <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <ImageIcon className="text-purple-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-purple-400 font-medium mb-2">Purchase Proof Uploaded</p>
                <button onClick={() => openImagePreview(request.purchaseProofBase64!, 'purchase')} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg">
                  <ImageIcon size={16} />
                  View Proof
                </button>
              </div>
            </div>
          )}

          {request.deliveredBy && (
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Upload className="text-blue-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-blue-400">Delivered</p>
                <p className="text-sm text-slate-400">By {request.deliveredBy} on {new Date(request.deliveredAt!).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {userRole === 'Project Manager' && request.confirmedBy && onRequestReturn && (
        <div className="mb-6 bg-slate-900 rounded-lg border border-green-500/30 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white mb-2">Return Item</h3>
              <p className="text-sm text-slate-400">Return this item to central storage</p>
            </div>
            <button onClick={() => setShowReturnModal(true)} className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center gap-2 transition-all">
              <RotateCcw size={18} />
              Return Item
            </button>
          </div>
          {request.returnRecords && request.returnRecords.length > 0 && (
            <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
              {request.returnRecords.map((record) => (
                <div key={record.id} className={`p-4 rounded-lg border ${record.returnStatus === 'Accepted' ? 'bg-green-500/10 border-green-500/30' : record.returnStatus === 'Rejected' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{record.returnedQuantity} units • {record.itemCondition}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${record.returnStatus === 'Accepted' ? 'bg-green-500/20 text-green-400' : record.returnStatus === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{record.returnStatus}</span>
                  </div>
                  <p className="text-xs text-slate-400">Requested: {new Date(record.requestedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showImagePreview && previewImageUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowImagePreview(false)}>
          <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-4xl w-full p-4" onClick={e => e.stopPropagation()}>
            <img src={previewImageUrl} alt="Preview" className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowImagePreview(false)} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Close</button>
              <button onClick={downloadImage} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">Download</button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <ReturnItemModal
          onRequestReturn={onRequestReturn}
          requestId={request.id}
          itemName={request.itemName}
          siteProject={request.siteProject}
          quantity={request.quantity}
          onClose={() => setShowReturnModal(false)}
        />
      )}
    </div>
  );
}